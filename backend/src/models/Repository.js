const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true // e.g. "src/components/Navbar.jsx" or "package.json"
  },
  filename: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String
  },
  storageKey: {
    type: String,
    required: true // The randomized filename actually saved on disk in backend/uploads
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const RepositorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  files: [FileSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure repository names are unique per user
RepositorySchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Repository', RepositorySchema);
