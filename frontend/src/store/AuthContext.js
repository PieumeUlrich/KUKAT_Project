import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/authApi';

const AuthContext = createContext(null);

// ── Role constants ─────────────────────────────────────────────
export const ROLES = {
  SUPERADMIN: 'superadmin',
  MANAGER:    'manager',
  AGENT:      'agent',
  ACCOUNTANT: 'accountant',
  HR:         'hr',
};

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem('kukat_user');
    const token  = localStorage.getItem('kukat_token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); }
      catch { clearAuth(); }
    }
    setLoading(false);
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('kukat_token');
    localStorage.removeItem('kukat_refresh');
    localStorage.removeItem('kukat_user');
    setUser(null);
  };

  const login = useCallback(async (email, password) => {
    const response = await authApi.login(email, password);
    const userData = response.data ?? response;
    localStorage.setItem('kukat_token',  userData.token);
    localStorage.setItem('kukat_refresh', userData.refreshToken);
    localStorage.setItem('kukat_user',   JSON.stringify(userData.user));
    setUser(userData.user);
    return userData.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}