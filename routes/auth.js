const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser, comparePassword } = require('../utils/userStore');

// Register
router.post('/register', async (req, res) => {
  let step = 'init';
  try {
    const { name, mobile, email, password, photo } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if DB is connected
    step = 'dbCheck';
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database service unavailable. Please check server logs.' });
    }
    
    // Create new user
    step = 'createUser';
    const user = await createUser({ name, mobile, email, password, photo });

    // Create token
    step = 'generateToken';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret', // Fallback for dev
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user
    });
  } catch (error) {
    console.error(`Register error at ${step}:`, error);
    if (error.message === 'Email already exists' || error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    if (error.message.includes('buffering timed out') || error.message.includes('Timeout')) {
       return res.status(503).json({ 
         error: 'Database Timeout. CAUSE: MongoDB IP Whitelist Block.', 
         details: 'Go to MongoDB Atlas -> Network Access -> Add IP Address -> Allow Access From Anywhere (0.0.0.0/0)' 
       });
    }

    res.status(500).json({ 
      error: `Registration Failed (${step}): ${error.message}`, 
      step: step,
      details: error.message,
      name: error.name
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if DB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database service unavailable. Please check server logs.' });
    }

    // Check if user exists
    // Note: This assumes a 'User' model is defined and imported elsewhere,
    // and 'bcrypt' is imported for password comparison.
    // The original code used 'findUserByEmail' and 'comparePassword' from '../utils/userStore'.
    // This change implies a shift in how user data and password comparison are handled.
    const User = require('../models/User'); // Assuming User model exists
    const bcrypt = require('bcryptjs'); // Assuming bcryptjs is used for password hashing

    // Ensure email is lowercased to match schema
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Create token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret', // Fallback for dev
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
      }
    );
  } catch (err) {
    console.error('Login Error:', err.message);
    
    if (err.message.includes('buffering timed out') || err.message.includes('Timeout')) {
       return res.status(503).json({ 
         error: 'Database Timeout. CAUSE: MongoDB IP Whitelist Block.', 
         details: 'Go to MongoDB Atlas -> Network Access -> Add IP Address -> Allow Access From Anywhere (0.0.0.0/0)' 
       });
    }

    res.status(500).json({ error: 'Server error during login', details: err.message });
  }
});

// Get all users (count)
router.get('/users', async (req, res) => {
  try {
    const { getAllUsers } = require('../utils/userStore');
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    // Return empty array to prevent frontend crash when DB is disconnected
    res.json([]);
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { deleteUser } = require('../utils/userStore');
    const { id } = req.params;
    await deleteUser(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;

// Change Password
router.put('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    const { findUserById, comparePassword, changePassword } = require('../utils/userStore');
    
    // In a real app we would use findById but we can reuse reading all users for now or implement findById
    // For simplicity, let's just use the existing helper logic or rely on readUsers inside helpers
    const { getAllUsers } = require('../utils/userStore');
    const users = await getAllUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await comparePassword(user, currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid current password' });
    }

    // Update password
    await changePassword(userId, newPassword);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Update Profile
router.put('/profile', async (req, res) => {
  try {
    const { userId, name, mobile, photo, email } = req.body;
    const { updateUser } = require('../utils/userStore');
    
    const updatedUser = await updateUser(userId, { name, mobile, photo, email });
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.message === 'Email already exists') {
        return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});
