/**
 * MODELS INDEX — defines all schemas and their relationships in one place
 *
 * Relationship Map:
 *
 *  User ──────────────────────────────────┐
 *    │  hasMany Appointments               │
 *    │                                     │
 *  Service ───────────────────────────────┤
 *    │  hasMany Appointments               │
 *    │                                     ▼
 *  Appointment ── belongsTo User        (ref: User)
 *               ── belongsTo Service    (ref: Service)
 *
 *  WorkingHours  ── standalone (one doc per day-of-week 0–6)
 *  DateOverride  ── standalone (one doc per specific date, overrides WorkingHours)
 *  ClosedDate    ── merged INTO DateOverride (same purpose — kept for compatibility)
 *  ShopSettings  ── standalone singleton (one doc, shop info + social links)
 */

const mongoose = require('mongoose');
const bcrypt    = require('bcryptjs');

// ─────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  phone:    { type: String, required: true, trim: true },
  role:     { type: String, enum: ['customer','admin'], default: 'customer' },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.matchPassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};
// Virtual: get all appointments for this user
userSchema.virtual('appointments', {
  ref:          'Appointment',
  localField:   '_id',
  foreignField: 'user',
});

// ─────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────
const serviceSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  duration:    { type: Number, required: true, min: 1 },
  category:    { type: String, enum: ['Manicure','Pedicure','Nail Art','Gel','Acrylic','Other'], default: 'Other' },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

// Virtual: get all appointments for this service
serviceSchema.virtual('appointments', {
  ref:          'Appointment',
  localField:   '_id',
  foreignField: 'service',
});

// ─────────────────────────────────────────────────────────────
// APPOINTMENT
// ─────────────────────────────────────────────────────────────
const appointmentSchema = new mongoose.Schema({
  // ── Relation to User (null for phone bookings) ──
  user: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'User',
    default: null,
    index:   true,                     // faster lookups by user
  },

  // ── Phone booking fields (only when user is null) ──
  customerName:   { type: String, default: '' },
  customerPhone:  { type: String, default: '' },
  isPhoneBooking: { type: Boolean, default: false },

  // ── Relation to Service ──
  service: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Service',
    required: true,
    index:    true,                    // faster lookups by service
  },

  date:      { type: String, required: true, index: true },  // YYYY-MM-DD
  time:      { type: String, required: true },
  status:    { type: String, enum: ['pending','confirmed','rejected','cancelled'], default: 'pending', index: true },
  notes:     { type: String, default: '' },
  adminNote: { type: String, default: '' },

  // ── Payment ──
  isPaid:      { type: Boolean, default: false },
  paidAmount:  { type: Number,  default: 0, min: 0 },
  paymentNote: { type: String,  default: '' },
}, { timestamps: true });

// Compound index: quickly find conflicts (same date+time+active status)
appointmentSchema.index({ date: 1, time: 1, status: 1 });

// ── AUTO-REMOVE: delete appointments older than 2 weeks ──
// MongoDB TTL index on the date field isn't ideal here (date is a string)
// so we use a pre-save hook + a static cleanup method called on server start
appointmentSchema.statics.removeOldAppointments = async function() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);                     // 14 days ago
  const cutoffStr = cutoff.toISOString().split('T')[0];      // YYYY-MM-DD

  const result = await this.deleteMany({ date: { $lt: cutoffStr } });
  if (result.deletedCount > 0) {
    console.log(`🧹 Auto-cleanup: removed ${result.deletedCount} appointment(s) older than 2 weeks`);
  }
  return result.deletedCount;
};

// ─────────────────────────────────────────────────────────────
// WORKING HOURS  (one doc per day-of-week, 0=Sun … 6=Sat)
// ─────────────────────────────────────────────────────────────
const workingHoursSchema = new mongoose.Schema({
  dayOfWeek:    { type: Number, required: true, unique: true, min: 0, max: 6 },
  isOpen:       { type: Boolean, default: true },
  openTime:     { type: String, default: '09:00' },
  closeTime:    { type: String, default: '20:00' },
  slotDuration: { type: Number, default: 60, min: 15 },
}, { timestamps: true });

// ─────────────────────────────────────────────────────────────
// DATE OVERRIDE  (overrides the weekly schedule for one date)
// ─────────────────────────────────────────────────────────────
const dateOverrideSchema = new mongoose.Schema({
  date:         { type: String, required: true, unique: true },  // YYYY-MM-DD
  isOpen:       { type: Boolean, required: true },
  openTime:     { type: String, default: '09:00' },
  closeTime:    { type: String, default: '20:00' },
  slotDuration: { type: Number, default: 60 },
  reason:       { type: String, default: '' },
}, { timestamps: true });

// ─────────────────────────────────────────────────────────────
// CLOSED DATE  (legacy — kept for backward compatibility)
// ─────────────────────────────────────────────────────────────
const closedDateSchema = new mongoose.Schema({
  date:   { type: String, required: true, unique: true },
  reason: { type: String, default: 'Closed' },
}, { timestamps: true });

// ─────────────────────────────────────────────────────────────
// SHOP SETTINGS  (singleton)
// ─────────────────────────────────────────────────────────────
const shopSettingsSchema = new mongoose.Schema({
  singleton:     { type: String, default: 'main', unique: true },
  shopName:      { type: String, default: 'Nissrine Nails Shop' },
  tagline:       { type: String, default: 'By Nissrine Bou Zeid' },
  address:       { type: String, default: 'Zahle, Lebanon' },
  googleMapsUrl: { type: String, default: 'https://maps.google.com/maps?q=Zahle,Lebanon' },
  email:         { type: String, default: '' },
  hoursWeekdays: { type: String, default: 'Mon–Fri: 9 AM – 8 PM' },
  hoursSaturday: { type: String, default: 'Saturday: 10 AM – 6 PM' },
  hoursSunday:   { type: String, default: '' },
  phone:         { type: String, default: '' },
  whatsapp:      { type: String, default: '' },
  facebook:      { type: String, default: '' },
  instagram:     { type: String, default: '' },
  tiktok:        { type: String, default: '' },
}, { timestamps: true });

// ─────────────────────────────────────────────────────────────
// REGISTER MODELS
// ─────────────────────────────────────────────────────────────
const User         = mongoose.model('User',         userSchema);
const Service      = mongoose.model('Service',      serviceSchema);
const Appointment  = mongoose.model('Appointment',  appointmentSchema);
const WorkingHours = mongoose.model('WorkingHours', workingHoursSchema);
const DateOverride = mongoose.model('DateOverride', dateOverrideSchema);
const ClosedDate   = mongoose.model('ClosedDate',   closedDateSchema);
const ShopSettings = mongoose.model('ShopSettings', shopSettingsSchema);

module.exports = {
  User,
  Service,
  Appointment,
  WorkingHours,
  DateOverride,
  ClosedDate,
  ShopSettings,
};
