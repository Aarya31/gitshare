const mongoose = require('mongoose');

async function connectDB() {
  let mongoUri = process.env.MONGODB_URI;
  
  // Robust check: Ensure the connection string starts with valid MongoDB schemes
  const hasValidScheme = mongoUri && (mongoUri.trim().startsWith('mongodb://') || mongoUri.trim().startsWith('mongodb+srv://'));

  if (!hasValidScheme) {
    console.log('No valid MONGODB_URI found in env (must start with mongodb:// or mongodb+srv://). Spinning up mongodb-memory-server as fallback...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log(`In-memory MongoDB server is running at: ${mongoUri}`);
      
      // Store on global or process for cleanup on exit if needed
      global.__MONGO_SERVER__ = mongoServer;
    } catch (err) {
      console.error('Failed to start in-memory MongoDB server:', err);
      process.exit(1);
    }
  }

  try {
    await mongoose.connect(mongoUri.trim());
    console.log('MongoDB connection established successfully.');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = connectDB;
