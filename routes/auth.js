const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser, comparePassword } = require('../utils/userStore');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, mobile, email, password, photo } = req.body;
    
    // Create new user
    const user = await createUser({ name, mobile, email, password, photo });

    // Create token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.message === 'Email already exists') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await comparePassword(user, password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
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
