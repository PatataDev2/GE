import { useState } from 'react';
import api, { registerUser } from '../api/users.api';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({
    username: '', 
    password: '', 
    password2: '',
    email: '', 
    cedula: '', 
    phone: ''
  });

  const handleBack = () => {
    window.history.back(); }

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    cedula: '',
    phone: '',
    password: '',
    password2: ''
  });

  const navigate = useNavigate();

  // Función para validar solo números en cédula y teléfono
  const handleNumberInput = (e) => {
    const { name, value } = e.target;
    // Remover cualquier caracter que no sea número
    const numericValue = value.replace(/[^0-9]/g, '');
    
    setForm({
      ...form, 
      [name]: numericValue
    });
  };

  // Validación de teléfono venezolano
  const validateVenezuelanPhone = (phone) => {
    const regex = /^(0414|0424|0412|0416|0426|0251|0255|0257|0261|0264|0265|0267|0268|0271|0272|0273|0274|0275|0276|0278|0281|0282|0283|0284|0285|0286|0287|0288|0289|0291|0292|0293|0294|0295)[0-9]{7}$/;
    return regex.test(phone);
  };

  // Validación de contraseña
  const validatePassword = (password) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    return {
      valid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber,
      message: !hasMinLength ? 'Mínimo 8 caracteres' : 
               !hasUpperCase ? 'Debe contener al menos una mayúscula' :
               !hasLowerCase ? 'Debe contener al menos una minúscula' :
               !hasNumber ? 'Debe contener al menos un número' : ''
    };
  };

  // Validación general del formulario
  const validateForm = () => {
    const newErrors = {
      username: form.username ? '' : 'Usuario es requerido',
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '' : 'Email inválido',
      cedula: form.cedula.length >= 6 && form.cedula.length <= 8 ? '' : 'Cédula debe tener entre 6 y 8 dígitos',
      phone: validateVenezuelanPhone(form.phone) ? '' : 'Teléfono inválido. Debe comenzar con 04xx o 02xx y tener 11 dígitos',
      password: validatePassword(form.password).valid ? '' : validatePassword(form.password).message,
      password2: form.password === form.password2 ? '' : 'Las contraseñas no coinciden'
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await registerUser(form);
      alert('Registrado correctamente');
      navigate('/login');
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert('Error en el registro: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="h-screen bg-green-300 flex flex-col items-center justify-center">
      <div className="w-full max-w-xs bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={handleBack}
              className="w-10 h-10 flex justify-center items-center font-bold text-gray-900 rounded-full hover:bg-green-600 hover:cursor-pointer bg-green-300"
            >
              <i className='bxr bx-chevron-left'></i>
            </button>
          </div>
          <div className="flex flex-col items-center">
            <img 
              src="/photo_5172934641273473906_y(1).jpg" 
              alt="Expedientes App" 
              className="w-16 h-16 mb-2 rounded-lg"
            />
            <h2 className="text-2xl font-bold text-gray-900">Register</h2>
          </div>
        </div>
        
        <form className='flex flex-col' onSubmit={handleSubmit}>
          {/* Username */}
          <input 
            className={`bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-1 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500 transition ease-in-out duration-150 ${errors.username && 'border-red-500 border'}`}
            name='username' 
            type="text" 
            placeholder='Usuario' 
            value={form.username}
            onChange={(e) => setForm({...form, username: e.target.value})}
          />
          {errors.username && <p className="text-red-500 text-xs mb-3">{errors.username}</p>}

          {/* Email */}
          <input 
            className={`bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-1 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500 transition ease-in-out duration-150 ${errors.email && 'border-red-500 border'}`}
            name='email' 
            type="email" 
            placeholder='Email' 
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
          />
          {errors.email && <p className="text-red-500 text-xs mb-3">{errors.email}</p>}

          {/* Cédula (solo números) */}
          <input 
            className={`bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-1 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500 transition ease-in-out duration-150 ${errors.cedula && 'border-red-500 border'}`}
            name='cedula' 
            type="text" 
            placeholder='Cédula' 
            value={form.cedula}
            onChange={handleNumberInput}
            maxLength="8"
          />
          {errors.cedula && <p className="text-red-500 text-xs mb-3">{errors.cedula}</p>}

          {/* Teléfono (solo números y validación Venezuela) */}
          <input 
            className={`bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-1 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500 transition ease-in-out duration-150 ${errors.phone && 'border-red-500 border'}`}
            name='phone' 
            type="text" 
            placeholder='Teléfono (04121234567)' 
            value={form.phone}
            onChange={handleNumberInput}
            maxLength="11"
          />
          {errors.phone && <p className="text-red-500 text-xs mb-3">{errors.phone}</p>}

          {/* Password */}
          <input 
            className={`bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-1 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500 transition ease-in-out duration-150 ${errors.password && 'border-red-500 border'}`}
            name='password' 
            type="password" 
            placeholder='Contraseña' 
            value={form.password}
            onChange={(e) => setForm({...form, password: e.target.value})}
          />
          {errors.password && <p className="text-red-500 text-xs mb-3">{errors.password}</p>}

          {/* Confirm Password */}
          <input 
            className={`bg-gray-100 text-gray-900 border-0 rounded-md p-2 mb-1 focus:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500 transition ease-in-out duration-150 ${errors.password2 && 'border-red-500 border'}`}
            name='password2' 
            type="password" 
            placeholder='Confirmar Contraseña' 
            value={form.password2}
            onChange={(e) => setForm({...form, password2: e.target.value})}
          />
          {errors.password2 && <p className="text-red-500 text-xs mb-3">{errors.password2}</p>}

          <button 
            className='bg-green-500 text-white border-0 rounded-md h-10 hover:bg-green-600 cursor-pointer transition duration-300 mt-4' 
            type="submit"
          >
            Registrar
          </button>
        </form>
      </div>
    </div>
  );
}