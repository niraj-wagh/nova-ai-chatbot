const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [10000, 'Message too long'],
    },
    tokens: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 5, default: null },
    feedback: { type: String, default: '' },
    isError: { type: Boolean, default: false },
    metadata: {
      model: { type: String, default: '' },
      processingTime: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      maxlength: [200, 'Title too long'],
    },
    messages: [messageSchema],
    isArchived: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    category: {
      type: String,
      enum: ['casual', 'professional', 'creative', 'technical', 'general'],
      default: 'general',
    },
    stats: {
      totalMessages: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    lastMessageAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Auto-generate title from first user message
conversationSchema.methods.generateTitle = function () {
  const firstUserMsg = this.messages.find((m) => m.role === 'user');
  if (firstUserMsg) {
    this.title = firstUserMsg.content.substring(0, 60) + (firstUserMsg.content.length > 60 ? '...' : '');
  }
};

// Update stats on message add
conversationSchema.pre('save', function (next) {
  this.stats.totalMessages = this.messages.length;
  if (this.messages.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].createdAt || Date.now();
  }
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
