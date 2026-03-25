const { Appointment, Service } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

const populateAppt = (q) =>
  q.populate('service', 'name price duration category')
   .populate('user',    'name email phone');

// ── Customer: my appointments ──────────────────────────────
exports.getMyAppointments = asyncHandler(async (req, res) => {
  const appts = await Appointment.find({ user: req.user._id })
    .populate('service', 'name price duration category')
    .sort({ date: -1, time: -1 });
  res.json({ success: true, data: appts });
});

// ── Admin: all appointments ────────────────────────────────
exports.getAllAppointments = asyncHandler(async (req, res) => {
  const appts = await populateAppt(Appointment.find()).sort({ date: 1, time: 1 });
  res.json({ success: true, data: appts });
});

// ── Admin: revenue summary ─────────────────────────────────
exports.getRevenueSummary = asyncHandler(async (req, res) => {
  const confirmed    = await Appointment.find({ status: 'confirmed' }).populate('service', 'price');
  const totalRevenue = confirmed.reduce((s, a) => s + (a.paidAmount || a.service?.price || 0), 0);
  const paidCount    = confirmed.filter(a =>  a.isPaid).length;
  const unpaidCount  = confirmed.filter(a => !a.isPaid).length;
  const todayStr     = new Date().toISOString().split('T')[0];
  const todayAppts   = await Appointment.find({ date: todayStr }).populate('service', 'price');
  const todayRevenue = todayAppts
    .filter(a => a.status === 'confirmed' && a.isPaid)
    .reduce((s, a) => s + (a.paidAmount || a.service?.price || 0), 0);
  res.json({ success: true, data: { totalRevenue, paidCount, unpaidCount, todayRevenue, todayAppts: todayAppts.length } });
});

// ── Customer: create appointment ───────────────────────────
exports.createAppointment = asyncHandler(async (req, res) => {
  const { serviceId, date, time, notes } = req.body;
  if (!serviceId || !date || !time)
    return res.status(400).json({ success: false, message: 'Service, date and time are required' });

  // Reject bookings in the past (today + past time, or any past date)
  const now        = new Date();
  const todayStr   = now.toISOString().split('T')[0];
  const slotDT     = new Date(`${date}T${time}:00`);
  if (date < todayStr)
    return res.status(400).json({ success: false, message: 'Cannot book an appointment in the past' });
  if (date === todayStr && slotDT <= now)
    return res.status(400).json({ success: false, message: 'This time slot has already passed. Please choose a future time.' });

  // Check for conflict using the compound index
  const conflict = await Appointment.findOne({ date, time, status: { $in: ['pending','confirmed'] } });
  if (conflict)
    return res.status(409).json({ success: false, message: 'This time slot is already booked. Please choose another.' });

  const service = await Service.findById(serviceId);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

  const appt = await Appointment.create({
    user: req.user._id, service: serviceId,
    date, time, notes: notes || '', paidAmount: service.price
  });
  await appt.populate('service', 'name price duration category');
  res.status(201).json({ success: true, data: appt, message: 'Appointment booked! Awaiting confirmation.' });
});

// ── Admin: create phone booking ────────────────────────────
exports.createPhoneBooking = asyncHandler(async (req, res) => {
  const { customerName, customerPhone, serviceId, date, time, notes } = req.body;
  if (!customerName || !customerPhone || !serviceId || !date || !time)
    return res.status(400).json({ success: false, message: 'All fields are required for phone booking' });

  const conflict = await Appointment.findOne({ date, time, status: { $in: ['pending','confirmed'] } });
  if (conflict)
    return res.status(409).json({ success: false, message: 'This time slot is already booked.' });

  const service = await Service.findById(serviceId);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

  const appt = await Appointment.create({
    customerName, customerPhone, service: serviceId,
    date, time, notes: notes || '',
    isPhoneBooking: true, status: 'confirmed', paidAmount: service.price
  });
  await appt.populate('service', 'name price duration category');
  res.status(201).json({ success: true, data: appt, message: 'Phone booking created and confirmed.' });
});

// ── Customer: cancel ───────────────────────────────────────
exports.cancelAppointment = asyncHandler(async (req, res) => {
  const appt = await Appointment.findOne({ _id: req.params.id, user: req.user._id });
  if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
  if (appt.status === 'cancelled')
    return res.status(400).json({ success: false, message: 'Already cancelled' });
  appt.status = 'cancelled';
  await appt.save();
  res.json({ success: true, message: 'Appointment cancelled', data: appt });
});

// ── Admin: confirm ─────────────────────────────────────────
exports.confirmAppointment = asyncHandler(async (req, res) => {
  const appt = await populateAppt(
    Appointment.findByIdAndUpdate(req.params.id,
      { status: 'confirmed', adminNote: req.body.adminNote || '' }, { new: true })
  );
  if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
  res.json({ success: true, data: appt, message: 'Appointment confirmed' });
});

// ── Admin: reject ──────────────────────────────────────────
exports.rejectAppointment = asyncHandler(async (req, res) => {
  const appt = await populateAppt(
    Appointment.findByIdAndUpdate(req.params.id,
      { status: 'rejected', adminNote: req.body.adminNote || '' }, { new: true })
  );
  if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
  res.json({ success: true, data: appt, message: 'Appointment rejected' });
});

// ── Admin: mark paid ───────────────────────────────────────
exports.markPaid = asyncHandler(async (req, res) => {
  const { paidAmount, paymentNote } = req.body;
  if (paidAmount !== undefined && isNaN(Number(paidAmount)))
    return res.status(400).json({ success: false, message: 'Invalid payment amount' });
  const appt = await populateAppt(
    Appointment.findByIdAndUpdate(req.params.id,
      { isPaid: true, paidAmount: paidAmount ? Number(paidAmount) : undefined, paymentNote: paymentNote || '' },
      { new: true })
  );
  if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
  res.json({ success: true, data: appt, message: 'Marked as paid' });
});

// ── Admin: manual cleanup ──────────────────────────────────
exports.cleanupOldAppointments = asyncHandler(async (req, res) => {
  const deleted = await Appointment.removeOldAppointments();
  res.json({ success: true, message: `Removed ${deleted} appointment(s) older than 2 weeks` });
});
