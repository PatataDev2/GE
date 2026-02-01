'use client';

import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { 
  getDepartments, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment, 
  toggleDepartmentStatus 
} from '../../api/departments.api';

export default function DepartmentsManagement() {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      setError('Error al cargar departamentos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(search.toLowerCase()) ||
                         dept.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && dept.is_active) ||
                         (filterStatus === 'inactive' && !dept.is_active);
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setSelectedDepartment(null);
    setFormData({ name: '', description: '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (department) => {
    setSelectedDepartment(department);
    setFormData({ 
      name: department.name, 
      description: department.description || '' 
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (department) => {
    setSelectedDepartment(department);
    setIsDeleteModalOpen(true);
  };

  const handleSaveDepartment = async () => {
    if (!formData.name.trim()) {
      setError('El nombre del departamento es requerido');
      return;
    }

    try {
      if (selectedDepartment) {
        await updateDepartment(selectedDepartment.id, formData);
      } else {
        await createDepartment(formData);
      }
      await loadDepartments();
      setIsModalOpen(false);
      setError('');
    } catch (err) {
      setError('Error al guardar departamento');
      console.error(err);
    }
  };

  const handleDeleteDepartment = async () => {
    try {
      await deleteDepartment(selectedDepartment.id);
      await loadDepartments();
      setIsDeleteModalOpen(false);
    } catch (err) {
      setError('Error al eliminar departamento');
      console.error(err);
    }
  };

  const handleToggleStatus = async (dept) => {
    try {
      await toggleDepartmentStatus(dept.id);
      await loadDepartments();
    } catch (err) {
      setError('Error al cambiar estado');
      console.error(err);
    }
  };

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18"/>
              <path d="M5 21V7l8-4v18"/>
              <path d="M19 21V11l-6-1"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{departments.length}</div>
            <div className="stat-label">Total Departamentos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{departments.filter(d => d.is_active).length}</div>
            <div className="stat-label">Activos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{departments.filter(d => !d.is_active).length}</div>
            <div className="stat-label">Inactivos</div>
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
              placeholder="Buscar por nombre o descripción..."
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
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <button 
            className="btn btn-primary" 
            onClick={handleOpenCreate}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo Departamento
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="card text-center">
          <div className="spinner"></div>
          <p>Cargando departamentos...</p>
        </div>
      ) : (
        /* Table */
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th>Actualizado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No se encontraron departamentos
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((dept) => (
                    <tr key={dept.id}>
                      <td>{dept.name}</td>
                      <td>{dept.description || 'Sin descripción'}</td>
                      <td>
                        <span className={`badge ${dept.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {dept.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>{new Date(dept.created_at).toLocaleDateString()}</td>
                      <td>{new Date(dept.updated_at).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn btn-sm btn-warning"
                            onClick={() => handleOpenEdit(dept)}
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4-1 9.5-9.5a2.121 2.121 0 0 1 0-3z"/>
                            </svg>
                          </button>
                          <button 
                            className={`btn btn-sm ${dept.is_active ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleToggleStatus(dept)}
                            title={dept.is_active ? 'Desactivar' : 'Activar'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              {dept.is_active ? (
                                <line x1="18" y1="6" x2="6" y2="18"/>
                              ) : (
                                <polyline points="20,6 9,17 4,12"/>
                              )}
                            </svg>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleOpenDelete(dept)}
                            title="Eliminar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={selectedDepartment ? 'Editar Departamento' : 'Nuevo Departamento'}
      >
        <div className="form-group">
          <label className="form-label">Nombre *</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Nombre del departamento"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Descripción</label>
          <textarea 
            className="form-input" 
            placeholder="Descripción del departamento"
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        <div className="modal-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsModalOpen(false)}
          >
            Cancelar
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSaveDepartment}
          >
            {selectedDepartment ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Eliminar Departamento"
      >
        <p>¿Está seguro que desea eliminar el departamento "{selectedDepartment?.name}"?</p>
        <p className="text-warning">Esta acción no se puede deshacer.</p>
        <div className="modal-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Cancelar
          </button>
          <button 
            className="btn btn-danger" 
            onClick={handleDeleteDepartment}
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}