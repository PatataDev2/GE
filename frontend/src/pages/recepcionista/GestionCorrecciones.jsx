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

export default function GestionCorrecciones() {
  const { showToast } = useToast();
  const [corrections, setCorrections] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(null);
const [showReplaceModal, setShowReplaceModal] = useState(false);
const [showDraftModal, setShowDraftModal] = useState(false);
const [replacingFile, setReplacingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sendingToReview, setSendingToReview] = useState(false);
  const [draftUploading, setDraftUploading] = useState(false);
const [draftUploadFile, setDraftUploadFile] = useState(null);
const [replacingDraftDocId, setReplacingDraftDocId] = useState(null);
const [draftDocuments, setDraftDocuments] = useState([]);
const [newDocType, setNewDocType] = useState('');
const [newDocFile, setNewDocFile] = useState(null);
const [newDocUploading, setNewDocUploading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [docxBlob, setDocxBlob] = useState(null);
  const [confirmSendToReview, setConfirmSendToReview] = useState(false);

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const fetchData = async (signal) => {
    setLoading(true);
    try {
      const [corrRes, draftsRes, typesRes] = await Promise.all([
        api.get('api/expedients/corrections_needed/', { signal }),
        api.get('api/expedients/my_drafts/', { signal }),
        api.get('api/document-types/', { signal })
      ]);
      let corrData = corrRes.data;
      if (corrData && typeof corrData === 'object' && !Array.isArray(corrData)) {
        corrData = corrData.results || [];
      }
      setCorrections(Array.isArray(corrData) ? corrData : []);
      let draftsData = draftsRes.data;
      if (draftsData && typeof draftsData === 'object' && !Array.isArray(draftsData)) {
        draftsData = draftsData.results || [];
      }
      setDrafts(Array.isArray(draftsData) ? draftsData : []);
      let types = typesRes.data;
      if (types && typeof types === 'object' && !Array.isArray(types)) {
        types = types.results || [];
      }
      setDocTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        logError('Error fetching data:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    fetchData(ac.signal);
    return () => ac.abort();
  }, []);

  const handleOpenReplaceModal = (correction) => {
    setSelectedCorrection(correction);
    setReplacingFile(null);
    setShowReplaceModal(true);
  };

const handleOpenDraftModal = async (draft) => {
  setSelectedDraft(draft);
  setNewDocFile(null);
  setNewDocType('');
  try {
    const docsRes = await api.get(`api/documents/?expedient=${draft.id}`);
    let docs = docsRes.data;
    if (docs && typeof docs === 'object' && !Array.isArray(docs)) {
      docs = docs.results || [];
    }
    setDraftDocuments(Array.isArray(docs) ? docs : []);
  } catch (err) {
    logError('Error fetching draft documents:', err);
    setDraftDocuments([]);
  }
  setShowDraftModal(true);
};

const handleUploadNewDocument = async () => {
  if (!newDocFile || !newDocType || !selectedDraft) {
    showToast('Selecciona un tipo de documento y un archivo', 'error');
    return;
  }

  setNewDocUploading(true);

  const selectedType = docTypes.find(t => t.id == newDocType);
  const title = selectedType ? selectedType.name : newDocFile.name;

  const formData = new FormData();
  formData.append('title', title);
  formData.append('file', newDocFile);
  formData.append('document_type', newDocType);
  formData.append('expedient', selectedDraft.id);

  try {
    await api.post('api/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    showToast('Documento subido exitosamente', 'success');
    setNewDocFile(null);
    setNewDocType('');

    const docsRes = await api.get(`api/documents/?expedient=${selectedDraft.id}`);
    let docs = docsRes.data;
    if (docs && typeof docs === 'object' && !Array.isArray(docs)) {
      docs = docs.results || [];
    }
    setDraftDocuments(Array.isArray(docs) ? docs : []);
  } catch (err) {
    logError('Error uploading document:', err);
    showToast('Error al subir documento: ' + (err.response?.data?.error || err.message), 'error');
  } finally {
    setNewDocUploading(false);
  }
};

const handleReplaceFile = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file) {
      showToast('Selecciona un archivo para reemplazar', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`api/documents/${selectedCorrection.id}/replace_file/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Archivo reemplazado exitosamente. El documento vuelve a estado Pendiente.', 'success');
      setShowReplaceModal(false);
      fetchData();
    } catch (err) {
      logError('Error replacing file:', err);
      showToast('Error al reemplazar archivo: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setUploading(false);
    }
  };

const handleReplaceDraftDocument = async (docId) => {
  if (!draftUploadFile || !selectedDraft) return;

  setDraftUploading(true);
  const formData = new FormData();
  formData.append('file', draftUploadFile);

  try {
    await api.post(`api/documents/${docId}/replace_file/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    showToast('Documento reemplazado exitosamente', 'success');
    setDraftUploadFile(null);
    setReplacingDraftDocId(null);
    
    const docsRes = await api.get(`api/documents/?expedient=${selectedDraft.id}`);
    let docs = docsRes.data;
    if (docs && typeof docs === 'object' && !Array.isArray(docs)) {
      docs = docs.results || [];
    }
    setDraftDocuments(Array.isArray(docs) ? docs : []);
  } catch (err) {
    logError('Error replacing document:', err);
    showToast('Error al reemplazar documento: ' + (err.response?.data?.error || err.message), 'error');
  } finally {
    setDraftUploading(false);
  }
};

const requiredTypes = docTypes.filter(t => t.is_required);
const uploadedTypeIds = new Set(draftDocuments.map(d => d.document_type));
const checklist = requiredTypes.map(t => ({
  ...t,
  uploaded: uploadedTypeIds.has(t.id)
}));
const allRequiredUploaded = checklist.every(t => t.uploaded);

const handleSendToReview = async () => {
  if (!selectedDraft) return;

  const missingTypes = checklist.filter(t => !t.uploaded);
  if (missingTypes.length > 0 && !confirmSendToReview) {
    showToast(`Faltan documentos obligatorios:\n${missingTypes.map(t => `- ${t.name}`).join('\n')}`, 'warning');
    return;
  }

  if (allRequiredUploaded && !confirmSendToReview) {
    setConfirmSendToReview(true);
    return;
  }

  setSendingToReview(true);
  setConfirmSendToReview(false);
  try {
    await api.post(`api/expedients/${selectedDraft.id}/send_to_review/`);
    setShowDraftModal(false);
    navigate('/recepcionista/mis-expedientes');
  } catch (err) {
    logError('Error sending to review:', err);
    if (err.response?.data?.missing_documents) {
      const missing = err.response.data.missing_documents;
      showToast(`Faltan documentos obligatorios:\n${missing.map(m => `- ${m.name}`).join('\n')}`, 'warning');
    } else {
      showToast('Error al enviar a revisión', 'error');
    }
  } finally {
    setSendingToReview(false);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const correctionsCount = corrections.length;
  const draftsCount = drafts.length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Correcciones</h2>
        <p className="text-gray-500 mt-1">Atiende documentos rechazados y gestiona tus borradores</p>
      </div>

      <div className="stats-grid mb-6">
        <div className="stat-card">
          <div className="stat-icon red">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{correctionsCount}</div>
            <div className="stat-label">Atención Requerida</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{draftsCount}</div>
            <div className="stat-label">Borradores</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Cargando...</div>
      ) : (
        <>
          {correctionsCount > 0 && (
            <div className="card mb-6">
              <div className="card-header">
                <h3 className="card-title text-red-500">
                  Atención Requerida
                </h3>
                <span className="badge badge-danger">{correctionsCount} documentos</span>
              </div>
              <div className="flex flex-col gap-3">
                {corrections.map(doc => (
                  <div key={doc.id} className="p-4 bg-red-50 border border-red-200 rounded-xl border-l-4 border-l-red-500">
                    <div className="flex justify-between items-start flex-wrap gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono font-semibold text-blue-600">#{doc.expedient_id}</span>
                          <span className="badge badge-danger">Rechazado</span>
                        </div>
                        <h4 className="text-base font-semibold mb-1">{doc.title}</h4>
                        <p className="text-slate-500 text-sm mb-1">
                          Expediente: {doc.expedient_title} | Tipo: {doc.document_type}
                        </p>
                        {doc.corrections && (
                          <div className="mt-2 p-3 bg-white rounded-lg border border-red-200">
                            <strong className="text-red-500 text-sm">Correcciones requeridas:</strong>
                            <p className="mt-1 text-sm text-gray-700">{doc.corrections}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Subido: {formatDate(doc.uploaded_at)}
                        </p>
                      </div>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-secondary"
                            onClick={() => handlePreviewDoc(doc)}
                            title="Ver documento"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            Ver
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleOpenReplaceModal(doc)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="17 8 12 3 7 8"/>
                              <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            Actualizar Archivo
                          </button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {draftsCount > 0 ? (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title text-amber-500">
                  Borradores
                </h3>
                <span className="badge badge-warning">{draftsCount} borradores</span>
              </div>
              <div className="flex flex-col gap-3">
                {drafts.map(draft => (
                  <div key={draft.id} className="p-4 bg-amber-50 border border-amber-200 rounded-xl border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start flex-wrap gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono font-semibold text-blue-600">#{draft.id}</span>
                          <span className="badge badge-warning">Borrador</span>
                        </div>
                        <h4 className="text-base font-semibold mb-1">{draft.title}</h4>
                        <p className="text-slate-500 text-sm">
                          Departamento: {draft.department_name || 'No especificado'}
                        </p>
                        {draft.description && (
                          <p className="text-gray-400 text-xs mt-1">{draft.description}</p>
                        )}
                      </div>
                      <div className="flex gap-3 items-center pt-2">
                        <button 
                          className="btn btn-primary flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm" 
                          onClick={() => handleOpenDraftModal(draft)}
                          style={{ 
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          Ver Detalles
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <h3>Sin borradores</h3>
                <p>No tienes expedientes en borrador. Crea uno desde Mis Expedientes.</p>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={showReplaceModal}
        onClose={() => setShowReplaceModal(false)}
        title="Actualizar Archivo"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowReplaceModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleReplaceFile} disabled={uploading}>
              {uploading ? 'Subiendo...' : 'Reemplazar Archivo'}
            </button>
          </>
        }
      >
        {selectedCorrection && (
          <div>
            <div className="p-4 bg-red-50 rounded-lg mb-4">
              <p><strong>Documento:</strong> {selectedCorrection.title}</p>
              <p><strong>Expediente:</strong> #{selectedCorrection.expedient_id} - {selectedCorrection.expedient_title}</p>
              {selectedCorrection.corrections && (
                <div className="mt-2">
                  <strong className="text-red-500">Correcciones del analista:</strong>
                  <p className="mt-1">{selectedCorrection.corrections}</p>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Nuevo archivo *</label>
              <input
                type="file"
                ref={fileInputRef}
                className="form-input"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Al reemplazar el archivo, el documento volverá a estado <strong>Pendiente</strong> para revision.
            </p>
          </div>
        )}
      </Modal>

<Modal
  isOpen={showDraftModal}
  onClose={() => { setShowDraftModal(false); setConfirmSendToReview(false); }}
  title={`Borrador #${selectedDraft?.id} - ${selectedDraft?.title}`}
  footer={
    confirmSendToReview ? (
      <div className="flex items-center gap-3 w-full">
        <span className="text-sm text-slate-600 flex-1">
          ¿Enviar a revisión? Una vez enviado no podrás modificarlo hasta que un analista lo revise.
        </span>
        <button
          className="btn btn-success flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
          onClick={handleSendToReview}
          disabled={sendingToReview}
        >
          {sendingToReview ? 'Enviando...' : 'Sí, Enviar'}
        </button>
        <button
          className="btn btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
          onClick={() => setConfirmSendToReview(false)}
          disabled={sendingToReview}
        >
          Cancelar
        </button>
      </div>
    ) : (
      <>
        <button 
          className="btn btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg font-medium" 
          onClick={() => setShowDraftModal(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Cerrar
        </button>
        <button
          className="btn btn-success flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
          onClick={handleSendToReview}
          disabled={sendingToReview}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
          </svg>
          {sendingToReview ? 'Enviando...' : 'Enviar a Revision'}
        </button>
      </>
    )
  }
>
  {selectedDraft && (
    <div>
      <div className="mb-4">
        <span className="badge badge-warning">Borrador</span>
      </div>
      <div className="flex flex-col gap-2 mb-4">
        <div className="p-2 bg-slate-50 rounded-lg">
          <strong>Departamento:</strong> {selectedDraft.department_name || 'No especificado'}
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">
          <strong>Descripcion:</strong> {selectedDraft.description || 'Sin descripcion'}
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">
          <strong>Creado:</strong> {formatDate(selectedDraft.created_at)}
        </div>
      </div>

      {requiredTypes.length > 0 && (
        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <strong className="text-sm block mb-2">Documentos Requeridos</strong>
          {checklist.map(t => (
            <div key={t.id} className="flex items-center gap-2 text-sm py-1">
              <span className={t.uploaded ? 'text-green-500 text-base' : 'text-red-500 text-base'}>
                {t.uploaded ? '✅' : '❌'}
              </span>
              <span className={t.uploaded ? 'text-green-800 font-normal' : 'text-red-800 font-medium'}>
                {t.name}
              </span>
            </div>
          ))}
        </div>
      )}

      <h4 className="text-sm font-semibold mb-2">Documentos Subidos</h4>
      {draftDocuments.length > 0 ? (
        <div className="flex flex-col gap-2">
          {draftDocuments.map(doc => (
            <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <strong className="text-sm">{doc.document_type_name || 'Documento'}</strong>
                  {doc.file && (
                    <button
                      className="btn btn-secondary ml-2 px-2 py-1 text-xs inline-flex items-center gap-1 rounded-md"
                      onClick={() => handlePreviewDoc(doc)}
                      title="Ver documento"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Ver
                    </button>
                  )}
                </div>
                {replacingDraftDocId !== doc.id && (
                  <button
                    className="btn btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-md"
                    onClick={() => setReplacingDraftDocId(doc.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Reemplazar
                  </button>
                )}
              </div>
              {replacingDraftDocId === doc.id && (
                <div className="flex gap-3 items-center p-3 bg-slate-100 rounded-lg mt-3">
                  <input
                    type="file"
                    onChange={(e) => setDraftUploadFile(e.target.files[0])}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="text-xs flex-1"
                  />
                  <button
                    className="btn btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5 rounded-md whitespace-nowrap"
                    onClick={() => handleReplaceDraftDocument(doc.id)}
                    disabled={!draftUploadFile || draftUploading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    {draftUploading ? 'Subiendo...' : 'Confirmar'}
                  </button>
                  <button
                    className="btn btn-secondary px-3 py-1.5 text-xs rounded-md whitespace-nowrap"
                    onClick={() => { setReplacingDraftDocId(null); setDraftUploadFile(null); }}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No hay documentos subidos aún.</p>
      )}

      <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-200">
        <h4 className="text-sm font-semibold mb-4 text-amber-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5 align-middle">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Subir Nuevo Documento
        </h4>
        <div className="flex gap-3 items-end flex-wrap">
                          <div className="form-group mb-0 flex-[1_1_200px]">
                            <label className="form-label text-xs">Tipo de documento *</label>
            <select
              value={newDocType}
              onChange={(e) => setNewDocType(e.target.value)}
              className="form-input text-xs p-2"
            >
              <option value="">Seleccionar tipo...</option>
              {docTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
                          <div className="form-group mb-0 flex-[1_1_250px]">
                            <label className="form-label text-xs">Archivo *</label>
            <input
              type="file"
              onChange={(e) => setNewDocFile(e.target.files[0])}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="form-input text-xs p-1.5"
            />
          </div>
          <button
            className="btn btn-primary px-4 py-2 text-xs flex items-center gap-1.5 rounded-lg whitespace-nowrap"
            onClick={handleUploadNewDocument}
            disabled={!newDocFile || !newDocType || newDocUploading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {newDocUploading ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
      </div>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
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
              className="w-full rounded-lg border border-gray-200 h-[80vh]"
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
