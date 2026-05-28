'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';

// Admin Dashboard imports
import UsersManagement from './admin/UsersManagement';
import ActivityLogs from './admin/ActivityLogs';
import BackupConfig from './admin/BackupConfig';

// Analyst Dashboard imports
import Expedientes from './analyst/Expedientes';
import ValidarExpedientes from './analyst/ValidarExpedientes';
import Reportes from './analyst/Reportes';

// Employee Dashboard imports
import MisExpedientes from './employee/MisExpedientes';
import Notificaciones from './employee/Notificaciones';
// Real user data from API
const roleMap = {
  admin: 'admin', analyst: 'analyst', employee: 'employee',
  Administrador: 'admin', Analista: 'analyst',
  Trabajador: 'employee', Empleado: 'employee',
  'Usuario Normal': 'employee',
};

const fetchUserRole = async () => {
  try {
    const res = await api.get('users/api/v1/me/');
    const role = roleMap[res.data.rol] || 'employee';
    localStorage.setItem('userRole', role);
    return { role };
  } catch {
    const stored = localStorage.getItem('userRole');
    return { role: roleMap[stored] || 'employee' };
  }
};
const timeAgo = (isoString) => {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  return date.toLocaleDateString();
};

const typeLabels = {
  asignado: 'asignó expediente',
  aprobado: 'aprobó expediente',
  rechazado: 'rechazó expediente',
  revision: 'envió a revisión',
  correccion: 'solicitó corrección',
  info: 'informó',
};

