require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Lead = require('./models/Lead');

async function seed() {
  await connectDB();
  await User.deleteMany({});
  await Lead.deleteMany({});

  const password = await bcrypt.hash('Admin@123', 10);
  const users = await User.insertMany([
    { name: 'Admin User', email: 'admin@edumerge.local', password, role: 'admin' },
    { name: 'Meena Manager', email: 'manager@edumerge.local', password, role: 'manager' },
    { name: 'Arun Counsellor', email: 'arun@edumerge.local', password, role: 'counsellor' },
    { name: 'Priya Counsellor', email: 'priya@edumerge.local', password, role: 'counsellor' }
  ]);

  const arun = users.find(u => u.email === 'arun@edumerge.local');
  const priya = users.find(u => u.email === 'priya@edumerge.local');

  const now = Date.now();
  const lead = (i, data) => ({
    name: data.name,
    email: `${data.name.toLowerCase().replace(/\s+/g,'')}${i}@example.com`,
    phone: `90000000${String(i).padStart(2,'0')}`,
    city: data.city || 'Coimbatore',
    source: data.source,
    course: data.course,
    qualification: 'Higher Secondary',
    preferredIntake: '2027',
    status: data.status,
    priority: data.priority || 'Medium',
    counsellor: data.counsellor,
    notes: data.notes || '',
    nextFollowUpAt: data.nextFollowUpAt,
    createdAt: data.createdAt || new Date(now - i * 86400000),
    lastContactAt: data.lastContactAt
  });

  await Lead.insertMany([
    lead(1, {name:'Ananya Kumar', source:'Website', course:'B.Tech Computer Science', status:'New', priority:'High', counsellor:arun._id}),
    lead(2, {name:'Rahul Das', source:'WhatsApp', course:'BCA', status:'Contacted', counsellor:priya._id, nextFollowUpAt:new Date(now + 86400000)}),
    lead(3, {name:'Divya S', source:'Fair', course:'MBA', status:'Qualified', priority:'High', counsellor:arun._id, nextFollowUpAt:new Date(now + 2*86400000)}),
    lead(4, {name:'Karthik R', source:'Referral', course:'MCA', status:'Counselling Scheduled', counsellor:priya._id, nextFollowUpAt:new Date(now + 3*86400000)}),
    lead(5, {name:'Nithya P', source:'Campaign', course:'B.Sc Data Science', status:'Application Started', counsellor:arun._id, nextFollowUpAt:new Date(now - 86400000)}),
    lead(6, {name:'Vignesh M', source:'Walk-in', course:'B.Com', status:'Converted', counsellor:priya._id, conversionValue:125000, convertedAt:new Date(now - 5*86400000)}),
    lead(7, {name:'Harish K', source:'Phone', course:'B.Tech AI & DS', status:'Lost', counsellor:arun._id}),
    lead(8, {name:'Keerthana V', source:'Website', course:'M.Tech AI', status:'Application Submitted', priority:'High', counsellor:priya._id}),
    lead(9, {name:'Sanjana T', source:'Other', course:'BBA', status:'Deferred', counsellor:arun._id}),
    lead(10, {name:'Mohan S', source:'Campaign', course:'BCA', status:'Contacted', counsellor:priya._id, nextFollowUpAt:new Date(now)}),
    lead(11, {name:'Aishwarya R', source:'Website', course:'B.Tech IT', status:'Qualified', counsellor:arun._id}),
    lead(12, {name:'Gokul N', source:'Fair', course:'MBA', status:'Not Interested', counsellor:priya._id})
  ]);

  console.log('Seed complete. Demo password: Admin@123');
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });