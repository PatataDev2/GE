'use client';
import { useState, useEffect } from 'react';
import api from '../../api/axios';
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const STATUS_MAP = {
  'Aprobado': 'Activos',
  'Finalizado': 'Activos',
  'Pendiente': 'En Revisi\u00f3n',
  'Proceso': 'En Revisi\u00f3n',
  'Rechazado': 'Cerrados'
};
export default function Reportes() {
  const [tipoReporte, setTipoReporte] = useState('resumen');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [expedientes, setExpedientes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [expRes, docRes, deptRes] = await Promise.all([
          api.get('api/expedients/'),
          api.get('api/documents/'),
          api.get('api/departments/')
        ]);
        setExpedientes(expRes.data);
        setDocuments(docRes.data);
        setDepartments(deptRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const [filterFeedback, setFilterFeedback] = useState('');

  const handleFilter = () => {
    setFilterFeedback('Filtrado aplicado: ' + filteredExpedientes.length + ' expedientes');
    setTimeout(function() { setFilterFeedback(''); }, 3000);
  };

  const handleExportPDF = () => {
    var html = '';
    html += '<!DOCTYPE html><html><head><title>Reporte</title>';
    html += '<style>';
    html += 'body{font-family:Arial;padding:20px}';
    html += 'table{width:100%;border-collapse:collapse}';
    html += 'th,td{border:1px solid #ddd;padding:8px;text-align:left}';
    html += 'th{background:#2563eb;color:white}';
    html += 'h2{color:#1e293b}';
    html += '</style></head><body>';
    html += '<h2>Reporte de Expedientes</h2>';
    html += '<p>Total: ' + totalExpedientes + ' | Aprobados: ' + aprobados + ' | Rechazados: ' + rechazados + ' | Tasa: ' + tasaAprobacion + '%</p>';
    html += '<table><tr><th>Estado</th><th>Cantidad</th><th>Porcentaje</th></tr>';
    expedientesPorEstado.forEach(function(e) {
      html += '<tr><td>' + e.estado + '</td><td>' + e.cantidad + '</td><td>' + e.porcentaje + '%</td></tr>';
    });
    html += '</table>';
    html += '<h3 style="margin-top:20px">Por Departamento</h3>';
    html += '<table><tr><th>Departamento</th><th>Cantidad</th></tr>';
    expedientesPorDepartamento.forEach(function(d) {
      html += '<tr><td>' + d.departamento + '</td><td>' + d.cantidad + '</td></tr>';
    });
    html += '</table>';
    html += '<p style="margin-top:20px;color:#64748b;font-size:12px">Generado el ' + new Date().toLocaleDateString() + '</p>';
    html += '</body></html>';
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) {
      win.onload = function() { URL.revokeObjectURL(url); win.print(); };
    } else {
      URL.revokeObjectURL(url);
    }
  };

  const handleExportExcel = () => {
    const rows = [['Estado', 'Cantidad', 'Porcentaje']];
    expedientesPorEstado.forEach(e => rows.push([e.estado, e.cantidad, e.porcentaje + '%']));
    rows.push([]);
    rows.push(['Departamento', 'Cantidad']);
    expedientesPorDepartamento.forEach(d => rows.push([d.departamento, d.cantidad]));
    rows.push([]);
    rows.push(['Mes', 'Creados', 'Aprobados', 'Rechazados']);
    actividadReciente.forEach(a => rows.push([a.mes, a.creados, a.aprobados, a.rechazados]));

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_expedientes_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDeptName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || 'Sin departamento';
  };
  const filteredExpedientes = expedientes.filter(exp => {
    const created = new Date(exp.created_at);
    if (fechaDesde && created < new Date(fechaDesde)) return false;
    if (fechaHasta && created < new Date(fechaHasta + 'T23:59:59')) return false;
    return true;
  });
  const expedientesPorEstado = (() => {
    const groups = { 'Activos': 0, 'En Revisi\u00f3n': 0, 'Cerrados': 0 };
    filteredExpedientes.forEach(exp => {
      const mapped = STATUS_MAP[exp.status] || 'En Revisi\u00f3n';
      groups[mapped]++;
    });
    const total = filteredExpedientes.length || 1;
    return [
      { estado: 'Activos', cantidad: groups['Activos'], porcentaje: Math.round((groups['Activos'] / total) * 100) },
      { estado: 'En Revisi\u00f3n', cantidad: groups['En Revisi\u00f3n'], porcentaje: Math.round((groups['En Revisi\u00f3n'] / total) * 100) },
      { estado: 'Cerrados', cantidad: groups['Cerrados'], porcentaje: Math.round((groups['Cerrados'] / total) * 100) }
    ];
  })();
  const expedientesPorDepartamento = (() => {
    const groups = {};
    filteredExpedientes.forEach(exp => {
      const name = getDeptName(exp.department);
      groups[name] = (groups[name] || 0) + 1;
    });
    return Object.entries(groups).map(([departamento, cantidad]) => ({ departamento, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
  })();
  const actividadReciente = (() => {
    const months = {};
    filteredExpedientes.forEach(exp => {
      const d = new Date(exp.created_at);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      if (!months[key]) months[key] = { mes: MESES[d.getMonth()], creados: 0, aprobados: 0, rechazados: 0 };
      months[key].creados++;
      if (exp.status === 'Aprobado' || exp.status === 'Finalizado') months[key].aprobados++;
      if (exp.status === 'Rechazado') months[key].rechazados++;
    });
    return Object.values(months).slice(-6);
  })();
  const totalExpedientes = filteredExpedientes.length;
  const aprobados = filteredExpedientes.filter(e => e.status === 'Aprobado' || e.status === 'Finalizado').length;
  const rechazados = filteredExpedientes.filter(e => e.status === 'Rechazado').length;
  const tasaAprobacion = totalExpedientes > 0 ? Math.round((aprobados / totalExpedientes) * 100) : 0;
  const avgReviewDays = (() => {
    const withDays = filteredExpedientes.filter(e => e.updated_at && e.created_at).map(e => {
      const created = new Date(e.created_at);
      const updated = new Date(e.updated_at);
      return (updated - created) / (1000 * 60 * 60 * 24);
    });
    if (withDays.length === 0) return 0;
    return (withDays.reduce((a, b) => a + b, 0) / withDays.length).toFixed(1);
  })();
  const docsAprobados = documents.filter(d => d.approval_status === true).length;
  const docsRechazados = documents.filter(d => d.approval_status === false).length;
  const docsPendientes = documents.filter(d => d.approval_status === null || d.approval_status === undefined).length;
  const docTasaAprobacion = (docsAprobados + docsRechazados) > 0 ? Math.round((docsAprobados / (docsAprobados + docsRechazados)) * 100) : 0;
  const maxDepartamento = expedientesPorDepartamento.length > 0 ? Math.max(...expedientesPorDepartamento.map(d => d.cantidad)) : 1;
  if (loading) return <div className="p-8 text-center text-gray-400">Cargando reportes...</div>;
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
            <div className="stat-value">{totalExpedientes}</div>
            <div className="stat-label">Total Expedientes</div>
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
            <div className="stat-value">{docsAprobados}</div>
            <div className="stat-label">Documentos Aprobados</div>
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
            <div className="stat-value">{avgReviewDays} d\u00edas</div>
            <div className="stat-label">Tiempo Promedio Revisi\u00f3n</div>
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
            <div className="stat-value">{tasaAprobacion}%</div>
            <div className="stat-label">Tasa de Aprobaci\u00f3n</div>
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
          {filterFeedback && (
            <span style={{ color: '#16a34a', fontSize: '0.875rem', alignSelf: 'center' }}>{filterFeedback}</span>
          )}
          <button className="btn btn-primary" onClick={handleFilter}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filtrar
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar PDF
          </button>
          <button className="btn btn-secondary" onClick={handleExportExcel}>
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
            {expedientesPorEstado.map((item, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>{item.estado}</span>
                  <span style={{ color: '#64748b' }}>{item.cantidad} ({item.porcentaje}%)</span>
                </div>
                <div className="progress-bar" style={{ height: '12px' }}>
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: item.porcentaje + '%',
                      background: idx === 0 ? '#10b981' : idx === 1 ? '#f59e0b' : '#64748b'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <h4 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.875rem' }}>Documentos</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '0.875rem' }}>Aprobados: {docsAprobados}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '0.875rem' }}>Pendientes: {docsPendientes}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></div>
                <span style={{ fontSize: '0.875rem' }}>Rechazados: {docsRechazados}</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
              <span style={{ fontSize: '0.875rem' }}>Activos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '2px' }}></div>
              <span style={{ fontSize: '0.875rem' }}>En Revisi\u00f3n</span>
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
            {expedientesPorDepartamento.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ width: '140px', fontSize: '0.875rem', flexShrink: 0 }}>{item.departamento}</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="progress-bar" style={{ flex: 1, height: '20px' }}>
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: (item.cantidad / maxDepartamento) * 100 + '%',
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
                <th>Tasa de Aprobaci\u00f3n</th>
              </tr>
            </thead>
            <tbody>
              {actividadReciente.map((item, idx) => {
                const tasaAprobacion = item.creados > 0 ? Math.round((item.aprobados / item.creados) * 100) : 0;
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
                              width: tasaAprobacion + '%',
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
              {actividadReciente.reduce((acc, i) => acc + i.creados, 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Creados</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
              {actividadReciente.reduce((acc, i) => acc + i.aprobados, 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Aprobados</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>
              {actividadReciente.reduce((acc, i) => acc + i.rechazados, 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Rechazados</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
              {docTasaAprobacion}%
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Tasa Documentos</div>
          </div>
        </div>
      </div>
    </div>
  );
}