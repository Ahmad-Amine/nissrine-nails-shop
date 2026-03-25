const rateLimit = require('express-rate-limit');
const helmet    = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

// ── Helmet: security headers ─────────────────────────────────
exports.helmetConfig = helmet({
  crossOriginEmbedderPolicy: false,   // allow images from CDN
  contentSecurityPolicy: false,       // let React handle CSP
});

// ── Rate limiters ─────────────────────────────────────────────

// Login: max 10 attempts per 15 minutes per IP
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Register: max 5 per hour per IP
exports.registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many accounts created from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: max 200 requests per 15 minutes
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── MongoDB injection sanitizer ───────────────────────────────
exports.mongoSanitize = mongoSanitize({
  replaceWith: '_',   // replace $ and . with _ to prevent NoSQL injection
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️  Sanitized suspicious key "${key}" from ${req.ip}`);
  },
});

// ── Body size limiter ─────────────────────────────────────────
exports.bodyLimit = '10kb'; // max request body size

// ── Strip unwanted fields from registration ───────────────────
// Prevents users from injecting 'role: admin' in request body
exports.stripRoleFromBody = (req, res, next) => {
  if (req.body) {
    delete req.body.role;        // never let client set role
    delete req.body.__v;
    delete req.body._id;
    delete req.body.createdAt;
    delete req.body.updatedAt;
  }
  next();
};
