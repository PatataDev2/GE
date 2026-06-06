'use client';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import PreviewModal from '../../components/PreviewModal';
import DocxPreview from '../analyst/DocxPreview';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logger';
const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;
export default function AprobarExpedientes() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('pendientes');
  const [pendientes, setPendientes] = useState([]);
  const [aprobados, setAprobados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExp, setSelectedExp] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [correcciones, setCorrecciones] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [docxBlob, setDocxBlob] = useState(null);
  const fetchAll = async (signal) => {
    setLoading(true);
    try {
      const [pendRes, aprobRes] = await Promise.all([
        api.get('api/expedients/pending_admin/', { signal }),
        api.get('api/expedients/approved/', { signal }),
      ]);
      setPendientes(pendRes.data);
      setAprobados(aprobRes.data);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        logError("Error fetching:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { const ac = new AbortController(); fetchAll(ac.signal); return () => ac.abort(); }, []);

  const fetchDocuments = async (expedientId) => {
    setDocLoading(true);
    try {
      const res = await api.get(`api/documents/?expedient=${expedientId}`);
      let docs = res.data;
      if (docs && typeof docs === 'object' && !Array.isArray(docs)) {
        docs = docs.results || [];
      }
      setDocuments((Array.isArray(docs) ? docs : []).filter(d => d.expedient === expedientId));
    } catch (err) {
      logError("Error fetching docs:", err);
      setDocuments([]);
    } finally {
      setDocLoading(false);
    }
  };

  const handleOpenReview = async (exp) => {
    setSelectedExp(exp);
    setIsModalOpen(true);
    await fetchDocuments(exp.id);
  };

  const handleOpenDetails = async (exp) => {
    setSelectedExp(exp);
    setIsModalOpen(true);
    await fetchDocuments(exp.id);
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
          showToast('Error al cargar el documento', 'error');
        }
      } else if (ext === 'pdf' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        setShowPreviewModal(true);
      } else {
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
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

  const handleFinalApprove = async () => {
    setSubmitting(true);
    try {
      await api.post(`api/expedients/${selectedExp.id}/admin_approve/`);
      setIsModalOpen(false);
      fetchAll();
    } catch (err) {
      logError('Error approving:', err);
      showToast('Error al aprobar el expediente', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReject = () => {
    setCorrecciones('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!correcciones.trim()) {
      showToast('Debes ingresar las correcciones requeridas.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`api/expedients/${selectedExp.id}/reject/`, {
        correcciones: correcciones.trim(),
      });
      setShowRejectModal(false);
      setIsModalOpen(false);
      fetchAll();
    } catch (err) {
      logError('Error rejecting:', err);
      showToast('Error al rechazar el expediente', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Aprobar Expedientes</h2>
        <p className="text-gray-500 mt-1">Revisa y aprueba expedientes, o consulta los ya aprobados</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          className={`btn ${tab === 'pendientes' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('pendientes')}
        >
          Pendientes ({pendientes.length})
        </button>
        <button
          className={`btn ${tab === 'aprobados' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('aprobados')}
        >
          Aprobados ({aprobados.length})
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Cargando...</div>
      ) : tab === 'pendientes' ? (
        pendientes.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <h3>No hay expedientes pendientes de aprobacion</h3>
              <p>Todos los expedientes pre-aprobados han sido procesados.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendientes.map(exp => (
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
        )
      ) : (
        aprobados.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <h3>No hay expedientes aprobados</h3>
              <p>Aún no se han aprobado expedientes.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {aprobados.map(exp => (
              <div key={exp.id} className="card" style={{ borderLeft: '4px solid #22c55e', cursor: 'pointer' }} onClick={() => handleOpenDetails(exp)}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '1rem', color: '#2563eb' }}>#{exp.id}</span>
                        <span className="badge badge-success">Aprobado</span>
                      </div>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>{exp.title}</h4>
                      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        {exp.department_name} • Asignado a: {exp.asinged_to_username || 'Sin asignar'}
                      </p>
                      {exp.approved_by_username && (
                        <p style={{ color: '#22c55e', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          Aprobado por: {exp.approved_by_username}
                        </p>
                      )}
                      {exp.description && (
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>{exp.description}</p>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>
                      {new Date(exp.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <Modal
        isOpen={isModalOpen && !!selectedExp}
        onClose={() => { setIsModalOpen(false); fetchAll(); }}
        title={`Expediente #${selectedExp?.id}`}
        size="md"
        footer={
          selectedExp?.status === 'Pre_Aprobado' ? (
            <div className="flex gap-2 w-full">
              <button className="btn btn-success flex-1" onClick={handleFinalApprove} disabled={submitting}>
                {submitting ? 'Aprobando...' : 'Aprobar Definitivamente'}
              </button>
              <button className="btn btn-danger flex-1" onClick={handleOpenReject} disabled={submitting}>
                Rechazar Expediente
              </button>
            </div>
          ) : null
        }
      >
        {selectedExp && (
          <div>
            <div style={{
              marginBottom: '1rem', padding: '1rem',
              background: selectedExp.status === 'Aprobado' ? '#f0fdf4' : '#f8fafc',
              borderRadius: '0.5rem',
              border: selectedExp.status === 'Aprobado' ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
            }}>
              <p><strong>Titulo:</strong> {selectedExp.title}</p>
              <p><strong>Departamento:</strong> {selectedExp.department_name}</p>
              <p><strong>Asignado a:</strong> {selectedExp.asinged_to_username || 'Sin asignar'}</p>
              {selectedExp.approved_by_username && (
                <p><strong>{selectedExp.status === 'Aprobado' ? 'Aprobado' : 'Pre-aprobado'} por:</strong> {selectedExp.approved_by_username}</p>
              )}
              {selectedExp.description && <p><strong>Descripcion:</strong> {selectedExp.description}</p>}
                <p style={{ marginTop: '0.5rem' }}>
                  <strong>Estado:</strong>{' '}
                  <span className={`badge ${selectedExp.status === 'Aprobado' ? 'badge-success' : selectedExp.status === 'Rechazado' ? 'badge-danger' : 'badge-warning'}`}>
                    {selectedExp.status === 'Aprobado' ? 'Aprobado' : selectedExp.status === 'Rechazado' ? 'Rechazado' : 'Pre-Aprobado'}
                  </span>
                </p>
                <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: '#64748b' }}>
                  {selectedExp.status === 'Aprobado' ? 'Aprobado' : 'Creado'} el: {new Date(selectedExp.updated_at).toLocaleString()}
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
                          <button className="btn btn-secondary btn-sm" onClick={() => handlePreviewDoc(doc)} title="Vista previa">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadDoc(doc)} title="Descargar">
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
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showRejectModal && !!selectedExp}
        onClose={() => setShowRejectModal(false)}
        title={`Rechazar Expediente #${selectedExp?.id}`}
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
            Expediente: <strong>{selectedExp?.title}</strong>
          </p>
          <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
            Trabajador: <strong>{selectedExp?.asinged_to_username}</strong>
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
          if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
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
                if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
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
            <DocxPreview blob={docxBlob} />
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
