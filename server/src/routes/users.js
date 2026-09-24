const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/counsellors', protect, async (_req, res, next) => {
  try {
    const users = await User.find({ role: 'counsellor', active: true }).select('name email');
    res.json(users);
  } catch (e) { next(e); }
});

module.exports = router;