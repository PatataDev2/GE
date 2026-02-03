'use client';

import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { getExpedientes, iniciarProceso, getDocumentos, uploadDocumento } from '../../api/expedientes.api';
import { getDocumentTypes } from '../../api/document-types.api';
import { getCurrentUser } from '../../api/users.api';

const statusLabels = {
  solicitado: { label: 'Solicitado', class: 'badge-warning' },
  en_proceso: { label: 'En Proceso', class: 'badge-info' },
  revision_analista: { label: 'Revisión Analista', class: 'badge-warning' },
  aprobado: { label: 'Aprobado', class: 'badge-success' },
  rechazado: { label: 'Rechazado', class: 'badge-danger' },
  cerrado: { label: 'Cerrado', class: 'badge-secondary' }
};

const docStatusLabels = {
  aprobado: { label: 'Aprobado', class: 'badge-success' },
  pendiente: { label: 'Pendiente', class: 'badge-warning' },
  rechazado: { label: 'Rechazado', class: 'badge-danger' }
};

export default function MisExpedientes() {
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchExpedientes();
    fetchDocumentTypes();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await getCurrentUser();
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchExpedientes = async () => {
    try {
      setLoading(true);
      const response = await getExpedientes();
      console.log('Expedientes response:', response.data);
      const expedientesData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setExpedientes(expedientesData);
    } catch (error) {
      console.error('Error fetching expedientes:', error);
      setExpedientes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const response = await getDocumentTypes();
      console.log('Document types response:', response.data);
      setDocumentTypes(response.data);
    } catch (error) {
      console.error('Error fetching document types:', error);
      setDocumentTypes([]);
    }
  };

  const handleOpenCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateExpediente = async (formData) => {
    try {
      await fetchExpedientes();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating expediente:', error);
      alert('Error al procesar expediente');
    }
  };

  const handleIniciarProceso = async (expedienteId) => {
    try {
      await iniciarProceso(expedienteId);
      await fetchExpedientes();
      alert('Proceso iniciado exitosamente');
    } catch (error) {
      console.error('Error starting process:', error);
      alert('Error al iniciar proceso');
    }
  };

  const handleOpenUpload = (expediente) => {
    setSelectedExpediente(expediente);
    setSelectedFiles([]);
    setIsUploadModalOpen(true);
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('nombre_archivo', file.file.name);
        formData.append('archivo', file.file);
        formData.append('tipo_documento', file.tipo_documento);
        await uploadDocumento(selectedExpediente.id, formData);
      }
      
      await fetchExpedientes();
      setIsUploadModalOpen(false);
      setSelectedExpediente(null);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error al subir documentos');
    }
  };

  const handleViewExpediente = (exp) => {
    setSelectedExpediente(exp);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>Cargando expedientes...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{expedientes.length}</div>
            <div className="stat-label">Mis Expedientes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{expedientes.filter(e => e.estado === 'aprobado').length}</div>
            <div className="stat-label">Aprobados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{expedientes.filter(e => e.estado === 'revision_analista').length}</div>
            <div className="stat-label">En Revisión</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{expedientes.filter(e => e.estado === 'rechazado').length}</div>
            <div className="stat-label">Requieren Atención</div>
          </div>
        </div>
      </div>

      {/* Expedientes List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Mis Expedientes</h3>
        </div>

        {expedientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>No tienes expedientes solicitados.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {expedientes.map(exp => (
              <div key={exp.id} style={{ 
                border: '1px solid #e2e8f0', 
                borderRadius: '0.75rem', 
                padding: '1.5rem',
                background: exp.estado === 'rechazado' ? '#fef2f2' : exp.estado === 'revision_analista' ? '#fefce8' : exp.estado === 'solicitado' ? '#f0f9ff' : 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#2563eb' }}>{exp.codigo}</span>
                        <span className={`badge ${statusLabels[exp.estado].class}`}>
                          {statusLabels[exp.estado].label}
                        </span>
                     </div>
                     <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        {exp.nombre_expediente || `Expediente - ${exp.departamento}`}
                     </h4>
                     <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        Código: {exp.codigo} · Creado: {new Date(exp.fecha_creacion).toLocaleDateString()} · Actualizado: {new Date(exp.fecha_actualizacion).toLocaleDateString()}
                     </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button className="btn btn-secondary" onClick={() => handleViewExpediente(exp)}>
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                         <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                         <circle cx="12" cy="12" r="3"/>
                       </svg>
                       Ver Detalles
                     </button>
                     {exp.estado === 'solicitado' && (
                       <button className="btn btn-primary" onClick={() => handleIniciarProceso(exp.id)}>
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                           <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                           <polyline points="22 4 12 14.01 9 11.01"/>
                         </svg>
                         Iniciar Proceso
                       </button>
                     )}
                     {(exp.estado === 'en_proceso' || exp.estado === 'revision_analista') && (
                       <button className="btn btn-primary" onClick={() => handleOpenUpload(exp)}>
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                           <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                           <polyline points="17 8 12 3 7 8"/>
                           <line x1="12" y1="3" x2="12" y2="15"/>
                         </svg>
                         Subir Documentos
                       </button>
                     )}
                  </div>
                </div>

                {/* Documentos */}
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#64748b' }}>
                    Documentos ({exp.documentos?.length || 0})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {(exp.documentos || []).map((doc, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ 
                          color: doc.estado === 'aprobado' ? '#10b981' : doc.estado === 'rechazado' ? '#ef4444' : '#f59e0b'
                        }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        {doc.nombre_archivo}
                        <span className={`badge ${docStatusLabels[doc.estado].class}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                          {docStatusLabels[doc.estado].label}
                        </span>
                       </div>
                    ))}
                  </div>
                </div>

                {/* Observaciones si hay rechazo */}
                {exp.estado === 'rechazado' && exp.observaciones && (
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '0.75rem', 
                    background: '#fee2e2', 
                    borderRadius: '0.5rem',
                    borderLeft: '4px solid #ef4444'
                  }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#991b1b', marginBottom: '0.25rem' }}>
                        Motivo del rechazo
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#7f1d1d' }}>{exp.observaciones}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Expediente ${selectedExpediente?.codigo}`}
        footer={
          <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
            Cerrar
          </button>
        }
      >
        {selectedExpediente && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                  Expediente {selectedExpediente.codigo} - {selectedExpediente.departamento}
                </h4>
                <span className={`badge ${statusLabels[selectedExpediente.estado].class}`}>
                  {statusLabels[selectedExpediente.estado].label}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Empleado</span>
                  <span style={{ fontWeight: '500' }}>{selectedExpediente.empleado?.username || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Email</span>
                  <span style={{ fontWeight: '500' }}>{selectedExpediente.empleado?.email || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Código</span>
                  <span style={{ fontWeight: '500' }}>{selectedExpediente.codigo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Departamento</span>
                  <span style={{ fontWeight: '500' }}>{selectedExpediente.departamento}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Fecha de Creación</span>
                  <span style={{ fontWeight: '500' }}>{new Date(selectedExpediente.fecha_creacion).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Última Actualización</span>
                  <span style={{ fontWeight: '500' }}>{new Date(selectedExpediente.fecha_actualizacion).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <h5 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>Documentos</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(selectedExpediente.documentos || []).map((doc, idx) => (
                <div key={idx} className="document-item">
                  <div className="document-icon" style={{ 
                    background: doc.estado === 'aprobado' ? '#d1fae5' : doc.estado === 'rechazado' ? '#fee2e2' : '#fef3c7',
                    color: doc.estado === 'aprobado' ? '#10b981' : doc.estado === 'rechazado' ? '#ef4444' : '#f59e0b'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="document-info">
                     <div className="document-name">{doc.nombre_archivo}</div>
                     <div className="document-size">{doc.tipo_documento?.name || 'Sin tipo'} · {new Date(doc.fecha_subida).toLocaleDateString()}</div>
                  </div>
                  <span className={`badge ${docStatusLabels[doc.estado].class}`}>
                    {docStatusLabels[doc.estado].label}
                  </span>
                </div>
              ))}
            </div>

            {selectedExpediente.observaciones && (
              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                background: selectedExpediente.estado === 'rechazado' ? '#fee2e2' : '#f8fafc', 
                borderRadius: '0.5rem'
              }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Observaciones:</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{selectedExpediente.observaciones}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Expediente Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Información del Expediente"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cerrar
            </button>
          </>
        }
      >
        {currentUser && (
          <div className="form-group">
            <label className="form-label">Empleado</label>
            <input
              type="text"
              className="form-input"
              value={`${currentUser.username} - ${currentUser.email}`}
              disabled
              style={{ background: '#f8fafc' }}
            />
          </div>
        )}
        
        <div className="form-group">
          <label className="form-label">Nombre del Expediente</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ej: Solicitud de Vacaciones, Ingreso de Documentos..."
            disabled
            style={{ background: '#f8fafc' }}
          />
        </div>
        
        <div style={{ 
          padding: '1rem', 
          background: '#fef3c7', 
          borderRadius: '0.5rem',
          borderLeft: '4px solid #f59e0b',
          marginBottom: '1rem'
        }}>
          <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#92400e', marginBottom: '0.5rem' }}>
            Información Importante:
          </p>
          <p style={{ fontSize: '0.875rem', color: '#78350f' }}>
            En el nuevo flujo de trabajo, los expedientes son solicitados por el administrador. 
            Usted podrá iniciar el proceso una vez que reciba la notificación.
          </p>
        </div>
        
        <div className="form-group">
          <label className="form-label">Observaciones</label>
          <textarea
            className="form-input"
            rows="3"
            placeholder="Notas adicionales sobre el expediente..."
          />
        </div>
      </Modal>

      {/* Upload Documents Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={`Subir Documentos - ${selectedExpediente?.codigo}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsUploadModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleFileUpload} disabled={selectedFiles.length === 0}>
              Subir Documentos
            </button>
          </>
        }
      >
        <div>
          <div className="form-group">
            <label className="form-label">Seleccionar Archivos</label>
            <input
              type="file"
              multiple
              className="form-input"
              onChange={(e) => {
                const files = Array.from(e.target.files).map(file => ({
                  file,
                  name: file.name,
                  tipo_documento: ''
                }));
                setSelectedFiles(files);
              }}
            />
          </div>
          
          {selectedFiles.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Archivos seleccionados:</p>
              {selectedFiles.map((file, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.5rem',
                  background: '#f8fafc',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span style={{ flex: 1 }}>{file.name}</span>
                  <select
                    className="form-select"
                    style={{ width: 'auto' }}
                    value={file.tipo_documento}
                    onChange={(e) => {
                      const updatedFiles = [...selectedFiles];
                      updatedFiles[idx].tipo_documento = e.target.value;
                      setSelectedFiles(updatedFiles);
                    }}
                  >
                    <option value="">Seleccionar tipo</option>
                    {documentTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}