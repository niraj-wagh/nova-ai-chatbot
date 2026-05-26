const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { getDashboardStats, getAllUsers, toggleUserStatus, changeUserRole } = require('../controllers/adminController');

router.use(authMiddleware, adminMiddleware);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.patch('/users/:id/role', changeUserRole);

module.exports = router;
