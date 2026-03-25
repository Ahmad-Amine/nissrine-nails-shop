const { Service } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getAllServices = asyncHandler(async (req, res) => {
  const services = await Service.find({ isActive: true }).sort({ category: 1, name: 1 });
  res.json({ success: true, data: services });
});

exports.getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
  res.json({ success: true, data: service });
});

exports.createService = asyncHandler(async (req, res) => {
  const { name, description, price, duration, category } = req.body;
  if (!name || !description || !price || !duration)
    return res.status(400).json({ success: false, message: 'Name, description, price and duration are required' });
  const service = await Service.create({ name, description, price: Number(price), duration: Number(duration), category: category || 'Other' });
  res.status(201).json({ success: true, data: service, message: 'Service created successfully' });
});

exports.updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
  res.json({ success: true, data: service, message: 'Service updated successfully' });
});

exports.deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
  res.json({ success: true, message: 'Service removed successfully' });
});

exports.seedServices = asyncHandler(async (req, res) => {
  const count = await Service.countDocuments();
  if (count > 0) return res.json({ success: true, message: 'Services already seeded' });
  await Service.insertMany([
    { name: 'Classic Manicure',  description: 'Nail shaping, cuticle care and polish application.',       price: 25, duration: 45, category: 'Manicure' },
    { name: 'Gel Manicure',      description: 'Long-lasting gel polish that shines for up to 3 weeks.',   price: 40, duration: 60, category: 'Gel'      },
    { name: 'Classic Pedicure',  description: 'Foot soak, nail care and polish for your feet.',           price: 35, duration: 60, category: 'Pedicure' },
    { name: 'Gel Pedicure',      description: 'Gel polish for feet with long-lasting results.',           price: 50, duration: 75, category: 'Gel'      },
    { name: 'Acrylic Full Set',  description: 'Full acrylic nail extensions, shaped and polished.',       price: 60, duration: 90, category: 'Acrylic'  },
    { name: 'Nail Art Design',   description: 'Creative nail art — flowers, gems, gradients and more!',   price: 15, duration: 30, category: 'Nail Art' },
    { name: 'French Manicure',   description: 'Timeless white-tip French manicure for an elegant look.',  price: 30, duration: 50, category: 'Manicure' },
    { name: 'Nail Removal',      description: 'Safe removal of gel, acrylic, or dip powder nails.',      price: 20, duration: 30, category: 'Other'    },
  ]);
  res.json({ success: true, message: '8 services seeded!' });
});
