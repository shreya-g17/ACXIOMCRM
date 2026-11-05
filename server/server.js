require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const seedIfEmpty = require('./utils/seedIfEmpty');

const app = express();

// ── Security & Utility Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // allow cookies
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/customers',     require('./routes/customers'));
app.use('/api/leads',         require('./routes/leads'));
app.use('/api/opportunities', require('./routes/opportunities'));
app.use('/api/followups',     require('./routes/followups'));
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/reports',       require('./routes/reports'));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` }));

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error.' });
});

// ── Start only after persistence and initial data are ready ──────────────────
const startServer = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be configured.');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');

  await connectDB();
  await seedIfEmpty();

  const PORT = process.env.PORT || 5000;
  return app.listen(PORT, () => {
    console.log(`AcxiomCRM API running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

// if (require.main === module) {
//   startServer().catch((err) => {
//     console.error('Unable to start AcxiomCRM API:', err.message);
//     process.exitCode = 1;
//   });
// }

module.exports = app;
//module.exports.startServer = startServer;
