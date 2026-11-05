const User = require('../models/User');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Opportunity = require('../models/Opportunity');
const FollowUp = require('../models/FollowUp');

/**
 * Creates the three demo accounts and sample CRM records only when the
 * database has no users. Safe to call on every startup.
 */
async function seedIfEmpty() {
  const existing = await User.countDocuments();
  if (existing > 0) {
    console.log('ℹ️  Users already present — skipping seed.');
    return;
  }

  const admin = await User.create({ fullName: 'System Administrator', email: 'admin@acxiomcrm.com', password: 'Admin@123', role: 'Admin', department: 'IT' });
  const manager = await User.create({ fullName: 'Sales Manager', email: 'manager@acxiomcrm.com', password: 'Manager@123', role: 'Manager', department: 'Sales' });
  const sales = await User.create({ fullName: 'Priya Sharma', email: 'sales@acxiomcrm.com', password: 'Sales@123', role: 'Sales Executive', department: 'Sales' });

  const c1 = await Customer.create({ customerCode: 'CUS-001', customerName: 'Infosys Ltd', email: 'contact@infosys.com', phone: '9876543210', companyName: 'Infosys Ltd', city: 'Bengaluru', state: 'Karnataka', status: 'Active', owner: sales._id });
  const c2 = await Customer.create({ customerCode: 'CUS-002', customerName: 'TCS Procurement', email: 'procurement@tcs.com', phone: '9876543211', companyName: 'Tata Consultancy Services', city: 'Mumbai', state: 'Maharashtra', status: 'Active', owner: sales._id });
  const c3 = await Customer.create({ customerCode: 'CUS-003', customerName: 'Wipro Digital', email: 'digital@wipro.com', phone: '9876543212', companyName: 'Wipro Technologies', city: 'Hyderabad', state: 'Telangana', status: 'Prospect', owner: manager._id });

  const l1 = await Lead.create({ leadCode: 'LEAD-001', leadName: 'Ravi Kumar', email: 'ravi.kumar@techcorp.in', phone: '9123456780', companyName: 'TechCorp India', source: 'Website', status: 'Qualified', expectedValue: 250000, assignedTo: sales._id });
  await Lead.create({ leadCode: 'LEAD-002', leadName: 'Aisha Patel', email: 'aisha@futuretech.com', phone: '9123456781', companyName: 'FutureTech Solutions', source: 'Referral', status: 'New', expectedValue: 500000, assignedTo: sales._id });
  await Lead.create({ leadCode: 'LEAD-003', leadName: 'Sanjay Mehta', email: 'sanjay@globalit.com', phone: '9123456782', companyName: 'Global IT Services', source: 'ColdCall', status: 'Contacted', expectedValue: 180000, assignedTo: manager._id });

  const closeDate1 = new Date(); closeDate1.setMonth(closeDate1.getMonth() + 2);
  const closeDate2 = new Date(); closeDate2.setMonth(closeDate2.getMonth() + 1);
  const closeDate3 = new Date(); closeDate3.setMonth(closeDate3.getMonth() + 3);

  await Opportunity.create({ opportunityName: 'Infosys ERP Implementation', customer: c1._id, amount: 1500000, stage: 'Proposal', status: 'Open', probability: 65, expectedCloseDate: closeDate1, owner: sales._id, description: 'Full ERP suite rollout for Infosys procurement division.' });
  await Opportunity.create({ opportunityName: 'TCS Cloud Migration', customer: c2._id, amount: 3200000, stage: 'Negotiation', status: 'Open', probability: 80, expectedCloseDate: closeDate2, owner: sales._id });
  await Opportunity.create({ opportunityName: 'Wipro Analytics Platform', customer: c3._id, amount: 850000, stage: 'Qualification', status: 'Open', probability: 40, expectedCloseDate: closeDate3, owner: manager._id });
  await Opportunity.create({ opportunityName: 'Legacy Deal Won', customer: c1._id, amount: 500000, stage: 'Won', status: 'Closed', probability: 100, expectedCloseDate: new Date(), actualCloseDate: new Date(), owner: manager._id });

  const fu1 = new Date(); fu1.setDate(fu1.getDate() + 2);
  const fu2 = new Date(); fu2.setDate(fu2.getDate() + 5);
  const fu3 = new Date(); fu3.setDate(fu3.getDate() + 1);
  await FollowUp.create({ subject: 'Demo call with Infosys team', followUpDate: fu1, followUpType: 'Call', status: 'Planned', customer: c1._id, assignedTo: sales._id, notes: 'Prepare ERP demo slides.' });
  await FollowUp.create({ subject: 'TCS contract review meeting', followUpDate: fu2, followUpType: 'Meeting', status: 'Planned', customer: c2._id, assignedTo: sales._id });
  await FollowUp.create({ subject: 'Follow up with Ravi Kumar on proposal', followUpDate: fu3, followUpType: 'Email', status: 'Planned', lead: l1._id, assignedTo: sales._id });

  console.log('✅ Demo data seeded.');
  console.log('   Admin   : admin@acxiomcrm.com   / Admin@123');
  console.log('   Manager : manager@acxiomcrm.com / Manager@123');
  console.log('   Sales   : sales@acxiomcrm.com   / Sales@123');
}

module.exports = seedIfEmpty;
