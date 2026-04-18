const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      phone
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      registrationNumber: user.registrationNumber,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      // Duplicate key error
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
      if (error.keyPattern && error.keyPattern.registrationNumber) {
        return res.status(500).json({ message: 'Failed to generate unique registration number. Please try again.' });
      }
    }
    res.status(500).json({ message: error.message || 'Registration failed. Please try again.' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID (Admin only)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user status (Admin only)
const updateUserStatus = async (req, res) => {
  try {
    const { approved } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { approved },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'User status updated', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change password (Any authenticated user)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    console.log('Change password request for user ID:', req.user._id);

    // Get user with password
    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', user.email, 'Role:', user.role);

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    console.log('Current password match:', isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    console.log('New password hashed successfully');

    // Update password directly
    await User.findByIdAndUpdate(req.user._id, { password: hashedPassword });

    console.log('Password updated successfully for user:', user.email);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: error.message });
  }
};

// Seed admin user (for initial setup only)
const seedAdmin = async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@hackathon.com' });
    
    if (existingAdmin) {
      // Update the existing admin with proper hashed password
      console.log('Admin exists, updating password...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      existingAdmin.approved = true;
      await existingAdmin.save();
      
      console.log('✅ Admin user updated successfully!');
      console.log('Email: admin@hackathon.com');
      console.log('Password: admin123');
      
      return res.status(200).json({ 
        message: 'Admin user updated successfully!',
        credentials: {
          email: 'admin@hackathon.com',
          password: 'admin123',
          note: 'Please change password after first login'
        }
      });
    }

    // Create admin user
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
    
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@hackathon.com');
    console.log('Password: admin123');
    
    res.status(201).json({ 
      message: 'Admin user created successfully!',
      credentials: {
        email: 'admin@hackathon.com',
        password: 'admin123',
        note: 'Please change password after first login'
      }
    });
  } catch (error) {
    console.error('Error seeding admin:', error);
    res.status(500).json({ message: error.message });
  }
};

// Fix users without registration numbers
const fixRegistrationNumbers = async (req, res) => {
  try {
    // Find all users without registration numbers
    const usersWithoutRegNum = await User.find({ 
      $or: [
        { registrationNumber: { $exists: false } },
        { registrationNumber: null },
        { registrationNumber: '' }
      ]
    });

    console.log(`Found ${usersWithoutRegNum.length} users without registration numbers`);

    let fixed = 0;
    let errors = [];

    for (const user of usersWithoutRegNum) {
      try {
        // Generate unique registration number
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;
        let regNumber = '';
        
        while (!isUnique && attempts < maxAttempts) {
          const timestamp = Date.now().toString();
          const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          regNumber = `USR${timestamp}${random}`;
          
          const existing = await User.findOne({ registrationNumber: regNumber });
          
          if (!existing) {
            isUnique = true;
          } else {
            attempts++;
            // Small delay to ensure different timestamp
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        if (!isUnique) {
          errors.push({ userId: user._id, email: user.email, error: 'Could not generate unique number' });
          continue;
        }
        
        user.registrationNumber = regNumber;
        await user.save();
        fixed++;
        console.log(`Fixed user ${user.email} - assigned ${regNumber}`);
      } catch (err) {
        console.error(`Error fixing user ${user.email}:`, err);
        errors.push({ userId: user._id, email: user.email, error: err.message });
      }
    }

    res.json({
      message: 'Registration numbers fix completed',
      total: usersWithoutRegNum.length,
      fixed: fixed,
      errors: errors.length,
      errorDetails: errors
    });
  } catch (error) {
    console.error('Error fixing registration numbers:', error);
    res.status(500).json({ message: error.message });
  }
};

// Fix duplicate key error on hackathon registrations
const fixRegistrationIndexes = async (req, res) => {
  try {
    const HackathonRegistration = require('../models/HackathonRegistration');
    const collection = HackathonRegistration.collection;
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);
    
    // Drop the registrationNumber_1 index if it exists
    try {
      await collection.dropIndex('registrationNumber_1');
      console.log('Dropped registrationNumber_1 index');
    } catch (err) {
      console.log('Index registrationNumber_1 does not exist or already dropped:', err.message);
    }
    
    // Ensure the correct compound index exists
    await collection.createIndex({ hackathonId: 1, userId: 1 }, { unique: true });
    console.log('Created compound index on hackathonId and userId');
    
    // Get updated indexes
    const updatedIndexes = await collection.indexes();
    
    res.json({
      message: 'Index fix completed successfully',
      oldIndexes: indexes,
      newIndexes: updatedIndexes
    });
  } catch (error) {
    console.error('Error fixing indexes:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe, getAllUsers, getUserById, updateUserStatus, changePassword, seedAdmin, fixRegistrationNumbers, fixRegistrationIndexes };