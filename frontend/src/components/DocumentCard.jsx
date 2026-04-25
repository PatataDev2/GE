import React from 'react';
import FileThumbnail from './FileThumbnail';

const DocumentCard = ({ doc, onStatusUpdate, onDelete }) => {
  const statusColors = {
    'pendiente': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'aprobado': 'bg-green-100 text-green-700 border-green-200',
    'rechazado': 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border rounded-xl hover:shadow-md transition-all group">
      <div className="flex items-center gap-4">
        <FileThumbnail fileUrl={doc.file} title={doc.title} />
        <div>
          <h4 className="text-sm font-bold text-gray-800">{doc.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${statusColors[doc.status || 'pendiente']}`}>
              {doc.status || 'pendiente'}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(doc.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Acciones de Validación */}
        <button 
          onClick={() => onStatusUpdate(doc.id, 'aprobado')}
          className="p-2 hover:bg-green-50 text-green-600 rounded-lg" title="Aprobar"
        >
          <svg size={18} fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
        </button>
        
        <button 
          onClick={() => onStatusUpdate(doc.id, 'rechazado')}
          className="p-2 hover:bg-red-50 text-red-600 rounded-lg" title="Rechazar"
        >
          <svg size={18} fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>

        <a href={doc.file} target="_blank" rel="noreferrer" className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg" title="Descargar">
          <svg size={18} fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </a>

        <button onClick={() => onDelete(doc.id)} className="p-2 hover:bg-gray-100 text-gray-400 rounded-lg" title="Eliminar">
          <svg size={18} fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  );
};