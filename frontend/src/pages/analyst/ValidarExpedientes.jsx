'use client';

import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import api from '../../api/axios';

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
      const res = await api.get('api/expedients/pending/');
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
      setDocuments(res.data);
    } catch (err) {
      console.error("Error fetching docs:", err);
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

  const handleDocumentStatus = async (docId, status) => {
    try {
      await api.patch(`api/documents/${docId}/`, { status });
      setDocuments(documents.map(d => d.id === docId ? { ...d, status } : d));
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

  const pendingDocsCount = pendientes.reduce((acc, p) => acc + (p.documents_count || 0), 0);

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon yellow">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{pendientes.length}</div>
            <div className="stat-label">Pendientes de Validación</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{pendingDocsCount}</div>
            <div className="stat-label">Documentos por Revisar</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Expedientes Pendientes de Validación</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : pendientes.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h3>No hay expedientes pendientes</h3>
            <p>Todos los expedientes han sido revisados</p>
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
                      <span className="badge badge-warning">Pendiente de Validación</span>
                    </div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>{exp.title}</h4>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {exp.department_name} · Asignado: {exp.asinged_to_username || 'Sin asignar'}
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => handleOpenReview(exp)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Revisar Expediente
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
              Cancelar
            </button>
            <button className="btn btn-success" onClick={handleAprobar} disabled={submitting}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Aprobar Expediente
            </button>
            <button className="btn btn-danger" onClick={handleRechazar} disabled={submitting}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Rechazar Expediente
            </button>
          </>
        }
      >
        {selectedExpediente && (
          <div>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
              <p><strong>Título:</strong> {selectedExpediente.title}</p>
              <p><strong>Departamento:</strong> {selectedExpediente.department_name}</p>
              <p><strong>Asignado a:</strong> {selectedExpediente.asinged_to_username}</p>
            </div>

            <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>Documentos a Revisar</h4>
            
            {docLoading ? (
              <div className="p-4 text-center text-gray-400">Cargando documentos...</div>
            ) : documents.length === 0 ? (
              <div className="p-4 text-center text-gray-400">No hay documentos</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {documents.map((doc) => (
                  <div key={doc.id} className="document-item" style={{ 
                    background: doc.status === 'aprobado' ? '#d1fae5' : doc.status === 'rechazado' ? '#fee2e2' : 'white' 
                  }}>
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
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {doc.status === 'pendiente' ? (
                        <>
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleDocumentStatus(doc.id, 'aprobado')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDocumentStatus(doc.id, 'rechazado')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </>
                      ) : (
                        <span className={`badge ${doc.status === 'aprobado' ? 'badge-success' : 'badge-danger'}`}>
                          {doc.status === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">Comentarios / Observaciones</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Agregar comentarios sobre la revisión..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}