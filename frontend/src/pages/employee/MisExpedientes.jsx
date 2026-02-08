'use client';

import { useState } from 'react';
import Modal from '../../components/Modal';

const mockMisExpedientes = [
  { 
    id: 'EXP-2024-0001', 
    tipo: 'Ingreso',
    status: 'activo', 
    fechaCreacion: '2024-01-10', 
    fechaActualizacion: '2024-01-20',
    documentos: [
      { nombre: 'cedula.pdf', tipo: 'Cédula de Identidad', estado: 'aprobado', fecha: '2024-01-10' },
      { nombre: 'titulo.pdf', tipo: 'Título Universitario', estado: 'aprobado', fecha: '2024-01-10' },
      { nombre: 'rif.pdf', tipo: 'RIF', estado: 'aprobado', fecha: '2024-01-12' },
      { nombre: 'antecedentes.pdf', tipo: 'Antecedentes Penales', estado: 'aprobado', fecha: '2024-01-15' },
      { nombre: 'certificado_medico.pdf', tipo: 'Certificado Médico', estado: 'aprobado', fecha: '2024-01-18' }
    ],
    observaciones: 'Expediente completo y aprobado.'
  },
  { 
    id: 'EXP-2024-0010', 
    tipo: 'Actualización de Datos',
    status: 'en_revision', 
    fechaCreacion: '2024-01-22', 
    fechaActualizacion: '2024-01-24',
    documentos: [
      { nombre: 'nuevo_titulo.pdf', tipo: 'Título de Posgrado', estado: 'pendiente', fecha: '2024-01-22' },
      { nombre: 'certificacion.pdf', tipo: 'Certificación Profesional', estado: 'pendiente', fecha: '2024-01-22' }
    ],
    observaciones: ''
  },
  { 
    id: 'EXP-2024-0015', 
    tipo: 'Solicitud de Vacaciones',
    status: 'rechazado', 
    fechaCreacion: '2024-01-18', 
    fechaActualizacion: '2024-01-20',
    documentos: [
      { nombre: 'solicitud_vacaciones.pdf', tipo: 'Formulario de Solicitud', estado: 'rechazado', fecha: '2024-01-18' }
    ],
    observaciones: 'La solicitud debe incluir la firma del supervisor directo. Por favor, vuelva a cargar el documento con la firma requerida.'
  }
];

const statusLabels = {
  activo: { label: 'Aprobado', class: 'badge-success' },
  en_revision: { label: 'En Revisión', class: 'badge-warning' },
  rechazado: { label: 'Rechazado', class: 'badge-danger' },
  cerrado: { label: 'Cerrado', class: 'badge-secondary' }
};

const docStatusLabels = {
  aprobado: { label: 'Aprobado', class: 'badge-success' },
  pendiente: { label: 'Pendiente', class: 'badge-warning' },
  rechazado: { label: 'Rechazado', class: 'badge-danger' }
};

export default function MisExpedientes() {
  const [expedientes] = useState(mockMisExpedientes);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewExpediente = (exp) => {
    setSelectedExpediente(exp);
    setIsModalOpen(true);
  };

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{expedientes.length}</div>
            <div className="stat-label">Mis Expedientes</div>
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
            <div className="stat-value">{expedientes.filter(e => e.status === 'activo').length}</div>
            <div className="stat-label">Aprobados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{expedientes.filter(e => e.status === 'en_revision').length}</div>
            <div className="stat-label">En Revisión</div>
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
            <div className="stat-value">{expedientes.filter(e => e.status === 'rechazado').length}</div>
            <div className="stat-label">Requieren Atención</div>
          </div>
        </div>
      </div>

      {/* Expedientes List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Mis Expedientes</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {expedientes.map(exp => (
            <div key={exp.id} style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '0.75rem', 
              padding: '1.5rem',
              background: exp.status === 'rechazado' ? '#fef2f2' : exp.status === 'en_revision' ? '#fefce8' : 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#2563eb' }}>{exp.id}</span>
                    <span className={`badge ${statusLabels[exp.status].class}`}>
                      {statusLabels[exp.status].label}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>{exp.tipo}</h4>
                  <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Creado: {exp.fechaCreacion} · Actualizado: {exp.fechaActualizacion}
                  </p>
                </div>
                <button className="btn btn-secondary" onClick={() => handleViewExpediente(exp)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Ver Detalles
                </button>
              </div>

              {/* Documentos */}
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#64748b' }}>
                  Documentos ({exp.documentos.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {exp.documentos.map((doc, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ 
                        color: doc.estado === 'aprobado' ? '#10b981' : doc.estado === 'rechazado' ? '#ef4444' : '#f59e0b'
                      }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      {doc.nombre}
                      <span className={`badge ${docStatusLabels[doc.estado].class}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                        {docStatusLabels[doc.estado].label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones si hay rechazo */}
              {exp.status === 'rechazado' && exp.observaciones && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  background: '#fee2e2', 
                  borderRadius: '0.5rem',
                  borderLeft: '4px solid #ef4444'
                }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#991b1b', marginBottom: '0.25rem' }}>
                    Motivo del rechazo:
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#7f1d1d' }}>{exp.observaciones}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* View Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Expediente ${selectedExpediente?.id}`}
        footer={
          <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
            Cerrar
          </button>
        }
      >
        {selectedExpediente && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600' }}>{selectedExpediente.tipo}</h4>
                <span className={`badge ${statusLabels[selectedExpediente.status].class}`}>
                  {statusLabels[selectedExpediente.status].label}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Fecha de Creación</span>
                  <span style={{ fontWeight: '500' }}>{selectedExpediente.fechaCreacion}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Última Actualización</span>
                  <span style={{ fontWeight: '500' }}>{selectedExpediente.fechaActualizacion}</span>
                </div>
              </div>
            </div>

            <h5 style={{ fontWeight: '600', marginBottom: '0.75rem' }}>Documentos</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selectedExpediente.documentos.map((doc, idx) => (
                <div key={idx} className="document-item">
                  <div className="document-icon" style={{ 
                    background: doc.estado === 'aprobado' ? '#d1fae5' : doc.estado === 'rechazado' ? '#fee2e2' : '#fef3c7',
                    color: doc.estado === 'aprobado' ? '#10b981' : doc.estado === 'rechazado' ? '#ef4444' : '#f59e0b'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div className="document-info">
                    <div className="document-name">{doc.nombre}</div>
                    <div className="document-size">{doc.tipo} · {doc.fecha}</div>
                  </div>
                  <span className={`badge ${docStatusLabels[doc.estado].class}`}>
                    {docStatusLabels[doc.estado].label}
                  </span>
                </div>
              ))}
            </div>

            {selectedExpediente.observaciones && (
              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                background: selectedExpediente.status === 'rechazado' ? '#fee2e2' : '#f8fafc', 
                borderRadius: '0.5rem'
              }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Observaciones:</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{selectedExpediente.observaciones}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
