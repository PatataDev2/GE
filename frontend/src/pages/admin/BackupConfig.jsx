'use client';

import { useState } from 'react';
import Modal from '../../components/Modal';

const mockBackups = [
  { id: 1, name: 'backup_20240125_230000.sql', size: '45.2 MB', date: '2024-01-25 23:00:00', type: 'auto', status: 'completado' },
  { id: 2, name: 'backup_20240124_230000.sql', size: '44.8 MB', date: '2024-01-24 23:00:00', type: 'auto', status: 'completado' },
  { id: 3, name: 'backup_20240123_150000.sql', size: '44.1 MB', date: '2024-01-23 15:00:00', type: 'manual', status: 'completado' },
  { id: 4, name: 'backup_20240122_230000.sql', size: '43.9 MB', date: '2024-01-22 23:00:00', type: 'auto', status: 'completado' },
  { id: 5, name: 'backup_20240121_230000.sql', size: '43.5 MB', date: '2024-01-21 23:00:00', type: 'auto', status: 'fallido' },
];

export default function BackupConfig() {
  const [backups, setBackups] = useState(mockBackups);
  const [config, setConfig] = useState({
    enabled: true,
    frequency: 'daily',
    time: '23:00',
    retention: 30,
    includeFiles: true
  });
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  const handleRunBackup = () => {
    setIsBackupRunning(true);
    setBackupProgress(0);
    
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackupRunning(false);
          const newBackup = {
            id: Math.max(...backups.map(b => b.id)) + 1,
            name: `backup_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.sql`,
            size: '45.5 MB',
            date: new Date().toISOString().replace('T', ' ').slice(0, 19),
            type: 'manual',
            status: 'completado'
          };
          setBackups([newBackup, ...backups]);
          return 0;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleDeleteBackup = (id) => {
    setBackups(backups.filter(b => b.id !== id));
  };

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{backups.length}</div>
            <div className="stat-label">Total Respaldos</div>
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
            <div className="stat-value">{backups.filter(b => b.status === 'completado').length}</div>
            <div className="stat-label">Exitosos</div>
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
            <div className="stat-value">23:00</div>
            <div className="stat-label">Próximo Respaldo</div>
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
            <div className="stat-value">{backups.filter(b => b.status === 'fallido').length}</div>
            <div className="stat-label">Fallidos</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Backup Configuration */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Configuración de Respaldos</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsConfigModalOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4"/>
              </svg>
              Configurar
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Respaldos Automáticos</span>
              <span className={`badge ${config.enabled ? 'badge-success' : 'badge-danger'}`}>
                {config.enabled ? 'Activado' : 'Desactivado'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Frecuencia</span>
              <span style={{ fontWeight: '500' }}>
                {config.frequency === 'daily' ? 'Diario' : config.frequency === 'weekly' ? 'Semanal' : 'Mensual'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Hora Programada</span>
              <span style={{ fontWeight: '500' }}>{config.time}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Retención</span>
              <span style={{ fontWeight: '500' }}>{config.retention} días</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>Incluir Archivos</span>
              <span className={`badge ${config.includeFiles ? 'badge-success' : 'badge-secondary'}`}>
                {config.includeFiles ? 'Sí' : 'No'}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={handleRunBackup}
              disabled={isBackupRunning}
            >
              {isBackupRunning ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <line x1="12" y1="2" x2="12" y2="6"/>
                    <line x1="12" y1="18" x2="12" y2="22"/>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                    <line x1="2" y1="12" x2="6" y2="12"/>
                    <line x1="18" y1="12" x2="22" y2="12"/>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                  </svg>
                  Ejecutando Respaldo...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                  Ejecutar Respaldo Ahora
                </>
              )}
            </button>
            
            {isBackupRunning && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Progreso</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{backupProgress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${backupProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Backups */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Respaldos Recientes</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {backups.slice(0, 5).map(backup => (
              <div key={backup.id} className="document-item">
                <div className="document-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                </div>
                <div className="document-info">
                  <div className="document-name">{backup.name}</div>
                  <div className="document-size">
                    {backup.size} · {backup.date} · 
                    <span className={`badge ${backup.type === 'auto' ? 'badge-info' : 'badge-secondary'}`} style={{ marginLeft: '0.5rem' }}>
                      {backup.type === 'auto' ? 'Automático' : 'Manual'}
                    </span>
                  </div>
                </div>
                <div className="action-buttons">
                  <span className={`badge ${backup.status === 'completado' ? 'badge-success' : 'badge-danger'}`}>
                    {backup.status}
                  </span>
                  <button className="btn-icon" title="Descargar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>
                  <button 
                    className="btn-icon" 
                    title="Eliminar"
                    onClick={() => handleDeleteBackup(backup.id)}
                    style={{ color: '#ef4444' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Config Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Configurar Respaldos Automáticos"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsConfigModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={() => setIsConfigModalOpen(false)}>
              Guardar Configuración
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Respaldos Automáticos</label>
          <select
            className="form-select"
            value={config.enabled ? 'true' : 'false'}
            onChange={(e) => setConfig({ ...config, enabled: e.target.value === 'true' })}
          >
            <option value="true">Activado</option>
            <option value="false">Desactivado</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Frecuencia</label>
          <select
            className="form-select"
            value={config.frequency}
            onChange={(e) => setConfig({ ...config, frequency: e.target.value })}
          >
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Hora de Ejecución</label>
          <input
            type="time"
            className="form-input"
            value={config.time}
            onChange={(e) => setConfig({ ...config, time: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Días de Retención</label>
          <input
            type="number"
            className="form-input"
            value={config.retention}
            onChange={(e) => setConfig({ ...config, retention: parseInt(e.target.value) })}
            min="1"
            max="365"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Incluir Archivos Adjuntos</label>
          <select
            className="form-select"
            value={config.includeFiles ? 'true' : 'false'}
            onChange={(e) => setConfig({ ...config, includeFiles: e.target.value === 'true' })}
          >
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>
      </Modal>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
