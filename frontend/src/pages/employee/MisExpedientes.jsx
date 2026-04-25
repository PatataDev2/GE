'use client';

import { useState, useEffect, useRef } from 'react';
import Modal from '../../components/Modal';
import api from '../../api/axios';

export default function MisExpedientes() {
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docTypes, setDocTypes] = useState([]);
  const [loadingDocTypes, setLoadingDocTypes] = useState(false);
  
  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const typeSelectRef = useRef(null);
  const descInputRef = useRef(null);

  const fetchExpedientes = async () => {
    setLoading(true);
    try {
      const res = await api.get('api/expedients/my/');
      let expData = res.data;
      if (expData && typeof expData === 'object' && !Array.isArray(expData)) {
        expData = expData.results || [];
      }
      setExpedientes(Array.isArray(expData) ? expData : []);
    } catch (err) {
      console.error("Error fetching expedients:", err);
      setExpedientes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocTypes = async () => {
    setLoadingDocTypes(true);
    try {
      const res = await api.get('api/document-types/');
      let types = res.data;
      if (types && typeof types === 'object' && !Array.isArray(types)) {
        types = types.results || [];
      }
      setDocTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      console.error("Error fetching doc types:", err);
      setDocTypes([]);
    } finally {
      setLoadingDocTypes(false);
    }
  };

  useEffect(() => { 
    fetchExpedientes(); 
    fetchDocTypes();
  }, []);

  const fetchDocuments = async (expedientId) => {
    setDocLoading(true);
    try {
      const res = await api.get(`api/documents/?expedient=${expedientId}`);
      let docs = res.data;
      if (docs && typeof docs === 'object' && !Array.isArray(docs)) {
        docs = docs.results || [];
      }
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setDocuments([]);
    } finally {
      setDocLoading(false);
    }
  };

  const handleViewExpediente = async (exp) => {
    setSelectedExpediente(exp);
    setIsModalOpen(true);
    await fetchDocuments(exp.id);
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    
    const file = fileInputRef.current?.files[0];
    const title = titleInputRef.current?.value;
    const documentType = typeSelectRef.current?.value;
    const description = descInputRef.current?.value;

    if (!file || !documentType) {
      alert("Selecciona un archivo y tipo de documento");
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
      alert("Documento subido exitosamente");
    } catch (err) {
      console.error("Error uploading:", err);
      alert("Error al subir documento: " + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  // Calculate stats safely
  const totalExpedientes = Array.isArray(expedientes) ? expedientes.length : 0;
  const activosExpedientes = Array.isArray(expedientes) ? expedientes.filter((e) => e.approval_status).length : 0;
  const enRevisionExpedientes = Array.isArray(expedientes) ? expedientes.filter((e) => !e.approval_status && !e.rejection_status).length : 0;
  const rechazadosExpedientes = Array.isArray(expedientes) ? expedientes.filter((e) => e.rejection_status).length : 0;

  function ExpedienteCard({ exp }) {
    const statusClass = exp.approval_status ? 'badge-success' : exp.rejection_status ? 'badge-danger' : 'badge-warning';
    const statusText = exp.approval_status ? 'Aprobado' : exp.rejection_status ? 'Rechazado' : 'En Revision';
    const bgColor = exp.rejection_status ? '#fef2f2' : !exp.approval_status ? '#fefce8' : 'white';

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
              <span className={`badge ${statusClass}`}>{statusText}</span>
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
    const isAprobado = doc.status === 'aprobado';
    const isRechazado = doc.status === 'rechazado';
    const bgColor = isAprobado ? '#d1fae5' : isRechazado ? '#fee2e2' : '#fef3c7';
    const textColor = isAprobado ? '#10b981' : isRechazado ? '#ef4444' : '#f59e0b';
    const badgeClass = isAprobado ? 'badge-success' : isRechazado ? 'badge-danger' : 'badge-warning';
    const badgeText = isAprobado ? 'Aprobado' : isRechazado ? 'Rechazado' : 'Pendiente';

    return (
      <div key={doc.id} className="document-item" style={{ background: bgColor }}>
        <div className="document-icon" style={{ background: bgColor, color: textColor }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div className="document-info">
          <div className="document-name">{doc.title}</div>
          <div className="document-size">{doc.document_type_name || 'Sin tipo'}</div>
        </div>
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
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : !expedientes || !Array.isArray(expedientes) || expedientes.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <h3>Sin expedientes</h3>
            <p>No tienes expedientes asignados actualmente.</p>
          </div>
        ) : (
          <div>
            {expedientes.map(exp => (
              <ExpedienteCard key={exp.id} exp={exp} />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Expediente #${selectedExpediente?.id} - ${selectedExpediente?.title}`}
        footer={
          <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
            Cerrar
          </button>
        }
      >
        {selectedExpediente && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <span className={`badge ${selectedExpediente.approval_status ? 'badge-success' : selectedExpediente.rejection_status ? 'badge-danger' : 'badge-warning'}`}>
                {selectedExpediente.approval_status ? 'Aprobado' : selectedExpediente.rejection_status ? 'Rechazado' : 'En Revision'}
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
                <input 
                  type="file" 
                  ref={fileInputRef}
                  required
                  className="form-input"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.pptx,.ppt"
                />
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
    </div>
  );
}