const mongoose = require('mongoose');

// Cache database connection for serverless execution environments (e.g., Vercel)
let cachedConnection = null;

// Connect to MongoDB database with auto-reconnect and error handling
const connectDB = async () => {
  // If already connected, reuse existing connection
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventify_db';
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    cachedConnection = conn;
    console.log('[Database] Database connected successfully.');

    // Handle database connection errors
    mongoose.connection.on('error', (err) => {
      console.error(`[Database Error] Connection failure: ${err.message}`);
    });

    // Handle database disconnection
    mongoose.connection.on('disconnected', () => {
      console.warn('[Database Warning] MongoDB connection lost. Attempting reconnect...');
    });

    // Handle database reconnection
    mongoose.connection.on('reconnected', () => {
      console.log('[Database Info] MongoDB reconnected successfully.');
    });

    return conn;
  } catch (error) {
    console.error(`[Database Fatal] Could not connect to MongoDB: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
