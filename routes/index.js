const express = require('express');
const router = express.Router();
const Personnel = require('../models/Personnel');
const Activity = require('../models/activity');

// Home Page
router.get('/', async (req, res) => {
  try {
    let personnel = [];
    let activities = [];
    
    try {
      personnel = await Personnel.find().sort({ level: 1 });
    } catch (err) {
      console.error('Error fetching personnel:', err);
    }
    
    try {
      // ✅ Get ALL activities (tidak dibatasi bulan)
      activities = await Activity.find().sort({ date: 1, gi: 1 });
      
      console.log('📊 Sending activities to frontend:', activities.length); // DEBUG
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
    
    res.render('index', { 
      personnel: personnel || [], 
      activities: activities || [] 
    });
  } catch (err) {
    console.error('Route error:', err);
    res.status(500).send('Server Error');
  }
});

// ✅ PENTING: Route month HARUS di atas route :date
// Get activities by month (AJAX)
router.get('/api/activities/month/:date', async (req, res) => {
  try {
    const targetDate = new Date(req.params.date);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
    
    const activities = await Activity.find({
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).sort({ date: 1, gi: 1 });
    
    console.log(`📅 API month request: ${activities.length} activities found`); // DEBUG
    
    res.json(activities);
  } catch (err) {
    console.error('API month error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Get activities by date (AJAX)
router.get('/api/activities/:date', async (req, res) => {
  try {
    const targetDate = new Date(req.params.date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const activities = await Activity.find({
      date: {
        $gte: targetDate,
        $lt: nextDay
      }
    }).sort({ gi: 1 });
    
    res.json(activities);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Create/Update Activity
router.post('/activities', async (req, res) => {
  try {
    const { date, gi, workTypes, personnel, description, notes } = req.body;
    
    // Validate
    if (!date || !gi) {
      return res.status(400).json({ error: 'Date and GI are required' });
    }
    
    // Check apakah sudah ada activity untuk GI & date ini
    const existingActivity = await Activity.findOne({
      date: new Date(date),
      gi: gi
    });
    
    if (existingActivity) {
      // Update existing
      existingActivity.workTypes = Array.isArray(workTypes) ? workTypes : [workTypes];
      existingActivity.personnel = Array.isArray(personnel) ? personnel : [personnel];
      existingActivity.description = description || '';
      existingActivity.notes = notes || '';
      existingActivity.updatedAt = new Date();
      await existingActivity.save();
      
      console.log('✅ Activity updated:', existingActivity._id); // DEBUG
    } else {
      // Create new
      const newActivity = new Activity({
        date: new Date(date),
        gi,
        workTypes: Array.isArray(workTypes) ? workTypes : [workTypes],
        personnel: Array.isArray(personnel) ? personnel : [personnel],
        description: description || '',
        notes: notes || ''
      });
      await newActivity.save();
      
      console.log('✅ Activity created:', newActivity._id); // DEBUG
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Create activity error:', err);
    res.status(400).json({ error: 'Error creating activity' });
  }
});

// Delete Activity
router.delete('/activities/:id', async (req, res) => {
  try {
    await Activity.findByIdAndDelete(req.params.id);
    console.log('✅ Activity deleted:', req.params.id); // DEBUG
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Error deleting activity' });
  }
});

module.exports = router;
