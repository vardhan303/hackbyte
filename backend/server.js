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
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL?.replace(/\/$/, ''), // Remove trailing slash
  'https://hackathon2-frontend-nextjs.vercel.app',
  'https://hackathon2-frontend-nextjs-git-master-vardhan-gosus-projects.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel deployments
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Allow local file requests (for seed-admin.html)
    if (origin === 'null' || origin === 'file://') {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.FRONTEND_URL === '*') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connect to MongoDB with caching for serverless
let cachedConnection = null;
let isConnecting = false;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('Using cached MongoDB connection');
    return cachedConnection;
  }

  // Validate MONGO_URI
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not defined in environment variables');
    throw new Error('MONGO_URI is not defined. Please check your .env file.');
  }

  try {
    console.log('Connecting to MongoDB...');
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10,
    });
    console.log('MongoDB connected successfully');
    cachedConnection = connection;
    return connection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
};

// Initialize connection with error handling
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  console.error('Please ensure MongoDB is running and MONGO_URI is correctly configured in .env file');
});

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  cachedConnection = null;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Routes - with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/request', requestRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/judge', judgeRoutes);

// Routes - without /api prefix (for compatibility)
app.use('/auth', authRoutes);
app.use('/request', requestRoutes);
app.use('/hackathons', hackathonRoutes);
app.use('/judge', judgeRoutes);

// Auto-seed admin on first deployment
const autoSeedAdmin = async () => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const existingAdmin = await User.findOne({ email: 'admin@hackathon.com' });
    
    if (!existingAdmin) {
      console.log('No admin user found. Creating default admin...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const admin = new User({
        name: 'System Admin',
        email: 'admin@hackathon.com',
        password: hashedPassword,
        role: 'admin',
        approved: true
      });

      await admin.save();
      console.log('✅ Default admin created successfully!');
      console.log('📧 Email: admin@hackathon.com');
      console.log('🔑 Password: admin123');
      console.log('⚠️  Please change the password after first login!');
    } else {
      // Check if password needs to be re-hashed
      const isPasswordHashed = existingAdmin.password.startsWith('$2');
      
      if (!isPasswordHashed) {
        console.log('Admin exists with unhashed password. Fixing...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        existingAdmin.password = hashedPassword;
        existingAdmin.role = 'admin';
        existingAdmin.approved = true;
        await existingAdmin.save();
        
        console.log('✅ Admin password fixed successfully!');
        console.log('📧 Email: admin@hackathon.com');
        console.log('🔑 Password: admin123');
      } else {
        console.log('✅ Admin user already exists with proper password');
      }
    }
  } catch (error) {
    console.error('❌ Error auto-seeding admin:', error.message);
  }
};

// Run auto-seed after MongoDB connection is established
mongoose.connection.once('open', () => {
  console.log('MongoDB connection established');
  autoSeedAdmin();
});

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

// MongoDB health check
app.get('/api/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState];
    
    res.json({
      status: 'ok',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Export for Vercel serverless
module.exports = app;