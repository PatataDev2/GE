'use client';

import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import api from '../../api/axios';

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

export default function ValidarExpedientes() {
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPendientes = async () => {
    setLoading(true);
    try {
      const res = await api.get('api/expedients/');
      setPendientes(res.data);
    } catch (err) {
      console.error("Error fetching:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPendientes(); }, []);

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
      console.error("Error fetching docs:", err);
      setDocuments([]);
    } finally {
      setDocLoading(false);
    }
  };

  const handleOpenReview = async (exp) => {
    setSelectedExpediente(exp);
    setComentario('');
    setIsModalOpen(true);
    await fetchDocuments(exp.id);
  };

  const getDocStatus = (doc) => {
    if (doc.approval_status === true) return 'aprobado';
    if (doc.approval_status === false) return 'rechazado';
    return 'pendiente';
  };

  const handleDocumentStatus = async (docId, status) => {
    try {
      const newStatus = status === 'aprobado';
      await api.patch(`api/documents/${docId}/`, { approval_status: newStatus });
      setDocuments(documents.map(d => d.id === docId ? { ...d, approval_status: newStatus } : d));
    } catch (err) {
      console.error("Error updating doc:", err);
    }
  };

  const handleAprobar = async () => {
    setSubmitting(true);
    try {
      await api.post(`api/expedients/${selectedExpediente.id}/approve/`, {
        observation: comentario
      });
      setIsModalOpen(false);
      fetchPendientes();
    } catch (err) {
      console.error("Error approving:", err);
      alert("Error al aprobar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRechazar = async () => {
    setSubmitting(true);
    try {
      await api.post(`api/expedients/${selectedExpediente.id}/reject/`, {
        observation: comentario
      });
      setIsModalOpen(false);
      fetchPendientes();
    } catch (err) {
      console.error("Error rejecting:", err);
      alert("Error al rechazar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDoc = (doc) => {
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
      window.open(fileUrl, '_blank');
    } else {
      alert('No se puede abrir el documento');
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Validar Expedientes</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : pendientes.length === 0 ? (
          <div className="empty-state">
            <h3>No hay expedientes pendientes</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendientes.map(exp => (
              <div key={exp.id} style={{ 
                border: '1px solid #e2e8f0', 
                borderRadius: '0.75rem', 
                padding: '1.5rem',
                background: '#fefce8'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#2563eb' }}>#{exp.id}</span>
                      <span className="badge badge-warning">Pendiente</span>
                    </div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600' }}>{exp.title}</h4>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {exp.department_name} - {exp.asinged_to_username || 'Sin asignar'}
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => handleOpenReview(exp)}>
                    Revisar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Revisar Expediente #${selectedExpediente?.id}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cerrar
            </button>
            <button className="btn btn-success" onClick={handleAprobar} disabled={submitting}>
              Aprobar
            </button>
            <button className="btn btn-danger" onClick={handleRechazar} disabled={submitting}>
              Rechazar
            </button>
          </>
        }
      >
        {selectedExpediente && (
          <div>
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
              <p><strong>Titulo:</strong> {selectedExpediente.title}</p>
              <p><strong>Departamento:</strong> {selectedExpediente.department_name}</p>
              <p><strong>Asignado:</strong> {selectedExpediente.asinged_to_username}</p>
            </div>
            <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>Documentos</h4>
            {docLoading ? (
              <div className="p-4 text-center">Cargando...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {documents.map(doc => {
                  const status = getDocStatus(doc);
                  const bgColor = status === 'aprobado' ? '#d1fae5' : status === 'rechazado' ? '#fee2e2' : 'white';
                  const FileUrl = doc.file ? (doc.file.startsWith('http') ? doc.file : `${BASE_API_URL}${doc.file.startsWith('/') ? '' : '/media/'}${doc.file}`) : null;
                  return (
                    <div key={doc.id} className="document-item" style={{ background: bgColor }}>
                      <div className="document-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div className="document-info">
                        <div className="document-name">{doc.title}</div>
                        <div className="document-size">{doc.document_type_name || 'Sin tipo'}</div>
                      </div>
                      {FileUrl && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleViewDoc(doc)}>
                          Ver
                        </button>
                      )}
                      {status === 'pendiente' ? (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => handleDocumentStatus(doc.id, 'aprobado')}>
                            ✓
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDocumentStatus(doc.id, 'rechazado')}>
                            ✗
                          </button>
                        </>
                      ) : (
                        <span className={`badge ${status === 'aprobado' ? 'badge-success' : 'badge-danger'}`}>
                          {status}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Comentarios</label>
              <textarea className="form-input" rows="3" value={comentario} onChange={(e) => setComentario(e.target.value)} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}