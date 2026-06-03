'use client';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import PreviewModal from '../../components/PreviewModal';
import DocxPreview from './DocxPreview';
import api from '../../api/axios';
const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;
export default function ValidarExpedientes() {
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [comentario, setComentario] = useState('');
  const [correcciones, setCorrecciones] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [docxBlob, setDocxBlob] = useState(null);
  const fetchExpedientes = async () => {
    setLoading(true);
    try {
      const res = await api.get('api/expedients/');
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
    setComentario('');
    setIsModalOpen(true);
    await fetchDocuments(exp.id);
  };
  const getExpedienteStatus = (exp) => {
  if (!exp) return 'pendiente';
  const s = exp.status;
  if (s === 'Aprobado' || s === 'Finalizado') return 'aprobado';
  if (s === 'Rechazado') return 'rechazado';
  if (s === 'Pre_Aprobado') return 'pre_aprobado';
  return 'pendiente';
};
  const getDocStatus = (doc) => {
    if (doc.approval_status === true) return 'aprobado';
    if (doc.approval_status === false) return 'rechazado';
    return 'pendiente';
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

  const handleExpedienteAction = async (expId, action) => {
    try {
      const endpoint = action === 'approve' ? 'approve' : 'reject';
      await api.post(`api/expedients/${expId}/${endpoint}/`, {
        observation: comentario || ''
      });
      setIsModalOpen(false);
      fetchExpedientes();
    } catch (err) {
      console.error(`Error ${action}ing:`, err);
      alert(`Error al ${action === 'approve' ? 'aprobar' : 'rechazar'}`);
    }
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
          console.error('Error loading DOCX:', err);
        }
      } else if (getFileType(doc) !== 'image') {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      } else {
        setShowPreviewModal(true);
      }
    }
  };
  const handleDownloadDoc = (doc) => {
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
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = doc.title || 'documento';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  const filtered = expedientes.filter(exp => {
    if (filterStatus === 'todos') return true;
    return getExpedienteStatus(exp) === filterStatus;
  });
  const statusLabels = {
    pendiente: 'Pendiente',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
    pre_aprobado: 'Pre-Aprobado'
  };
  const pendingCount = expedientes.filter(exp => getExpedienteStatus(exp) === 'pendiente').length;
  const preApprovedCount = expedientes.filter(exp => getExpedienteStatus(exp) === 'pre_aprobado').length;
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Validar Expedientes</h2>
        <p className="text-gray-500 mt-1">Revisa y valida los expedientes enviados por los trabajadores</p>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'pendiente', label: `Pendientes (${pendingCount})` },
            { key: 'pre_aprobado', label: `Pre-Aprobados (${preApprovedCount})` },
            { key: 'aprobado', label: 'Aprobados' },
            { key: 'rechazado', label: 'Rechazados' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterStatus === f.key ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="p-8 text-center text-gray-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>No hay expedientes</h3>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(exp => {
            const status = getExpedienteStatus(exp);
            const badgeClass = status === 'aprobado' ? 'badge-success' : status === 'rechazado' ? 'badge-danger' : status === 'pre_aprobado' ? 'badge-info' : 'badge-warning';
            const borderColor = status === 'aprobado' ? '#22c55e' : status === 'rechazado' ? '#ef4444' : status === 'pre_aprobado' ? '#8b5cf6' : '#f59e0b';
            return (
              <div key={exp.id} className="card" style={{ borderLeft: `4px solid ${borderColor}` }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '1rem', color: '#2563eb' }}>#{exp.id}</span>
                        <span className={`badge ${badgeClass}`}>{statusLabels[status] || status}</span>
                      </div>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>{exp.title}</h4>
                      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        {exp.department_name} â€¢ Asignado a: {exp.asinged_to_username || 'Sin asignar'}
                      </p>
                      {exp.description && (
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>{exp.description}</p>
                      )}
                    </div>
                    <button
                      className={`btn ${status === 'pendiente' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleOpenReview(exp)}
                    >
                      {status === 'pendiente' ? 'Revisar' : 'Ver documentos'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Expediente #${selectedExpediente?.id}`}
        footer={
          <>
            {selectedExpediente && getExpedienteStatus(selectedExpediente) === 'pendiente' && (
              <div className="flex gap-2 w-full">
                <button className="btn btn-success flex-1" onClick={() => handleExpedienteAction(selectedExpediente.id, 'approve')} disabled={submitting}>
                  Pre-Aprobar (Enviar a Admin)
                </button>
                <button className="btn btn-danger flex-1" onClick={() => handleOpenReject(selectedExpediente)} disabled={submitting}>
                  Rechazar Expediente
                </button>
              </div>
            )}
            {selectedExpediente && getExpedienteStatus(selectedExpediente) === 'pre_aprobado' && (
              <div className="flex gap-2 w-full">
                <button className="btn btn-secondary flex-1" disabled>
                  Enviado a Administrador para aprobacion final
                </button>
              </div>
            )}
          </>
        }
      >
        {selectedExpediente && (
          <div>
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
              <p><strong>TÃ­tulo:</strong> {selectedExpediente.title}</p>
              <p><strong>Departamento:</strong> {selectedExpediente.department_name}</p>
              <p><strong>Asignado a:</strong> {selectedExpediente.asinged_to_username || 'Sin asignar'}</p>
              {selectedExpediente.description && <p><strong>DescripciÃ³n:</strong> {selectedExpediente.description}</p>}
              <p style={{ marginTop: '0.5rem' }}>
                <strong>Estado:</strong>{' '}
                <span className={`badge ${getExpedienteStatus(selectedExpediente) === 'aprobado' ? 'badge-success' : getExpedienteStatus(selectedExpediente) === 'rechazado' ? 'badge-danger' : getExpedienteStatus(selectedExpediente) === 'pre_aprobado' ? 'badge-info' : 'badge-warning'}`}>
                  {statusLabels[getExpedienteStatus(selectedExpediente)] || getExpedienteStatus(selectedExpediente)}
                </span>
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
                        <div className="flex gap-1">
                          <button className="btn btn-secondary btn-sm" onClick={() => handlePreviewDoc(doc)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadDoc(doc)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {getExpedienteStatus(selectedExpediente) === 'pendiente' && (
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Comentario (opcional)</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Agrega un comentario para la revisiÃ³n..."
                />
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
              Tu navegador no soporta la reproducciÃ³n de video.
            </video>
          )}
          {previewUrl && getFileType(previewDoc) === 'other' && (
            <div className="text-center p-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-gray-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p className="text-gray-600 mb-4">La vista previa no estÃ¡ disponible para este tipo de archivo.</p>
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