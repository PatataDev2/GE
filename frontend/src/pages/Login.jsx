import { useState, useEffect } from 'react';
import api from '../api/users.api';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../api/users.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [data, setData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const ac = new AbortController();
    const fetchUser = async () => {
      try {
        await api.get('users/api/v1/me/', { signal: ac.signal });
        navigate('/dashboard');
      } catch (err) {
        if (err.name === 'CanceledError') return;
      }
    };
    fetchUser();
    return () => ac.abort();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('users/api/v1/login/cookie/', data);
      await refreshUser();
      const userRes = await getCurrentUser();
      if (userRes.data.clave_temporal) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch {
      setLoading(false);
      toast.showToast('Credenciales incorrectas', 'error');
    }
  };

  return (
    <div className="h-screen bg-green-300 flex flex-col items-center justify-center relative">
      <img src="/login-left.png" alt="" className="absolute top-0 left-0 w-32 h-32 object-contain pointer-events-none" />
      <img src="/login-right.png" alt="" className="absolute top-0 right-0 w-32 h-32 object-contain pointer-events-none" />
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-green-600/95 flex flex-col items-center justify-center" style={{ animation: 'fadeIn 0.25s ease-out' }}>
          <div className="relative w-[100px] h-[120px]" style={{ animation: 'sway 2.5s ease-in-out 1.2s infinite' }}>
            <svg width="100" height="120" viewBox="0 0 100 130" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 125 Q48 80 50 45"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"
                strokeDasharray="100"
                style={{ animation: 'stemGrow 0.8s ease-out both' }}
              />
              <g style={{ animation: 'leafUnfurl 0.9s ease-out 0.15s both', transformOrigin: '50px 45px' }}>
                <ellipse cx="68" cy="32" rx="16" ry="8" transform="rotate(-20 68 32)"
                  fill="rgba(255,255,255,0.35)" stroke="white" strokeWidth="1.5"/>
                <ellipse cx="32" cy="32" rx="16" ry="8" transform="rotate(20 32 32)"
                  fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.5"/>
                <line x1="50" y1="45" x2="66" y2="33" stroke="white" strokeWidth="1" opacity="0.5"/>
                <line x1="50" y1="45" x2="34" y2="33" stroke="white" strokeWidth="1" opacity="0.4"/>
              </g>
            </svg>
          </div>
          <p className="text-white mt-3 text-lg font-medium" style={{ animation: 'fadeIn 0.5s 0.6s both' }}>
            Cargando...
          </p>
        </div>
      )}

      <div className="w-full max-w-xs bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logo.jpg"
            alt="Expedientes App"
            className="w-16 h-16 mb-2 rounded-lg"
          />
          <h2 className="text-2xl font-bold text-gray-900">Login</h2>
        </div>
        <form className="flex flex-col" onSubmit={handleSubmit}>
          <input
            type="text"
            className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-4 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500 transition ease-in-out duration-150"
            placeholder="Usuario"
            disabled={loading}
            onChange={e => setData({...data, username: e.target.value})}
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-4 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500 transition ease-in-out duration-150"
            disabled={loading}
            onChange={e => setData({...data, password: e.target.value})}
          />
          <button type="submit" disabled={loading}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-2 px-4 rounded-md mt-4 hover:from-green-600 hover:to-green-700 transition ease-in-out duration-150">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
