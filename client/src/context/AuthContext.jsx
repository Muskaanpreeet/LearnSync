import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

// Holds the single source of truth for "who is logged in" across the
// whole app: current user, role, auth status, and loading state.
// ProtectedRoute / RoleRoute (see src/routes) read from this context
// to decide what to render — but the backend's protect()/authorize()
// middleware is what actually enforces access.
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check for an existing session

  // On first load, if a token is stored, verify it's still valid by
  // fetching the current user. This survives page refreshes.
  useEffect(() => {
    const token = localStorage.getItem('learnsync_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .getMe()
      .then((res) => setUser(res.user))
      .catch(() => {
        localStorage.removeItem('learnsync_token');
        localStorage.removeItem('learnsync_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    localStorage.setItem('learnsync_token', res.token);
    localStorage.setItem('learnsync_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    localStorage.setItem('learnsync_token', res.token);
    localStorage.setItem('learnsync_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('learnsync_token');
      localStorage.removeItem('learnsync_user');
      setUser(null);
    }
  };

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook components use instead of useContext(AuthContext) directly —
// throws a clear error if used outside the provider by mistake.
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
