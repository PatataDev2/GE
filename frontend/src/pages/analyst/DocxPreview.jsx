'use client';
import { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { logError } from '../../utils/logger';

export default function DocxPreview({ blob }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!blob || !containerRef.current) return;

    let cancelled = false;
    containerRef.current.innerHTML = '';
    setLoading(true);
    setError(null);

    renderAsync(blob, containerRef.current, null, {
      className: 'docx-preview',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      debug: false,
    })
      .then(() => {
        if (!cancelled) setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          logError('Error rendering DOCX:', err);
          setError(err.message || 'Error desconocido');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [blob]);

  return (
    <div className="docx-preview-container rounded-lg border border-gray-200 overflow-auto" style={{ maxHeight: '100vh', background: '#fff', padding: '1rem', position: 'relative', minHeight: '100vh' }}>
      {loading && !error && (
        <div className="flex justify-center items-center p-12" style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', zIndex: 10 }}>
          <svg className="animate-spin h-8 w-8 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-600">Cargando documento...</span>
        </div>
      )}
      {error && (
        <div className="text-center p-8 text-red-600">
          <p>Error al cargar el documento: {error}</p>
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}
