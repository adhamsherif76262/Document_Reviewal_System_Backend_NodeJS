// server.js

// 1. Load environment variables from the .env file into process.env
require('dotenv').config();

// 2. Import the Express app from app.js
const app = require('./app');

// 3. Import MongoDB connection function
const connectDB = require('./Config/db');

// 4. Connect to MongoDB
connectDB();

// 5. Define the port, fallback to 5000 if not specified in .env
const PORT = process.env.PORT || 5000;

// 6. Start the Express server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
