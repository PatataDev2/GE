'use client';

import { useState, useEffect, useCallback } from 'react';
import { markAsRead, markAllAsRead, deleteNotification } from '../../api/notifications.api';
import api from '../../api/axios';
import { logError } from '../../utils/logger';

const tipoConfig = {
  asignado: { 
    color: '#2563eb', 
    bgColor: '#dbeafe',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 7h-9"/>
        <path d="M14 17H5"/>
        <circle cx="17" cy="17" r="3"/>
        <circle cx="7" cy="7" r="3"/>
      </svg>
    )
  },
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
  correccion: { 
    color: '#f97316', 
    bgColor: '#ffedd5',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
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

function formatFecha(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [loading, setLoading] = useState(true);

  const cargarNotificaciones = useCallback(async (signal) => {
    try {
      const res = await api.get('/api/notifications/', { signal });
      setNotificaciones(res.data.results || res.data);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        logError('Error cargando notificaciones:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    cargarNotificaciones(ac.signal);
    return () => ac.abort();
  }, [cargarNotificaciones]);

  const noLeidas = notificaciones.filter(n => !n.read).length;

  const filteredNotificaciones = notificaciones.filter(n => {
    if (filtro === 'todas') return true;
    if (filtro === 'no_leidas') return !n.read;
    return n.notification_type === filtro;
  });

  const handleMarcarComoLeida = async (id) => {
    try {
      await markAsRead(id);
      setNotificaciones(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      logError('Error marcando como leida:', err);
    }
  };

  const handleMarcarTodasComoLeidas = async () => {
    try {
      await markAllAsRead();
      setNotificaciones(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      logError('Error marcando todas como leidas:', err);
    }
  };

  const handleEliminar = async (id) => {
    try {
      await deleteNotification(id);
      setNotificaciones(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      logError('Error eliminando notificacion:', err);
    }
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
            <div className="stat-value">{notificaciones.filter(n => n.notification_type === 'aprobado').length}</div>
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
            <div className="stat-value">{notificaciones.filter(n => n.notification_type === 'rechazado' || n.notification_type === 'correccion').length}</div>
            <div className="stat-label">Requieren Accion</div>
          </div>
        </div>
      </div>

      {/* Filter & Actions */}
      <div className="card">
          <div className="filter-bar mb-0">
          <div className="tabs border-b-0 mb-0">
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
              No Leidas ({noLeidas})
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
          
          <button className="btn btn-secondary" onClick={() => cargarNotificaciones()}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refrescar
          </button>
          {noLeidas > 0 && (
            <button className="btn btn-secondary" onClick={handleMarcarTodasComoLeidas}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Marcar todas como leidas
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="card mt-4">
        {loading ? (
          <div className="empty-state">
            <p>Cargando notificaciones...</p>
          </div>
        ) : filteredNotificaciones.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <h3>No hay notificaciones</h3>
            <p>No tienes notificaciones que coincidan con el filtro seleccionado</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredNotificaciones.map(notif => {
              const config = tipoConfig[notif.notification_type] || tipoConfig.info;
              return (
                  <div 
                    key={notif.id} 
                    className="flex gap-4 p-5 border-b border-slate-200 cursor-pointer transition-colors duration-200"
                    style={{ background: notif.read ? 'white' : '#eff6ff' }}
                    onClick={() => handleMarcarComoLeida(notif.id)}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: config.bgColor, color: config.color }}>
                      {config.icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold flex items-center gap-2">
                          {notif.title}
                          {!notif.read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </h4>
                        <span className="text-xs text-slate-500">{formatFecha(notif.created_at)}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        {notif.message}
                      </p>
                      <div className="flex gap-2 items-center flex-wrap">
                        {notif.expedient_id && (
                          <span className="text-xs font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            EXP-#{notif.expedient_id}
                          </span>
                        )}
                        {notif.actor_username && (
                          <span className="text-xs text-slate-500">
                            Por: {notif.actor_username}
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      className="btn-icon text-slate-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminar(notif.id);
                      }}
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
