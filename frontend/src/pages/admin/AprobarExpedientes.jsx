import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import PreviewModal from '../../components/PreviewModal';
import DocxPreview from '../analyst/DocxPreview';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logger';
const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;
import { getFileType, resolveFileUrl } from '../../utils/preview';

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
  const [rejectDocId, setRejectDocId] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [docxBlob, setDocxBlob] = useState(null);
  const [kebabMenuId, setKebabMenuId] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeTarget, setCloseTarget] = useState(null);

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

  useEffect(() => {
    const handleClickOutside = () => setKebabMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  const handleOpenDetails = async (exp) => {
    setSelectedExp(exp);
    setIsModalOpen(true);
    await fetchDocuments(exp.id);
  };

  const handlePreviewDoc = async (doc) => {
    const fileUrl = resolveFileUrl(doc, BASE_API_URL);
    if (!fileUrl) return;
    setPreviewDoc(doc);
    setPreviewUrl(fileUrl);
    setDocxBlob(null);
    const ext = doc.file.split('.').pop().toLowerCase();
    if (ext === 'docx') {
      try {
        setShowPreviewModal(true);
        const response = await api.get(fileUrl, { responseType: 'blob' });
        setDocxBlob(response.data);
      } catch (err) {
        logError('Error loading DOCX:', err);
        showToast('Error al cargar el documento', 'error');
      }
    } else if (ext === 'pdf' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      setShowPreviewModal(true);
    } else {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
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
    setRejectDocId(null);
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
      if (rejectDocId) {
        await api.post(`api/documents/${rejectDocId}/review/`, {
          action: 'reject',
          message: correcciones.trim(),
          corrections: correcciones.trim(),
        });
        showToast('Documento rechazado', 'success');
        setShowRejectModal(false);
        setIsModalOpen(false);
        fetchAll();
      } else {
        await api.post(`api/expedients/${selectedExp.id}/reject/`, {
          correcciones: correcciones.trim(),
        });
        setShowRejectModal(false);
        setIsModalOpen(false);
        fetchAll();
      }
    } catch (err) {
      logError('Error rejecting:', err);
      showToast('Error al rechazar', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveDoc = async (docId) => {
    setSubmitting(true);
    try {
      await api.post(`api/documents/${docId}/review/`, { action: 'approve' });
      showToast('Documento aprobado', 'success');
      setIsModalOpen(false);
      fetchAll();
    } catch (err) {
      logError('Error approving doc:', err);
      showToast('Error al aprobar el documento', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectDoc = (docId) => {
    setRejectDocId(docId);
    setCorrecciones('');
    setShowRejectModal(true);
  };

  const handleCloseClick = (exp) => {
    setCloseTarget(exp);
    setShowCloseModal(true);
    setKebabMenuId(null);
  };

  const executeCloseExpedient = async () => {
    if (!closeTarget) return;
    setSubmitting(true);
    try {
      await api.post(`api/expedients/${closeTarget.id}/close/`);
      setShowCloseModal(false);
      setCloseTarget(null);
      showToast('Expediente cerrado exitosamente', 'success');
      fetchAll();
    } catch (err) {
      logError('Error closing expedient:', err);
      showToast('Error al cerrar el expediente', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const docsConActualizaciones = aprobados.filter(exp => exp.has_pending_updates);
  const pendingDoc = selectedExp?.has_pending_updates
    ? documents.find(doc => doc.pending_update_request === true)
    : null;

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
        <button
          className={`btn ${tab === 'documentos' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('documentos')}
        >
          Documentos ({docsConActualizaciones.length})
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
          <div className="flex flex-col gap-4">
            {pendientes.map(exp => (
              <div key={exp.id} className="card border-l-4 border-l-amber-500 cursor-pointer" onClick={() => handleOpenDetails(exp)}>
                <div className="card-body">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-bold text-base text-blue-600">#{exp.id}</span>
                        <span className="badge badge-warning">Pre-Aprobado</span>
                      </div>
                      <h4 className="text-lg font-semibold mb-1">{exp.title}</h4>
                      <p className="text-slate-500 text-sm">
                        {exp.department_name} - Asignado a: {exp.asinged_to_username || 'Sin asignar'}
                      </p>
                      {exp.approved_by_username && (
                        <p className="text-purple-500 text-xs mt-1">
                          Pre-aprobado por: {exp.approved_by_username}
                        </p>
                      )}
                      {exp.description && (
                        <p className="text-slate-400 text-xs mt-1">{exp.description}</p>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 text-right">
                      {new Date(exp.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === 'aprobados' ? (
        <div className="flex flex-col gap-4">
          {aprobados.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <h3>No hay expedientes aprobados</h3>
                <p>Los expedientes aprobados aparecerán aquí.</p>
              </div>
            </div>
          ) : (
            aprobados.map(exp => {
              const isClosed = exp.status === 'Finalizado';
              return (
              <div
                key={exp.id}
                className={`card border-l-4 cursor-pointer ${isClosed ? 'border-l-gray-400 opacity-60' : 'border-l-green-500'}`}
                onClick={isClosed ? undefined : () => handleOpenDetails(exp)}
                style={isClosed ? { pointerEvents: 'none' } : undefined}
              >
                <div className="card-body" style={isClosed ? { pointerEvents: 'auto' } : undefined}>
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-bold text-base text-blue-600">#{exp.id}</span>
                        {isClosed ? (
                          <span className="badge" style={{ background: '#e2e8f0', color: '#64748b' }}>Cerrado</span>
                        ) : (
                          <span className="badge badge-success">Aprobado</span>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold mb-1">{exp.title}</h4>
                      <p className="text-slate-500 text-sm">
                        {exp.department_name} - Asignado a: {exp.asinged_to_username || 'Sin asignar'}
                      </p>
                      {exp.approved_by_username && (
                        <p className="text-green-500 text-xs mt-1">
                          Aprobado por: {exp.approved_by_username}
                        </p>
                      )}
                      {exp.description && (
                        <p className="text-slate-400 text-xs mt-1">{exp.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-slate-400 text-right">
                        {new Date(exp.updated_at).toLocaleDateString()}
                      </div>
                      {!isClosed && (
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setKebabMenuId(kebabMenuId === exp.id ? null : exp.id); }}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                            </svg>
                          </button>
                          {kebabMenuId === exp.id && (
                            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCloseClick(exp); }}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors text-red-600"
                              >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                                <div>
                                  <p className="font-semibold">Cerrar Expediente</p>
                                  <p className="text-xs text-gray-400">Cambiar estado a cerrado</p>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {docsConActualizaciones.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <h3>No hay documentos pendientes de aprobación</h3>
                <p>Los documentos nuevos subidos a expedientes aprobados aparecerán aquí cuando el analista los haya pre-aprobado.</p>
              </div>
            </div>
          ) : (
            docsConActualizaciones.map(exp => (
              <div key={exp.id} className="card border-l-4 border-l-blue-500 cursor-pointer" onClick={() => handleOpenDetails(exp)}>
                <div className="card-body">
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono font-bold text-base text-blue-600">#{exp.id}</span>
                        <span className="badge badge-info">Actualización</span>
                      </div>
                      <h4 className="text-lg font-semibold mb-1">{exp.title}</h4>
                      <p className="text-slate-500 text-sm">
                        {exp.department_name} - Asignado a: {exp.asinged_to_username || 'Sin asignar'}
                      </p>
                      <p className="text-blue-500 text-xs mt-1 font-medium">
                        Documento actualizado pendiente de aprobación
                      </p>
                    </div>
                    <div className="text-xs text-slate-400 text-right">
                      {new Date(exp.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen && !!selectedExp}
        onClose={() => { setIsModalOpen(false); fetchAll(); }}
        title={
          selectedExp?.has_pending_updates
            ? `Actualización - Expediente #${selectedExp?.id}`
            : `Expediente #${selectedExp?.id}`
        }
        size="lg"
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
          ) : selectedExp?.has_pending_updates && pendingDoc ? (
            <div className="flex gap-2 w-full">
              <button className="btn btn-success flex-1" onClick={() => handleApproveDoc(pendingDoc.id)} disabled={submitting}>
                {submitting ? 'Procesando...' : 'Aprobar Cambio'}
              </button>
              <button className="btn btn-danger flex-1" onClick={() => handleRejectDoc(pendingDoc.id)} disabled={submitting}>
                Rechazar Cambio
              </button>
            </div>
          ) : null
        }
      >
        {selectedExp && (
          <div>
            <div className="mb-4 p-4 rounded-lg" style={{
              background: selectedExp.status === 'Finalizado' ? '#f1f5f9' : selectedExp.status === 'Aprobado' ? '#f0fdf4' : '#f8fafc',
              border: selectedExp.status === 'Finalizado' ? '1px solid #cbd5e1' : selectedExp.status === 'Aprobado' ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
            }}>
              <p><strong>Titulo:</strong> {selectedExp.title}</p>
              <p><strong>Departamento:</strong> {selectedExp.department_name}</p>
              <p><strong>Asignado a:</strong> {selectedExp.asinged_to_username || 'Sin asignar'}</p>
              {selectedExp.approved_by_username && (
                <p><strong>{selectedExp.status === 'Finalizado' ? 'Aprobado' : selectedExp.status === 'Aprobado' ? 'Aprobado' : 'Pre-aprobado'} por:</strong> {selectedExp.approved_by_username}</p>
              )}
              {selectedExp.description && <p><strong>Descripcion:</strong> {selectedExp.description}</p>}
              {selectedExp.rejection_reason && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <strong>Correcciones pendientes:</strong> {selectedExp.rejection_reason}
                </div>
              )}
              <p className="mt-2">
                <strong>Estado:</strong>{' '}
                <span className={`badge ${selectedExp.status === 'Finalizado' ? '' : selectedExp.status === 'Aprobado' ? 'badge-success' : selectedExp.rejection_reason ? 'badge-danger' : 'badge-warning'}`}
                  style={selectedExp.status === 'Finalizado' ? { background: '#e2e8f0', color: '#64748b' } : undefined}>
                  {selectedExp.status === 'Finalizado' ? 'Cerrado' : selectedExp.status === 'Aprobado' ? 'Aprobado' : selectedExp.rejection_reason ? 'Rechazado' : 'Pre-Aprobado'}
                </span>
              </p>
            </div>

            {selectedExp?.has_pending_updates ? (
              docLoading ? (
                <div className="p-4 text-center">Cargando documento...</div>
              ) : !pendingDoc ? (
                <div className="p-4 text-center text-gray-400">
                  No se encontró el documento con actualización pendiente
                </div>
              ) : (
                <div>
                  <h4 className="mb-3 font-semibold text-sm text-blue-700">Documento actualizado por el recepcionista</h4>
                  <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-3 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 shrink-0">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{pendingDoc.title}</p>
                        <p className="text-xs text-gray-500">{pendingDoc.document_type_name || 'Sin tipo'}</p>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handlePreviewDoc(pendingDoc)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Vista previa
                      </button>
                    </div>
                    {pendingDoc.description_content && (
                      <p className="text-xs text-gray-600 mt-2 p-2 bg-white rounded border border-blue-100">
                        {pendingDoc.description_content}
                      </p>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div>
                <h4 className="mb-3 font-semibold text-sm">Documentos ({documents.length})</h4>
                {documents.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">No hay documentos en este expediente</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {documents.map(doc => {
                      const status = !doc.file ? 'solicitado' : doc.approval_status === true ? 'aprobado' : doc.approval_status === false ? 'rechazado' : 'pendiente';
                      const hasFile = !!doc.file;
                      return (
                        <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 shrink-0">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{doc.title}</p>
                            <p className="text-xs text-slate-500">{doc.document_type_name || 'Sin tipo'}</p>
                          </div>
                          <span className={`badge text-[0.7rem] ${status === 'aprobado' ? 'badge-success' : status === 'rechazado' ? 'badge-danger' : status === 'solicitado' ? 'badge-info' : 'badge-warning'}`}>
                            {status === 'solicitado' ? 'Esperando subida' : status}
                          </span>
                          {hasFile && (
                            <button className="btn btn-secondary btn-sm" onClick={() => handlePreviewDoc(doc)} title="Vista previa">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showRejectModal && !!selectedExp}
        onClose={() => setShowRejectModal(false)}
        title={rejectDocId ? `Rechazar Documento` : `Rechazar Expediente #${selectedExp?.id}`}
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
          <p className="mb-2 text-sm text-slate-500">
            Expediente: <strong>{selectedExp?.title}</strong>
          </p>
          {!rejectDocId && (
            <p className="mb-4 text-sm text-slate-500">
              Recepcionista: <strong>{selectedExp?.asinged_to_username}</strong>
            </p>
          )}
          <div className="form-group">
            <label className="form-label text-red-500 font-semibold">
              Correcciones requeridas *
            </label>
            <textarea
              className="form-input"
              rows="5"
              value={correcciones}
              onChange={(e) => setCorrecciones(e.target.value)}
              placeholder="Describe las correcciones que el recepcionista debe realizar..."
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
          </div>
        }
      >
        <div>
          {previewUrl && getFileType(previewDoc) === 'pdf' && (
            <iframe
              src={previewUrl}
              className="w-full h-[80vh] rounded-lg border border-gray-200"
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
            </div>
          )}
        </div>
      </PreviewModal>

      <Modal
        isOpen={showCloseModal && !!closeTarget}
        onClose={() => { setShowCloseModal(false); setCloseTarget(null); }}
        title="Cerrar Expediente"
        footer={
          <div className="flex gap-2 w-full">
            <button className="btn btn-secondary flex-1" onClick={() => { setShowCloseModal(false); setCloseTarget(null); }} disabled={submitting}>
              Cancelar
            </button>
            <button className="btn btn-danger flex-1" onClick={executeCloseExpedient} disabled={submitting}>
              {submitting ? 'Cerrando...' : 'Si, Cerrar'}
            </button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <p className="text-slate-600 mb-2">
            Estas seguro de cerrar el expediente?
          </p>
          <p className="text-sm text-slate-400">
            <strong>{closeTarget?.title}</strong>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Una vez cerrado, no se podran realizar mas actualizaciones.
          </p>
        </div>
      </Modal>
    </div>
  );
}
