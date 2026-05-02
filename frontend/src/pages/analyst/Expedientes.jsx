'use client';

import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import ManejoDocumentos from './ManejoDocumentos'; 
import api from '../../api/axios';

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

export default function Expedientes() {
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [currentExpedientId, setCurrentExpedientId] = useState(null);
  const [docLoading, setDocLoading] = useState(false);
  const [showNewExpedienteModal, setShowNewExpedienteModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewAction, setReviewAction] = useState('approve');
  const [submitting, setSubmitting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchExpedientes = async () => {
    setLoading(true);
    try {
      const response = await api.get('api/expedients/');
      setExpedientes(response.data);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpedientes(); }, []);

  const fetchDocuments = async (expedientId) => {
    setDocLoading(true);
    setCurrentExpedientId(expedientId);
    setDocuments([]);
    try {
      console.log('Fetching documents for expedient:', expedientId);
      const res = await api.get(`api/documents/?expedient=${expedientId}`);
      console.log('Documents response:', res.data);
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

  const handleViewDocuments = async (exp) => {
    console.log('Opening documents for expedient:', exp.id);
    setSelectedExpediente(exp);
    setDocuments([]);
    setIsModalOpen(true);
    await fetchDocuments(exp.id);
  };

  const getDocStatus = (doc) => {
    if (doc.approval_status === true) return 'aprobado';
    if (doc.approval_status === false) return 'rechazado';
    return 'pendiente';
  };

  const handlePreviewDoc = (doc) => {
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
      if (getFileType(doc) !== 'image') {
        window.open(fileUrl, '_blank');
      } else {
        setPreviewDoc(doc);
        setPreviewUrl(fileUrl);
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

  const getFileType = (doc) => {
    if (doc.file) {
      const ext = doc.file.split('.').pop().toLowerCase();
      if (['pdf'].includes(ext)) return 'pdf';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
      if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video';
    }
    return 'other';
  };

  const openReviewModal = (doc, action) => {
    setSelectedDoc(doc);
    setReviewAction(action);
    setReviewMessage(doc.description_content || '');
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedDoc) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('access');
      console.log('Token:', token);
      const res = await api.post(`api/documents/${selectedDoc.id}/review/`, {
        action: reviewAction,
        message: reviewMessage
      });
      console.log('Review response:', res.data);
      setShowReviewModal(false);
      await fetchDocuments(selectedExpediente.id);
    } catch (err) {
      console.error("Error:", err);
      console.error("Response:", err.response);
      alert('Error al procesar la revisión');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = expedientes.filter(exp => {
    const matchesSearch = exp.title?.toLowerCase().includes(search.toLowerCase()) || exp.id.toString().includes(search);
    const status = exp.approval_status ? 'activo' : 'en_revision';
    const matchesStatus = filterStatus === 'todos' || status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Panel de Control</h1>
          <p className="text-gray-500">Gestiona y supervisa los expedientes en tiempo real.</p>
        </div>
        <button 
          onClick={() => {
            setSelectedExpediente(null);
            setDocuments([]);
            setShowNewExpedienteModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-200 transition-all transform hover:scale-105 flex items-center gap-2 font-bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nuevo Expediente
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-8 items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative flex-1 min-w-[300px]">
          <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </span>
          <input 
            type="text" 
            placeholder="Buscar por ID o nombre..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          {['todos', 'en_revision', 'activo'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filterStatus === st ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-3xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(exp => (
            <div 
              key={exp.id} 
              className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-150 ${exp.approval_status ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">
                  #{exp.id}
                </span>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${exp.approval_status ? 'bg-green-50 text-green-600 border-green-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'}`}>
                  {exp.approval_status ? '✓ ACTIVO' : '⏳ REVISIÓN'}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">{exp.title}</h3>
              <p className="text-sm text-gray-500 mb-6 line-clamp-2">{exp.description || 'Sin descripción asignada.'}</p>

              <div className="flex items-center gap-3 mb-6 bg-gray-50 p-3 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {exp.asinged_to_username?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Analista</p>
                  <p className="text-sm font-bold text-gray-700">{exp.asinged_to_username || 'No asignado'}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleViewDocuments(exp)}
                  className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors"
                >
                  Ver Documentos
                </button>
                <button className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setDocuments([]);
          setCurrentExpedientId(null);
        }}
        title={`Expediente #${selectedExpediente?.id} - ${selectedExpediente?.title}`}
        footer={
          <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
            Cerrar
          </button>
        }
      >
        {selectedExpediente && (
          <div>
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
              <p><strong>Departamento:</strong> {selectedExpediente.department_name}</p>
              <p><strong>Asignado a:</strong> {selectedExpediente.asinged_to_username || 'No asignado'}</p>
              <p><strong>Descripción:</strong> {selectedExpediente.description || 'Sin descripción'}</p>
            </div>
            
            <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>Documentos</h4>
            
            {docLoading ? (
              <div className="p-4 text-center">Cargando documentos...</div>
            ) : documents.length === 0 ? (
              <div className="p-4 text-center text-gray-400">No hay documentos</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {documents.map(doc => {
                  const status = getDocStatus(doc);
                  const bgColor = status === 'aprobado' ? '#d1fae5' : status === 'rechazado' ? '#fee2e2' : 'white';
                  const fileUrl = doc.file ? (doc.file.startsWith('http') ? doc.file : `${BASE_API_URL}${doc.file.startsWith('/') ? '' : '/media/'}${doc.file}`) : null;
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
                        {fileUrl && (
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
<span className={`badge ${status === 'aprobado' ? 'badge-success' : status === 'rechazado' ? 'badge-danger' : 'badge-warning'}`}>
                          {status}
                        </span>
                        {status === 'pendiente' && (
                          <div className="flex gap-1">
                            <button
                              className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                              onClick={() => openReviewModal(doc, 'approve')}
                            >
                              Aprobar
                            </button>
                            <button
                              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                              onClick={() => openReviewModal(doc, 'reject')}
                            >
                              Rechazar
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
        isOpen={showNewExpedienteModal} 
        onClose={() => {
          setShowNewExpedienteModal(false);
          setSelectedExpediente(null);
          setDocuments([]);
          setCurrentExpedientId(null);
        }}
        title="Crear Nuevo Expediente"
      >
        <div className="p-2">
          <ManejoDocumentos onSuccess={async (newExpediente) => {
            setShowNewExpedienteModal(false);
            setSelectedExpediente(newExpediente);
            setDocuments([]);
            setIsModalOpen(true);
            if (newExpediente?.id) {
              await fetchDocuments(newExpediente.id);
            } else {
              await fetchExpedientes();
            }
          }} />
        </div>
      </Modal>

      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={reviewAction === 'approve' ? 'Aprobar Documento' : 'Rechazar Documento'}
        footer={
          <div className="flex gap-2">
            <button
              className="btn btn-secondary"
              onClick={() => setShowReviewModal(false)}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              className={`btn ${reviewAction === 'approve' ? 'btn-success' : 'btn-danger'}`}
              onClick={handleReviewSubmit}
              disabled={submitting}
            >
              {submitting ? 'Enviando...' : reviewAction === 'approve' ? 'Aprobar' : 'Rechazar'}
            </button>
          </div>
        }
      >
        <div className="p-2">
          <p className="mb-2 font-semibold">{selectedDoc?.title}</p>
          <label className="block text-sm font-medium mb-1">
            Mensaje {reviewAction === 'reject' ? '(requerido para rechazo)' : '(opcional)'}
          </label>
          <textarea
            className="w-full p-3 border rounded-lg"
            rows="4"
            value={reviewMessage}
            onChange={(e) => setReviewMessage(e.target.value)}
            placeholder={reviewAction === 'reject' ? 'Explique el motivo del rechazo...' : 'Agregue un comentario (opcional)...'}
          />
        </div>
      </Modal>

      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewUrl(null);
          setPreviewDoc(null);
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
        <div className="p-2">
          {previewUrl && getFileType(previewDoc) === 'pdf' && (
            <iframe
              src={previewUrl}
              className="w-full rounded-lg border border-gray-200"
              style={{ height: '80vh' }}
              title="Vista previa del documento"
            />
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
      </Modal>
    </div>
  );
}