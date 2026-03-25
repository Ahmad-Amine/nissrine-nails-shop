const express = require('express');
const router  = express.Router();
const { register, login, getMe, seedAdmin, getAllUsers, resetUserPassword } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const { loginLimiter, registerLimiter, stripRoleFromBody } = require('../middleware/security');

router.post('/register', registerLimiter, stripRoleFromBody, register);
router.post('/login',    loginLimiter, login);
router.get('/me',        protect, getMe);

// seed-admin: one-time setup route — remove this from production after first use
router.get('/seed-admin', seedAdmin);

router.get('/users',     protect, adminOnly, getAllUsers);
router.put('/users/:id/reset-password', protect, adminOnly, resetUserPassword);

module.exports = router;
