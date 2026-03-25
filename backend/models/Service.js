const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true },
  duration:    { type: Number, required: true },
  category:    { type: String, enum: ['Manicure','Pedicure','Nail Art','Gel','Acrylic','Other'], default: 'Other' },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
