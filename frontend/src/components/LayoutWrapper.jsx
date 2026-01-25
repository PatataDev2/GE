import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Layout from './Layout';

const getMockUser = () => {
  const storedRole = localStorage.getItem('userRole');
  return {
    id: 1,
    username: 'usuario_demo',
    email: 'demo@empresa.com',
    role: storedRole || 'employee'
  };
};

export default function LayoutWrapper() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) {
      navigate('/login');
      return;
    }

    const userData = getMockUser();
    setUser(userData);
    setLoading(false);
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