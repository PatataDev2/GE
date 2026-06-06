'use client';

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import PreviewModal from '../../components/PreviewModal';
import DocxPreview from '../analyst/DocxPreview';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logger';

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

export default function MisExpedientes() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docTypes, setDocTypes] = useState([]);
  const [loadingDocTypes, setLoadingDocTypes] = useState(false);
  const [showCommentDocId, setShowCommentDocId] = useState(null);
  const [savingAsDraft, setSavingAsDraft] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [docxBlob, setDocxBlob] = useState(null);
  
  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const typeSelectRef = useRef(null);
  const descInputRef = useRef(null);

  const fetchExpedientes = async (signal) => {
    setLoading(true);
    try {
      const res = await api.get('api/expedients/my/', { signal });
      let expData = res.data;
      if (expData && typeof expData === 'object' && !Array.isArray(expData)) {
        expData = expData.results || [];
      }
      setExpedientes(Array.isArray(expData) ? expData : []);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        logError("Error fetching expedients:", err);
      }
      setExpedientes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocTypes = async (signal) => {
    setLoadingDocTypes(true);
    try {
      const res = await api.get('api/document-types/', { signal });
      let types = res.data;
      if (types && typeof types === 'object' && !Array.isArray(types)) {
        types = types.results || [];
      }
      setDocTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        logError("Error fetching doc types:", err);
      }
      setDocTypes([]);
    } finally {
      setLoadingDocTypes(false);
    }
  };

  useEffect(() => { 
    const ac = new AbortController();
    fetchExpedientes(ac.signal); 
    fetchDocTypes(ac.signal);
    return () => ac.abort();
  }, []);

  const fetchDocuments = async (expedientId) => {
    setDocLoading(true);
    setDocuments([]);
    try {
      const res = await api.get(`api/documents/?expedient=${expedientId}`);
      let docs = res.data;
      if (docs && typeof docs === 'object' && !Array.isArray(docs)) {
        docs = docs.results || [];
      }
      const filteredDocs = (Array.isArray(docs) ? docs : []).filter(d => d.expedient === expedientId);
      setDocuments(filteredDocs);
    } catch (err) {
      logError("Error fetching documents:", err);
      setDocuments([]);
    } finally {
      setDocLoading(false);
    }
  };

  const handleViewExpediente = async (exp) => {
    setDocuments([]);
    setSelectedExpediente(exp);
    setIsModalOpen(true);
    await fetchDocuments(exp.id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDocuments([]);
    setSelectedExpediente(null);
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    
    const file = fileInputRef.current?.files[0];
    const title = titleInputRef.current?.value;
    const documentType = typeSelectRef.current?.value;
    const description = descInputRef.current?.value;
    
    if (!file || !documentType) {
      showToast("Seleccione un archivo y tipo de documento", 'error');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('title', title || file.name);
    formData.append('file', file);
    formData.append('expedient', selectedExpediente.id);
    formData.append('document_type', documentType);
    formData.append('description_content', description || '');
    
    try {
      await api.post('api/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (titleInputRef.current) titleInputRef.current.value = '';
      if (typeSelectRef.current) typeSelectRef.current.value = '';
      if (descInputRef.current) descInputRef.current.value = '';
      
      await fetchDocuments(selectedExpediente.id);
      await fetchExpedientes();
      showToast("Documento subido exitosamente", 'success');
    } catch (err) {
      logError("Error uploading:", err);
      showToast("Error al subir documento: " + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!selectedExpediente) return;
    
    setSavingAsDraft(true);
    try {
      const res = await api.post(`api/expedients/${selectedExpediente.id}/save_draft/`);
      handleCloseModal();
      navigate('/employee/gestion-correcciones');
    } catch (err) {
      logError('Error saving as draft:', err);
      showToast('Error al guardar como borrador: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setSavingAsDraft(false);
    }
  };
  
  const getFileType = (doc) => {
    if (doc.file) {
      const ext = doc.file.split('.').pop().toLowerCase();
      if (['pdf'].includes(ext)) return 'pdf';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
      if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video';
      if (['docx'].includes(ext)) return 'docx';
    }
    return 'other';
  };

  const handlePreviewDoc = async (doc) => {
    let fileUrl = null;
    if (doc.file) {
      const filePath = doc.file;
      if (filePath.startsWith('http')) {
        fileUrl = filePath;
      } else if (filePath.startsWith('/')) {
        fileUrl = `${BASE_API_URL}${filePath}`;
      } else {
        fileUrl = `${BASE_API_URL}/media/${filePath}`;
      }
    }
    if (fileUrl) {
      setPreviewDoc(doc);
      setPreviewUrl(fileUrl);
      setDocxBlob(null);
      const ext = doc.file.split('.').pop().toLowerCase();
      if (ext === 'docx') {
        try {
          setShowPreviewModal(true);
          const response = await api.get(fileUrl, { responseType: 'blob' });
          const blob = response.data;
          setDocxBlob(blob);
        } catch (err) {
          logError('Error loading DOCX:', err);
        }
      } else if (getFileType(doc) !== 'image') {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      } else {
        setShowPreviewModal(true);
      }
    }
  };

  // Calculate stats safely
  const totalExpedientes = Array.isArray(expedientes) ? expedientes.length : 0;
  const activosExpedientes = Array.isArray(expedientes) ? expedientes.filter((e) => e.status === 'Aprobado').length : 0;
  const enRevisionExpedientes = Array.isArray(expedientes) ? expedientes.filter((e) => e.status === 'Pendiente' || e.status === 'Proceso').length : 0;
  const rechazadosExpedientes = Array.isArray(expedientes) ? expedientes.filter((e) => e.status === 'Rechazado').length : 0;

  function ExpedienteCard({ exp }) {
    const statusClass = exp.status === 'Aprobado' ? 'badge-success' : exp.status === 'Rechazado' ? 'badge-danger' : 'badge-warning';
    const statusText = exp.status === 'Aprobado' ? 'Aprobado' : exp.status === 'Rechazado' ? 'Rechazado' : 'En Revision';
    const bgColor = exp.status === 'Rechazado' ? '#fef2f2' : (exp.status === 'Pendiente' || exp.status === 'Proceso') ? '#fefce8' : 'white';

    return (
      <div style={{ 
        border: '1px solid #e2e8f0', 
        borderRadius: '0.75rem', 
        padding: '1.5rem',
        background: bgColor,
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#2563eb' }}>#{exp.id}</span>
              {exp.is_draft && <span className="badge" style={{ background: '#fde68a', color: '#92400e' }}>Borrador</span>}
              {!exp.is_draft && <span className={`badge ${statusClass}`}>{statusText}</span>}
            </div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>{exp.title}</h4>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Departamento: {exp.department_name || 'No especificado'}
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => handleViewExpediente(exp)}>
            Ver Detalles
          </button>
        </div>
      </div>
    );
  }

  function DocumentCard({ doc }) {
    // False or None means "pending" until reviewer approves/rejects
    const hasApproved = doc.approval_status === true;
    const hasRejected = doc.approval_status === false;
    const isPending = !hasApproved && !hasRejected;
    
    const status = hasApproved ? 'aprobado' : hasRejected ? 'rechazado' : 'pendiente';
    const bgColor = hasApproved ? '#d1fae5' : hasRejected ? '#fee2e2' : '#fef3c7';
    const textColor = hasApproved ? '#10b981' : hasRejected ? '#ef4444' : '#f59e0b';
    const badgeClass = hasApproved ? 'badge-success' : hasRejected ? 'badge-danger' : 'badge-warning';
    const badgeText = hasApproved ? 'Aprobado' : hasRejected ? 'Rechazado' : 'Pendiente';
    const showComment = showCommentDocId === doc.id;
    
    // Try to build the file URL from doc.file path
    let fileUrl = null;
    if (doc.file) {
      const filePath = doc.file;
      if (filePath.startsWith('http')) {
        fileUrl = filePath;
      } else if (filePath.startsWith('/')) {
        fileUrl = `${BASE_API_URL}${filePath}`;
      } else {
        fileUrl = `${BASE_API_URL}/media/${filePath}`;
      }
    }
    
    const handleClick = () => {
      if (fileUrl) {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }
    };

    return (
      <div className="document-item" style={{ background: bgColor }}>
        <div className="document-icon" style={{ background: bgColor, color: textColor }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div className="document-info" style={{ flex: 1 }}>
          <div className="document-name">{doc.title}</div>
          <div className="document-size">{doc.document_type_name || 'Sin tipo'}</div>
          {showComment && doc.description_content && (
            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
              <strong>Comentario:</strong> {doc.description_content}
            </div>
          )}
        </div>
        {fileUrl && (
          <button 
            className="btn btn-secondary btn-sm"
            style={{ marginRight: '0.5rem' }}
            onClick={() => handlePreviewDoc(doc)}
          >
            Ver
          </button>
        )}
        {!isPending && doc.description_content && (
          <button 
            className="btn btn-sm"
            style={{ marginRight: '0.5rem', background: hasRejected ? '#fecaca' : '#bbf7d0' }}
            onClick={() => setShowCommentDocId(showComment ? null : doc.id)}
          >
            {showComment ? 'Ocultar' : 'Comentario'} 
          </button>
        )}
        <span className={`badge ${badgeClass}`}>{badgeText}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{totalExpedientes}</div>
            <div className="stat-label">Mis expedientes</div>
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
            <div className="stat-value">{activosExpedientes}</div>
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
            <div className="stat-value">{enRevisionExpedientes}</div>
            <div className="stat-label">En Revision</div>
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
            <div className="stat-value">{rechazadosExpedientes}</div>
            <div className="stat-label">Rechazados</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Mis expedientes</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className="filter-tabs" style={{ display: 'flex', gap: '0.25rem' }}>
              {['all', 'Aprobado', 'Pendiente', 'Proceso', 'Rechazado'].map(status => {
                const labels = { all: 'Todos', Aprobado: 'Aprobados', Pendiente: 'Pendientes', Proceso: 'En Proceso', Rechazado: 'Rechazados' };
                const isActive = filterStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.8125rem',
                      border: `1px solid ${isActive ? '#2563eb' : '#e2e8f0'}`,
                      borderRadius: '0.375rem',
                      background: isActive ? '#2563eb' : 'white',
                      color: isActive ? 'white' : '#475569',
                      cursor: 'pointer',
                      fontWeight: isActive ? '600' : '400',
                      transition: 'all 0.15s',
                    }}
                  >
                    {labels[status]}
                  </button>
                );
              })}
            </div>
            <a href="/employee/gestion-correcciones" style={{ fontSize: '0.875rem', color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
              Ver Gestión de Correcciones →
            </a>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : (
          (() => {
            const filtered = filterStatus === 'all'
              ? expedientes
              : (Array.isArray(expedientes) ? expedientes.filter(e => e.status === filterStatus) : []);
            return !filtered || filtered.length === 0 ? (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <h3>{filterStatus === 'all' ? 'Sin expedientes' : `Sin expedientes ${filterStatus === 'Aprobado' ? 'aprobados' : filterStatus === 'Rechazado' ? 'rechazados' : 'en este estado'}`}</h3>
                <p>No tienes expedientes asignados actualmente.</p>
              </div>
            ) : (
              <div>
                {filtered.map(exp => (
                  <ExpedienteCard key={exp.id} exp={exp} />
                ))}
              </div>
            );
          })()
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Expediente #${selectedExpediente?.id} - ${selectedExpediente?.title}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={handleCloseModal}>
              Cerrar
            </button>
            {selectedExpediente && !selectedExpediente.is_draft && (
              <button 
                className="btn btn-warning" 
                onClick={handleSaveAsDraft}
                disabled={savingAsDraft}
              >
                {savingAsDraft ? 'Guardando...' : 'Guardar como Borrador'}
              </button>
            )}
          </>
        }
      >
        {selectedExpediente && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <span className={`badge ${selectedExpediente.status === 'Aprobado' ? 'badge-success' : selectedExpediente.status === 'Rechazado' ? 'badge-danger' : 'badge-warning'}`}>
                {selectedExpediente.status === 'Aprobado' ? 'Aprobado' : selectedExpediente.status === 'Rechazado' ? 'Rechazado' : 'En Revision'}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <strong>Departamento:</strong> {selectedExpediente.department_name || 'No especificado'}
              </div>
              <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <strong>Descripcion:</strong> {selectedExpediente.description || 'Sin descripcion'}
              </div>
            </div>

            <h5 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>Documentos ({documents.length})</h5>
            
            {docLoading ? (
              <div className="p-4 text-center text-gray-400">Cargando documentos...</div>
            ) : documents.length === 0 ? (
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
                <p style={{ color: '#64748b' }}>No hay documentos subidos aun.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {documents.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            )}

            <form onSubmit={handleUploadDocument} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
              <h5 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>Subir Nuevo Documento</h5>
              
              <div className="form-group">
                <label className="form-label">Archivo *</label>
                <label 
                  className="file-upload-input"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: '#f8fafc',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    required
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.pptx,.ppt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const nameSpan = document.getElementById('file-name-display');
                        if (nameSpan) nameSpan.textContent = file.name;
                      }
                    }}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ marginBottom: '0.5rem' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    <span style={{ color: '#2563eb', fontWeight: '500' }}>Haz click</span> o arrastra archivos aquí
                  </span>
                  <span id="file-name-display" style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#2563eb', fontWeight: '500' }}></span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Titulo</label>
                <input 
                  type="text"
                  ref={titleInputRef}
                  className="form-input"
                  placeholder="Nombre del documento (opcional)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Documento *</label>
                {loadingDocTypes ? (
                  <p>Cargando tipos...</p>
                ) : (
                  <select ref={typeSelectRef} required className="form-select">
                    <option value="">Seleccionar tipo...</option>
                    {docTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Descripcion</label>
                <textarea 
                  ref={descInputRef}
                  className="form-input"
                  rows="2"
                  placeholder="Descripcion opcional..."
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={uploading}
              >
                {uploading ? 'Subiendo...' : 'Subir Documento'}
              </button>
            </form>
          </div>
        )}
      </Modal>
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewUrl(null);
          setPreviewDoc(null);
          setDocxBlob(null);
        }}
        title={`Vista previa: ${previewDoc?.title || 'Documento'}`}
        footer={
          <div className="flex gap-2">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowPreviewModal(false);
                setPreviewUrl(null);
                setPreviewDoc(null);
                setDocxBlob(null);
              }}
            >
              Cerrar
            </button>
            {previewUrl && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewUrl;
                  link.download = previewDoc?.title || 'documento';
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar
              </button>
            )}
          </div>
        }
      >
        <div>
          {previewUrl && getFileType(previewDoc) === 'pdf' && (
            <iframe
              src={previewUrl}
              className="w-full rounded-lg border border-gray-200"
              style={{ height: '80vh' }}
              title="Vista previa del documento"
            />
          )}
          {previewUrl && getFileType(previewDoc) === 'docx' && docxBlob && (
            <DocxPreview key={previewDoc?.id} blob={docxBlob} />
          )}
          {previewUrl && getFileType(previewDoc) === 'image' && (
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt={previewDoc?.title || 'Documento'}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          )}
          {previewUrl && getFileType(previewDoc) === 'video' && (
            <video controls className="w-full max-h-[80vh] rounded-lg">
              <source src={previewUrl} />
              Tu navegador no soporta la reproducción de video.
            </video>
          )}
          {previewUrl && getFileType(previewDoc) === 'other' && (
            <div className="text-center p-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-gray-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p className="text-gray-600 mb-4">La vista previa no está disponible para este tipo de archivo.</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewUrl;
                  link.download = previewDoc?.title || 'documento';
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Descargar documento
              </button>
            </div>
          )}
        </div>
      </PreviewModal>
    </div>
  );
}