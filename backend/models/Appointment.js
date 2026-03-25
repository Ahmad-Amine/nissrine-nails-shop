const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Online booking — linked user account
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Phone booking — admin fills manually
  customerName:   { type: String, default: '' },
  customerPhone:  { type: String, default: '' },
  isPhoneBooking: { type: Boolean, default: false },

  service:   { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  date:      { type: String, required: true },
  time:      { type: String, required: true },
  status:    { type: String, enum: ['pending','confirmed','rejected','cancelled'], default: 'pending' },
  notes:     { type: String, default: '' },
  adminNote: { type: String, default: '' },

  // Payment
  isPaid:      { type: Boolean, default: false },
  paidAmount:  { type: Number, default: 0 },
  paymentNote: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
