const mongoose = require('mongoose');

// Admin can block specific dates (holidays, vacations, etc.)
const closedDateSchema = new mongoose.Schema({
  date:   { type: String, required: true, unique: true }, // YYYY-MM-DD
  reason: { type: String, default: 'Closed' }
}, { timestamps: true });

module.exports = mongoose.model('ClosedDate', closedDateSchema);
