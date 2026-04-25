'use client';

import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import ExpedientForm from './ManejoDocumentos'; 
import api from '../../api/axios';

export default function Expedientes() {
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpediente, setSelectedExpediente] = useState(null);

  const fetchExpedientes = async () => {
    setLoading(true);
    try {
      const response = await api.get('api/expedients/');
      setExpedientes(response.data);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpedientes(); }, []);

  const filtered = expedientes.filter(exp => {
    const matchesSearch = exp.title?.toLowerCase().includes(search.toLowerCase()) || exp.id.toString().includes(search);
    const status = exp.approval_status ? 'activo' : 'en_revision';
    const matchesStatus = filterStatus === 'todos' || status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Interactivo */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Panel de Control</h1>
          <p className="text-gray-500">Gestiona y supervisa los expedientes en tiempo real.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-200 transition-all transform hover:scale-105 flex items-center gap-2 font-bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nuevo Expediente
        </button>
      </div>

      {/* Barra de Filtros Inteligente */}
      <div className="flex flex-wrap gap-4 mb-8 items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative flex-1 min-w-[300px]">
          <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </span>
          <input 
            type="text" 
            placeholder="Buscar por ID o nombre..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          {['todos', 'en_revision', 'activo'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filterStatus === st ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Tarjetas Interactivas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-3xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(exp => (
            <div 
              key={exp.id} 
              className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-150 ${exp.approval_status ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">
                  #{exp.id}
                </span>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${exp.approval_status ? 'bg-green-50 text-green-600 border-green-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'}`}>
                  {exp.approval_status ? '✓ ACTIVO' : '⏳ REVISIÓN'}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">{exp.title}</h3>
              <p className="text-sm text-gray-500 mb-6 line-clamp-2">{exp.description || 'Sin descripción asignada.'}</p>

              <div className="flex items-center gap-3 mb-6 bg-gray-50 p-3 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {exp.asinged_to_username?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Analista</p>
                  <p className="text-sm font-bold text-gray-700">{exp.asinged_to_username || 'No asignado'}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedExpediente(exp); /* Lógica para ver documentos */ }}
                  className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors"
                >
                  Ver Documentos
                </button>
                <button className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Re-estilizado */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Expediente"
      >
        <div className="p-2">
          <ExpedientForm onSuccess={() => {
            setIsModalOpen(false);
            fetchExpedientes();
          }} />
        </div>
      </Modal>
    </div>
  );
}