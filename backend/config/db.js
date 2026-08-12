const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  // 1. Try Atlas first
  const atlasUri = process.env.MONGODB_URI;

  if (atlasUri) {
    try {
      const conn = await mongoose.connect(atlasUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.warn(`⚠️  Atlas connection failed (${error.message})`);
      console.warn('   Falling back to in-memory MongoDB...\n');
    }
  }

  // 2. Fall back to in-memory MongoDB
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`✅ In-Memory MongoDB Connected: ${conn.connection.host}`);
    console.log('   ⚠️  Data will not persist between restarts.\n');
  } catch (err) {
    console.error(`❌ Failed to start in-memory MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
