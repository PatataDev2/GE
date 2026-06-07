import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logger';

export default function BackupConfig() {
  const { showToast } = useToast();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [config, setConfig] = useState({
    enabled: true, frequency: 'daily', time: '23:00', retention: 30, includeFiles: true
  });

  useEffect(() => {
    const ac = new AbortController();
    async function fetchBackups() {
      setLoading(true);
      try {
        const res = await api.get('api/admin/backups/', { signal: ac.signal });
        setBackups(res.data);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          logError('Error fetching backups:', err);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchBackups();
    return () => ac.abort();
  }, []);

  const handleRunBackup = async () => {
    setIsBackupRunning(true);
    try {
      const res = await api.post('api/admin/backups/');
      setBackups(prev => [res.data, ...prev]);
    } catch (err) {
      logError('Error creating backup:', err);
      showToast('Error al crear respaldo', 'error');
    } finally {
      setIsBackupRunning(false);
    }
  };

  const handleDeleteBackup = async (backup) => {
    if (!confirm(`¿Eliminar respaldo "${backup.name}"?`)) return;
    try {
      await api.delete(`api/admin/backups/${backup.name}/`);
      setBackups(prev => prev.filter(b => b.id !== backup.id));
    } catch (err) {
      logError('Error deleting backup:', err);
      showToast('Error al eliminar respaldo', 'error');
    }
  };

  const handleDownloadBackup = async (backup) => {
    try {
      const res = await api.get(`api/admin/backups/${backup.name}/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.download = backup.name;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      logError('Error downloading backup:', err);
      showToast('Error al descargar respaldo', 'error');
    }
  };

  const handleRestoreBackup = async (backup) => {
    if (!confirm(`¿Restaurar desde "${backup.name}"? Esto reemplazará TODOS los datos actuales.`)) return;
    if (!confirm('¿Estás SEGURO? Esta acción NO se puede deshacer.')) return;
    setRestoring(backup.name);
    try {
      await api.post(`api/admin/backups/${backup.name}/`);
      showToast('Datos restaurados exitosamente', 'success');
    } catch (err) {
      logError('Error restoring backup:', err);
      showToast('Error al restaurar: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setRestoring(null);
    }
  };

  const completedCount = backups.filter(b => b.status === 'completado').length;
  const failedCount = backups.filter(b => b.status === 'fallido').length;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          </div>
          <div>
            <div className="stat-value">{backups.length}</div>
            <div className="stat-label">Total Respaldos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div>
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">Exitosos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div className="stat-value">{backups.length > 0 ? backups[0]?.date?.slice(0, 10) || '—' : '—'}</div>
            <div className="stat-label">Último Respaldo</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div>
            <div className="stat-value">{failedCount}</div>
            <div className="stat-label">Fallidos</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Gestión de Respaldos</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Respaldos Automáticos</span>
              <span className={`badge ${config.enabled ? 'badge-success' : 'badge-danger'}`}>
                {config.enabled ? 'Activado' : 'Desactivado'}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Frecuencia</span>
              <span className="font-medium">
                {config.frequency === 'daily' ? 'Diario' : config.frequency === 'weekly' ? 'Semanal' : 'Mensual'}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Hora Programada</span>
              <span className="font-medium">{config.time}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Retención</span>
              <span className="font-medium">{config.retention} días</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Incluir Archivos</span>
              <span className={`badge ${config.includeFiles ? 'badge-success' : 'badge-secondary'}`}>
                {config.includeFiles ? 'Sí' : 'No'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              className="btn btn-primary w-full"
              onClick={handleRunBackup}
              disabled={isBackupRunning}
            >
              {isBackupRunning ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                    <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
                  </svg>
                  Ejecutando Respaldo...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                  Ejecutar Respaldo Ahora
                </>
              )}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Respaldos Recientes</h3>
          </div>

          {loading ? (
            <div className="p-4 text-center text-gray-400">Cargando...</div>
          ) : backups.length === 0 ? (
            <div className="p-4 text-center text-gray-400">No hay respaldos aún</div>
          ) : (
            <div className="flex flex-col gap-2">
              {backups.slice(0, 10).map(backup => (
                <div key={backup.id} className="document-item">
                  <div className="document-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                    </svg>
                  </div>
                  <div className="document-info">
                    <div className="document-name">{backup.name}</div>
                    <div className="document-size">
                      {backup.size} · {backup.date} ·
                      <span className={`badge ${backup.type === 'auto' ? 'badge-info' : 'badge-secondary'} ml-2`}>
                        {backup.type === 'auto' ? 'Automático' : 'Manual'}
                      </span>
                    </div>
                  </div>
                  <div className="action-buttons">
                    <span className={`badge ${backup.status === 'completado' ? 'badge-success' : 'badge-danger'}`}>
                      {backup.status}
                    </span>
                    <button className="btn-icon" title="Descargar" onClick={() => handleDownloadBackup(backup)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                    <button className="btn-icon text-amber-500" title="Restaurar" onClick={() => handleRestoreBackup(backup)} disabled={restoring === backup.name}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                      </svg>
                    </button>
                    <button className="btn-icon text-red-500" title="Eliminar" onClick={() => handleDeleteBackup(backup)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
