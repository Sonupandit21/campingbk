const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(__dirname, '../data/users.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(USERS_FILE);
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    // Directory already exists
  }
}

// Read users from file
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // File doesn't exist yet
    return [];
  }
}

async function getAllUsers() {
  return await readUsers();
}

// Write users to file
async function writeUsers(users) {
  await ensureDataDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// Find user by email
async function findUserByEmail(email) {
  const users = await readUsers();
  return users.find(u => u.email === email);
}

// Create new user
async function createUser(userData) {
  const users = await readUsers();
  
  const { name, mobile, email, password, photo } = userData;

  // Check if email exists
  if (users.find(u => u.email === email)) {
    throw new Error('Email already exists');
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 8);
  
  const newUser = {
    id: Date.now().toString(),
    name,
    mobile,
    email,
    password: hashedPassword,
    photo, // Base64 string
    role: 'user',
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  await writeUsers(users);
  
  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    photo: newUser.photo
  };
}

// Delete user
async function deleteUser(userId) {
  const users = await readUsers();
  const newUsers = users.filter(u => u.id !== userId);
  await writeUsers(newUsers);
  return newUsers;
}

// Compare password
async function comparePassword(user, password) {
  return await bcrypt.compare(password, user.password);
}

// Change password
async function changePassword(userId, newPassword) {
  const users = await readUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index === -1) {
    throw new Error('User not found');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 8);
  users[index].password = hashedPassword;
  
  await writeUsers(users);
  await writeUsers(users);
  return true;
}

// Update user details
async function updateUser(userId, updates) {
  const users = await readUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index === -1) {
    throw new Error('User not found');
  }

  const user = users[index];

  // Check if email is being updated and if it's unique
  if (updates.email && updates.email !== user.email) {
    if (users.find(u => u.email === updates.email)) {
      throw new Error('Email already exists');
    }
  }

  // Update fields (excluding critical ones like id, password unless specific flow)
  const updatedUser = {
    ...user,
    name: updates.name || user.name,
    mobile: updates.mobile || user.mobile,
    photo: updates.photo !== undefined ? updates.photo : user.photo,
    email: updates.email || user.email
  };

  users[index] = updatedUser;
  await writeUsers(users);
  
  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    mobile: updatedUser.mobile,
    role: updatedUser.role,
    photo: updatedUser.photo
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
