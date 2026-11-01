const mongoose = require('mongoose');

// Connect to MongoDB database with auto-reconnect and error handling
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: true,
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

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
    process.exit(1);
  }
};

module.exports = connectDB;
