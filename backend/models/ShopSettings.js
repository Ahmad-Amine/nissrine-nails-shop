const mongoose = require('mongoose');

const shopSettingsSchema = new mongoose.Schema({
  // Only one document — singleton pattern
  singleton: { type: String, default: 'main', unique: true },

  shopName:    { type: String, default: 'Nissrine Nails Shop' },
  tagline:     { type: String, default: 'By Nissrine Bou Zeid' },
  address:     { type: String, default: 'Zahle, Lebanon' },
  googleMapsUrl: { type: String, default: 'https://maps.google.com/maps?q=Zahle,Lebanon' },
  email:       { type: String, default: '' },

  // Working hours display (for footer — not the booking schedule)
  hoursWeekdays: { type: String, default: 'Mon–Fri: 9 AM – 8 PM' },
  hoursSaturday: { type: String, default: 'Saturday: 10 AM – 6 PM' },
  hoursSunday:   { type: String, default: '' }, // empty = closed

  // Social media
  phone:     { type: String, default: '' },
  whatsapp:  { type: String, default: '' },
  facebook:  { type: String, default: '' },
  instagram: { type: String, default: '' },
  tiktok:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ShopSettings', shopSettingsSchema);
