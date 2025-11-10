const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const hackathonRoutes = require('./routes/hackathonRoutes');
const judgeRoutes = require('./routes/judgeRoutes');

// Import middleware
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB with caching for serverless
let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) {
    console.log('Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected');
    cachedConnection = connection;
    return connection;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Initialize connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/request', requestRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/judge', judgeRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hackathon Management Platform API',
    status: 'running',
    endpoints: ['/api/auth', '/api/request', '/api/hackathons', '/api/judge']
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'Hackathon Management Platform API',
    status: 'running',
    endpoints: ['/api/auth', '/api/request', '/api/hackathons', '/api/judge']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Export for Vercel serverless
module.exports = app;

// Only listen if not in Vercel environment
if (!process.env.VERCEL && require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}