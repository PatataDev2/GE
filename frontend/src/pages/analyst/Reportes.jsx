'use client';

import { useState } from 'react';

const mockData = {
  expedientesPorEstado: [
    { estado: 'Activos', cantidad: 45, porcentaje: 60 },
    { estado: 'En Revisión', cantidad: 15, porcentaje: 20 },
    { estado: 'Cerrados', cantidad: 15, porcentaje: 20 }
  ],
  expedientesPorDepartamento: [
    { departamento: 'Recursos Humanos', cantidad: 18 },
    { departamento: 'Contabilidad', cantidad: 12 },
    { departamento: 'Tecnología', cantidad: 15 },
    { departamento: 'Ventas', cantidad: 10 },
    { departamento: 'Marketing', cantidad: 8 },
    { departamento: 'Operaciones', cantidad: 12 }
  ],
  actividadReciente: [
    { mes: 'Enero', creados: 12, aprobados: 10, rechazados: 2 },
    { mes: 'Febrero', creados: 15, aprobados: 13, rechazados: 1 },
    { mes: 'Marzo', creados: 18, aprobados: 15, rechazados: 2 },
    { mes: 'Abril', creados: 10, aprobados: 8, rechazados: 1 },
    { mes: 'Mayo', creados: 20, aprobados: 18, rechazados: 1 }
  ]
};

export default function Reportes() {
  const [tipoReporte, setTipoReporte] = useState('resumen');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const maxDepartamento = Math.max(...mockData.expedientesPorDepartamento.map(d => d.cantidad));

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
            <div className="stat-value">75</div>
            <div className="stat-label">Total Expedientes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="20" x2="12" y2="10"/>
              <line x1="18" y1="20" x2="18" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="16"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">+12%</div>
            <div className="stat-label">Crecimiento Mensual</div>
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
            <div className="stat-value">2.5 días</div>
            <div className="stat-label">Tiempo Promedio Revisión</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">94%</div>
            <div className="stat-label">Tasa de Aprobación</div>
          </div>
        </div>
      </div>

      {/* Filter and Export */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="filter-bar">
          <select 
            className="form-select" 
            style={{ width: 'auto', minWidth: '200px' }}
            value={tipoReporte}
            onChange={(e) => setTipoReporte(e.target.value)}
          >
            <option value="resumen">Resumen General</option>
            <option value="departamento">Por Departamento</option>
            <option value="estado">Por Estado</option>
            <option value="actividad">Actividad Mensual</option>
          </select>
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
          <input
            type="date"
            className="form-input"
            style={{ width: 'auto' }}
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
          <button className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filtrar
          </button>
          <button className="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar PDF
          </button>
          <button className="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Estado de Expedientes */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Expedientes por Estado</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {mockData.expedientesPorEstado.map((item, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>{item.estado}</span>
                  <span style={{ color: '#64748b' }}>{item.cantidad} ({item.porcentaje}%)</span>
                </div>
                <div className="progress-bar" style={{ height: '12px' }}>
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${item.porcentaje}%`,
                      background: idx === 0 ? '#10b981' : idx === 1 ? '#f59e0b' : '#64748b'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Pie chart representation */}
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
              <span style={{ fontSize: '0.875rem' }}>Activos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '2px' }}></div>
              <span style={{ fontSize: '0.875rem' }}>En Revisión</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#64748b', borderRadius: '2px' }}></div>
              <span style={{ fontSize: '0.875rem' }}>Cerrados</span>
            </div>
          </div>
        </div>

        {/* Expedientes por Departamento */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Expedientes por Departamento</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mockData.expedientesPorDepartamento.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ width: '140px', fontSize: '0.875rem', flexShrink: 0 }}>{item.departamento}</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="progress-bar" style={{ flex: 1, height: '20px' }}>
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${(item.cantidad / maxDepartamento) * 100}%`,
                        background: '#2563eb'
                      }}
                    ></div>
                  </div>
                  <span style={{ fontWeight: '600', width: '30px', textAlign: 'right' }}>{item.cantidad}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actividad Mensual */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Actividad Mensual</h3>
        </div>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mes</th>
                <th>Expedientes Creados</th>
                <th>Aprobados</th>
                <th>Rechazados</th>
                <th>Tasa de Aprobación</th>
              </tr>
            </thead>
            <tbody>
              {mockData.actividadReciente.map((item, idx) => {
                const tasaAprobacion = Math.round((item.aprobados / item.creados) * 100);
                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: '500' }}>{item.mes}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-info">{item.creados}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-success">{item.aprobados}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-danger">{item.rechazados}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="progress-bar" style={{ width: '100px', height: '8px' }}>
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${tasaAprobacion}%`,
                              background: tasaAprobacion >= 90 ? '#10b981' : tasaAprobacion >= 70 ? '#f59e0b' : '#ef4444'
                            }}
                          ></div>
                        </div>
                        <span style={{ fontWeight: '500' }}>{tasaAprobacion}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: '#f8fafc', 
          borderRadius: '0.5rem',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>
              {mockData.actividadReciente.reduce((acc, i) => acc + i.creados, 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Creados</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
              {mockData.actividadReciente.reduce((acc, i) => acc + i.aprobados, 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Aprobados</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>
              {mockData.actividadReciente.reduce((acc, i) => acc + i.rechazados, 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Rechazados</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
              {Math.round(
                (mockData.actividadReciente.reduce((acc, i) => acc + i.aprobados, 0) / 
                mockData.actividadReciente.reduce((acc, i) => acc + i.creados, 0)) * 100
              )}%
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Tasa Promedio</div>
          </div>
        </div>
      </div>
    </div>
  );
}
