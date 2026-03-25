const { User } = require('../models');
const jwt       = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/errorHandler');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Password strength: min 8 chars, 1 uppercase, 1 number
const isStrongPassword = (pw) =>
  pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);

// Sanitize string inputs
const sanitize = (str) => (typeof str === 'string' ? str.trim() : '');

exports.register = asyncHandler(async (req, res) => {
  const name     = sanitize(req.body.name);
  const email    = sanitize(req.body.email).toLowerCase();
  const password = sanitize(req.body.password);
  const phone    = sanitize(req.body.phone);

  if (!name || !email || !password || !phone)
    return res.status(400).json({ success: false, message: 'All fields are required' });

  // Email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ success: false, message: 'Invalid email format' });

  // Password strength
  if (!isStrongPassword(password))
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters with 1 uppercase letter and 1 number' });

  // Prevent excessively long inputs
  if (name.length > 100 || email.length > 150 || phone.length > 30)
    return res.status(400).json({ success: false, message: 'Input too long' });

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

  // role is never taken from body — always defaults to 'customer'
  const user  = await User.create({ name, email, password, phone });
  const token = signToken(user._id);
  res.status(201).json({
    success: true, token,
    user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
  });
});

exports.login = asyncHandler(async (req, res) => {
  const email    = sanitize(req.body.email).toLowerCase();
  const password = sanitize(req.body.password);

  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required' });

  const user = await User.findOne({ email });

  // Use consistent timing to prevent user enumeration
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ success: false, message: 'Invalid email or password' });

  const token = signToken(user._id);
  res.json({
    success: true, token,
    user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// seed-admin: runs ONCE from .env credentials, then locks itself
exports.seedAdmin = asyncHandler(async (req, res) => {
  const exists = await User.findOne({ role: 'admin' });
  if (exists)
    // Don't reveal credentials in response ever again
    return res.json({ success: true, message: 'Admin account already set up.' });

  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PHONE } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD)
    return res.status(500).json({ success: false, message: 'Admin credentials not configured in .env' });

  await User.create({
    name:     ADMIN_NAME     || 'Admin',
    email:    ADMIN_EMAIL.toLowerCase(),
    password: ADMIN_PASSWORD,
    phone:    ADMIN_PHONE    || '00000000',
    role:     'admin',
  });

  // Never log or return the actual credentials
  res.json({ success: true, message: 'Admin account created. You can now log in.' });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;
  const q     = req.query.q ? req.query.q.trim() : '';

  const filter = q
    ? { $or: [
        { name:  { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ]}
    : {};

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: users, total, page, pages: Math.ceil(total / limit) });
});

exports.resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || !isStrongPassword(newPassword))
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters with 1 uppercase and 1 number' });

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.role === 'admin')
    return res.status(403).json({ success: false, message: 'Cannot reset admin password via this endpoint' });

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: `Password reset for ${user.name}` });
});
