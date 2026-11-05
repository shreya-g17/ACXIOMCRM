const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Opportunity = require('../models/Opportunity');
const FollowUp = require('../models/FollowUp');

/**
 * GET /api/dashboard
 * Returns all KPI data and chart series in one request.
 * Admins/Managers see global data; Sales Executives see own records.
 */
exports.getDashboard = async (req, res) => {
  try {
    const isGlobal = req.user.role !== 'Sales Executive';
    const userId = req.user._id;

    const customerFilter    = isGlobal ? {} : { owner: userId };
    const leadFilter        = isGlobal ? {} : { assignedTo: userId };
    const opportunityFilter = isGlobal ? {} : { owner: userId };
    const followUpFilter    = isGlobal ? {} : { assignedTo: userId };

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const [
      totalCustomers, totalLeads, openLeads,
      totalOpportunities, openOpportunities, wonOpportunities,
      totalFollowUps, overdueFollowUps,
      pipelineAgg, monthlyAgg, leadStatusAgg, stageAgg, recentFollowUps,
    ] = await Promise.all([
      Customer.countDocuments(customerFilter),
      Lead.countDocuments(leadFilter),
      Lead.countDocuments({ ...leadFilter, status: { $in: ['New', 'Contacted', 'Qualified'] } }),
      Opportunity.countDocuments(opportunityFilter),
      Opportunity.countDocuments({ ...opportunityFilter, status: 'Open' }),
      Opportunity.countDocuments({ ...opportunityFilter, stage: 'Won' }),
      FollowUp.countDocuments(followUpFilter),
      FollowUp.countDocuments({ ...followUpFilter, status: 'Planned', followUpDate: { $lt: today } }),
      // Pipeline value
      Opportunity.aggregate([{ $match: { ...opportunityFilter, status: 'Open' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      // Monthly revenue last 6 months
      Opportunity.aggregate([
        { $match: { ...opportunityFilter, stage: 'Won', actualCloseDate: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
        { $group: { _id: { year: { $year: '$actualCloseDate' }, month: { $month: '$actualCloseDate' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      // Lead status breakdown
      Lead.aggregate([{ $match: leadFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      // Opportunity by stage
      Opportunity.aggregate([{ $match: opportunityFilter }, { $group: { _id: '$stage', total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      // Upcoming follow-ups
      FollowUp.find({ ...followUpFilter, status: 'Planned', followUpDate: { $gte: today } })
        .populate('customer', 'customerName').populate('lead', 'leadName')
        .sort({ followUpDate: 1 }).limit(5),
    ]);

    res.json({
      success: true,
      kpi: {
        totalCustomers, totalLeads, openLeads,
        totalOpportunities, openOpportunities, wonOpportunities,
        pipelineValue: pipelineAgg[0]?.total || 0,
        totalFollowUps, overdueFollowUps,
      },
      charts: {
        monthlyRevenue: monthlyAgg,
        leadStatus: leadStatusAgg,
        opportunityStage: stageAgg,
      },
      upcomingFollowUps: recentFollowUps,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
