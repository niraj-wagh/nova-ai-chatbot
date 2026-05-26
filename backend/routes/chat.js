const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getConversations, createConversation, getConversation,
  deleteConversation, updateConversation, sendMessage,
  rateMessage, searchConversations,
} = require('../controllers/chatController');

router.use(authMiddleware);

router.get('/search', searchConversations);
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id', getConversation);
router.patch('/conversations/:id', updateConversation);
router.delete('/conversations/:id', deleteConversation);
router.post('/conversations/:id/messages', sendMessage);
router.patch('/conversations/:convId/messages/:msgId/rate', rateMessage);

module.exports = router;
