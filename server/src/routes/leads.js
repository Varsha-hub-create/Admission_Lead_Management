const express = require('express');
const { body, validationResult } = require('express-validator');
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
}

router.get('/', async (req, res, next) => {
  try {
    const {
      search, status, source, counsellor, priority,
      page = 1, limit = 10, sort = '-createdAt'
    } = req.query;

    const query = {};
    if (req.user.role === 'counsellor') query.counsellor = req.user._id;
    if (status) query.status = status;
    if (source) query.source = source;
    if (priority) query.priority = priority;
    if (counsellor && req.user.role !== 'counsellor') query.counsellor = counsellor;
    if (search) query.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Lead.find(query).populate('counsellor', 'name email').sort(sort).skip(skip).limit(Number(limit)),
      Lead.countDocuments(query)
    ]);

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('counsellor', 'name email');
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    if (req.user.role === 'counsellor' && String(lead.counsellor?._id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(lead);
  } catch (e) { next(e); }
});

router.post('/',
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('course').trim().notEmpty().withMessage('Course is required'),
  body('source').notEmpty().withMessage('Lead source is required'),
  validate,
  async (req, res, next) => {
    try {
      const data = { ...req.body };
      if (req.user.role === 'counsellor') data.counsellor = req.user._id;
      const lead = await Lead.create(data);
      res.status(201).json(await lead.populate('counsellor', 'name email'));
    } catch (e) { next(e); }
  }
);

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await Lead.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Lead not found' });
    if (req.user.role === 'counsellor' && String(existing.counsellor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allowed = ['name','email','phone','city','source','course','qualification','preferredIntake','status','priority','counsellor','notes','nextFollowUpAt','conversionValue'];
    for (const key of allowed) if (key in req.body) existing[key] = req.body[key];

    if (existing.status === 'Converted' && !existing.convertedAt) existing.convertedAt = new Date();
    if (req.body.status && req.body.status !== 'Converted') existing.convertedAt = undefined;

    await existing.save();
    res.json(await existing.populate('counsellor', 'name email'));
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (req.user.role === 'counsellor') return res.status(403).json({ message: 'Counsellors cannot delete leads' });
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json({ message: 'Lead deleted' });
  } catch (e) { next(e); }
});

router.post('/:id/followups',
  body('scheduledAt').notEmpty().withMessage('Follow-up date is required'),
  body('mode').isIn(['Call','WhatsApp','Email','Meeting','SMS']).withMessage('Invalid follow-up mode'),
  validate,
  async (req, res, next) => {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) return res.status(404).json({ message: 'Lead not found' });
      if (req.user.role === 'counsellor' && String(lead.counsellor) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      lead.followUps.push(req.body);
      lead.nextFollowUpAt = req.body.completed ? undefined : req.body.scheduledAt;
      lead.lastContactAt = new Date();
      await lead.save();
      res.status(201).json(lead);
    } catch (e) { next(e); }
  }
);

router.put('/:id/followups/:followUpId', async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    const followUp = lead.followUps.id(req.params.followUpId);
    if (!followUp) return res.status(404).json({ message: 'Follow-up not found' });

    Object.assign(followUp, req.body);
    if (req.body.completed === true) {
      followUp.completedAt = new Date();
      if (String(lead.nextFollowUpAt) === String(followUp.scheduledAt)) lead.nextFollowUpAt = undefined;
    }
    await lead.save();
    res.json(lead);
  } catch (e) { next(e); }
});

module.exports = router;