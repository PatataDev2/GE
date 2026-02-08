'use client';

import { useState } from 'react';
import Modal from '../../components/Modal';

const mockPendientes = [
  { 
    id: 'EXP-2024-0002', 
    empleado: 'María López', 
    cedula: '23456789', 
    departamento: 'Contabilidad',
    fechaSubida: '2024-01-22',
    documentos: [
      { nombre: 'cedula.pdf', tipo: 'Cédula de Identidad', tamaño: '1.2 MB', estado: 'pendiente' },
      { nombre: 'titulo_universitario.pdf', tipo: 'Título Universitario', tamaño: '2.5 MB', estado: 'pendiente' },
      { nombre: 'antecedentes.pdf', tipo: 'Antecedentes Penales', tamaño: '0.8 MB', estado: 'pendiente' }
    ]
  },
  { 
    id: 'EXP-2024-0005', 
    empleado: 'Pedro Sánchez', 
    cedula: '56789012', 
    departamento: 'Marketing',
    fechaSubida: '2024-01-24',
    documentos: [
      { nombre: 'cedula_pedro.pdf', tipo: 'Cédula de Identidad', tamaño: '1.1 MB', estado: 'pendiente' },
      { nombre: 'curriculum.pdf', tipo: 'Currículum Vitae', tamaño: '0.5 MB', estado: 'pendiente' }
    ]
  },
  { 
    id: 'EXP-2024-0007', 
    empleado: 'Sofía Herrera', 
    cedula: '78901234', 
    departamento: 'Recursos Humanos',
    fechaSubida: '2024-01-25',
    documentos: [
      { nombre: 'cedula_sofia.pdf', tipo: 'Cédula de Identidad', tamaño: '1.0 MB', estado: 'pendiente' },
      { nombre: 'rif.pdf', tipo: 'RIF', tamaño: '0.3 MB', estado: 'pendiente' },
      { nombre: 'titulo.pdf', tipo: 'Título Universitario', tamaño: '2.1 MB', estado: 'pendiente' },
      { nombre: 'constancia_trabajo.pdf', tipo: 'Constancia de Trabajo Anterior', tamaño: '0.7 MB', estado: 'pendiente' }
    ]
  }
];

export default function ValidarExpedientes() {
  const [pendientes, setPendientes] = useState(mockPendientes);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comentario, setComentario] = useState('');

  const handleOpenReview = (exp) => {
    setSelectedExpediente({...exp});
    setComentario('');
    setIsModalOpen(true);
  };

  const handleDocumentStatus = (docIndex, status) => {
    const updatedDocs = [...selectedExpediente.documentos];
    updatedDocs[docIndex] = { ...updatedDocs[docIndex], estado: status };
    setSelectedExpediente({ ...selectedExpediente, documentos: updatedDocs });
  };

  const handleAprobar = () => {
    setPendientes(pendientes.filter(p => p.id !== selectedExpediente.id));
    setIsModalOpen(false);
    // Aquí iría la lógica para aprobar el expediente
  };

  const handleRechazar = () => {
    setPendientes(pendientes.filter(p => p.id !== selectedExpediente.id));
    setIsModalOpen(false);
    // Aquí iría la lógica para rechazar el expediente
  };

  const allDocumentsReviewed = selectedExpediente?.documentos.every(d => d.estado !== 'pendiente');
  const hasRejectedDocs = selectedExpediente?.documentos.some(d => d.estado === 'rechazado');

  return (
    <div>
      {/* Stats */}
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
            <div className="stat-value">{pendientes.reduce((acc, p) => acc + p.documentos.length, 0)}</div>
            <div className="stat-label">Documentos por Revisar</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">12</div>
            <div className="stat-label">Aprobados Hoy</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">3</div>
            <div className="stat-label">Rechazados Hoy</div>
          </div>
        </div>
      </div>

      {/* Pending List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Expedientes Pendientes de Validación</h3>
        </div>

        {pendientes.length === 0 ? (
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
                      <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#2563eb' }}>{exp.id}</span>
                      <span className="badge badge-warning">Pendiente de Validación</span>
                    </div>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>{exp.empleado}</h4>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      Cédula: {exp.cedula} · {exp.departamento} · Subido: {exp.fechaSubida}
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

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {exp.documentos.map((doc, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: 'white',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#2563eb' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      {doc.nombre}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Revisar Expediente ${selectedExpediente?.id}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            {allDocumentsReviewed && !hasRejectedDocs && (
              <button className="btn btn-success" onClick={handleAprobar}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Aprobar Expediente
              </button>
            )}
            {allDocumentsReviewed && hasRejectedDocs && (
              <button className="btn btn-danger" onClick={handleRechazar}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Rechazar Expediente
              </button>
            )}
          </>
        }
      >
        {selectedExpediente && (
          <div>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
              <p><strong>Empleado:</strong> {selectedExpediente.empleado}</p>
              <p><strong>Cédula:</strong> {selectedExpediente.cedula}</p>
              <p><strong>Departamento:</strong> {selectedExpediente.departamento}</p>
            </div>

            <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>Documentos a Revisar</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedExpediente.documentos.map((doc, idx) => (
                <div key={idx} className="document-item" style={{ 
                  background: doc.estado === 'aprobado' ? '#d1fae5' : doc.estado === 'rechazado' ? '#fee2e2' : 'white' 
                }}>
                  <div className="document-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="document-info">
                    <div className="document-name">{doc.nombre}</div>
                    <div className="document-size">{doc.tipo} · {doc.tamaño}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {doc.estado === 'pendiente' ? (
                      <>
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleDocumentStatus(idx, 'aprobado')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDocumentStatus(idx, 'rechazado')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </>
                    ) : (
                      <span className={`badge ${doc.estado === 'aprobado' ? 'badge-success' : 'badge-danger'}`}>
                        {doc.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

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
