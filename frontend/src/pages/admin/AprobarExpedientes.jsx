'use client';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import api from '../../api/axios';
const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;
export default function AprobarExpedientes() {
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [correcciones, setCorrecciones] = useState('');
  const fetchExpedientes = async () => {
    setLoading(true);
    try {
      const res = await api.get('api/expedients/pending_admin/');
      setExpedientes(res.data);
    } catch (err) {
      console.error("Error fetching:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchExpedientes(); }, []);
  const fetchDocuments = async (expedientId) => {
    setDocLoading(true);
    try {
      const res = await api.get(`api/documents/?expedient=${expedientId}`);
      let docs = res.data;
      if (docs && typeof docs === 'object' && !Array.isArray(docs)) {
        docs = docs.results || [];
      }
      const filteredDocs = (Array.isArray(docs) ? docs : []).filter(d => d.expedient === expedientId);
      setDocuments(filteredDocs);
    } catch (err) {
      console.error("Error fetching docs:", err);
      setDocuments([]);
    } finally {
      setDocLoading(false);
    }
  };
  const handleOpenReview = async (exp) => {
    setSelectedExpediente(exp);
    setIsModalOpen(true);
    await fetchDocuments(exp.id);
  };
  const getDocStatus = (doc) => {
    if (doc.approval_status === true) return 'aprobado';
    if (doc.approval_status === false) return 'rechazado';
    return 'pendiente';
  };
  const handleFinalApprove = async () => {
    setSubmitting(true);
    try {
      await api.post(`api/expedients/${selectedExpediente.id}/admin_approve/`);
      setIsModalOpen(false);
      fetchExpedientes();
    } catch (err) {
      console.error('Error approving:', err);
      alert('Error al aprobar el expediente');
    } finally {
      setSubmitting(false);
    }
  };
  const handleOpenReject = (exp) => {
    setSelectedExpediente(exp);
    setCorrecciones('');
    setShowRejectModal(true);
  };
  const handleConfirmReject = async () => {
    if (!correcciones.trim()) {
      alert('Debes ingresar las correcciones requeridas.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`api/expedients/${selectedExpediente.id}/reject/`, {
        correcciones: correcciones.trim(),
      });
      setShowRejectModal(false);
      setIsModalOpen(false);
      fetchExpedientes();
    } catch (err) {
      console.error('Error rejecting:', err);
      alert('Error al rechazar el expediente');
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Aprobar Expedientes</h2>
        <p className="text-gray-500 mt-1">Expedientes pre-aprobados por analistas pendientes de tu aprobacion final</p>
      </div>
      {loading ? (
        <div className="p-8 text-center text-gray-400">Cargando...</div>
      ) : expedientes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>No hay expedientes pendientes de aprobacion</h3>
            <p>Todos los expedientes pre-aprobados han sido procesados.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {expedientes.map(exp => (
            <div key={exp.id} className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '1rem', color: '#2563eb' }}>#{exp.id}</span>
                      <span className="badge badge-warning">Pre-Aprobado</span>
                    </div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>{exp.title}</h4>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {exp.department_name} • Asignado a: {exp.asinged_to_username || 'Sin asignar'}
                    </p>
                    {exp.approved_by_username && (
                      <p style={{ color: '#8b5cf6', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        Pre-aprobado por: {exp.approved_by_username}
                      </p>
                    )}
                    {exp.description && (
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>{exp.description}</p>
                    )}
                  </div>
                  <button className="btn btn-primary" onClick={() => handleOpenReview(exp)}>
                    Revisar y Aprobar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Expediente #${selectedExpediente?.id}`}
        footer={
          <>
            {selectedExpediente && (
              <div className="flex gap-2 w-full">
                <button className="btn btn-success flex-1" onClick={handleFinalApprove} disabled={submitting}>
                  Aprobar Definitivamente
                </button>
                <button className="btn btn-danger flex-1" onClick={() => handleOpenReject(selectedExpediente)} disabled={submitting}>
                  Rechazar Expediente
                </button>
              </div>
            )}
          </>
        }
      >
        {selectedExpediente && (
          <div>
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
              <p><strong>Titulo:</strong> {selectedExpediente.title}</p>
              <p><strong>Departamento:</strong> {selectedExpediente.department_name}</p>
              <p><strong>Asignado a:</strong> {selectedExpediente.asinged_to_username || 'Sin asignar'}</p>
              {selectedExpediente.approved_by_username && (
                <p><strong>Pre-aprobado por:</strong> {selectedExpediente.approved_by_username}</p>
              )}
              {selectedExpediente.description && <p><strong>Descripcion:</strong> {selectedExpediente.description}</p>}
              <p style={{ marginTop: '0.5rem' }}>
                <strong>Estado:</strong>{' '}
                <span className="badge badge-warning">Pre-Aprobado</span>
              </p>
            </div>
            <h4 style={{ marginBottom: '1rem', fontWeight: '600', fontSize: '1rem' }}>
              Documentos ({documents.length})
            </h4>
            {docLoading ? (
              <div className="p-4 text-center">Cargando documentos...</div>
            ) : documents.length === 0 ? (
              <div className="p-4 text-center text-gray-400">No hay documentos en este expediente</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {documents.map(doc => {
                  const status = getDocStatus(doc);
                  const bgColor = status === 'aprobado' ? '#f0fdf4' : status === 'rechazado' ? '#fef2f2' : '#fffbeb';
                  const FileUrl = doc.file ? (doc.file.startsWith('http') ? doc.file : `${BASE_API_URL}${doc.file.startsWith('/') ? '' : '/media/'}${doc.file}`) : null;
                  return (
                    <div key={doc.id} className="document-item" style={{ background: bgColor, display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <div className="document-icon" style={{ flexShrink: 0 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div className="document-info" style={{ flex: 1, minWidth: 0 }}>
                        <div className="document-name" style={{ fontWeight: '600', fontSize: '0.875rem' }}>{doc.title}</div>
                        <div className="document-size" style={{ fontSize: '0.75rem', color: '#64748b' }}>{doc.document_type_name || 'Sin tipo'}</div>
                      </div>
                      <span className={`badge ${status === 'aprobado' ? 'badge-success' : status === 'rechazado' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                        {status}
                      </span>
                      {FileUrl && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleViewDoc(doc)}>
                          Ver
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title={`Rechazar Expediente #${selectedExpediente?.id}`}
        footer={
          <>
            <button className="btn btn-secondary flex-1" onClick={() => setShowRejectModal(false)} disabled={submitting}>
              Cancelar
            </button>
            <button className="btn btn-danger flex-1" onClick={handleConfirmReject} disabled={submitting || !correcciones.trim()}>
              {submitting ? 'Enviando...' : 'Rechazar y Devolver'}
            </button>
          </>
        }
      >
        <div>
          <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
            Expediente: <strong>{selectedExpediente?.title}</strong>
          </p>
          <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
            Trabajador: <strong>{selectedExpediente?.asinged_to_username}</strong>
          </p>
          <div className="form-group">
            <label className="form-label" style={{ color: '#ef4444', fontWeight: '600' }}>
              Correcciones requeridas *
            </label>
            <textarea
              className="form-input"
              rows="5"
              value={correcciones}
              onChange={(e) => setCorrecciones(e.target.value)}
              placeholder="Describe las correcciones que el trabajador debe realizar..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
