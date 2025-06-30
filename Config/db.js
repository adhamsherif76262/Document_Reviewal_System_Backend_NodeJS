// config/db.js

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connect to MongoDB using the URI from .env
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // If successful, log the connection host
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    // If connection fails, log the error and stop the app
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1); // Exit with failure
  }
};

module.exports = connectDB;
