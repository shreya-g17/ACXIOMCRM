const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Opportunity = require('../models/Opportunity');
const User = require('../models/User');

exports.getReports = async (req, res) => {
  try {
    const [
      totalCustomers, totalLeads,
      wonAgg, lostCount, openCount,
      leadSourceAgg, stageAgg, topUsers,
    ] = await Promise.all([
      Customer.countDocuments(),
      Lead.countDocuments(),
      Opportunity.aggregate([{ $match: { stage: 'Won' } }, { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$amount' } } }]),
      Opportunity.countDocuments({ stage: 'Lost' }),
      Opportunity.countDocuments({ status: 'Open' }),
      Lead.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Opportunity.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
      // Top performers
      User.aggregate([
        { $match: { isActive: true } },
        { $lookup: { from: 'customers', localField: '_id', foreignField: 'owner', as: 'customers' } },
        { $lookup: { from: 'opportunities', localField: '_id', foreignField: 'owner', as: 'opportunities' } },
        { $project: {
          fullName: 1, role: 1,
          customerCount: { $size: '$customers' },
          wonDeals: { $size: { $filter: { input: '$opportunities', as: 'o', cond: { $eq: ['$$o.stage', 'Won'] } } } },
          openOpportunities: { $size: { $filter: { input: '$opportunities', as: 'o', cond: { $eq: ['$$o.status', 'Open'] } } } },
          totalRevenue: { $sum: { $map: { input: { $filter: { input: '$opportunities', as: 'o', cond: { $eq: ['$$o.stage', 'Won'] } } }, as: 'w', in: '$$w.amount' } } }
        }},
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.json({
      success: true,
      summary: {
        totalCustomers, totalLeads,
        totalWon: wonAgg[0]?.count || 0,
        totalRevenue: wonAgg[0]?.revenue || 0,
        totalLost: lostCount,
        totalOpen: openCount,
      },
      charts: { leadSource: leadSourceAgg, opportunityStage: stageAgg },
      topPerformers: topUsers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
