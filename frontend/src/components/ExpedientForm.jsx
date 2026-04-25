'use client';

import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function DocumentForm({ expedientId, onSuccess }) {
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    document_type: '',
    description_content: '',
    file: null // Aquí guardaremos el archivo físico
  });

  // 1. Cargar tipos de documentos (Seeds)
  useEffect(() => {
    const fetchDocTypes = async () => {
      try {
        const res = await api.get('api/document-types/');
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        setDocTypes(data);
      } catch (err) {
        console.error("Error cargando tipos de documentos:", err);
        setDocTypes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) return alert("Por favor, selecciona un archivo");

    setIsSubmitting(true);

    // IMPORTANTE: Para subir archivos usamos FormData
    const data = new FormData();
    data.append('title', formData.title);
    data.append('file', formData.file); // El archivo físico
    data.append('expedient', Number(expedientId)); // Vinculación automática
    data.append('document_type', formData.document_type);
    data.append('description_content', formData.description_content);

    try {
      // Django recibirá esto gracias al MultiPartParser
      await api.post('api/documents/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess();
      setFormData({ title: '', document_type: '', description_content: '', file: null });
    } catch (err) {
      console.error(err.response?.data);
      alert("Error al subir el documento. Verifica el formato.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-emerald-600 animate-pulse">Cargando requisitos...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-xl border border-gray-100">
      <h3 className="text-sm font-black text-gray-400 uppercase tracking-tighter">Nuevo Documento</h3>

      {/* Input de Archivo - Estilo Verde */}
      <div className="relative group">
        <label className="block text-xs font-bold text-emerald-700 mb-1">Archivo (PDF, PNG, etc.)</label>
        <input 
          type="file" 
          required
          onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
        />
      </div>

      {/* Título del Documento */}
      <input 
        type="text"
        placeholder="Nombre del documento (ej: Cédula, Título...)"
        required
        className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none transition-all text-sm"
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
      />

      {/* Tipo de Documento (Select dinámico) */}
      <select 
        required
        className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none text-sm"
        value={formData.document_type}
        onChange={(e) => setFormData({...formData, document_type: e.target.value})}
      >
        <option value="">Tipo de documento...</option>
        {docTypes.map(type => (
          <option key={type.id} value={type.id}>{type.name}</option>
        ))}
      </select>

      {/* Contenido/Notas */}
      <textarea 
        placeholder="Breve descripción del contenido..."
        className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none text-sm h-20 resize-none"
        value={formData.description_content}
        onChange={(e) => setFormData({...formData, description_content: e.target.value})}
      />

      {/* BOTÓN VERDE DE ACCIÓN */}
      <button 
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? 'SUBIENDO...' : 'SUBIR DOCUMENTO'}
      </button>
    </form>
  );
}