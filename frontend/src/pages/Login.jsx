import { useState , useEffect } from 'react';
import api from '../api/users.api';
import { useNavigate , Link } from 'react-router-dom';
import { getCurrentUser } from '../api/users.api';

export default function Login() {
  const [data, setData] = useState({ username: '', password: '' });
  const navigate = useNavigate();
    const [user, setUser] = useState(null);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getCurrentUser();
        setUser(res.data);
        navigate('/dashboard');
      } catch (err) {
        console.error('Error fetching user:', err);
        }
      }
    

    fetchUser();
  }, [navigate]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/login/', data);
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      navigate('/dashboard');
    } catch (err) {
      alert('Credenciales incorrectas');
    }
  };

  return (


       
<div className="h-screen bg-blue-300 flex flex-col items-center justify-center">
  <div className="w-full max-w-xs bg-white rounded-lg shadow-md p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center">Login</h2>
    <form className="flex flex-col" onSubmit={handleSubmit}>
      <input 
        type="text" 
        className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-4 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150" 
        placeholder="Username" 
        onChange={e => setData({...data, username: e.target.value})}
      />
      <input 
        type="password" 
        placeholder='Contraseña'
        className="bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-4 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition ease-in-out duration-150"  
        onChange={e => setData({...data, password: e.target.value})}
      />
      <div className="flex items-center justify-between flex-wrap">
       
        {/* <Link to="" className="text-sm text-blue-500 hover:underline mb-0.5">Forgot password?</Link> */}
        <p className="text-gray-900 mt-4">
          No tienes una cuenta?     <Link to="/register" className="text-sm text-blue-500 hover:underline ml-1">Registrate</Link>
        </p>
      </div>
      <button onClick={handleSubmit} className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold py-2 px-4 rounded-md mt-4 hover:bg-indigo-600 hover:to-blue-600 transition ease-in-out duration-150">
        Login
      </button>
    </form>
  </div>
</div>


    

  );
}
