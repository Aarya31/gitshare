const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure CORS - Allow frontend address
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Apply rate limiter
app.use(limiter);

// Express JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom lightweight cookie parser to avoid extra npm packages
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const name = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      req.cookies[name] = val;
    });
  }
  next();
});

// Serve uploaded files statically for direct link viewing if needed, with path validation
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const repoRoutes = require('./routes/repoRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/repositories', repoRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

// Seed default users for testing if empty
async function seedDefaultUsers() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Seeding default accounts...');
      
      const adminSalt = await bcrypt.genSalt(10);
      const adminPassword = await bcrypt.hash('admin123', adminSalt);
      const adminUser = new User({
        username: 'admin',
        password: adminPassword,
        isAdmin: true
      });
      await adminUser.save();
      console.log('seeded Admin account -> username: admin, password: admin123');

      const userSalt = await bcrypt.genSalt(10);
      const userPassword = await bcrypt.hash('user123', userSalt);
      const regularUser = new User({
        username: 'gitshare_user',
        password: userPassword,
        isAdmin: false
      });
      await regularUser.save();
      console.log('seeded User account -> username: gitshare_user, password: user123');
    }
  } catch (err) {
    console.error('Error seeding default users:', err);
  }
}

// Connect DB and Start Server
connectDB().then(() => {
  seedDefaultUsers().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
});
