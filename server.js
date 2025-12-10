require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database Connection
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('✓ MongoDB Connected - PLN HarPro Database'))
  .catch(err => console.error('MongoDB Error:', err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', require('./routes/index'));

// 404 Handler
app.use((req, res) => {
  res.status(404).send('Halaman tidak ditemukan');
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PLN HarPro Server running on port ${PORT}`);
});
