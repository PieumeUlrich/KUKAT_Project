import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/authApi';

const AuthContext = createContext(null);

// ── Role constants ─────────────────────────────────────────────
export const ROLES = {
  SUPERADMIN:  'superadmin',
  MANAGER:     'manager',
  AGENT:       'agent',
  ACCOUNTANT:  'accountant',
  HR:          'hr',
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem('kukat_user');
    const token  = localStorage.getItem('kukat_token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); }
      catch { /* corrupted — clear */ clearAuth(); }
    }
    setLoading(false);
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('kukat_token');
    localStorage.removeItem('kukat_user');
    setUser(null);
  };

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login(email, password);
    localStorage.setItem('kukat_token', data.token);
    localStorage.setItem('kukat_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clearAuth();
  }, []);

  // ── Role helpers ─────────────────────────────────────────────
  const hasRole    = useCallback((role) => user?.role === role, [user]);
  const isAdmin    = useCallback(() => user?.role === ROLES.SUPERADMIN, [user]);
  const isManager  = useCallback(() => [ROLES.SUPERADMIN, ROLES.MANAGER].includes(user?.role), [user]);
  const isAgent    = useCallback(() => user?.role === ROLES.AGENT, [user]);
  const isAccountant = useCallback(() => [ROLES.SUPERADMIN, ROLES.ACCOUNTANT].includes(user?.role), [user]);
  const isHR       = useCallback(() => [ROLES.SUPERADMIN, ROLES.HR].includes(user?.role), [user]);
  const canApprove = useCallback(() => [ROLES.SUPERADMIN, ROLES.MANAGER].includes(user?.role), [user]);
  const canViewAllData = useCallback(() =>
    [ROLES.SUPERADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT].includes(user?.role), [user]);

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, logout,
      hasRole, isAdmin, isManager, isAgent, isAccountant, isHR,
      canApprove, canViewAllData,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
