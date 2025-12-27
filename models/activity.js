const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  gi: {
    type: String,
    required: true,
    enum: ['GISTET Saguling', 'GI Rajamandala', 'GI Cibabat Lama', 'GI Cibabat Baru', 'GI Bandung Utara', 'GI Kiaracondong', 'GI Braga', 'GI Cibereum', 'GI Dayeuhkolot', 'GI Sukaluyu', 'GI Padalarang', 'GI Panasia', 'GI Cianjur', 'GI Cigereleng']
  },
  workTypes: [{
    type: String,
    enum: ['Rutin', 'Non Rutin', 'Pihak Lain', 'Libur Nasional', 'Siaga NATARU']
  }],
  personnel: [{
    type: String,
    enum: ['Restu', 'Ara', 'Refo', 'Yudi']
  }],
  description: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index untuk query cepat
activitySchema.index({ date: 1, gi: 1 });

module.exports = mongoose.model('Activity', activitySchema);
