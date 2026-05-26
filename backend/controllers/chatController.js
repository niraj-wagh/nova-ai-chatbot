const Conversation = require('../models/Conversation');
const User = require('../models/User');
const aiService = require('../services/aiService');

// GET /api/chat/conversations
const getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 20, archived = false } = req.query;
    const conversations = await Conversation.find({
      userId: req.user._id,
      isArchived: archived === 'true',
    })
      .select('title category stats lastMessageAt isPinned createdAt updatedAt')
      .sort({ isPinned: -1, lastMessageAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Conversation.countDocuments({ userId: req.user._id });

    res.json({ success: true, conversations, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch conversations.' });
  }
};

// POST /api/chat/conversations
const createConversation = async (req, res) => {
  try {
    const { category = 'general' } = req.body;
    const conversation = await Conversation.create({ userId: req.user._id, category });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalConversations': 1 } });

    res.status(201).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create conversation.' });
  }
};

// GET /api/chat/conversations/:id
const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch conversation.' });
  }
};

// DELETE /api/chat/conversations/:id
const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }
    res.json({ success: true, message: 'Conversation deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete conversation.' });
  }
};

// PATCH /api/chat/conversations/:id
const updateConversation = async (req, res) => {
  try {
    const { title, category, isArchived, isPinned } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = category;
    if (isArchived !== undefined) updates.isArchived = isArchived;
    if (isPinned !== undefined) updates.isPinned = isPinned;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      { new: true }
    );

    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update conversation.' });
  }
};

// POST /api/chat/conversations/:id/messages  (HTTP fallback, main is via Socket)
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.user._id });
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });

    // Add user message
    conversation.messages.push({ role: 'user', content });

    // Build history for AI
    const chatbotName = req.user.preferences?.chatbotName || 'Nova AI';
    const systemPrompt = aiService.getSystemPrompt(chatbotName);
    const historyMessages = [
      { role: 'system', content: systemPrompt },
      ...conversation.messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
    ];

    const aiResponse = await aiService.generateResponse(historyMessages);

    // Add AI message
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse.content,
      tokens: aiResponse.usage.totalTokens,
      metadata: { model: aiResponse.model, processingTime: aiResponse.processingTime },
    });

    // Auto-title on first message
    if (conversation.messages.length === 2) conversation.generateTitle();

    conversation.stats.totalTokens += aiResponse.usage.totalTokens;
    await conversation.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalMessages': 2 } });

    res.json({
      success: true,
      userMessage: conversation.messages[conversation.messages.length - 2],
      aiMessage: conversation.messages[conversation.messages.length - 1],
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process message.' });
  }
};

// PATCH /api/chat/conversations/:convId/messages/:msgId/rate
const rateMessage = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const conversation = await Conversation.findOne({ _id: req.params.convId, userId: req.user._id });
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });

    const message = conversation.messages.id(req.params.msgId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

    message.rating = rating;
    message.feedback = feedback || '';
    await conversation.save();

    res.json({ success: true, message: 'Rating saved!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to rate message.' });
  }
};

// GET /api/chat/search
const searchConversations = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, results: [] });

    const conversations = await Conversation.find({
      userId: req.user._id,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { 'messages.content': { $regex: q, $options: 'i' } },
      ],
    }).select('title category stats lastMessageAt');

    res.json({ success: true, results: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed.' });
  }
};

module.exports = {
  getConversations,
  createConversation,
  getConversation,
  deleteConversation,
  updateConversation,
  sendMessage,
  rateMessage,
  searchConversations,
};
