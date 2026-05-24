const express = require('express');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const Repository = require('../models/Repository');
const { verifyUser } = require('../middleware/auth');
const { upload, uploadDirectory } = require('../middleware/upload');

const router = express.Router();

// GET /api/repositories - List repositories (supports search ?q=searchterm & owner filter ?ownerId=ownerid)
router.get('/', verifyUser, async (req, res) => {
  try {
    const { q, ownerId } = req.query;
    let query = {};

    if (ownerId) {
      query.owner = ownerId;
    }

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'files.path': { $regex: q, $options: 'i' } } // Can also search file paths
      ];
    }

    const repositories = await Repository.find(query)
      .populate('owner', 'username')
      .sort({ updatedAt: -1 });

    return res.json(repositories);
  } catch (err) {
    console.error('List repositories error:', err);
    return res.status(500).json({ message: 'Server error listing repositories.' });
  }
});

// GET /api/repositories/:id - Get single repository details and files
router.get('/:id', verifyUser, async (req, res) => {
  try {
    const repository = await Repository.findById(req.params.id).populate('owner', 'username');
    if (!repository) {
      return res.status(404).json({ message: 'Repository not found.' });
    }
    return res.json(repository);
  } catch (err) {
    console.error('Fetch repository details error:', err);
    return res.status(500).json({ message: 'Server error fetching repository details.' });
  }
});

// POST /api/repositories - Create repository (metadata only, files uploaded separately or after)
router.post('/', verifyUser, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Repository name is required.' });
    }

    const cleanName = name.replace(/[^a-zA-Z0-9-_]/g, '-').trim();
    if (!cleanName) {
      return res.status(400).json({ message: 'Invalid repository name.' });
    }

    // Check if name is unique for this user
    const existingRepo = await Repository.findOne({
      owner: req.user._id,
      name: { $regex: `^${cleanName}$`, $options: 'i' }
    });

    if (existingRepo) {
      return res.status(400).json({ message: 'You already have a repository with this name.' });
    }

    const repository = new Repository({
      name: cleanName,
      description: description || '',
      owner: req.user._id,
      files: []
    });

    await repository.save();
    await repository.populate('owner', 'username');

    return res.status(201).json(repository);
  } catch (err) {
    console.error('Create repository error:', err);
    return res.status(500).json({ message: 'Server error creating repository.' });
  }
});

