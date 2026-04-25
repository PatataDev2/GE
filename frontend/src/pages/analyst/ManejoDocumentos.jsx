'use client';

import { useState, useEffect } from 'react';
import api from '../../api/axios';

const ExpedientForm = ({ onSuccess }) => {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',  
    asinged_to: ''   
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resDep, resUsers] = await Promise.all([
          api.get('api/departments/'), 
          api.get('api/users/')        
        ]);
        setDepartments(resDep.data);
        setEmployees(resUsers.data.filter(u => u.role_name === 'employee'));
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('api/expedients/', formData);
      onSuccess(); 
    } catch (err) {
      alert("Error: " + JSON.stringify(err.response?.data));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Input Título con color Indigo */}
      <div>
        <label className="text-sm font-bold text-indigo-900 mb-2 block">Nombre del Expediente</label>
        <input 
          type="text"
          required
          className="w-full p-4 bg-indigo-50/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all text-indigo-900 placeholder-indigo-300"
          placeholder="Ej: Registro de Personal Nuevo"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Select Departamento (Conectado al Seed) */}
        <div>
          <label className="text-sm font-bold text-indigo-900 mb-2 block">Departamento</label>
          <select 
            required
            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none cursor-pointer text-gray-700"
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
          >
            <option value="">Seleccionar...</option>
            {departments.map(dep => (
              <option key={dep.id} value={dep.id}>{dep.name}</option>
            ))}
          </select>
        </div>

        {/* Select Analista */}
        <div>
          <label className="text-sm font-bold text-indigo-900 mb-2 block">Asignar Empleado</label>
          <select 
            required
            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none cursor-pointer text-gray-700"
            value={formData.asinged_to}
            onChange={(e) => setFormData({...formData, asinged_to: e.target.value})}
          >
            <option value="">Seleccionar...</option>
            {employees.map(user => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="text-sm font-bold text-indigo-900 mb-2 block">Descripción</label>
        <textarea
          required
          className="w-full p-4 bg-indigo-50/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all text-indigo-900 placeholder-indigo-300 h-32"
          placeholder="Describe el propósito del expediente..."
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
      </div>

      {/* Botón */}
      <button 
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
      >
        {loading ? 'CREANDO...' : 'CREAR EXPEDIENTE'}
      </button>
    </form>
  );
};

export default ExpedientForm;