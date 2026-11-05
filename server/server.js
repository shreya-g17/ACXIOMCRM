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
// Disable CSP and COEP — this is a JSON API server, not an HTML server.
// CSP for the React frontend is handled via Vercel response headers (vercel.json).
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
const allowedOrigin = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin.replace(/\/$/, '') === allowedOrigin) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true, // allow cookies
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Lazy DB connection for serverless (Vercel) ───────────────────────────────
// In a serverless environment there is no persistent process, so we connect to
// MongoDB on the first request and cache the connection for warm invocations.
let initialized = false;
app.use(async (req, res, next) => {
  if (initialized) return next();
  try {
    if (!process.env.MONGO_URI) {
      return res.status(500).json({ success: false, message: 'MONGO_URI is not configured.' });
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured.' });
    }
    await connectDB();
    await seedIfEmpty();
    initialized = true;
    next();
  } catch (err) {
    console.error('Initialization error:', err.message);
    res.status(500).json({ success: false, message: 'Server initialization failed.' });
  }
});

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

// ── Local development: start the server when run directly ────────────────────
if (require.main === module) {
  const startServer = async () => {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be configured.');
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
      throw new Error('JWT_SECRET must be configured with at least 32 characters.');

    await connectDB();
    await seedIfEmpty();
    initialized = true;

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`AcxiomCRM API running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  };

  startServer().catch((err) => {
    console.error('Unable to start AcxiomCRM API:', err.message);
    process.exitCode = 1;
  });
}

// ── Export for Vercel serverless ─────────────────────────────────────────────
module.exports = app;
