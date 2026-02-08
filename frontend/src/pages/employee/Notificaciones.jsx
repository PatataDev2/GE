'use client';

import { useState } from 'react';

const mockNotificaciones = [
  {
    id: 1,
    tipo: 'aprobado',
    titulo: 'Expediente Aprobado',
    mensaje: 'Tu expediente EXP-2024-0001 (Ingreso) ha sido aprobado exitosamente.',
    expedienteId: 'EXP-2024-0001',
    fecha: '2024-01-20 14:30',
    leida: false
  },
  {
    id: 2,
    tipo: 'rechazado',
    titulo: 'Documento Rechazado',
    mensaje: 'El documento "solicitud_vacaciones.pdf" del expediente EXP-2024-0015 ha sido rechazado. Motivo: Falta la firma del supervisor.',
    expedienteId: 'EXP-2024-0015',
    fecha: '2024-01-20 10:15',
    leida: false
  },
  {
    id: 3,
    tipo: 'revision',
    titulo: 'Expediente en Revisión',
    mensaje: 'Tu expediente EXP-2024-0010 (Actualización de Datos) está siendo revisado por el analista.',
    expedienteId: 'EXP-2024-0010',
    fecha: '2024-01-22 09:00',
    leida: true
  },
  {
    id: 4,
    tipo: 'recordatorio',
    titulo: 'Recordatorio: Documentos Pendientes',
    mensaje: 'Tienes documentos pendientes por corregir en el expediente EXP-2024-0015.',
    expedienteId: 'EXP-2024-0015',
    fecha: '2024-01-21 08:00',
    leida: true
  },
  {
    id: 5,
    tipo: 'info',
    titulo: 'Actualización del Sistema',
    mensaje: 'El sistema estará en mantenimiento el próximo domingo de 2:00 AM a 6:00 AM.',
    expedienteId: null,
    fecha: '2024-01-19 15:00',
    leida: true
  }
];

const tipoConfig = {
  aprobado: { 
    color: '#10b981', 
    bgColor: '#d1fae5',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    )
  },
  rechazado: { 
    color: '#ef4444', 
    bgColor: '#fee2e2',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    )
  },
  revision: { 
    color: '#f59e0b', 
    bgColor: '#fef3c7',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    )
  },
  recordatorio: { 
    color: '#2563eb', 
    bgColor: '#dbeafe',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    )
  },
  info: { 
    color: '#64748b', 
    bgColor: '#f1f5f9',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    )
  }
};

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState(mockNotificaciones);
  const [filtro, setFiltro] = useState('todas');

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  const filteredNotificaciones = notificaciones.filter(n => {
    if (filtro === 'todas') return true;
    if (filtro === 'no_leidas') return !n.leida;
    return n.tipo === filtro;
  });

  const marcarComoLeida = (id) => {
    setNotificaciones(notificaciones.map(n => 
      n.id === id ? { ...n, leida: true } : n
    ));
  };

  const marcarTodasComoLeidas = () => {
    setNotificaciones(notificaciones.map(n => ({ ...n, leida: true })));
  };

  const eliminarNotificacion = (id) => {
    setNotificaciones(notificaciones.filter(n => n.id !== id));
  };

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{notificaciones.length}</div>
            <div className="stat-label">Total Notificaciones</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{noLeidas}</div>
            <div className="stat-label">Sin Leer</div>
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
            <div className="stat-value">{notificaciones.filter(n => n.tipo === 'aprobado').length}</div>
            <div className="stat-label">Aprobaciones</div>
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
            <div className="stat-value">{notificaciones.filter(n => n.tipo === 'rechazado').length}</div>
            <div className="stat-label">Requieren Acción</div>
          </div>
        </div>
      </div>

      {/* Filter & Actions */}
      <div className="card">
        <div className="filter-bar" style={{ marginBottom: '0' }}>
          <div className="tabs" style={{ borderBottom: 'none', marginBottom: '0' }}>
            <button 
              className={`tab ${filtro === 'todas' ? 'active' : ''}`}
              onClick={() => setFiltro('todas')}
            >
              Todas
            </button>
            <button 
              className={`tab ${filtro === 'no_leidas' ? 'active' : ''}`}
              onClick={() => setFiltro('no_leidas')}
            >
              No Leídas ({noLeidas})
            </button>
            <button 
              className={`tab ${filtro === 'aprobado' ? 'active' : ''}`}
              onClick={() => setFiltro('aprobado')}
            >
              Aprobaciones
            </button>
            <button 
              className={`tab ${filtro === 'rechazado' ? 'active' : ''}`}
              onClick={() => setFiltro('rechazado')}
            >
              Rechazos
            </button>
          </div>
          
          {noLeidas > 0 && (
            <button className="btn btn-secondary" onClick={marcarTodasComoLeidas}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="card" style={{ marginTop: '1rem' }}>
        {filteredNotificaciones.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <h3>No hay notificaciones</h3>
            <p>No tienes notificaciones que coincidan con el filtro seleccionado</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredNotificaciones.map(notif => {
              const config = tipoConfig[notif.tipo];
              return (
                <div 
                  key={notif.id} 
                  style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    padding: '1.25rem',
                    borderBottom: '1px solid #e2e8f0',
                    background: notif.leida ? 'white' : '#eff6ff',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => marcarComoLeida(notif.id)}
                >
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    background: config.bgColor,
                    color: config.color,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {config.icon}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <h4 style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {notif.titulo}
                        {!notif.leida && (
                          <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            background: '#2563eb', 
                            borderRadius: '50%' 
                          }}></span>
                        )}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{notif.fecha}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                      {notif.mensaje}
                    </p>
                    {notif.expedienteId && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontFamily: 'monospace', 
                        color: '#2563eb',
                        background: '#dbeafe',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem'
                      }}>
                        {notif.expedienteId}
                      </span>
                    )}
                  </div>

                  <button 
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminarNotificacion(notif.id);
                    }}
                    style={{ color: '#64748b' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
