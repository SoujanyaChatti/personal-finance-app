import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;
console.log("VITE_API_URL:", API_URL);
export function useAuth() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      setLoading(false);
      navigate('/dashboard'); // Redirect to dashboard after login
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      setLoading(false);
      return false;
    }
  };

  const register = async (email, password, name) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/auth/register`, { email, password, name });
      setLoading(false);
      navigate('/login'); // Redirect to login after registration
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login'); // Redirect to login page
  };

  return { user, token, error, loading, login, register, logout };
}