const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { register, login, getMe, updatePreferences, changePassword } = require('../controllers/authController');

const validateRegister = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', authMiddleware, getMe);
router.patch('/preferences', authMiddleware, updatePreferences);
router.patch('/password', authMiddleware, changePassword);

module.exports = router;
