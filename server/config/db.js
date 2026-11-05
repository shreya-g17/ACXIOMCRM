const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the MONGO_URI environment variable.
 *
 * Uses module-level caching so that warm serverless lambda invocations
 * reuse the existing connection instead of opening a new one every request.
 */
let cachedConn = null;

const connectDB = async () => {
  // Reuse existing connection (warm lambda / cached state)
  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }

  try {
    cachedConn = await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
    });
    console.log(`✅ MongoDB Connected: ${cachedConn.connection.host}`);
    return cachedConn;
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    cachedConn = null;
    throw err;
  }
};

module.exports = connectDB;
