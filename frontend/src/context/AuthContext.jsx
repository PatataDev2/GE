import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import api from '../api/users.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (signal) => {
    setLoading(true);
    try {
      const response = await api.get('users/api/v1/me/', { signal });
      const data = response.data;
      setUser({
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.rol || 'recepcionista',
        claveTemporal: data.clave_temporal || false,
      });
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetchUser(ac.signal);
    return () => ac.abort();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    try {
      await api.post('users/api/v1/logout/');
    } catch {
      // Always clear local state even if API call fails
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
