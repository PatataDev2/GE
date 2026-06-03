import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '../api/users.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('access');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await getCurrentUser();
      const data = response.data;
      setUser({
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.rol || 'employee',
        claveTemporal: data.clave_temporal || false,
      });
    } catch (err) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('userRole');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('userRole');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
