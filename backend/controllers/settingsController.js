const { ShopSettings } = require('../models');
const { asyncHandler }  = require('../middleware/errorHandler');

exports.getSettings = asyncHandler(async (req, res) => {
  let settings = await ShopSettings.findOne({ singleton: 'main' });
  if (!settings) settings = await ShopSettings.create({ singleton: 'main' });
  res.json({ success: true, data: settings });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const allowed = ['shopName','tagline','address','googleMapsUrl','email','hoursWeekdays','hoursSaturday','hoursSunday','phone','whatsapp','facebook','instagram','tiktok'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  const settings = await ShopSettings.findOneAndUpdate(
    { singleton: 'main' },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data: settings, message: 'Settings updated successfully' });
});