// POST /api/repositories/:id/upload - Upload multiple files/folders to repository
router.post('/:id/upload', verifyUser, upload.array('files', 100), async (req, res) => {
  try {
    const repository = await Repository.findById(req.params.id);
    if (!repository) {
      return res.status(404).json({ message: 'Repository not found.' });
    }

    // Verify owner or admin
    if (repository.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. You do not own this repository.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files provided for upload.' });
    }

    const paths = req.body.paths;

    // Helper to resolve the relative folder path for each file
    const getRelativePath = (index) => {
      if (Array.isArray(paths)) {
        return paths[index] || req.files[index].originalname;
      } else if (typeof paths === 'string') {
        return index === 0 ? paths : req.files[index].originalname;
      }
      return req.files[index].originalname;
    };

    const newFiles = req.files.map((file, i) => {
      let relativePath = getRelativePath(i);
      // Clean path if necessary, but keep directory structure
      // Remove leading slashes/dots to prevent path escapes
      relativePath = relativePath.replace(/^(\.\.\/|\/)+/, '');
      
      return {
        path: relativePath,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        storageKey: file.filename,
        uploadedAt: new Date()
      };
    });

    // Check for duplicate paths in the repository and update them or merge
    for (const newFile of newFiles) {
      // Find index of existing file with same path
      const existingIndex = repository.files.findIndex(f => f.path === newFile.path);
      
      if (existingIndex > -1) {
        // If file exists, delete the old physical file on disk first
        const oldFile = repository.files[existingIndex];
        const oldPathOnDisk = path.join(uploadDirectory, oldFile.storageKey);
        if (fs.existsSync(oldPathOnDisk)) {
          fs.unlinkSync(oldPathOnDisk);
        }
        // Update file entry
        repository.files[existingIndex] = newFile;
      } else {
        // Add new file entry
        repository.files.push(newFile);
      }
    }

    repository.updatedAt = new Date();
    await repository.save();

    await repository.populate('owner', 'username');
    return res.json(repository);
  } catch (err) {
    console.error('File upload error:', err);
    // Cleanup uploaded files on error to avoid orphan files on disk
    if (req.files) {
      req.files.forEach(file => {
        const filePath = path.join(uploadDirectory, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    return res.status(500).json({ message: err.message || 'Server error uploading files.' });
  }
});

// DELETE /api/repositories/:id/files/:fileId - Delete a single file
router.delete('/:id/files/:fileId', verifyUser, async (req, res) => {
  try {
    const repository = await Repository.findById(req.params.id);
    if (!repository) {
      return res.status(404).json({ message: 'Repository not found.' });
    }

    // Verify owner or admin
    if (repository.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. You do not own this repository.' });
    }

    const fileIndex = repository.files.findIndex(f => f._id.toString() === req.params.fileId);
    if (fileIndex === -1) {
      return res.status(404).json({ message: 'File not found in repository.' });
    }

    const file = repository.files[fileIndex];
    const filePathOnDisk = path.join(uploadDirectory, file.storageKey);

    // Delete file from disk
    if (fs.existsSync(filePathOnDisk)) {
      fs.unlinkSync(filePathOnDisk);
    }

    // Remove from array
    repository.files.splice(fileIndex, 1);
    repository.updatedAt = new Date();
    await repository.save();

    return res.json({ message: 'File deleted successfully.', repository });
  } catch (err) {
    console.error('Delete file error:', err);
    return res.status(500).json({ message: 'Server error deleting file.' });
  }
});

// DELETE /api/repositories/:id - Delete whole repository
router.delete('/:id', verifyUser, async (req, res) => {
  try {
    const repository = await Repository.findById(req.params.id);
    if (!repository) {
      return res.status(404).json({ message: 'Repository not found.' });
    }

    // Verify owner or admin
    if (repository.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. You do not own this repository.' });
    }

    // Delete all physical files on disk
    for (const file of repository.files) {
      const filePathOnDisk = path.join(uploadDirectory, file.storageKey);
      if (fs.existsSync(filePathOnDisk)) {
        fs.unlinkSync(filePathOnDisk);
      }
    }

    // Delete repository from DB
    await Repository.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Repository and all associated files deleted successfully.' });
  } catch (err) {
    console.error('Delete repository error:', err);
    return res.status(500).json({ message: 'Server error deleting repository.' });
  }
});

// GET /api/repositories/:id/files/:fileId/download - Download a specific file
router.get('/:id/files/:fileId/download', verifyUser, async (req, res) => {
  try {
    const repository = await Repository.findById(req.params.id);
    if (!repository) {
      return res.status(404).json({ message: 'Repository not found.' });
    }

    const file = repository.files.find(f => f._id.toString() === req.params.fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found in repository.' });
    }

    const filePathOnDisk = path.join(uploadDirectory, file.storageKey);
    if (!fs.existsSync(filePathOnDisk)) {
      return res.status(404).json({ message: 'Physical file not found on disk.' });
    }

    // Stream download with correct original filename
    return res.download(filePathOnDisk, file.filename);
  } catch (err) {
    console.error('Download file error:', err);
    return res.status(500).json({ message: 'Server error downloading file.' });
  }
});

// GET /api/repositories/:id/download-zip - Download whole repository folder structure as ZIP
router.get('/:id/download-zip', verifyUser, async (req, res) => {
  try {
    const repository = await Repository.findById(req.params.id);
    if (!repository) {
      return res.status(404).json({ message: 'Repository not found.' });
    }

    if (repository.files.length === 0) {
      return res.status(400).json({ message: 'Repository is empty. Nothing to download.' });
    }

    // Set headers for ZIP stream
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${repository.name}.zip"`);

    const archive = archiver('zip', {
      zlib: { level: 9 } // Best compression
    });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).send({ error: err.message });
      }
    });

    archive.pipe(res);

    // Append each file to the archive maintaining folder paths
    for (const file of repository.files) {
      const filePathOnDisk = path.join(uploadDirectory, file.storageKey);
      if (fs.existsSync(filePathOnDisk)) {
        archive.file(filePathOnDisk, { name: file.path });
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error('ZIP generation error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Server error generating ZIP archive.' });
    }
  }
});

module.exports = router;
