const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Path to store files locally
const uploadDirectory = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    // Generate unique key to prevent overlaps and hide true filenames on disk
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Security block list: block active executable scripts/files
  const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.com', '.vbs', '.scr'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (blockedExtensions.includes(ext)) {
    return cb(new Error(`Security Restriction: File extension ${ext} is blocked.`), false);
  }
  
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit per file
  }
});

module.exports = {
  upload,
  uploadDirectory
};
