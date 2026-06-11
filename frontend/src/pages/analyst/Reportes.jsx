'use client';
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { logError } from '../../utils/logger';
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
    const ac = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        const [expRes, docRes, deptRes] = await Promise.all([
          api.get('api/expedients/', { signal: ac.signal }),
          api.get('api/documents/', { signal: ac.signal }),
          api.get('api/departments/', { signal: ac.signal })
        ]);
        setExpedientes(expRes.data);
        setDocuments(docRes.data);
        setDepartments(deptRes.data);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          logError('Error fetching data:', err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => ac.abort();
  }, []);
  const [filterFeedback, setFilterFeedback] = useState('');

  const handleFilter = () => {
    setFilterFeedback('Filtrado aplicado: ' + filteredExpedientes.length + ' expedientes');
    setTimeout(function() { setFilterFeedback(''); }, 3000);
  };

  const esc = (str) => String(str).replace(/[&<>"']/g, function (m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '"') return '&quot;';
    if (m === "'") return '&#39;';
    return m;
  });

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
    html += '<p>Total: ' + esc(totalExpedientes) + ' | Aprobados: ' + esc(aprobados) + ' | Rechazados: ' + esc(rechazados) + ' | Tasa: ' + esc(tasaAprobacion) + '%</p>';
    html += '<table><tr><th>Estado</th><th>Cantidad</th><th>Porcentaje</th></tr>';
    expedientesPorEstado.forEach(function(e) {
      html += '<tr><td>' + esc(e.estado) + '</td><td>' + esc(e.cantidad) + '</td><td>' + esc(e.porcentaje) + '%</td></tr>';
    });
    html += '</table>';
    html += '<h3 style="margin-top:20px">Por Departamento</h3>';
    html += '<table><tr><th>Departamento</th><th>Cantidad</th></tr>';
    expedientesPorDepartamento.forEach(function(d) {
      html += '<tr><td>' + esc(d.departamento) + '</td><td>' + esc(d.cantidad) + '</td></tr>';
    });
    html += '</table>';
    html += '<p style="margin-top:20px;color:#64748b;font-size:12px">Generado el ' + esc(new Date().toLocaleDateString()) + '</p>';
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
      <div className="card mb-6">
        <div className="filter-bar">
          <select 
            className="form-select w-auto min-w-[200px]"
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
            className="form-input w-auto"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
          <input
            type="date"
            className="form-input w-auto"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
          {filterFeedback && (
            <span className="text-green-600 text-sm self-center">{filterFeedback}</span>
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
          
          <div className="flex flex-col gap-6">
            {expedientesPorEstado.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{item.estado}</span>
                  <span className="text-slate-500">{item.cantidad} ({item.porcentaje}%)</span>
                </div>
                <div className="progress-bar h-3">
                  <div 
                    style={{ width: item.porcentaje + '%' }}
                    className={`progress-fill ${
                      idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-amber-500' : 'bg-slate-500'
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-4 border-t border-slate-200">
            <h4 className="font-semibold mb-4 text-sm">Documentos</h4>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                <span className="text-sm">Aprobados: {docsAprobados}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
                <span className="text-sm">Pendientes: {docsPendientes}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <span className="text-sm">Rechazados: {docsRechazados}</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
              <span className="text-sm">Activos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
              <span className="text-sm">En Revisi\u00f3n</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-500 rounded-sm"></div>
              <span className="text-sm">Cerrados</span>
            </div>
          </div>
        </div>
        {/* Expedientes por Departamento */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Expedientes por Departamento</h3>
          </div>
          
          <div className="flex flex-col gap-4">
            {expedientesPorDepartamento.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-35 text-sm shrink-0">{item.departamento}</span>
                <div className="flex-1 flex items-center gap-3">
                  <div className="progress-bar flex-1 h-5">
                    <div 
                      className="progress-fill bg-blue-600" 
                      style={{ 
                        width: (item.cantidad / maxDepartamento) * 100 + '%'
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold text-right w-8">{item.cantidad}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Actividad Mensual */}
      <div className="card mt-6">
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
                    <td className="font-medium">{item.mes}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-info">{item.creados}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-success">{item.aprobados}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-danger">{item.rechazados}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="progress-bar w-24 h-2">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: tasaAprobacion + '%',
                              background: tasaAprobacion >= 90 ? '#10b981' : tasaAprobacion >= 70 ? '#f59e0b' : '#ef4444'
                            }}
                          ></div>
                        </div>
                        <span className="font-medium">{tasaAprobacion}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Summary */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg flex justify-around flex-wrap gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {actividadReciente.reduce((acc, i) => acc + i.creados, 0)}
            </div>
            <div className="text-sm text-slate-500">Total Creados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">
              {actividadReciente.reduce((acc, i) => acc + i.aprobados, 0)}
            </div>
            <div className="text-sm text-slate-500">Total Aprobados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {actividadReciente.reduce((acc, i) => acc + i.rechazados, 0)}
            </div>
            <div className="text-sm text-slate-500">Total Rechazados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-500">
              {docTasaAprobacion}%
            </div>
            <div className="text-sm text-slate-500">Tasa Documentos</div>
          </div>
        </div>
      </div>
    </div>
  );
}