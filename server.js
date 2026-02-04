const express = require('express'); // Force deploy
const cors = require('cors');
require('dotenv').config();

const app = express();

const mongoose = require('mongoose');

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Middleware
// app.use(cors({
//     origin: true, // Reflects the request origin
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
// }));
const corsOptions = {
  origin: function (origin, callback) {
    // allow Postman, curl, server-to-server
    if (!origin) return callback(null, true);

    const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'];
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // 👈 VERY IMPORTANT


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const publisherRoutes = require('./routes/publishers');
const postbackRoutes = require('./routes/postback');
const trackingRoutes = require('./routes/tracking');
const campaignRoutes = require('./routes/campaigns');

app.use('/api/auth', authRoutes);
app.use('/api/publishers', publisherRoutes);
app.use('/api/postback', postbackRoutes);
app.use('/api/track', trackingRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/stats', require('./routes/stats'));

// Debug/Health Route
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  
  let dbError = null;
  try {
    // Try a simple operation
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
      host: mongoose.connection.host
    },
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

// Base route
app.get('/', (req, res) => {
  res.send('FullPanel Backend API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});





// Force restart
