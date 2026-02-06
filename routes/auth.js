const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/* ================= REGISTER ================= */
router.post('/register', async (req, res) => {
  try {
    const { name, mobile, email, password, photo, role = 'user' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      mobile,
      email: email.toLowerCase(),
      password: hashedPassword,
      photo,
      role
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/* ================= LOGIN ================= */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({ token, user });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/* ================= GET USERS (LATEST FIRST) ================= */
router.get('/users', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;

    const users = await User.find()
      .sort({ createdAt: -1 })   // ⭐ NEW USER FIRST
      .skip((page - 1) * limit)
      .limit(limit);

    res.json(users);

  } catch (error) {
    console.error('Get Users Error:', error);
    res.json([]);
  }
});

/* ================= DELETE USER ================= */
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
