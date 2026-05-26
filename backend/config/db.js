require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = (process.env.MONGODB_URI || '').trim();

  if (!uri) {
    console.error('❌ MONGODB_URI is missing in backend/.env');
    process.exit(1);
  }

  console.log('📡 Connecting to MongoDB...');

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected.'));
    mongoose.connection.on('reconnected', () => console.log('✅ MongoDB reconnected.'));
  } catch (error) {
    console.error(`❌ MongoDB error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;