const mongoose = require('mongoose');

const personnelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  photo: {
    type: String,
    default: 'https://ui-avatars.com/api/?background=035B71&color=fff&size=200&name='
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Personnel', personnelSchema);
