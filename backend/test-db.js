require('dotenv').config();
const mongoose = require('mongoose');

console.log('\n🔍 Diagnosing MongoDB connection...\n');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is undefined - .env file not found or not loaded');
  console.error('   Make sure .env exists in the SAME folder as this file (backend/)');
  process.exit(1);
}

console.log('✅ URI found in .env');
console.log('📋 URI value:', uri);
console.log('');

// Check for common URI mistakes
if (uri.includes('?=')) {
  console.error('❌ BAD URI: contains "?=" which is invalid');
  console.error('   Fix: remove everything from "?" onwards');
}
if (uri.includes('/?')) {
  console.error('❌ BAD URI: contains "/?" — database name is missing');
  console.error('   Fix: change /? to /chatbot');
}
if (!uri.includes('.mongodb.net/')) {
  console.error('❌ BAD URI: missing database name after .mongodb.net/');
}

// Try connecting
console.log('🔌 Attempting connection...\n');

mongoose.connect(uri)
  .then(() => {
    console.log('✅ SUCCESS! MongoDB connected to:', mongoose.connection.host);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ FAILED:', err.message);
    process.exit(1);
  });