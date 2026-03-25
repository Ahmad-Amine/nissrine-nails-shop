const mongoose = require('mongoose');

/**
 * DateOverride lets the admin control a SPECIFIC DATE differently
 * from its regular weekly schedule.
 *
 * isOpen: true  → force this date OPEN even if the weekly schedule has it closed
 * isOpen: false → force this date CLOSED even if the weekly schedule has it open
 *
 * When isOpen: true, you can also set custom openTime/closeTime/slotDuration
 * for that specific date only.
 */
const dateOverrideSchema = new mongoose.Schema({
  date:         { type: String, required: true, unique: true }, // YYYY-MM-DD
  isOpen:       { type: Boolean, required: true },
  openTime:     { type: String, default: '09:00' },
  closeTime:    { type: String, default: '20:00' },
  slotDuration: { type: Number, default: 60 },
  reason:       { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('DateOverride', dateOverrideSchema);
