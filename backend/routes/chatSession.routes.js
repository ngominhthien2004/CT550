const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const asyncHandler = require('express-async-handler');

// GET /api/chat-sessions — list all sessions for current user
router.get('/', protect, asyncHandler(async (req, res) => {
  const sessions = await ChatSession.find({ user: req.user._id })
    .select('title updatedAt createdAt')
    .sort({ updatedAt: -1 })
    .lean();
  res.json(sessions);
}));

// POST /api/chat-sessions — create new session
router.post('/', protect, asyncHandler(async (req, res) => {
  const { title } = req.body;
  const session = await ChatSession.create({
    user: req.user._id,
    title: title || 'Cuộc trò chuyện mới'
  });

  // Tự động thêm welcome message
  await ChatMessage.create({
    session: session._id,
    role: 'assistant',
    content: '👋 Chào bạn! Tôi là trợ lý AI của IlluWrl. Tôi có thể:\n\n• 🔍 Tìm kiếm artwork, user, plan theo từ khóa\n• 💡 Gợi ý tác phẩm dựa trên sở thích của bạn\n• 🎨 Trả lời câu hỏi về nghệ thuật và illustration\n\nBạn muốn tôi giúp gì hôm nay? Hãy thử yêu cầu nhé!',
    isWelcome: true
  });

  res.status(201).json(session);
}));

// GET /api/chat-sessions/:id — get session details
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const session = await ChatSession.findOne({
    _id: req.params.id,
    user: req.user._id
  }).lean();

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  res.json(session);
}));

// DELETE /api/chat-sessions/:id — delete session and its messages
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const session = await ChatSession.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  // Delete all messages in this session
  await ChatMessage.deleteMany({ session: req.params.id });

  res.json({ message: 'Session deleted' });
}));

// PATCH /api/chat-sessions/:id — update session title
router.patch('/:id', protect, asyncHandler(async (req, res) => {
  const { title } = req.body;
  const session = await ChatSession.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { title, updatedAt: new Date() },
    { new: true }
  ).lean();

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  res.json(session);
}));

// GET /api/chat-sessions/:id/messages — get all messages for a session
router.get('/:id/messages', protect, asyncHandler(async (req, res) => {
  const session = await ChatSession.findOne({
    _id: req.params.id,
    user: req.user._id
  }).lean();

  if (!session) {
    res.status(404);
    throw new Error('Session not found');
  }

  const messages = await ChatMessage.find({ session: req.params.id })
    .sort({ createdAt: 1 })
    .lean();

  res.json(messages);
}));

module.exports = router;
