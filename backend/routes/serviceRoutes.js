const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/serviceController');
const { protect, adminOnly } = require('../middleware/auth');

// IMPORTANT: /seed must come BEFORE /:id to avoid being caught as an ID
router.get('/seed', (req, res, next) => {
  if (process.env.NODE_ENV === 'production')
    return res.status(403).json({ success: false, message: 'Seed disabled in production' });
  next();
}, ctrl.seedServices);

router.get('/',      ctrl.getAllServices);
router.get('/:id',   ctrl.getServiceById);
router.post('/',     protect, adminOnly, ctrl.createService);
router.put('/:id',   protect, adminOnly, ctrl.updateService);
router.delete('/:id',protect, adminOnly, ctrl.deleteService);

module.exports = router;
