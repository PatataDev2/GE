import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Layout from './Layout';
import { getCurrentUser } from '../api/users.api';

export default function LayoutWrapper() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('access');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await getCurrentUser();
        const userData = {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          role: response.data.role_name || 'user'
        };
        setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f1f5f9'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #e2e8f0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#64748b' }}>Cargando...</p>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Layout user={user}>
      <Outlet />
    </Layout>
  );
}