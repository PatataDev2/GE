import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { logError } from '../../utils/logger';
import DocxPreview from './DocxPreview';
import { useToast } from '../../context/ToastContext';

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

const statusConfig = {
  pendiente: { label: 'Pendiente', style: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  aprobado: { label: 'Aprobado', style: 'bg-green-50 text-green-600 border-green-100' },
  rechazado: { label: 'Rechazado', style: 'bg-red-50 text-red-600 border-red-100' },
};

function getDocStatus(doc) {
  if (doc.approval_status === true) return 'aprobado';
  if (doc.approval_status === false) return 'rechazado';
  return 'pendiente';
}

function getFileUrl(doc) {
  if (!doc.file) return null;
  if (doc.file.startsWith('http')) return doc.file;
  return BASE_API_URL + (doc.file.startsWith('/') ? '' : '/media/') + doc.file;
}

function getViewPdfUrl(docId) {
  return BASE_API_URL + '/api/documents/' + docId + '/view_pdf/';
}

export default function DocumentosPendientes() {
  const { showToast } = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectMessage, setRejectMessage] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [docBlob, setDocBlob] = useState(null);
  const [docIsImage, setDocIsImage] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('api/expedients/pending_docs/');
      setDocs(res.data);
    } catch (err) {
      logError('Error fetching pending docs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetchDocs();
    return () => ac.abort();
  }, [fetchDocs]);

  const openPreview = async (doc) => {
    setSelectedDoc(doc);
    setShowRejectForm(false);
    setRejectMessage('');
    setDocBlob(null);
    setDocIsImage(false);
    setShowPreview(true);

    const ext = doc.file ? doc.file.split('.').pop().toLowerCase() : '';
    const isImg = ['jpg', 'jpeg', 'png'].includes(ext);

    if (isImg) {
      setDocIsImage(true);
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await api.get('api/documents/' + doc.id + '/view_pdf/', {
        responseType: 'blob',
      });
      setDocBlob(res.data);
    } catch (err) {
      logError('Error loading document preview:', err);
      showToast('Error al cargar la vista previa del documento', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDoc) return;
    setReviewing(true);
    try {
      await api.post('api/documents/' + selectedDoc.id + '/review/', {
        action: 'approve',
        message: 'Documento aprobado por el analista',
      });
      showToast('Documento aprobado exitosamente', 'success');
      setShowPreview(false);
      setSelectedDoc(null);
      fetchDocs();
    } catch (err) {
      logError('Error approving document:', err);
      showToast('Error al aprobar el documento', 'error');
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDoc) return;
    setReviewing(true);
    try {
      await api.post('api/documents/' + selectedDoc.id + '/review/', {
        action: 'reject',
        message: rejectMessage || 'Documento rechazado',
        corrections: rejectMessage,
      });
      showToast('Documento rechazado', 'success');
      setShowPreview(false);
      setSelectedDoc(null);
      setShowRejectForm(false);
      setRejectMessage('');
      fetchDocs();
    } catch (err) {
      logError('Error rejecting document:', err);
      showToast('Error al rechazar el documento', 'error');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Documentos Pendientes</h1>
        <p className="text-gray-500">Revisa y aprueba o rechaza los documentos subidos a expedientes.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <p className="text-lg font-semibold">No hay documentos pendientes</p>
          <p className="text-sm">Los documentos nuevos en expedientes aprobados aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map(doc => {
            const status = getDocStatus(doc);
            const cfg = statusConfig[status];
            return (
              <div key={doc.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800">{doc.title}</h3>
                      <span className={'text-xs font-bold px-3 py-1 rounded-full border ' + cfg.style}>{cfg.label}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      <strong>Expediente:</strong> {doc.expedient?.title || doc.expedient_title || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      <strong>Tipo:</strong> {doc.document_type?.name || doc.document_type_name || 'Sin tipo'}
                    </p>
                    <p className="text-sm text-gray-500">
                      <strong>Subido por:</strong> {doc.uploaded_by?.username || doc.uploaded_by_username || 'N/A'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openPreview(doc)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
                    >
                      Vista Previa
                    </button>
                    <a
                      href={getFileUrl(doc)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-700 transition-colors"
                    >
                      Descargar
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showPreview && selectedDoc && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div
            className="bg-white rounded-lg shadow-2xl flex flex-col w-[95vw] h-[92vh] max-w-[1500px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">{selectedDoc.title}</h3>
              <button className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-500" onClick={() => setShowPreview(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-gray-100">
              {previewLoading ? (
                <div className="flex justify-center items-center h-full">
                  <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-3 text-gray-600">Cargando documento...</span>
                </div>
              ) : docIsImage ? (
                <div className="flex justify-center items-center h-full">
                  <img src={getFileUrl(selectedDoc)} alt={selectedDoc.title} className="max-w-full max-h-full object-contain rounded shadow" />
                </div>
              ) : selectedDoc.file && selectedDoc.file.split('.').pop().toLowerCase() === 'docx' && docBlob ? (
                <DocxPreview blob={docBlob} />
              ) : selectedDoc.file && selectedDoc.file.split('.').pop().toLowerCase() === 'pdf' ? (
                <iframe
                  src={getViewPdfUrl(selectedDoc.id)}
                  className="w-full h-full rounded border-0"
                  title={selectedDoc.title}
                />
              ) : docBlob ? (
                <iframe
                  src={URL.createObjectURL(docBlob)}
                  className="w-full h-full rounded border-0"
                  title={selectedDoc.title}
                />
              ) : (
                <div className="flex justify-center items-center h-full text-gray-400">
                  <p>No se puede previsualizar este documento.</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              {showRejectForm ? (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Motivo del rechazo / Correcciones requeridas:</label>
                  <textarea
                    className="form-input w-full border rounded-lg p-3 text-sm"
                    rows="3"
                    placeholder="Describe las correcciones necesarias..."
                    value={rejectMessage}
                    onChange={(e) => setRejectMessage(e.target.value)}
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      className="btn btn-secondary"
                      onClick={() => { setShowRejectForm(false); setRejectMessage(''); }}
                      disabled={reviewing}
                    >
                      Cancelar
                    </button>
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                      onClick={handleReject}
                      disabled={reviewing || !rejectMessage.trim()}
                    >
                      {reviewing ? 'Rechazando...' : 'Confirmar Rechazo'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                    onClick={() => setShowRejectForm(true)}
                    disabled={reviewing}
                  >
                    Rechazar
                  </button>
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                    onClick={handleApprove}
                    disabled={reviewing}
                  >
                    {reviewing ? 'Aprobando...' : 'Aprobar'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
