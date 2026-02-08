'use client';

import { useState } from 'react';
import Modal from '../../components/Modal';

const mockExpedientes = [
  { id: 'EXP-2024-0001', empleado: 'Juan García', cedula: '12345678', departamento: 'Recursos Humanos', status: 'activo', fechaCreacion: '2024-01-10', fechaActualizacion: '2024-01-20', documentos: 5 },
  { id: 'EXP-2024-0002', empleado: 'María López', cedula: '23456789', departamento: 'Contabilidad', status: 'en_revision', fechaCreacion: '2024-01-12', fechaActualizacion: '2024-01-22', documentos: 3 },
  { id: 'EXP-2024-0003', empleado: 'Carlos Martínez', cedula: '34567890', departamento: 'Tecnología', status: 'activo', fechaCreacion: '2024-01-15', fechaActualizacion: '2024-01-25', documentos: 7 },
  { id: 'EXP-2024-0004', empleado: 'Ana Rodríguez', cedula: '45678901', departamento: 'Ventas', status: 'cerrado', fechaCreacion: '2024-01-08', fechaActualizacion: '2024-01-18', documentos: 4 },
  { id: 'EXP-2024-0005', empleado: 'Pedro Sánchez', cedula: '56789012', departamento: 'Marketing', status: 'en_revision', fechaCreacion: '2024-01-20', fechaActualizacion: '2024-01-24', documentos: 2 },
  { id: 'EXP-2024-0006', empleado: 'Laura Torres', cedula: '67890123', departamento: 'Operaciones', status: 'activo', fechaCreacion: '2024-01-22', fechaActualizacion: '2024-01-25', documentos: 6 },
];

const statusLabels = {
  activo: { label: 'Activo', class: 'badge-success' },
  en_revision: { label: 'En Revisión', class: 'badge-warning' },
  cerrado: { label: 'Cerrado', class: 'badge-secondary' }
};

const departamentos = ['sala situacional', 'gestion humana', 'administracion', 'asesoria legal', 'direccion', 'taquilla unica', 'ecosocialismo', 'division de gestion integral de la basura', 'formacion', 'diversidad biologica', 'patrimonio forestal', 'fiscalizacion', 'area 3', 'guarderia ambiental', 'oficina de la UPA'];

