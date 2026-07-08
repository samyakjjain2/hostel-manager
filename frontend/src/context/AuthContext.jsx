import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup Axios interceptors to attach JWT token to all requests
  useEffect(() => {
    const token = localStorage.getItem('aegis_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      if (res.data.success) {
        setUser(res.data.admin);
      }
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    if (res.data.success) {
      const { token, admin } = res.data;
      localStorage.setItem('aegis_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(admin);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('aegis_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const res = await axios.put(`${API_URL}/auth/profile`, profileData);
    if (res.data.success) {
      setUser(res.data.admin);
    }
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export { API_URL };
