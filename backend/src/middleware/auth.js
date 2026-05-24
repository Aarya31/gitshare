const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'gitshare-default-secret-key-12345';

// Authenticate user middleware
const verifyUser = async (req, res, next) => {
  try {
    let token = '';

    // 1. Try to read from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // 2. Try to read from cookies (if enabled/supported)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user from database to ensure they still exist and check admin privileges
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
};

// Admin protection middleware
const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Forbidden. Admin access required.' });
  }
  next();
};

module.exports = {
  verifyUser,
  verifyAdmin,
  JWT_SECRET
};
