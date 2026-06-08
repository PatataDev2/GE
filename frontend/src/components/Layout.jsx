'use client';

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { getNotifications, getUnreadCount, markAllAsRead } from '../api/notifications.api';
import { logError } from '../utils/logger';
import api from '../api/users.api';

// Icon components
const Icons = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Folder: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  FileText: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Activity: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Bell: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  LogOut: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  BarChart: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10"/>
      <line x1="18" y1="20" x2="18" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="16"/>
    </svg>
  ),
  Database: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  ClipboardList: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <path d="M9 14l2 2 4-4"/>
    </svg>
  ),
  Edit: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
};

const getMenuItems = (role) => {
  const commonItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Icons.Dashboard }
  ];

  switch (role) {
     case 'admin':
        return [
          ...commonItems,
          { path: '/admin/aprobar-expedientes', label: 'Aprobar Expedientes', icon: Icons.CheckCircle },
          { path: '/admin/solicitar-expediente', label: 'Solicitar Expediente', icon: Icons.Upload },
          { path: '/admin/pendientes', label: 'Documentos Pendientes', icon: Icons.ClipboardList },
          { path: '/admin/users', label: 'Gestión de Usuarios', icon: Icons.Users },
          { path: '/admin/departments', label: 'Gestión de Departamentos', icon: Icons.Folder },
          { path: '/admin/document-types', label: 'Gestión de Tipos de Documento', icon: Icons.FileText },
          { path: '/admin/logs', label: 'Registro de Actividad', icon: Icons.Activity },
          { path: '/admin/backup', label: 'Respaldos', icon: Icons.Database },
          { path: '/admin/notificaciones', label: 'Notificaciones', icon: Icons.Bell }
        ];
     case 'analyst':
        return [
          ...commonItems,
          { path: '/analyst/expedientes', label: 'Expedientes', icon: Icons.Folder },
          { path: '/analyst/validar', label: 'Validar Expedientes', icon: Icons.CheckCircle },
          { path: '/analyst/pendientes', label: 'Documentos Pendientes', icon: Icons.ClipboardList },
          { path: '/analyst/reportes', label: 'Reportes', icon: Icons.BarChart },
          { path: '/analyst/notificaciones', label: 'Notificaciones', icon: Icons.Bell }
        ];
    case 'recepcionista':
      return [
        ...commonItems,
        { path: '/recepcionista/mis-expedientes', label: 'Mis Expedientes', icon: Icons.Folder },
        { path: '/recepcionista/gestion-correcciones', label: 'Gestión de Correcciones', icon: Icons.Activity },
        { path: '/recepcionista/notificaciones', label: 'Notificaciones', icon: Icons.Bell }
      ];
    case 'user':
      return [
        ...commonItems,
        { path: '/user/profile', label: 'Mi Perfil', icon: Icons.Settings },
        { path: '/user/expedientes', label: 'Mis Expedientes', icon: Icons.Folder }
      ];
    default:
      return commonItems;
  }
};

const getRoleName = (role) => {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'analyst': return 'Analista';
    case 'recepcionista': return 'Recepcionista';
    case 'user': return 'Usuario Normal';
    default: return 'Usuario';
  }
};

export default function Layout({ children, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);
  
  const notifRoute = user?.role === 'admin' ? '/admin/notificaciones' : user?.role === 'analyst' ? '/analyst/notificaciones' : '/recepcionista/notificaciones';
  const menuItems = getMenuItems(user?.role);
  
  const handleLogout = async () => {
    try {
      await api.post('users/api/v1/logout/');
    } catch {
      // Proceed with logout even if API call fails
    }
    navigate('/login');
  };

  useEffect(() => {
    if (!user?.role) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await getUnreadCount();
        setUnreadCount(res.data.count);
      } catch (err) {
        logError('Error fetching unread count:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    if (!showNotifications) return;
    const ac = new AbortController();

    const fetchNotifications = async () => {
      setNotifLoading(true);
      try {
        const res = await getNotifications({ signal: ac.signal });
        setNotifications((res.data.results || res.data).slice(0, 10));
      } catch (err) {
        if (err.name !== 'CanceledError') {
          logError('Error fetching notifications:', err);
        }
      } finally {
        setNotifLoading(false);
      }
    };

    fetchNotifications();
    return () => ac.abort();
  }, [showNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      logError('Error marking all read:', err);
    }
  };

  function formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Ahora mismo';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHr < 24) return `Hace ${diffHr} hora${diffHr > 1 ? 's' : ''}`;
    if (diffDay < 7) return `Hace ${diffDay} dia${diffDay > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  const tipoConfig = {
    asignado: { color: '#2563eb', icon: Icons.Users },
    aprobado: { color: '#10b981', icon: Icons.CheckCircle },
    rechazado: { color: '#ef4444', icon: Icons.X },
    revision: { color: '#f59e0b', icon: Icons.ClipboardList },
    correccion: { color: '#f97316', icon: Icons.Edit },
    info: { color: '#64748b', icon: Icons.AlertCircle },
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo flex justify-center">
          <img 
            src="/logo.jpg" 
            alt="Expedientes App" 
            className="w-16 h-16 rounded-lg mb-2"
          />
          <div className="text-center">
            <span className="ml-2">ExpedientesApp</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon />
              {item.label}
            </Link>
          ))}
        </nav>
        
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="sidebar-user-name">{user?.username || 'Usuario'}</div>
              <div className="sidebar-user-role">{getRoleName(user?.role)}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="sidebar-link mt-4 w-full border-0 cursor-pointer bg-white/10"
          >
            <Icons.LogOut />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h1 className="header-title">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h1>
          <div className="header-actions">
            <div className="relative" ref={notifRef}>
              <button 
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Icons.Bell />
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="dropdown-panel">
                  <div className="dropdown-header flex justify-between items-center">
                    <span>Notificaciones</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-600 bg-transparent border-0 cursor-pointer">
                        Marcar todas como leidas
                      </button>
                    )}
                  </div>
                  {notifLoading ? (
                    <div className="p-4 text-center text-slate-400">Cargando...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      No hay notificaciones
                    </div>
                  ) : (
                    notifications.map(notif => {
                      const config = tipoConfig[notif.notification_type] || tipoConfig.info;
                      const NotifIcon = config.icon;
                      return (
                        <Link
                          key={notif.id}
                          to={notifRoute}
                          onClick={() => setShowNotifications(false)}
                          className={`notification-item ${!notif.read ? 'unread' : ''} flex gap-3 p-3 border-b border-slate-100`}
                          style={{ background: !notif.read ? '#eff6ff' : 'white' }}
                        >
                          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: config.color + '20', color: config.color }}>
                            <NotifIcon />
                          </div>
                          <div className="notification-content flex-1 min-w-0">
                            <div className={"notification-title text-xs text-slate-800 " + (!notif.read ? 'font-bold' : 'font-semibold')}>{notif.title}</div>
                            <div className="notification-text text-xs text-slate-500 mt-0.5 truncate">{notif.message}</div>
                            <div className="notification-time text-xs text-slate-400 mt-1">{formatTime(notif.created_at)}</div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                  <div className="p-2 text-center border-t border-slate-200">
                    <Link
                      to={notifRoute}
                      className="text-xs text-blue-600 no-underline"
                      onClick={() => setShowNotifications(false)}
                    >
                      Ver todas las notificaciones
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  user: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
  }),
};
