import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Layout from './Layout';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser } from '../api/users.api';
import api from '../api/users.api';
import { logError } from '../utils/logger';

export default function LayoutWrapper() {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading, refreshUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    // If AuthProvider already has user data, use it directly
    if (!authLoading && authUser) {
      setUser(authUser);
      setLoading(false);
      return;
    }

    // Otherwise fetch user data independently
    const loadUser = async () => {
      const token = localStorage.getItem('access');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await api.get('users/api/v1/me/', { signal: ac.signal });

        if (response.data.clave_temporal) {
          navigate('/change-password', { replace: true });
          return;
        }

        const userData = {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          role: response.data.rol || 'recepcionista'
        };
        setUser(userData);
      } catch (error) {
        if (error.name !== 'CanceledError') {
          logError('Error loading user:', error);
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && !authUser) {
      loadUser();
    }
    return () => ac.abort();
  }, [navigate, authUser, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 rounded-full mx-auto mb-4" style={{ borderTopColor: '#2563eb', animation: 'spin 1s linear infinite' }}></div>
          <p className="text-slate-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user}>
      <Outlet />
    </Layout>
  );
}
