'use client';

import { useState, useEffect, useRef } from 'react';
import Modal from '../../components/Modal';
import api from '../../api/axios';

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

export default function GestionCorrecciones() {
  const [corrections, setCorrections] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [replacingFile, setReplacingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sendingToReview, setSendingToReview] = useState(false);
  const [checklistStatus, setChecklistStatus] = useState({ complete: false, missing: [] });
  
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [corrRes, draftsRes, typesRes] = await Promise.all([
        api.get('api/expedients/corrections_needed/'),
        api.get('api/expedients/my_drafts/'),
        api.get('api/document-types/')
      ]);
      setCorrections(corrRes.data || []);
      setDrafts(draftsRes.data || []);
      let types = typesRes.data;
      if (types && typeof types === 'object' && !Array.isArray(types)) {
        types = types.results || [];
      }
      setDocTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenReplaceModal = (correction) => {
    setSelectedCorrection(correction);
    setReplacingFile(null);
    setShowReplaceModal(true);
  };

  const handleOpenDraftModal = (draft) => {
    setSelectedDraft(draft);
    setShowDraftModal(true);
  };

  const handleOpenChecklist = async (draft) => {
    setSelectedDraft(draft);
    try {
      const [docsRes] = await Promise.all([
        api.get(`api/documents/?expedient=${draft.id}`)
      ]);
      let docs = docsRes.data;
      if (docs && typeof docs === 'object' && !Array.isArray(docs)) {
        docs = docs.results || [];
      }
      const uploadedTypeIds = new Set(
        (Array.isArray(docs) ? docs : [])
          .filter(d => d.document_type)
          .map(d => d.document_type)
      );
      const requiredTypes = (Array.isArray(docTypes) ? docTypes : []).filter(t => t.is_required);
      const missing = requiredTypes.filter(t => !uploadedTypeIds.has(t.id));
      setChecklistStatus({
        complete: missing.length === 0,
        missing,
        uploaded: docs || []
      });
      setShowChecklistModal(true);
    } catch (err) {
      console.error('Error checking documents:', err);
    }
  };

  const handleReplaceFile = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file) {
      alert('Selecciona un archivo para reemplazar');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`api/documents/${selectedCorrection.id}/replace_file/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Archivo reemplazado exitosamente. El documento vuelve a estado Pendiente.');
      setShowReplaceModal(false);
      fetchData();
    } catch (err) {
      console.error('Error replacing file:', err);
      alert('Error al reemplazar archivo: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSendToReview = async () => {
    if (!selectedDraft) return;

    setSendingToReview(true);
    try {
      await api.post(`api/expedients/${selectedDraft.id}/send_to_review/`);
      alert('Expediente enviado a revision exitosamente!');
      setShowChecklistModal(false);
      setShowDraftModal(false);
      fetchData();
    } catch (err) {
      console.error('Error sending to review:', err);
      if (err.response?.data?.missing_documents) {
        alert('No se puede enviar: faltan documentos obligatorios');
      } else {
        alert('Error al enviar a revision');
      }
    } finally {
      setSendingToReview(false);
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
        <h2 className="text-2xl font-bold text-gray-900">Gestion de Correcciones</h2>
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
            <div className="stat-label">Atencion Requerida</div>
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
                <h3 className="card-title" style={{ color: '#ef4444' }}>
                  Atencion Requerida
                </h3>
                <span className="badge badge-danger">{correctionsCount} documentos</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {corrections.map(doc => (
                  <div key={doc.id} style={{
                    padding: '1rem',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '0.75rem',
                    borderLeft: '4px solid #ef4444'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#2563eb' }}>#{doc.expedient_id}</span>
                          <span className="badge badge-danger">Rechazado</span>
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{doc.title}</h4>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          Expediente: {doc.expedient_title} | Tipo: {doc.document_type}
                        </p>
                        {doc.corrections && (
                          <div style={{
                            marginTop: '0.5rem',
                            padding: '0.75rem',
                            background: 'white',
                            borderRadius: '0.5rem',
                            border: '1px solid #fecaca'
                          }}>
                            <strong style={{ color: '#ef4444', fontSize: '0.875rem' }}>Correcciones requeridas:</strong>
                            <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#374151' }}>{doc.corrections}</p>
                          </div>
                        )}
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                          Subido: {formatDate(doc.uploaded_at)}
                        </p>
                      </div>
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
                ))}
              </div>
            </div>
          )}

          {draftsCount > 0 ? (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ color: '#f59e0b' }}>
                  Borradores
                </h3>
                <span className="badge badge-warning">{draftsCount} borradores</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {drafts.map(draft => (
                  <div key={draft.id} style={{
                    padding: '1rem',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '0.75rem',
                    borderLeft: '4px solid #f59e0b'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#2563eb' }}>#{draft.id}</span>
                          <span className="badge badge-warning">Borrador</span>
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{draft.title}</h4>
                        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                          Departamento: {draft.department_name || 'No especificado'}
                        </p>
                        {draft.description && (
                          <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.25rem' }}>{draft.description}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={() => handleOpenChecklist(draft)}>
                          Checklist
                        </button>
                        <button className="btn btn-primary" onClick={() => handleOpenDraftModal(draft)}>
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
            <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: '0.5rem', marginBottom: '1rem' }}>
              <p><strong>Documento:</strong> {selectedCorrection.title}</p>
              <p><strong>Expediente:</strong> #{selectedCorrection.expedient_id} - {selectedCorrection.expedient_title}</p>
              {selectedCorrection.corrections && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong style={{ color: '#ef4444' }}>Correcciones del analista:</strong>
                  <p style={{ marginTop: '0.25rem' }}>{selectedCorrection.corrections}</p>
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
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
              Al reemplazar el archivo, el documento volvera a estado <strong>Pendiente</strong> para revision.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showDraftModal}
        onClose={() => setShowDraftModal(false)}
        title={`Borrador #${selectedDraft?.id} - ${selectedDraft?.title}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDraftModal(false)}>Cerrar</button>
            <button className="btn btn-primary" onClick={() => { setShowDraftModal(false); handleOpenChecklist(selectedDraft); }}>
              Ver Checklist y Enviar
            </button>
          </>
        }
      >
        {selectedDraft && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <span className="badge badge-warning">Borrador</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <strong>Departamento:</strong> {selectedDraft.department_name || 'No especificado'}
              </div>
              <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <strong>Descripcion:</strong> {selectedDraft.description || 'Sin descripcion'}
              </div>
              <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <strong>Creado:</strong> {formatDate(selectedDraft.created_at)}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showChecklistModal}
        onClose={() => setShowChecklistModal(false)}
        title={`Checklist: Expediente #${selectedDraft?.id}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowChecklistModal(false)}>Cerrar</button>
            <button
              className="btn btn-success"
              onClick={handleSendToReview}
              disabled={sendingToReview || !checklistStatus.complete}
              style={{ opacity: checklistStatus.complete ? 1 : 0.5 }}
            >
              {sendingToReview ? 'Enviando...' : 'Enviar a Revision'}
            </button>
          </>
        }
      >
        {selectedDraft && (
          <div>
            <p style={{ marginBottom: '1rem', color: '#64748b' }}>
              Verifica que hayas subido todos los documentos obligatorios antes de enviar a revision.
            </p>

            {checklistStatus.missing.length > 0 && (
              <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                <strong style={{ color: '#ef4444' }}>Documentos faltantes:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', margin: 0 }}>
                  {checklistStatus.missing.map(doc => (
                    <li key={doc.id} style={{ color: '#374151', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      {doc.name} {doc.description && <span style={{ color: '#64748b' }}>({doc.description})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {docTypes.filter(t => t.is_required).map(type => {
                const isUploaded = checklistStatus.uploaded?.some(d => d.document_type === type.id);
                return (
                  <div key={type.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: isUploaded ? '#d1fae5' : '#fef2f2',
                    borderRadius: '0.5rem',
                    border: `1px solid ${isUploaded ? '#6ee7b7' : '#fecaca'}`
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: isUploaded ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isUploaded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.875rem' }}>{type.name}</strong>
                      {type.description && <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{type.description}</p>}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: isUploaded ? '#10b981' : '#ef4444' }}>
                      {isUploaded ? 'Subido' : 'Faltante'}
                    </span>
                  </div>
                );
              })}
            </div>

            {checklistStatus.complete && (
              <p style={{ marginTop: '1rem', textAlign: 'center', color: '#10b981', fontWeight: '600' }}>
                Todos los documentos obligatorios estan completos. Puedes enviar a revision.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
