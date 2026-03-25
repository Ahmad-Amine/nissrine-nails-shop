const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/availabilityController');
const { protect, adminOnly } = require('../middleware/auth');

// Seed only works in development
router.get('/seed-hours', (req, res, next) => {
  if (process.env.NODE_ENV === 'production')
    return res.status(403).json({ success: false, message: 'Seed disabled in production' });
  next();
}, ctrl.seedWorkingHours);

router.get('/month',          ctrl.getMonth);
router.get('/working-hours',  ctrl.getWorkingHours);
router.get('/date-overrides', ctrl.getDateOverrides);

router.put('/working-hours/:dayOfWeek', protect, adminOnly, ctrl.updateWorkingHours);
router.post('/date-overrides',          protect, adminOnly, ctrl.setDateOverride);
router.delete('/date-overrides/:id',    protect, adminOnly, ctrl.removeDateOverride);

router.get('/:date', ctrl.getSlots);

module.exports = router;
