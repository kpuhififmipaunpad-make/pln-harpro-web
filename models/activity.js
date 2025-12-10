const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['Proteksi', 'Metering', 'Otomasi', 'Pemeliharaan', 'Lainnya'],
    default: 'Pemeliharaan'
  },
  status: {
    type: String,
    enum: ['Terjadwal', 'Sedang Berjalan', 'Selesai'],
    default: 'Terjadwal'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Activity', activitySchema);
