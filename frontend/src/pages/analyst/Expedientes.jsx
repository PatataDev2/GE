'use client';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import PreviewModal from '../../components/PreviewModal';
import ManejoDocumentos from './ManejoDocumentos'; 
import DocxPreview from './DocxPreview';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logger';
const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;
export default function Expedientes() {
  const { showToast } = useToast();
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [departments, setDepartments] = useState([]);
  const [filterDepartment, setFilterDepartment] = useState('');
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
  const [docxBlob, setDocxBlob] = useState(null);
  const [kebabMenuId, setKebabMenuId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [workers, setWorkers] = useState([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [reassignSubmitting, setReassignSubmitting] = useState(false);
  const [reassignEmployeeId, setReassignEmployeeId] = useState('');
  const fetchExpedientes = async (signal) => {
    setLoading(true);
    try {
      const response = await api.get('api/expedients/', { signal });
      setExpedientes(response.data);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        logError("Error:", err);
      }
    } finally {
      setLoading(false);
    }
  };
  const fetchWorkers = async (signal) => {
    try {
      const res = await api.get('api/users/api/v1/', { signal });
      setWorkers(res.data.filter(u => u.rol === 'employee' && u.is_active));
    } catch (err) {
      if (err.name !== 'CanceledError') {
        logError("Error fetching workers:", err);
      }
    }
  };
  const fetchDepartments = async (signal) => {
    try {
      const res = await api.get('api/departments/', { signal });
      setDepartments(res.data);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        logError("Error fetching departments:", err);
      }
    }
  };
  useEffect(() => { 
    const ac = new AbortController();
    fetchExpedientes(ac.signal); 
    fetchWorkers(ac.signal);
    fetchDepartments(ac.signal);
    return () => ac.abort();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setKebabMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  const fetchDocuments = async (expedientId) => {
    setDocLoading(true);
    setCurrentExpedientId(expedientId);
    setDocuments([]);
    try {
      const res = await api.get(`api/documents/?expedient=${expedientId}`);
      let docs = res.data;
      if (docs && typeof docs === 'object' && !Array.isArray(docs)) {
        docs = docs.results || [];
      }
      const filteredDocs = Array.isArray(docs) ? docs : [];
      setDocuments(filteredDocs);
    } catch (err) {
      logError("Error fetching docs:", err);
      setDocuments([]);
    } finally {
      setDocLoading(false);
    }
  };
  const handleViewDocuments = async (exp) => {
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
  const getExpedienteStatus = (exp) => {
  if (!exp) return 'pendiente';
  const s = exp.status;
  if (s === 'Aprobado' || s === 'Finalizado') return 'activo';
  if (s === 'Pre_Aprobado') return 'pre_aprobado';
  if (s === 'Rechazado') return 'rechazado';
  return 'en_revision';
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
      if (['docx'].includes(ext)) return 'docx';
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
      const res = await api.post(`api/documents/${selectedDoc.id}/review/`, {
        action: reviewAction,
        message: reviewMessage,
        corrections: reviewAction === 'reject' ? reviewMessage : ''
      });
      setShowReviewModal(false);
      await fetchDocuments(selectedExpediente.id);
    } catch (err) {
      logError("Error:", err);
      logError("Response:", err.response);
      showToast('Error al procesar la revisión', 'error');
    } finally {
      setSubmitting(false);
    }
  };
  const openKebabMenu = (expId) => {
    setKebabMenuId(kebabMenuId === expId ? null : expId);
  };
  const handleEditClick = (exp) => {
    setSelectedExpediente(exp);
    setEditForm({ title: exp.title, description: exp.description || '' });
    setShowEditModal(true);
    setKebabMenuId(null);
  };
  const handleEditSubmit = async () => {
    setEditSubmitting(true);
    try {
      await api.patch(`api/expedients/${selectedExpediente.id}/`, {
        title: editForm.title,
        description: editForm.description
      });
      setShowEditModal(false);
      fetchExpedientes();
    } catch (err) {
      logError("Error updating:", err);
      showToast('Error al actualizar el expediente', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };
  const handleReassignClick = (exp) => {
  setSelectedExpediente(exp);
  setReassignEmployeeId('');
  setShowReassignModal(true);
  setKebabMenuId(null);
};
  const handleReassignSubmit = async (newEmployeeId) => {
    setReassignSubmitting(true);
    try {
      await api.patch(`api/expedients/${selectedExpediente.id}/`, {
        asinged_to: newEmployeeId
      });
      setShowReassignModal(false);
      fetchExpedientes();
    } catch (err) {
      logError("Error reassigning:", err);
      showToast('Error al reasignar el expediente', 'error');
    } finally {
      setReassignSubmitting(false);
    }
  };
  const handleHistoryClick = (exp) => {
    getExpedienteStatus(exp);
    setShowHistoryModal(true);
    setKebabMenuId(null);
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const filtered = expedientes.filter(exp => {
    const matchesSearch = exp.title?.toLowerCase().includes(search.toLowerCase()) || exp.id.toString().includes(search);
     const status = getExpedienteStatus(exp);
    const matchesStatus = filterStatus === 'todos' || status === filterStatus;
    const matchesDepartment = !filterDepartment || exp.department == filterDepartment;
    return matchesSearch && matchesStatus && matchesDepartment;
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
          {['todos', 'en_revision', 'activo', 'rechazado'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filterStatus === st ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-gray-700"
        >
          <option value="">Todos los departamentos</option>
          {departments.filter(d => d.is_active !== false).map(dep => (
            <option key={dep.id} value={dep.id}>{dep.name}</option>
          ))}
        </select>
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
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-150 ${
  getExpedienteStatus(exp) === 'activo' ? 'bg-green-500' :
  getExpedienteStatus(exp) === 'pre_aprobado' ? 'bg-purple-500' :
  getExpedienteStatus(exp) === 'rechazado' ? 'bg-red-500' :
  'bg-yellow-500'
}`}></div>
              <div className="flex justify-between items-start mb-4">
               <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
  getExpedienteStatus(exp) === 'activo' ? 'bg-green-50 text-green-600 border-green-100' :
  getExpedienteStatus(exp) === 'pre_aprobado' ? 'bg-purple-50 text-purple-600 border-purple-100' :
  getExpedienteStatus(exp) === 'rechazado' ? 'bg-red-50 text-red-600 border-red-100' :
  'bg-yellow-50 text-yellow-600 border-yellow-100'
}`}>
  {getExpedienteStatus(exp) === 'activo' ? '✓ ACTIVO' :
   getExpedienteStatus(exp) === 'pre_aprobado' ? '⬡ PRE-APROBADO' :
   getExpedienteStatus(exp) === 'rechazado' ? '✗ RECHAZADO' :
   '⏳ REVISIÓN'}
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
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openKebabMenu(exp.id); }}
                    className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                  </button>
                  {kebabMenuId === exp.id && (
                    <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                      <button onClick={() => handleEditClick(exp)} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        <div>
                          <p className="font-semibold">Editar detalles</p>
                          <p className="text-xs text-gray-400">Modificar información</p>
                        </div>
                      </button>
                      <div className="border-t border-gray-100"></div>
                      <button onClick={() => handleReassignClick(exp)} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m0 0l-4 4m4 6H4m0 0l4 4m0-4l-4-4"/></svg>
                        <div>
                          <p className="font-semibold">Reasignar trabajador</p>
                          <p className="text-xs text-gray-400">Cambiar responsable</p>
                        </div>
                      </button>
                      <div className="border-t border-gray-100"></div>
                      <button onClick={() => handleHistoryClick(exp)} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <div>
                          <p className="font-semibold">Ver historial</p>
                          <p className="text-xs text-gray-400">Registro de actividad</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
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
          <div className="flex gap-2 w-full">
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cerrar
            </button>
          </div>
        }
      >
        {selectedExpediente && (
          <div>
            <div className="mb-4 p-4 bg-slate-50 rounded-lg">
              <p><strong>Departamento:</strong> {selectedExpediente.department_name}</p>
              <p><strong>Asignado a:</strong> {selectedExpediente.asinged_to_username || 'No asignado'}</p>
              <p><strong>Descripción:</strong> {selectedExpediente.description || 'Sin descripción'}</p>
            </div>
            
            <h4 className="mb-4 font-semibold">Documentos</h4>
            
            {docLoading ? (
              <div className="p-4 text-center">Cargando documentos...</div>
            ) : documents.length === 0 ? (
              <div className="p-4 text-center text-gray-400">No hay documentos</div>
            ) : (
              <div className="flex flex-col gap-3">
                {documents.map(doc => {
                  const status = getDocStatus(doc);
                  const bgColor = status === 'aprobado' ? '#d1fae5' : status === 'rechazado' ? '#fee2e2' : 'white';
                  const fileUrl = doc.file ? (doc.file.startsWith('http') ? doc.file : `${BASE_API_URL}${doc.file.startsWith('/') ? '' : '/media/'}${doc.file}`) : null;
                  return (
                    <div key={doc.id} className="document-item" style={{ background: bgColor }}>
                      <div className="document-icon">
                        {doc.file && doc.file.toLowerCase().endsWith('.docx') ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                        )}
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
                        {status === 'pendiente' ? (
                          <div className="flex gap-1">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => openReviewModal(doc, 'approve')}
                              title="Aprobar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => openReviewModal(doc, 'reject')}
                              title="Rechazar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </div>
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
            }
            await fetchExpedientes();
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
            {reviewAction === 'reject' ? 'Correcciones requeridas *' : 'Comentario (opcional)'}
          </label>
          <textarea
            className="w-full p-3 border rounded-lg"
            rows="4"
            value={reviewMessage}
            onChange={(e) => setReviewMessage(e.target.value)}
            placeholder={reviewAction === 'reject' ? 'Describe las correcciones que debe hacer el trabajador...' : 'Agregue un comentario (opcional)...'}
          />
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
              className="w-full h-[80vh] rounded-lg border border-gray-200"
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
      {/* Modal Editar Detalles */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Detalles del Expediente"
        footer={
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleEditSubmit} disabled={editSubmitting}>
              {editSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        }
      >
        <div className="p-2">
          <div className="form-group">
            <label className="form-label">Título</label>
            <input
              className="form-input"
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
          </div>
          <div className="form-group mt-4">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-input"
              rows="4"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>
        </div>
      </Modal>
      {/* Modal Reasignar Trabajador */}
      <Modal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        title="Reasignar Expediente"
        footer={
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => setShowReassignModal(false)}>Cancelar</button>
          </div>
        }
      >
        <div className="p-2">
          <p className="mb-2 font-semibold">{selectedExpediente?.title}</p>
          <p className="text-sm text-gray-500 mb-4">Actualmente asignado a: <strong>{selectedExpediente?.asinged_to_username || 'Sin asignar'}</strong></p>
          <div className="form-group">
            <label className="form-label">Asignar a:</label>
           <select 
  className="form-input"
  value={reassignEmployeeId}
  onChange={(e) => setReassignEmployeeId(e.target.value)}
>
              <option value="">Seleccionar trabajador...</option>
              {workers.filter(e => e.is_active).map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.username} ({emp.email})
                </option>
              ))}
            </select>
          </div>
         <button
  className="btn btn-primary w-full mt-4"
  onClick={() => {
    if (reassignEmployeeId) {
      handleReassignSubmit(Number(reassignEmployeeId));
    } else {
      showToast('Selecciona un trabajador', 'error');
    }
  }}
  disabled={reassignSubmitting}
>
  {reassignSubmitting ? 'Reasignando...' : 'Reasignar'}
</button>
        </div>
      </Modal>
      {/* Modal Ver Historial */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title={`Historial: Expediente #${selectedExpediente?.id}`}
        footer={
          <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>Cerrar</button>
        }
      >
        <div className="p-2">
          <div className="timeline flex flex-col gap-5">
            <div className="flex gap-4 items-start">
              <div className="w-[10px] h-[10px] rounded-full bg-blue-600 mt-1 shrink-0"></div>
              <div>
                <p className="font-semibold text-sm">Expediente creado</p>
                <p className="text-xs text-slate-500">{formatDate(selectedExpediente?.created_at)}</p>
                <p className="text-xs text-slate-400">Estado inicial: Pendiente</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-[10px] h-[10px] rounded-full mt-1 shrink-0" style={{ background: selectedExpediente?.status === 'Aprobado' ? '#10b981' : '#f59e0b' }}></div>
              <div>
                <p className="font-semibold text-sm">Estado actual: {selectedExpediente?.status || 'Pendiente'}</p>
                <p className="text-xs text-slate-500">Última actualización: {formatDate(selectedExpediente?.updated_at)}</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-[10px] h-[10px] rounded-full bg-purple-500 mt-1 shrink-0"></div>
              <div>
                <p className="font-semibold text-sm">Asignado a</p>
                <p className="text-xs text-slate-500">{selectedExpediente?.asinged_to_username || 'Sin asignar'}</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-[10px] h-[10px] rounded-full bg-slate-500 mt-1 shrink-0"></div>
              <div>
                <p className="font-semibold text-sm">Departamento</p>
                <p className="text-xs text-slate-500">{selectedExpediente?.department_name || 'Sin departamento'}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 italic">
            Nota: El registro detallado de cambios estará disponible próximamente.
          </p>
        </div>
      </Modal>
    </div>
  );
}