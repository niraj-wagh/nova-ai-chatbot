const User = require('../models/User');
const Conversation = require('../models/Conversation');

// GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalConversations, recentUsers] = await Promise.all([
      User.countDocuments(),
      Conversation.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('username email role createdAt stats'),
    ]);

    const totalMessages = await Conversation.aggregate([
      { $group: { _id: null, total: { $sum: '$stats.totalMessages' } } },
    ]);

    const activeToday = await User.countDocuments({
      'stats.lastActive': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalConversations,
        totalMessages: totalMessages[0]?.total || 0,
        activeToday,
        recentUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments();
    res.json({ success: true, users, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

// PATCH /api/admin/users/:id/toggle
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle user status.' });
  }
};

// PATCH /api/admin/users/:id/role
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, message: 'User role updated.', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change user role.' });
  }
};

module.exports = { getDashboardStats, getAllUsers, toggleUserStatus, changeUserRole };
