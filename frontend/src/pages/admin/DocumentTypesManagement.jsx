'use client';

import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { 
  getDocumentTypes, 
  createDocumentType, 
  updateDocumentType, 
  deleteDocumentType, 
  toggleDocumentTypeStatus 
} from '../../api/documentTypes.api';

export default function DocumentTypesManagement() {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDocumentTypes();
  }, []);

  const loadDocumentTypes = async () => {
    try {
      setLoading(true);
      const data = await getDocumentTypes();
      setDocumentTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error al cargar tipos de documentos');
      console.error(err);
      setDocumentTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocumentTypes = (Array.isArray(documentTypes) ? documentTypes : []).filter(docType => {
    const matchesSearch = docType.name.toLowerCase().includes(search.toLowerCase()) ||
                         docType.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && docType.is_active) ||
                         (filterStatus === 'inactive' && !docType.is_active);
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setSelectedDocumentType(null);
    setFormData({ name: '', description: '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (documentType) => {
    setSelectedDocumentType(documentType);
    setFormData({ 
      name: documentType.name, 
      description: documentType.description || '' 
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (documentType) => {
    setSelectedDocumentType(documentType);
    setIsDeleteModalOpen(true);
  };

  const handleSaveDocumentType = async () => {
    if (!formData.name.trim()) {
      setError('El nombre del tipo de documento es requerido');
      return;
    }

    try {
      if (selectedDocumentType) {
        await updateDocumentType(selectedDocumentType.id, formData);
      } else {
        await createDocumentType(formData);
      }
      await loadDocumentTypes();
      setIsModalOpen(false);
      setError('');
    } catch (err) {
      setError('Error al guardar tipo de documento');
      console.error(err);
    }
  };

  const handleDeleteDocumentType = async () => {
    try {
      await deleteDocumentType(selectedDocumentType.id);
      await loadDocumentTypes();
      setIsDeleteModalOpen(false);
    } catch (err) {
      setError('Error al eliminar tipo de documento');
      console.error(err);
    }
  };

  const handleToggleStatus = async (docType) => {
    try {
      await toggleDocumentTypeStatus(docType.id);
      await loadDocumentTypes();
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{(Array.isArray(documentTypes) ? documentTypes : []).length}</div>
            <div className="stat-label">Total Tipos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{(Array.isArray(documentTypes) ? documentTypes : []).filter(d => d.is_active).length}</div>
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
            <div className="stat-value">{(Array.isArray(documentTypes) ? documentTypes : []).filter(d => !d.is_active).length}</div>
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
            Nuevo Tipo
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
          <p>Cargando tipos de documentos...</p>
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
                {filteredDocumentTypes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No se encontraron tipos de documentos
                    </td>
                  </tr>
                ) : (
                  filteredDocumentTypes.map((docType) => (
                    <tr key={docType.id}>
                      <td>{docType.name}</td>
                      <td>{docType.description || 'Sin descripción'}</td>
                      <td>
                        <span className={`badge ${docType.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {docType.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>{new Date(docType.created_at).toLocaleDateString()}</td>
                      <td>{new Date(docType.updated_at).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn btn-sm btn-warning"
                            onClick={() => handleOpenEdit(docType)}
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4-1 9.5-9.5a2.121 2.121 0 0 1 0-3z"/>
                            </svg>
                          </button>
                          <button 
                            className={`btn btn-sm ${docType.is_active ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleToggleStatus(docType)}
                            title={docType.is_active ? 'Desactivar' : 'Activar'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              {docType.is_active ? (
                                <line x1="18" y1="6" x2="6" y2="18"/>
                              ) : (
                                <polyline points="20,6 9,17 4,12"/>
                              )}
                            </svg>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleOpenDelete(docType)}
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
        title={selectedDocumentType ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
      >
        <div className="form-group">
          <label className="form-label">Nombre *</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Nombre del tipo de documento"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Descripción</label>
          <textarea 
            className="form-input" 
            placeholder="Descripción del tipo de documento"
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
            onClick={handleSaveDocumentType}
          >
            {selectedDocumentType ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Eliminar Tipo de Documento"
      >
        <p>¿Está seguro que desea eliminar el tipo de documento "{selectedDocumentType?.name}"?</p>
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
            onClick={handleDeleteDocumentType}
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}