const mongoose = require('mongoose');

let mongod = null;

// Normal development database: the locally installed MongoDB service.
const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017/daycarehq';

const connectDB = async (maxRetries = 3) => {
  const atlasUri = process.env.MONGODB_URI || process.env.MONGO_URI || (process.env.NODE_ENV === 'production' ? null : DEFAULT_LOCAL_URI);

  if (atlasUri) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📡 Connecting to MongoDB (attempt ${attempt}/${maxRetries})...`);
        const conn = await mongoose.connect(atlasUri, {
          serverSelectionTimeoutMS: 20000,
          connectTimeoutMS: 20000,
          socketTimeoutMS: 45000,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}\n`);
        return conn;
      } catch (error) {
        console.warn(`⚠️  Connection attempt ${attempt} failed: ${error.message}`);
        if (attempt < maxRetries) {
          console.log('   Retrying in 2 seconds...');
          await new Promise(res => setTimeout(res, 2000));
        }
      }
    }
    console.warn('⚠️  Could not connect to MongoDB after retries.\n');
  }

  // 2. In-memory MongoDB is OPT-IN only (used for tests) and is never the normal dev database path.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Could not connect to MongoDB in production. In-memory fallback disabled to protect 512MB RAM limit.');
  }

  if (process.env.USE_IN_MEMORY_DB !== 'true') {
    throw new Error(`Could not connect to MongoDB at ${atlasUri || DEFAULT_LOCAL_URI}. Make sure the local MongoDB service is running and MONGODB_URI is set in backend/.env.`);
  }

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
