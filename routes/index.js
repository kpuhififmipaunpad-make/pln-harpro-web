const express = require('express');
const router = express.Router();
const Personnel = require('../models/personel');
const Activity = require('../models/activity');

// Home Page
router.get('/', async (req, res) => {
  try {
    const personnel = await Personnel.find().sort({ level: 1 });
    const activities = await Activity.find().sort({ date: 1 });
    res.render('index', { personnel, activities });
  } catch (err) {
    res.status(500).send('Server Error');
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
    });
    
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Create Activity (Admin)
router.post('/activities', async (req, res) => {
  try {
    const newActivity = new Activity({
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      category: req.body.category,
      status: req.body.status
    });
    await newActivity.save();
    res.redirect('/');
  } catch (err) {
    res.status(400).send('Error creating activity');
  }
});

// Delete Activity
router.delete('/activities/:id', async (req, res) => {
  try {
    await Activity.findByIdAndDelete(req.params.id);
    res.redirect('/');
  } catch (err) {
    res.status(500).send('Error deleting activity');
  }
});

module.exports = router;
