const mongoose = require('mongoose');

// Connect to MongoDB using the connection string from the environment.
// The server refuses to start without MONGO_URI so a misconfigured
// deploy fails loudly instead of silently running without a database.
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined. Copy .env.example to .env and set it.');
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};

module.exports = connectDB;
