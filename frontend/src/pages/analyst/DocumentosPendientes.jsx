import { useState, useEffect } from 'react';
import { getPendingDocs } from '../../api/expedients.api';
import { logError } from '../../utils/logger';
const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

const statusConfig = {
  pendiente: { label: 'Pendiente', style: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  aprobado: { label: 'Aprobado', style: 'bg-green-50 text-green-600 border-green-100' },
  rechazado: { label: 'Rechazado', style: 'bg-red-50 text-red-600 border-red-100' },
};

function getDocStatus(doc) {
  if (doc.approval_status === true) return 'aprobado';
  if (doc.approval_status === false) return 'rechazado';
  return 'pendiente';
}

export default function DocumentosPendientes() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await getPendingDocs();
      setDocs(res.data);
    } catch (err) {
      logError('Error fetching pending docs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Documentos Pendientes</h1>
        <p className="text-gray-500">Documentos subidos a expedientes aprobados que requieren revisión.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <p className="text-lg font-semibold">No hay documentos pendientes</p>
          <p className="text-sm">Los documentos nuevos en expedientes aprobados aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map(doc => {
            const status = getDocStatus(doc);
            const cfg = statusConfig[status];
            const fileUrl = doc.file ? (doc.file.startsWith('http') ? doc.file : `${BASE_API_URL}${doc.file.startsWith('/') ? '' : '/media/'}${doc.file}`) : null;
            return (
              <div key={doc.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800">{doc.title}</h3>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${cfg.style}`}>{cfg.label}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      <strong>Expediente:</strong> {doc.expedient?.title || doc.expedient_title || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      <strong>Tipo:</strong> {doc.document_type?.name || doc.document_type_name || 'Sin tipo'}
                    </p>
                    <p className="text-sm text-gray-500">
                      <strong>Subido por:</strong> {doc.uploaded_by?.username || doc.uploaded_by_username || 'N/A'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {fileUrl && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors"
                      >
                        Ver Documento
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
