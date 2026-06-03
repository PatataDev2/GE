import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, changePassword } from '../api/users.api';

export default function ChangePassword() {
  const [form, setForm] = useState({ new_password: '', new_password2: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) {
      navigate('/login');
      return;
    }
    const checkUser = async () => {
      try {
        const res = await getCurrentUser();
        if (!res.data.clave_temporal) {
          navigate('/dashboard');
        }
      } catch {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        navigate('/login');
      }
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.new_password || form.new_password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.new_password !== form.new_password2) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await changePassword(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña');
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-green-300 flex flex-col items-center justify-center">
      <div className="w-full max-w-xs bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center mb-6">
          <div style={{
            width: 64, height: 64,
            background: '#dcfce7', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 8
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Cambiar Contraseña</h2>
          <p className="text-sm text-gray-500 mt-1">Debes cambiar tu contraseña temporal</p>
        </div>
        <form className="flex flex-col" onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: '#fef2f2', color: '#dc2626',
              padding: '0.5rem 0.75rem', borderRadius: 6,
              fontSize: '0.875rem', marginBottom: 12,
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          <input
            type="password"
            className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-4 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500 transition ease-in-out duration-150"
            placeholder="Nueva contraseña"
            disabled={loading}
            value={form.new_password}
            onChange={e => setForm({...form, new_password: e.target.value})}
          />
          <input
            type="password"
            className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-4 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500 transition ease-in-out duration-150"
            placeholder="Confirmar contraseña"
            disabled={loading}
            value={form.new_password2}
            onChange={e => setForm({...form, new_password2: e.target.value})}
          />
          <button type="submit" disabled={loading}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-2 px-4 rounded-md mt-4 hover:from-green-600 hover:to-green-700 transition ease-in-out duration-150">
            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
