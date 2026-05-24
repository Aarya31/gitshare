const express = require('express');
const User = require('../models/User');
const Repository = require('../models/Repository');
const { verifyUser, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply admin protection to all routes in this file
router.use(verifyUser, verifyAdmin);

// GET /api/admin/stats - Server-level dashboard metrics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const repositories = await Repository.find();
    
    let totalFiles = 0;
    let totalStorageBytes = 0;

    repositories.forEach(repo => {
      totalFiles += repo.files.length;
      repo.files.forEach(file => {
        totalStorageBytes += file.size || 0;
      });
    });

    return res.json({
      totalUsers,
      totalRepos: repositories.length,
      totalFiles,
      totalStorageBytes
    });
  } catch (err) {
    console.error('Fetch admin stats error:', err);
    return res.status(500).json({ message: 'Server error retrieving system stats.' });
  }
});

// GET /api/admin/users - List all users and their uploads metadata
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const repositories = await Repository.find().select('owner name files');

    // Map user to their repository counts
    const usersWithStats = users.map(user => {
      const userRepos = repositories.filter(repo => repo.owner.toString() === user._id.toString());
      const repoCount = userRepos.length;
      const fileCount = userRepos.reduce((acc, repo) => acc + repo.files.length, 0);
      const totalBytes = userRepos.reduce((acc, repo) => acc + repo.files.reduce((fAcc, f) => fAcc + f.size, 0), 0);

      return {
        id: user._id,
        username: user.username,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        repoCount,
        fileCount,
        totalBytes
      };
    });

    return res.json(usersWithStats);
  } catch (err) {
    console.error('Fetch admin users error:', err);
    return res.status(500).json({ message: 'Server error retrieving user list.' });
  }
});

module.exports = router;
