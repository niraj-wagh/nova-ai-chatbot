require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('❌ MONGODB_URI not found in .env'); process.exit(1); }

console.log('🔌 Connecting to MongoDB Atlas...');

mongoose.connect(uri).then(async () => {
  console.log('✅ Connected to:', mongoose.connection.host);

  const db = mongoose.connection.db;
  const users = db.collection('users');

  const adminHash = await bcrypt.hash('admin123', 12);
  const demoHash  = await bcrypt.hash('demo123', 12);
  const now = new Date();

  // Force delete old ones first
  await users.deleteOne({ email: 'admin@novaai.dev' });
  await users.deleteOne({ email: 'demo@novaai.dev' });
  await users.deleteOne({ username: 'admin' });
  await users.deleteOne({ username: 'demouser' });

  await users.insertOne({
    username: 'admin', email: 'admin@novaai.dev', password: adminHash,
    role: 'admin', isActive: true,
    preferences: { theme: 'dark', chatbotName: 'Nova AI', language: 'en', fontSize: 'md' },
    stats: { totalMessages: 0, totalConversations: 0, lastActive: now },
    createdAt: now, updatedAt: now,
  });
  console.log('✅ Admin created  →  admin@novaai.dev  /  admin123');

  await users.insertOne({
    username: 'demouser', email: 'demo@novaai.dev', password: demoHash,
    role: 'user', isActive: true,
    preferences: { theme: 'dark', chatbotName: 'Nova AI', language: 'en', fontSize: 'md' },
    stats: { totalMessages: 0, totalConversations: 0, lastActive: now },
    createdAt: now, updatedAt: now,
  });
  console.log('✅ Demo created   →  demo@novaai.dev   /  demo123');

  const check = await users.findOne({ email: 'admin@novaai.dev' });
  console.log('\n🔍 Admin in DB:', !!check, '| role:', check?.role, '| active:', check?.isActive);
  console.log('\n🎉 Now login at your Vercel URL!');

  await mongoose.disconnect();
  process.exit(0);
}).catch(err => { console.error('❌', err.message); process.exit(1); });