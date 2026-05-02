'use client';

import { useState, useRef, useEffect } from 'react';
import { renderAsync } from 'docx-preview';

const tiposDocumento = [
  'Cédula de Identidad',
  'RIF',
  'Título Universitario',
  'Certificado Médico',
  'Antecedentes Penales',
  'Constancia de Trabajo',
  'Currículum Vitae',
  'Certificación Profesional',
  'Formulario de Solicitud',
  'Otro'
];

const expedientesDisponibles = [
  { id: 'EXP-2024-0010', tipo: 'Actualización de Datos', status: 'en_revision' },
  { id: 'EXP-2024-0015', tipo: 'Solicitud de Vacaciones', status: 'rechazado' },
  { id: 'NUEVO', tipo: 'Crear Nuevo Expediente', status: 'nuevo' }
];

export default function SubirDocumentos() {
  const [selectedExpediente, setSelectedExpediente] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const fileInputRef = useRef(null);
  const previewContainerRef = useRef(null);

  useEffect(() => {
    if (previewFile && previewContainerRef.current && previewFile.type === 'docx') {
      setLoadingPreview(true);
      previewContainerRef.current.innerHTML = '';
      renderAsync(previewFile.file, previewContainerRef.current, null, {
        className: 'docx-preview',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        debug: false,
      }).then(() => {
        setLoadingPreview(false);
      }).catch((error) => {
        console.error('Error al renderizar el documento:', error);
        setLoadingPreview(false);
      });
    }
  }, [previewFile]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  const addFiles = (files) => {
    const newFiles = files.map(file => ({
      file,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.type
    }));
    setArchivos(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeFile = (index) => {
    setArchivos(archivos.filter((_, i) => i !== index));
    if (previewFile && previewFile.index === index) {
      setPreviewFile(null);
    }
  };

  const viewDocument = (archivo, index) => {
    setPreviewFile({ ...archivo, index });
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  const downloadDocument = (archivo) => {
    const url = URL.createObjectURL(archivo.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = archivo.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedExpediente || !tipoDocumento || archivos.length === 0) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simular subida
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setUploadSuccess(true);
          setTimeout(() => {
            setUploadSuccess(false);
            setArchivos([]);
            setTipoDocumento('');
            setDescripcion('');
            setPreviewFile(null);
          }, 3000);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const isDocx = (file) => file.name.toLowerCase().endsWith('.docx');

  return (
    <div>
      <div className="grid-2">
        {/* Upload Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Subir Nuevo Documento</h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Expediente *</label>
              <select
                className="form-select"
                value={selectedExpediente}
                onChange={(e) => setSelectedExpediente(e.target.value)}
                required
              >
                <option value="">Seleccionar expediente</option>
                {expedientesDisponibles.map(exp => (
                  <option key={exp.id} value={exp.id}>
                    {exp.id === 'NUEVO' ? exp.tipo : `${exp.id} - ${exp.tipo}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Documento *</label>
              <select
                className="form-select"
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                required
              >
                <option value="">Seleccionar tipo</option>
                {tiposDocumento.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            {/* File Drop Zone */}
            <div className="form-group">
              <label className="form-label">Archivos *</label>
              <div 
                className="file-upload"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current.click()}
              >
                <div className="file-upload-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p className="file-upload-text">
                  <span>Haz clic para seleccionar</span> o arrastra y suelta tus archivos aquí
                </p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                  PDF, DOC, DOCX, JPG, PNG (máx. 10MB por archivo)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </div>
            </div>

            {/* Files List */}
            {archivos.length > 0 && (
              <div className="form-group">
                <label className="form-label">Archivos Seleccionados ({archivos.length})</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {archivos.map((archivo, idx) => (
                    <div key={idx} className="document-item">
                      <div className="document-icon">
                        {isDocx(archivo) ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                        )}
                      </div>
                      <div className="document-info">
                        <div className="document-name">{archivo.name}</div>
                        <div className="document-size">{archivo.size}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button 
                          type="button"
                          className="btn-icon" 
                          onClick={() => viewDocument(archivo, idx)}
                          style={{ color: '#3b82f6' }}
                          title="Vista previa"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button 
                          type="button"
                          className="btn-icon" 
                          onClick={() => downloadDocument(archivo)}
                          style={{ color: '#10b981' }}
                          title="Descargar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        </button>
                        <button 
                          type="button"
                          className="btn-icon" 
                          onClick={() => removeFile(idx)}
                          style={{ color: '#ef4444' }}
                          title="Eliminar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Descripción / Notas</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Agregar notas o descripción adicional..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Subiendo...</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{uploadProgress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {uploadSuccess && (
              <div style={{ 
                padding: '1rem', 
                background: '#d1fae5', 
                borderRadius: '0.5rem', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#10b981' }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span style={{ color: '#065f46', fontWeight: '500' }}>
                  Documentos subidos exitosamente. El analista revisará tu expediente.
                </span>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={uploading || archivos.length === 0}
            >
              {uploading ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <line x1="12" y1="2" x2="12" y2="6"/>
                    <line x1="12" y1="18" x2="12" y2="22"/>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                    <line x1="2" y1="12" x2="6" y2="12"/>
                    <line x1="18" y1="12" x2="22" y2="12"/>
                  </svg>
                  Subiendo...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Subir Documentos
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Document Preview */}
          {previewFile && (
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">Vista Previa: {previewFile.name}</h3>
                <button 
                  type="button"
                  className="btn-icon" 
                  onClick={closePreview}
                  style={{ color: '#64748b' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="form-group">
                {loadingPreview ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    padding: '3rem',
                    color: '#64748b'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', marginRight: '0.75rem' }}>
                      <line x1="12" y1="2" x2="12" y2="6"/>
                      <line x1="12" y1="18" x2="12" y2="22"/>
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                      <line x1="2" y1="12" x2="6" y2="12"/>
                      <line x1="18" y1="12" x2="22" y2="12"/>
                    </svg>
                    Cargando vista previa...
                  </div>
                ) : (
                  <div 
                    ref={previewContainerRef}
                    className="document-preview-container"
                    style={{ 
                      maxHeight: '600px', 
                      overflow: 'auto',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      background: '#fff'
                    }}
                  />
                )}
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => downloadDocument(previewFile)}
                    style={{ flex: 1 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Descargar .docx
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Instrucciones</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    background: '#2563eb', 
                    color: 'white', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}>1</span>
                  Selecciona el expediente
                </h4>
                <p style={{ color: '#64748b', fontSize: '0.875rem', paddingLeft: '2rem' }}>
                  Elige el expediente al que deseas agregar documentos o crea uno nuevo si es necesario.
                </p>
              </div>

              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    background: '#2563eb', 
                    color: 'white', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}>2</span>
                  Selecciona el tipo de documento
                </h4>
                <p style={{ color: '#64748b', fontSize: '0.875rem', paddingLeft: '2rem' }}>
                  Indica qué tipo de documento estás subiendo para facilitar la revisión del analista.
                </p>
              </div>

              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    background: '#2563eb', 
                    color: 'white', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}>3</span>
                  Sube tus archivos
                </h4>
                <p style={{ color: '#64748b', fontSize: '0.875rem', paddingLeft: '2rem' }}>
                  Arrastra y suelta o selecciona los archivos. Los documentos .docx se pueden visualizar directamente en el navegador.
                </p>
              </div>

              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    background: '#2563eb', 
                    color: 'white', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '700'
                  }}>4</span>
                  Espera la validación
                </h4>
                <p style={{ color: '#64748b', fontSize: '0.875rem', paddingLeft: '2rem' }}>
                  Una vez subidos, el analista revisará tus documentos. Recibirás una notificación con el resultado.
                </p>
              </div>
            </div>

            <div style={{ 
              marginTop: '2rem', 
              padding: '1rem', 
              background: '#eff6ff', 
              borderRadius: '0.5rem',
              borderLeft: '4px solid #2563eb'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                <strong>Nota:</strong> Asegúrate de que los documentos sean legibles y estén completos antes de subirlos para evitar rechazos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .docx-preview {
          background: #fff;
        }
        .docx-preview .docx-wrapper {
          background: transparent !important;
        }
        .document-preview-container .docx-wrapper {
          padding: 1rem;
        }
      `}</style>
    </div>
  );
}
