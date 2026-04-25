import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('studyos_user');
    const storedToken = localStorage.getItem('studyos_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const data = res.data;
    localStorage.setItem('studyos_token', data.token);
    localStorage.setItem('studyos_user', JSON.stringify({ userId: data.userId, email: data.email, name: data.name }));
    setUser({ userId: data.userId, email: data.email, name: data.name });
    return data;
  };

  const register = async (name, email, password, targetRole, deadline) => {
    const res = await api.post('/auth/register', { name, email, password, targetRole, deadline });
    const data = res.data;
    localStorage.setItem('studyos_token', data.token);
    localStorage.setItem('studyos_user', JSON.stringify({ userId: data.userId, email: data.email, name: data.name }));
    setUser({ userId: data.userId, email: data.email, name: data.name });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('studyos_token');
    localStorage.removeItem('studyos_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
