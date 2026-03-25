const mongoose = require('mongoose');

const workingHoursSchema = new mongoose.Schema({
  dayOfWeek:    { type: Number, required: true, unique: true },
  isOpen:       { type: Boolean, default: true },
  openTime:     { type: String, default: '09:00' },
  closeTime:    { type: String, default: '20:00' },
  slotDuration: { type: Number, default: 60 }
}, { timestamps: true });

module.exports = mongoose.model('WorkingHours', workingHoursSchema);
