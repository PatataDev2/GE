'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

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
import SubirDocumentos from './employee/SubirDocumentos';
import Notificaciones from './employee/Notificaciones';

// Mock user data - en producción esto vendría del backend
const getMockUser = () => {
  const storedRole = localStorage.getItem('userRole');
  return {
    id: 1,
    username: 'usuario_demo',
    email: 'demo@empresa.com',
    role: storedRole || 'employee' // admin, analyst, employee
  };
};

const AdminDashboardContent = () => (
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
          <div className="stat-value">24</div>
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
          <div className="stat-value">156</div>
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
          <div className="stat-value">5</div>
          <div className="stat-label">Respaldos Este Mes</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon red">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <div className="stat-value">2</div>
          <div className="stat-label">Alertas Pendientes</div>
        </div>
      </div>
    </div>

    <div className="grid-2">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Actividad Reciente</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { user: 'analista1', action: 'Aprobó expediente EXP-2024-0045', time: 'Hace 5 min' },
            { user: 'admin', action: 'Creó usuario empleado3', time: 'Hace 15 min' },
            { user: 'empleado1', action: 'Subió documento cedula.pdf', time: 'Hace 30 min' },
            { user: 'analista2', action: 'Rechazó expediente EXP-2024-0043', time: 'Hace 1 hora' },
          ].map((item, idx) => (
            <div key={idx} className="activity-item">
              <div className="activity-icon">
                <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{item.user.charAt(0).toUpperCase()}</span>
              </div>
              <div className="activity-content">
                <div className="activity-text"><strong>{item.user}</strong> {item.action}</div>
                <div className="activity-time">{item.time}</div>
              </div>
            </div>
          ))}
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
            <span>Almacenamiento</span>
            <span className="badge badge-success">85% disponible</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Último Respaldo</span>
            <span className="badge badge-info">Hace 12 horas</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>API</span>
            <span className="badge badge-success">Funcionando</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AnalystDashboardContent = () => (
  <div>
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon blue">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div>
          <div className="stat-value">75</div>
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
          <div className="stat-value">8</div>
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
          <div className="stat-value">2</div>
          <div className="stat-label">Rechazados Hoy</div>
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
                <th>Empleado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'EXP-2024-0045', empleado: 'Juan García', status: 'activo' },
                { id: 'EXP-2024-0044', empleado: 'María López', status: 'en_revision' },
                { id: 'EXP-2024-0043', empleado: 'Carlos Pérez', status: 'cerrado' },
              ].map((exp, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'monospace', color: '#2563eb' }}>{exp.id}</td>
                  <td>{exp.empleado}</td>
                  <td>
                    <span className={`badge ${
                      exp.status === 'activo' ? 'badge-success' : 
                      exp.status === 'en_revision' ? 'badge-warning' : 'badge-secondary'
                    }`}>
                      {exp.status === 'activo' ? 'Activo' : exp.status === 'en_revision' ? 'En Revisión' : 'Cerrado'}
                    </span>
                  </td>
                </tr>
              ))}
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
            Validar Expedientes Pendientes (8)
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

const EmployeeDashboardContent = () => (
  <div>
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon blue">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div>
          <div className="stat-value">3</div>
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
          <div className="stat-value">1</div>
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
          <div className="stat-value">1</div>
          <div className="stat-label">En Revisión</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon red">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div>
          <div className="stat-value">2</div>
          <div className="stat-label">Notificaciones</div>
        </div>
      </div>
    </div>

    <div className="grid-2">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Mis Expedientes Recientes</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { id: 'EXP-2024-0001', tipo: 'Ingreso', status: 'activo' },
            { id: 'EXP-2024-0010', tipo: 'Actualización de Datos', status: 'en_revision' },
            { id: 'EXP-2024-0015', tipo: 'Solicitud de Vacaciones', status: 'rechazado' }
          ].map((exp, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.75rem',
              background: '#f8fafc',
              borderRadius: '0.5rem'
            }}>
              <div>
                <span style={{ fontFamily: 'monospace', color: '#2563eb', fontWeight: '500' }}>{exp.id}</span>
                <span style={{ marginLeft: '0.5rem', color: '#64748b' }}>{exp.tipo}</span>
              </div>
              <span className={`badge ${
                exp.status === 'activo' ? 'badge-success' : 
                exp.status === 'en_revision' ? 'badge-warning' : 'badge-danger'
              }`}>
                {exp.status === 'activo' ? 'Aprobado' : exp.status === 'en_revision' ? 'En Revisión' : 'Rechazado'}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Acciones Rápidas</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <a href="/employee/subir-documentos" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Subir Nuevos Documentos
          </a>
          <a href="/employee/mis-expedientes" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Ver Mis Expedientes
          </a>
          <a href="/employee/notificaciones" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Ver Notificaciones (2)
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = getMockUser();
    setUser(userData);
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
  SubirDocumentos,
  Notificaciones
};
