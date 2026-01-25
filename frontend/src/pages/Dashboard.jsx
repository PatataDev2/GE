import { useEffect, useState } from 'react';
import { getCurrentUser } from '../api/users.api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () =>{

    localStorage.clear();
    navigate('/login');
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getCurrentUser();
        setUser(res.data);
      } catch (err) {
        setError('No se pudo cargar la información del usuario');
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bienvenido, {user?.username}</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Tu información</h2>
        <div className="space-y-2">
          <p><span className="font-medium">Email:</span> {user?.email}</p>
          {user?.cedula && <p><span className="font-medium">Cédula:</span> {user.cedula}</p>}
          {user?.phone && <p><span className="font-medium">Teléfono:</span> {user.phone}</p>}
                <button className='h-10 w-50 bg-red-500 hover:bg-red-600 text-white  rounded-md' onClick={handleLogout} >Cerrar sesion</button> 
        </div>
      </div>

    </div>
  );
}