export default function Expedientes() {
  const [expedientes, setExpedientes] = useState(mockExpedientes);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartamento, setFilterDepartamento] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [formData, setFormData] = useState({
    empleado: '',
    cedula: '',
    departamento: '',
    observaciones: ''
  });

  const filteredExpedientes = expedientes.filter(exp => {
    const matchesSearch = exp.id.toLowerCase().includes(search.toLowerCase()) ||
                          exp.empleado.toLowerCase().includes(search.toLowerCase()) ||
                          exp.cedula.includes(search);
    const matchesStatus = !filterStatus || exp.status === filterStatus;
    const matchesDepartamento = !filterDepartamento || exp.departamento === filterDepartamento;
    return matchesSearch && matchesStatus && matchesDepartamento;
  });

  const handleOpenCreate = () => {
    setSelectedExpediente(null);
    setFormData({ empleado: '', cedula: '', departamento: '', observaciones: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp) => {
    setSelectedExpediente(exp);
    setFormData({
      empleado: exp.empleado,
      cedula: exp.cedula,
      departamento: exp.departamento,
      observaciones: ''
    });
    setIsModalOpen(true);
  };

  const handleViewExpediente = (exp) => {
    setSelectedExpediente(exp);
    setIsViewModalOpen(true);
  };

  const handleSaveExpediente = () => {
    if (selectedExpediente) {
      setExpedientes(expedientes.map(e => 
        e.id === selectedExpediente.id 
          ? { ...e, ...formData, fechaActualizacion: new Date().toISOString().split('T')[0] }
          : e
      ));
    } else {
      const newExpediente = {
        id: `EXP-2024-${String(expedientes.length + 1).padStart(4, '0')}`,
        ...formData,
        status: 'en_revision',
        fechaCreacion: new Date().toISOString().split('T')[0],
        fechaActualizacion: new Date().toISOString().split('T')[0],
        documentos: 0
      };
      setExpedientes([newExpediente, ...expedientes]);
    }
    setIsModalOpen(false);
  };

  const handleChangeStatus = (expId, newStatus) => {
    setExpedientes(expedientes.map(e => 
      e.id === expId 
        ? { ...e, status: newStatus, fechaActualizacion: new Date().toISOString().split('T')[0] }
        : e
    ));
  };

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
            <div className="stat-value">{expedientes.length}</div>
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
            <div className="stat-value">{expedientes.filter(e => e.status === 'activo').length}</div>
            <div className="stat-label">Activos</div>
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
            <div className="stat-value">{expedientes.filter(e => e.status === 'en_revision').length}</div>
            <div className="stat-label">En Revisión</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{expedientes.filter(e => e.status === 'cerrado').length}</div>
            <div className="stat-label">Cerrados</div>
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
              placeholder="Buscar por ID, empleado o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <select 
            className="form-select" 
            style={{ width: 'auto', minWidth: '150px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="en_revision">En Revisión</option>
            <option value="cerrado">Cerrado</option>
          </select>
          <select 
            className="form-select" 
            style={{ width: 'auto', minWidth: '180px' }}
            value={filterDepartamento}
            onChange={(e) => setFilterDepartamento(e.target.value)}
          >
            <option value="">Todos los departamentos</option>
            {departamentos.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo Expediente
          </button>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID Expediente</th>
                <th>Empleado</th>
                <th>Cédula</th>
                <th>Departamento</th>
                <th>Documentos</th>
                <th>Estado</th>
                <th>Última Actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpedientes.map(exp => (
                <tr key={exp.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: '500', color: '#2563eb' }}>{exp.id}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: '#dbeafe', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontWeight: '600',
                        color: '#2563eb',
                        fontSize: '0.875rem'
                      }}>
                        {exp.empleado.charAt(0)}
                      </div>
                      {exp.empleado}
                    </div>
                  </td>
                  <td>{exp.cedula}</td>
                  <td>{exp.departamento}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#64748b' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      {exp.documentos}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${statusLabels[exp.status].class}`}>
                      {statusLabels[exp.status].label}
                    </span>
                  </td>
                  <td>{exp.fechaActualizacion}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon" 
                        title="Ver detalles"
                        onClick={() => handleViewExpediente(exp)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Editar"
                        onClick={() => handleOpenEdit(exp)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {exp.status === 'en_revision' && (
                        <>
                          <button 
                            className="btn-icon" 
                            title="Aprobar"
                            onClick={() => handleChangeStatus(exp.id, 'activo')}
                            style={{ color: '#10b981' }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </button>
                          <button 
                            className="btn-icon" 
                            title="Cerrar"
                            onClick={() => handleChangeStatus(exp.id, 'cerrado')}
                            style={{ color: '#ef4444' }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedExpediente ? 'Editar Expediente' : 'Crear Nuevo Expediente'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSaveExpediente}>
              {selectedExpediente ? 'Guardar Cambios' : 'Crear Expediente'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nombre del Empleado</label>
          <input
            type="text"
            className="form-input"
            value={formData.empleado}
            onChange={(e) => setFormData({ ...formData, empleado: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Cédula</label>
          <input
            type="text"
            className="form-input"
            value={formData.cedula}
            onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Departamento</label>
          <select
            className="form-select"
            value={formData.departamento}
            onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
          >
            <option value="">Seleccionar departamento</option>
            {departamentos.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Observaciones</label>
          <textarea
            className="form-input"
            rows="3"
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          />
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Expediente ${selectedExpediente?.id}`}
        footer={
          <button className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>
            Cerrar
          </button>
        }
      >
        {selectedExpediente && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Empleado</span>
                <span style={{ fontWeight: '500' }}>{selectedExpediente.empleado}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Cédula</span>
                <span style={{ fontWeight: '500' }}>{selectedExpediente.cedula}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Departamento</span>
                <span style={{ fontWeight: '500' }}>{selectedExpediente.departamento}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Estado</span>
                <span className={`badge ${statusLabels[selectedExpediente.status].class}`}>
                  {statusLabels[selectedExpediente.status].label}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Fecha Creación</span>
                <span style={{ fontWeight: '500' }}>{selectedExpediente.fechaCreacion}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Documentos</span>
                <span style={{ fontWeight: '500' }}>{selectedExpediente.documentos} archivos</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
