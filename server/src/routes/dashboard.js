const express = require('express');
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', protect, async (req, res, next) => {
  try {
    const match = {};
    if (req.user.role === 'counsellor') match.counsellor = req.user._id;

    const [total, groupedStatus, groupedSource, overdue, dueToday, converted] = await Promise.all([
      Lead.countDocuments(match),
      Lead.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Lead.aggregate([{ $match: match }, { $group: { _id: '$source', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Lead.countDocuments({ ...match, nextFollowUpAt: { $lt: new Date() }, status: { $nin: ['Converted', 'Lost', 'Not Interested'] } }),
      Lead.countDocuments({
        ...match,
        nextFollowUpAt: {
          $gte: new Date(new Date().setHours(0,0,0,0)),
          $lt: new Date(new Date().setHours(23,59,59,999))
        }
      }),
      Lead.find({ ...match, status: 'Converted' }).select('conversionValue')
    ]);

    const conversionValue = converted.reduce((sum, l) => sum + (l.conversionValue || 0), 0);
    const statusMap = Object.fromEntries(groupedStatus.map(x => [x._id, x.count]));
    const sourceMap = Object.fromEntries(groupedSource.map(x => [x._id, x.count]));

    res.json({
      total, statusMap, sourceMap, overdue, dueToday,
      converted: statusMap.Converted || 0,
      conversionRate: total ? Number((((statusMap.Converted || 0) / total) * 100).toFixed(1)) : 0,
      conversionValue
    });
  } catch (e) { next(e); }
});

module.exports = router;