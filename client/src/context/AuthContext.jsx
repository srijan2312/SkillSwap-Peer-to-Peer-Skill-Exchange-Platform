import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('skillswap_token'));
  // `loading` stays true until we have checked the stored token once.
  const [loading, setLoading] = useState(true);

  // On first load: if a token was stored, verify it and restore the session.
  useEffect(() => {
    const stored = localStorage.getItem('skillswap_token');
    if (!stored) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        // Bad or expired token — drop it so the user starts logged out.
        localStorage.removeItem('skillswap_token');
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveAuth = (newToken, newUser) => {
    localStorage.setItem('skillswap_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveAuth(data.token, data.user);
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    saveAuth(data.token, data.user);
  };

  const logout = () => {
    localStorage.removeItem('skillswap_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
