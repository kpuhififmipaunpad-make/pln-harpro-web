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
    enum: ['GI Cimahi', 'GI Cililin', 'GI Lembang', 'GI Batujajar', 'GI Padalarang', 'GI Cisarua']
  },
  workTypes: [{
    type: String,
    enum: ['Rutin', 'Non Rutin', 'Pihak Lain', 'Libur Nasional']
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