const AdminDashboardContent = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('api/admin/dashboard/');
        setStats(res.data);
      } catch (err) {
        setError('Error al cargar estadísticas');
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{stats.active_users}</div>
            <div className="stat-label">Usuarios Activos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{stats.today_actions}</div>
            <div className="stat-label">Acciones Hoy</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{stats.expedients_summary.total}</div>
            <div className="stat-label">Total Expedientes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{stats.expedients_summary.pending}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Actividad Reciente</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.recent_activity.length === 0 ? (
              <div className="text-center text-gray-400 p-4">Sin actividad reciente</div>
            ) : (
              stats.recent_activity.map((item) => (
                <div key={item.id} className="activity-item">
                  <div className="activity-icon">
                    <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{item.actor_username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="activity-content">
                    <div className="activity-text">
                      <strong>{item.actor_username}</strong>{' '}
                      {typeLabels[item.notification_type] || item.notification_type}{' '}
                      {item.expedient_id && <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>#{item.expedient_id}</span>}
                      {item.message && !item.expedient_id && item.message}
                    </div>
                    <div className="activity-time">{timeAgo(item.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Estado del Sistema</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Base de Datos</span>
              <span className="badge badge-success">Operativo</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Total Usuarios</span>
              <span className="badge badge-info">{stats.total_users}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Aprobados</span>
              <span className="badge badge-success">{stats.expedients_summary.approved}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Rechazados</span>
              <span className="badge badge-danger">{stats.expedients_summary.rejected}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const AnalystDashboardContent = () => {
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('api/expedients/');
        setExpedientes(res.data);
      } catch (err) {
        console.error('Error fetching expedientes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const getExpedienteStatus = (exp) => {
    const s = exp?.status;
    if (s === 'Aprobado' || s === 'Finalizado') return 'activo';
    if (s === 'Rechazado') return 'rechazado';
    return 'en_revision';
  };
  const total = expedientes.length;
  const pendientes = expedientes.filter(e => e.status === 'Pendiente').length;
  const aprobados = expedientes.filter(e => e.status === 'Aprobado' || e.status === 'Finalizado').length;
  const rechazados = expedientes.filter(e => e.status === 'Rechazado').length;
  const recientes = [...expedientes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  if (loading) return <div className="p-8 text-center text-gray-400">Cargando dashboard...</div>;
  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{total}</div>
            <div className="stat-label">Total Expedientes</div>
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
            <div className="stat-value">{pendientes}</div>
            <div className="stat-label">Pendientes Validación</div>
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
            <div className="stat-value">{aprobados}</div>
            <div className="stat-label">Aprobados</div>
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
            <div className="stat-value">{rechazados}</div>
            <div className="stat-label">Rechazados</div>
          </div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Expedientes Recientes</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Trabajador</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recientes.length === 0 ? (
                  <tr><td colSpan="3" className="text-center text-gray-400">No hay expedientes</td></tr>
                ) : (
                  recientes.map((exp) => (
                    <tr key={exp.id}>
                      <td style={{ fontFamily: 'monospace', color: '#2563eb' }}>#{exp.id}</td>
                      <td>{exp.asinged_to_username || 'Sin asignar'}</td>
                      <td>
                        <span className={`badge ${
                          getExpedienteStatus(exp) === 'activo' ? 'badge-success' : 
                          getExpedienteStatus(exp) === 'rechazado' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {getExpedienteStatus(exp) === 'activo' ? 'Activo' : 
                           getExpedienteStatus(exp) === 'rechazado' ? 'Rechazado' : 'En Revisión'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Acciones Rápidas</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a href="/analyst/validar" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Validar Expedientes Pendientes ({pendientes})
            </a>
            <a href="/analyst/expedientes" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Ver Todos los Expedientes
            </a>
            <a href="/analyst/reportes" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Generar Reporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
const EmployeeDashboardContent = () => {
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificacionesCount, setNotificacionesCount] = useState(0);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const expRes = await api.get('api/expedients/my/');
        let expData = expRes.data;
        if (expData && typeof expData === 'object' && !Array.isArray(expData)) {
          expData = expData.results || [];
        }
        setExpedientes(Array.isArray(expData) ? expData : []);
      } catch (err) {
        console.error('Error fetching expedients:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalExpedientes = expedientes.length;
  const aprobados = expedientes.filter(e => e.status === 'Aprobado').length;
  const enRevision = expedientes.filter(e => e.status === 'Pendiente' || e.status === 'Proceso').length;
  const rechazados = expedientes.filter(e => e.status === 'Rechazado').length;
  
  const recientes = [...expedientes]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando dashboard...</div>;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{totalExpedientes}</div>
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
            <div className="stat-value">{aprobados}</div>
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
            <div className="stat-value">{enRevision}</div>
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
            <div className="stat-value">{rechazados}</div>
            <div className="stat-label">Rechazados</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Mis Expedientes Recientes</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recientes.length === 0 ? (
              <div className="text-center text-gray-400 p-4">No hay expedientes</div>
            ) : (
              recientes.map((exp, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '0.5rem'
                }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: '500' }}>#{exp.id}</span>
                    <span style={{ marginLeft: '0.5rem', color: '#64748b' }}>{exp.title}</span>
                  </div>
                  <span className={`badge ${
                    exp.status === 'Aprobado' ? 'badge-success' : 
                    exp.status === 'Rechazado' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {exp.status === 'Aprobado' ? 'Aprobado' : exp.status === 'Rechazado' ? 'Rechazado' : 'En Revisión'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
       
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Acciones Rápidas</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a href="/employee/mis-expedientes" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Mis Expedientes
            </a>
            <a href="/employee/mis-expedientes" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Ver Mis Expedientes
            </a>
            <a href="/employee/notificaciones" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Ver Notificaciones
            </a>
            <a href="/employee/gestion-correcciones" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Gestión de Correcciones
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
  fetchUserRole().then(setUser);
}, []);

  return (
    <>
      {user?.role === 'admin' && <AdminDashboardContent />}
      {user?.role === 'analyst' && <AnalystDashboardContent />}
      {user?.role === 'employee' && <EmployeeDashboardContent />}
    </>
  );
}

// Export individual page components for routing
export { 
  UsersManagement, 
  ActivityLogs, 
  BackupConfig,
  Expedientes,
  ValidarExpedientes,
  Reportes,
  MisExpedientes,
  Notificaciones
};
