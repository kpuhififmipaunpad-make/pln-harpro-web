require('dotenv').config();
const mongoose = require('mongoose');
const Activity = require('./models/activity');

mongoose.connect(process.env.DATABASE_URL).then(async () => {
  console.log('✅ Connected to MongoDB');
  
  const activities = await Activity.find().sort({ date: -1 });
  
  console.log('\n📊 Total activities in database:', activities.length);
  console.log('\n📋 Latest activities:');
  
  activities.forEach((act, i) => {
    console.log(`\n${i+1}. Date: ${act.date.toISOString().split('T')[0]}`);
    console.log(`   GI: ${act.gi}`);
    console.log(`   WorkTypes: ${act.workTypes.join(', ')}`);
    console.log(`   Personnel: ${act.personnel.join(', ')}`);
  });
  
  process.exit();
}).catch(err => {
  console.error('❌ Connection error:', err);
  process.exit(1);
});
