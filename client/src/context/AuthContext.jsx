import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  fetchMe,
  login as loginRequest,
  register as registerRequest,
} from '../services/authService.js';
import { tokenStorage, setUnauthorizedHandler } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const logout = useCallback(
    (opts = {}) => {
      tokenStorage.clear();
      setUser(null);
      if (opts.silent !== true) {
        toast.success('Signed out');
      }
      navigateRef.current('/login', { replace: true });
    },
    []
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStorage.clear();
      setUser(null);
      navigateRef.current('/login', { replace: true });
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      const token = tokenStorage.get();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchMe();
        if (!cancelled) setUser(data.user);
      } catch (err) {
        tokenStorage.clear();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginRequest(credentials);
    tokenStorage.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerRequest(payload);
    tokenStorage.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const updateUser = useCallback((next) => {
    setUser((prev) => (prev ? { ...prev, ...next } : next));
  }, []);

  const setToken = useCallback((token) => {
    if (token) tokenStorage.set(token);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      logout,
      updateUser,
      setToken,
      hasRole: (...roles) => !!user && roles.includes(user.role),
    }),
    [user, loading, login, register, logout, updateUser, setToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
