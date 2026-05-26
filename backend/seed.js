/**
 * Seed script - creates demo admin + user accounts
 * Run: node seed.js (from backend directory with .env loaded)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
};

const User = require('./models/User');
const Conversation = require('./models/Conversation');

const seed = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Conversation.deleteMany({});
  console.log('🧹 Cleared existing data');

  // Create admin user
  const admin = await User.create({
    username: 'admin',
    email: 'admin@novaaI.dev',
    password: 'admin123',
    role: 'admin',
    preferences: {
      theme: 'dark',
      chatbotName: 'Nova AI',
    },
  });
  console.log('👤 Created admin: admin@novaaI.dev / admin123');

  // Create demo user
  const demo = await User.create({
    username: 'demouser',
    email: 'demo@novaaI.dev',
    password: 'demo123',
    role: 'user',
    preferences: {
      theme: 'dark',
      chatbotName: 'Nova AI',
    },
  });
  console.log('👤 Created demo user: demo@novaaI.dev / demo123');

  // Seed a sample conversation
  await Conversation.create({
    userId: demo._id,
    title: 'Welcome to Nova AI',
    category: 'general',
    messages: [
      {
        role: 'user',
        content: 'Hello! What can you help me with?',
        createdAt: new Date(),
      },
      {
        role: 'assistant',
        content: "Hi there! I'm **Nova AI**, your intelligent assistant. I can help you with:\n\n- **Writing** — drafts, emails, essays\n- **Coding** — any language, debugging, explanations\n- **Analysis** — data, documents, ideas\n- **Creative** — stories, brainstorming, poetry\n- **Q&A** — science, history, math, and more\n\nWhat would you like to explore today?",
        createdAt: new Date(),
      },
    ],
    stats: { totalMessages: 2 },
    lastMessageAt: new Date(),
  });

  console.log('💬 Created sample conversation');
  console.log('\n🎉 Seed complete! Accounts:');
  console.log('   Admin:  admin@novaaI.dev / admin123');
  console.log('   Demo:   demo@novaaI.dev / demo123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
