const mongoose = require('mongoose');

// connectDB() opens a single connection to MongoDB using the URI from .env.
// Called once when the server boots (see server.js).
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1); // stop the server — nothing works without a DB
  }
};

module.exports = connectDB;
