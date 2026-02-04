const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all users
async function getAllUsers() {
  const users = await User.find().sort({ createdAt: -1 });
  return users.map(u => ({
    ...u.toObject(),
    id: u._id.toString()
  }));
}

// Find user by email
async function findUserByEmail(email) {
  const user = await User.findOne({ email });
  if (!user) return null;
  return {
    ...user.toObject(),
    id: user._id.toString(),
    password: user.password
  };
}

// Create new user
async function createUser(userData) {
  const { name, mobile, email, password, photo } = userData;
  
  // Custom check to ensure no duplicates
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already exists');
  }

  const user = new User({
    name,
    username: name, // Populate username with name for fallback
    email,
    mobile,
    photo,
    password, // Mongoose pre-save hook will hash this
    role: 'user'
  });

  await user.save();
  
  return {
    ...user.toObject(),
    id: user._id.toString()
  };
}

// Delete user
async function deleteUser(userId) {
  await User.findByIdAndDelete(userId);
  return await getAllUsers();
}

// Compare password
async function comparePassword(user, password) {
  // If user object comes from Mongoose, it might have comparePassword method
  // But since we spread toObject() in findUserByEmail, we lost the methods.
  // So we use bcrypt directly on the hash.
  return await bcrypt.compare(password, user.password);
}

// Change password
async function changePassword(userId, newPassword) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  user.password = newPassword; // Pre-save hook will hash
  await user.save();
  return true;
}

// Update user details
async function updateUser(userId, updates) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Check email uniqueness if changing
  if (updates.email && updates.email !== user.email) {
    const existing = await User.findOne({ email: updates.email });
    if (existing) {
      throw new Error('Email already exists');
    }
  }

  if (updates.name) user.name = updates.name;
  if (updates.mobile) user.mobile = updates.mobile;
  if (updates.email) user.email = updates.email;
  if (updates.photo !== undefined) user.photo = updates.photo;

  await user.save();

  return {
    ...user.toObject(),
    id: user._id.toString()
  };
}

module.exports = {
  findUserByEmail,
  createUser,
  comparePassword,
  getAllUsers,
  deleteUser,
  changePassword,
  updateUser
};
