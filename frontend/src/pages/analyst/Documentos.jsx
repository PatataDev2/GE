'use client';

import { useState, useEffect } from 'react';
import api from '../../api/axios';
import DocumentForm from '../../components/DocumentForm';
import Modal from '../../components/Modal';

export default function GestionDocumentos({ expedientId = 1 }) { // ID de prueba
  const [documentos, setDocumentos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDocumentos = async () => {
    try {
      // Filtramos documentos por el ID del expediente
      const res = await api.get(`documents/?expedient=${expedientId}`);
      setDocumentos(res.data);
    } catch (err) {
      console.error("Error cargando documentos");
    }
  };

  useEffect(() => {
    fetchDocumentos();
  }, [expedientId]);

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Documentos del Expediente</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Adjuntar Archivo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentos.map((doc) => (
          <div key={doc.id} className="border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 text-red-600 p-2 rounded">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700 truncate w-32">{doc.title}</p>
                <p className="text-xs text-gray-400">{doc.created_at?.split('T')[0]}</p>
              </div>
            </div>
            <a 
              href={doc.file} 
              target="_blank" 
              rel="noreferrer"
              className="text-blue-500 hover:text-blue-700 font-medium text-sm"
            >
              Ver
            </a>
          </div>
        ))}

        {documentos.length === 0 && (
          <div className="col-span-full py-10 text-center text-gray-400 italic">
            No hay documentos adjuntos a este expediente.
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Subir nuevo documento"
      >
        <DocumentForm 
          expedientId={expedientId} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchDocumentos();
          }} 
        />
      </Modal>
    </div>
  );
}