import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://trackierpanel.com';


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, credentials);
    const data = response.data;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const response = await axios.post(`${BACKEND_URL}/api/auth/register`, userData);
    const data = response.data;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = (userData) => {
    // Merge existing user with new data to keep token etc if needed, though usually we just update the user object
    const updatedUser = { ...user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const publisherLogin = async (credentials) => {
    const response = await axios.post(`${BACKEND_URL}/api/auth/publisher/login`, credentials);
    const data = response.data;
    localStorage.setItem('token', data.token);
    // Ensure we store the role
    const userWithRole = { ...data.publisher, role: 'publisher' }; 
    localStorage.setItem('user', JSON.stringify(userWithRole));
    setUser(userWithRole);
    return data;
  };

  const impersonateLogin = (token, publisherData) => {
      localStorage.setItem('token', token);
      const userWithRole = { ...publisherData, role: 'publisher' };
      localStorage.setItem('user', JSON.stringify(userWithRole));
      setUser(userWithRole);
  };

  return (
    <AuthContext.Provider value={{ user, login, publisherLogin, impersonateLogin, register, logout, updateProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);




