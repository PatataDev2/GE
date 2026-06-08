import { useState } from 'react';
import { requestCreateExpedient } from '../../api/expedients.api';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logger';

export default function SolicitarExpediente() {
  const { showToast } = useToast();
  const [personName, setPersonName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personName.trim()) {
      showToast('Debes indicar el nombre de la persona', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await requestCreateExpedient({ person_name: personName, description });
      showToast('Solicitud enviada a los analistas', 'success');
      setPersonName('');
      setDescription('');
    } catch (err) {
      logError('Error al solicitar:', err);
      showToast('Error al enviar la solicitud', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Solicitar Expediente</h1>
        <p className="text-gray-500 mb-8">
          Solicita a los analistas la creación de un nuevo expediente para una persona.
        </p>
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la persona *</label>
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Nombre y apellido"
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Motivo</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el motivo de la solicitud..."
              rows="4"
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-200 transition-all font-bold disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </form>
      </div>
    </div>
  );
}
