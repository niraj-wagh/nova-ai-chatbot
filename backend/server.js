require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const aiService = require('./services/aiService');

// ── Init ─────────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Chatbot API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    aiProvider: process.env.AI_PROVIDER || 'anthropic',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

// ── Socket.io – Real-time Chat ────────────────────────────────────────────────
// Auth middleware for Socket.io
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return next(new Error('User not found'));

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
});

// Track active users
const activeUsers = new Map();

io.on('connection', (socket) => {
  const userId = socket.user._id.toString();
  activeUsers.set(userId, socket.id);
  console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

  // Join personal room
  socket.join(`user:${userId}`);

  // ── Send Message (Streaming) ──────────────────────────────────────────────
  socket.on('send_message', async (data) => {
    const { conversationId, content } = data;

    if (!content?.trim()) {
      return socket.emit('error', { message: 'Message cannot be empty.' });
    }

    try {
      // Find or create conversation
      let conversation;
      if (conversationId) {
        conversation = await Conversation.findOne({ _id: conversationId, userId: socket.user._id });
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found.' });
        }
      } else {
        conversation = await Conversation.create({ userId: socket.user._id });
        await User.findByIdAndUpdate(socket.user._id, { $inc: { 'stats.totalConversations': 1 } });
        socket.emit('conversation_created', { conversationId: conversation._id });
      }

      // Add user message
      conversation.messages.push({ role: 'user', content: content.trim() });
      await conversation.save();

      const userMessage = conversation.messages[conversation.messages.length - 1];
      socket.emit('message_received', {
        message: userMessage,
        conversationId: conversation._id,
      });

      // Build context for AI
      const chatbotName = socket.user.preferences?.chatbotName || 'Nova AI';
      const systemPrompt = aiService.getSystemPrompt(chatbotName);
      const historyMessages = [
        { role: 'system', content: systemPrompt },
        ...conversation.messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
      ];

      // Emit "thinking" indicator
      socket.emit('ai_thinking', { conversationId: conversation._id });

      // Stream AI response
      let fullResponse = '';
      const startTime = Date.now();

      await aiService.generateStream(
        historyMessages,
        // onChunk
        (chunk) => {
          fullResponse += chunk;
          socket.emit('ai_stream_chunk', {
            chunk,
            conversationId: conversation._id,
          });
        },
        // onDone
        async (fullText, usage) => {
          // Save AI message
          conversation.messages.push({
            role: 'assistant',
            content: fullText,
            tokens: usage?.totalTokens || 0,
            metadata: {
              model: process.env.AI_MODEL || 'claude-sonnet-4-20250514',
              processingTime: Date.now() - startTime,
            },
          });

          // Auto-title after first exchange
          if (conversation.messages.length === 2) conversation.generateTitle();
          await conversation.save();

          // Update user stats
          await User.findByIdAndUpdate(socket.user._id, { $inc: { 'stats.totalMessages': 2 } });

          const aiMessage = conversation.messages[conversation.messages.length - 1];
          socket.emit('ai_stream_done', {
            message: aiMessage,
            conversationId: conversation._id,
            title: conversation.title,
          });
        },
        // onError
        (error) => {
          socket.emit('error', { message: error.message || 'AI response failed.' });
        }
      );
    } catch (error) {
      console.error('Socket send_message error:', error);
      socket.emit('error', { message: error.message || 'Failed to process message.' });
    }
  });

  // ── Typing Indicator ──────────────────────────────────────────────────────
  socket.on('typing_start', ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit('user_typing', { userId, username: socket.user.username });
  });

  socket.on('typing_stop', ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit('user_stopped_typing', { userId });
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    activeUsers.delete(userId);
    console.log(`🔌 User disconnected: ${socket.user.username}`);
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 AI Provider: ${process.env.AI_PROVIDER || 'anthropic'}`);
  console.log(`🧠 AI Model: ${process.env.AI_MODEL || 'claude-sonnet-4-20250514'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
});

module.exports = { app, server, io };
