const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// -----------------------------
// Database Connection
// -----------------------------
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// -----------------------------
// CORS Configuration
// -----------------------------
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://trackierpanel.com',
  'https://www.trackierpanel.com',
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.set('trust proxy', true);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// -----------------------------
// API Routes
// -----------------------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/publishers', require('./routes/publishers'));
app.use('/api/postback', require('./routes/postback'));
app.use('/api/track', require('./routes/tracking'));
app.use('/tracking', require('./routes/tracking'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/utils', require('./routes/utils'));

// -----------------------------
// Health Check Route
// -----------------------------
app.get('/api/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  let dbError = null;

  try {
    if (dbState === 1) {
      await mongoose.connection.db.admin().ping();
    }
  } catch (e) {
    dbError = e.message;
  }

  res.json({
    status: 'ok',
    timestamp: new Date(),
    database: {
      state: states[dbState] || 'unknown',
      code: dbState,
      error: dbError,
      host: mongoose.connection.host || null,
    },
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      nodeEnv: process.env.NODE_ENV,
    },
  });
});

// -----------------------------
// Serve Frontend Build
// -----------------------------
const frontendBuildPath = path.join(__dirname, '../frontend/client/build');

app.use(express.static(frontendBuildPath));

// root route
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// SPA fallback route
app.get(/^\/(?!api|tracking).*/, (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// -----------------------------
// API 404
// -----------------------------
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    path: req.originalUrl,
  });
});

// -----------------------------
// Error Handling Middleware
// -----------------------------
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack || err.message);

  res.status(err.status || 500).json({
    error: 'Something went wrong!',
    details: err.message,
  });
});

const PORT = process.env.PORT || 5002; // ✅ FIXED to match your running port
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});