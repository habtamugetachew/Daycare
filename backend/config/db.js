const mongoose = require('mongoose');

let mongod = null;

const connectDB = async (maxRetries = 3) => {
  const atlasUri = process.env.MONGODB_URI;

  if (atlasUri) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📡 Connecting to MongoDB Atlas (attempt ${attempt}/${maxRetries})...`);
        const conn = await mongoose.connect(atlasUri, {
          serverSelectionTimeoutMS: 20000,
          connectTimeoutMS: 20000,
          socketTimeoutMS: 45000,
        });
        console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}\n`);
        return conn;
      } catch (error) {
        console.warn(`⚠️  Atlas connection attempt ${attempt} failed: ${error.message}`);
        if (attempt < maxRetries) {
          console.log('   Retrying in 2 seconds...');
          await new Promise(res => setTimeout(res, 2000));
        }
      }
    }
    console.warn('⚠️  Could not connect to MongoDB Atlas after retries.\n');
  }

  // 2. Fall back to in-memory MongoDB only if Atlas is not reachable
  try {
    console.log('📦 Attempting in-memory MongoDB fallback...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`✅ In-Memory MongoDB Connected: ${conn.connection.host}`);
    console.log('   ⚠️  Data will not persist between restarts.\n');
    return conn;
  } catch (err) {
    console.error(`❌ Failed to start database: ${err.message}`);
    throw err;
  }
};

module.exports = connectDB;
