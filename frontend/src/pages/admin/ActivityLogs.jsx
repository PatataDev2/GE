    import { useState } from 'react';

const mockLogs = [
  { id: 1, user: 'admin1', action: 'Creó usuario', target: 'empleado3', timestamp: '2024-01-25 14:30:22', ip: '192.168.1.100', type: 'create' },
  { id: 2, user: 'analista1', action: 'Aprobó expediente', target: '#EXP-2024-0045', timestamp: '2024-01-25 14:15:10', ip: '192.168.1.105', type: 'approve' },
  { id: 3, user: 'empleado1', action: 'Subió documento', target: 'cedula.pdf', timestamp: '2024-01-25 13:45:00', ip: '192.168.1.110', type: 'upload' },
  { id: 4, user: 'admin1', action: 'Eliminó usuario', target: 'empleado_temp', timestamp: '2024-01-25 12:30:00', ip: '192.168.1.100', type: 'delete' },
  { id: 5, user: 'analista1', action: 'Editó expediente', target: '#EXP-2024-0044', timestamp: '2024-01-25 11:20:15', ip: '192.168.1.105', type: 'edit' },
  { id: 6, user: 'empleado2', action: 'Inició sesión', target: '-', timestamp: '2024-01-25 10:00:00', ip: '192.168.1.115', type: 'login' },
  { id: 7, user: 'admin1', action: 'Cambió rol', target: 'analista2 → admin', timestamp: '2024-01-25 09:30:00', ip: '192.168.1.100', type: 'edit' },
  { id: 8, user: 'analista1', action: 'Rechazó expediente', target: '#EXP-2024-0043', timestamp: '2024-01-24 16:45:00', ip: '192.168.1.105', type: 'reject' },
  { id: 9, user: 'empleado1', action: 'Cerró sesión', target: '-', timestamp: '2024-01-24 18:00:00', ip: '192.168.1.110', type: 'logout' },
  { id: 10, user: 'admin1', action: 'Ejecutó respaldo', target: 'backup_20240124.sql', timestamp: '2024-01-24 23:00:00', ip: '192.168.1.100', type: 'backup' },
];

const actionTypes = {
  create: { label: 'Creación', color: 'badge-success' },
  edit: { label: 'Edición', color: 'badge-info' },
  delete: { label: 'Eliminación', color: 'badge-danger' },
  approve: { label: 'Aprobación', color: 'badge-success' },
  reject: { label: 'Rechazo', color: 'badge-warning' },
  upload: { label: 'Subida', color: 'badge-info' },
  login: { label: 'Sesión', color: 'badge-secondary' },
  logout: { label: 'Sesión', color: 'badge-secondary' },
  backup: { label: 'Respaldo', color: 'badge-info' }
};

export default function ActivityLogs() {
  const [logs] = useState(mockLogs);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(search.toLowerCase()) ||
                          log.action.toLowerCase().includes(search.toLowerCase()) ||
                          log.target.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || log.type === filterType;
    return matchesSearch && matchesType;
  });

  const getActionIcon = (type) => {
    switch (type) {
      case 'create':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        );
      case 'edit':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        );
      case 'delete':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        );
      case 'approve':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        );
      case 'reject':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        );
      case 'upload':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        );
      case 'login':
      case 'logout':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
        );
      case 'backup':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{logs.length}</div>
            <div className="stat-label">Total Acciones</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{logs.filter(l => l.type === 'approve').length}</div>
            <div className="stat-label">Aprobaciones</div>
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
            <div className="stat-value">{logs.filter(l => l.type === 'edit' || l.type === 'create').length}</div>
            <div className="stat-label">Modificaciones</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{logs.filter(l => l.type === 'delete').length}</div>
            <div className="stat-label">Eliminaciones</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card">
        <div className="filter-bar">
          <div className="search-input" style={{ flex: 1 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Buscar por usuario, acción o objetivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <select 
            className="form-select" 
            style={{ width: 'auto', minWidth: '150px' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Todas las acciones</option>
            <option value="create">Creación</option>
            <option value="edit">Edición</option>
            <option value="delete">Eliminación</option>
            <option value="approve">Aprobación</option>
            <option value="reject">Rechazo</option>
            <option value="upload">Subida</option>
            <option value="login">Inicio de sesión</option>
            <option value="backup">Respaldo</option>
          </select>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="Desde"
          />
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="Hasta"
          />
          <button className="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar
          </button>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Objetivo</th>
                <th>Tipo</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.timestamp}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%', 
                        background: '#e2e8f0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {log.user.charAt(0).toUpperCase()}
                      </div>
                      {log.user}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#64748b' }}>{getActionIcon(log.type)}</span>
                      {log.action}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.target}</td>
                  <td>
                    <span className={`badge ${actionTypes[log.type]?.color || 'badge-secondary'}`}>
                      {actionTypes[log.type]?.label || log.type}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
