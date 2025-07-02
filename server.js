// server.js

// 1. Load environment variables from the .env file into process.env
require('dotenv').config();

// 2. Import the Express app from app.js
const app = require('./app');

// 3. Import MongoDB connection function
const connectDB = require('./Config/db');

const logger = require('./utils/logger');

// 4. Connect to MongoDB
connectDB();

// 5. Define the port, fallback to 5000 if not specified in .env
const PORT = process.env.PORT || 5000;

// 6. Start the Express server
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });

app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
});

// Optional: catch unhandled errors
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
