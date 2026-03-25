const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
require('dotenv').config();

const { errorHandler }                                         = require('./middleware/errorHandler');
const { helmetConfig, generalLimiter, mongoSanitize, bodyLimit } = require('./middleware/security');
const { Appointment } = require('./models');

const authRoutes         = require('./routes/authRoutes');
const serviceRoutes      = require('./routes/serviceRoutes');
const appointmentRoutes  = require('./routes/appointmentRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const settingsRoutes     = require('./routes/settingsRoutes');

const app = express();

// ── Security headers ─────────────────────────────────────────
app.use(helmetConfig);

// ── CORS — only allow our frontend origin ────────────────────
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:5173',
];
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, Postman in dev)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Body parsing with size limit ─────────────────────────────
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

// ── MongoDB injection sanitization ───────────────────────────
app.use(mongoSanitize);

// ── General rate limiter ──────────────────────────────────────
app.use('/api/', generalLimiter);

// ── Request logger (dev only) ─────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── MongoDB ───────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    try {
      const deleted = await Appointment.removeOldAppointments();
      if (deleted > 0) console.log(`🧹 Startup cleanup: ${deleted} old appointment(s) removed`);
    } catch (e) { console.warn('⚠️  Cleanup warning:', e.message); }

    const scheduleCleanup = () => {
      const now  = new Date();
      const next = new Date(); next.setHours(24, 0, 0, 0);
      setTimeout(async () => {
        try { await Appointment.removeOldAppointments(); } catch {}
        scheduleCleanup();
      }, next - now);
    };
    scheduleCleanup();
  })
  .catch(err => { console.error('❌ MongoDB Error:', err.message); process.exit(1); });

mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
mongoose.connection.on('reconnected',  () => console.log('✅  MongoDB reconnected'));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/services',     serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/settings',     settingsRoutes);

// ── Health check (minimal — no internal info) ─────────────────
app.get('/', (req, res) => res.json({ success: true, message: '💅 API running' }));

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Not found' }));

// ── Central error handler ─────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason?.message || reason);
});
