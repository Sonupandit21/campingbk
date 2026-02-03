const express = require('express'); // Force deploy
const cors = require('cors');
require('dotenv').config();

const app = express();

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

    if (origin === process.env.FRONTEND_URL) {
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

console.log('✅ Using file-based user storage (no database required)');

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
