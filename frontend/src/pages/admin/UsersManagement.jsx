
'use client';

import { useState } from 'react';
import Modal from '../../components/Modal';

const mockUsers = [
  { id: 1, username: 'admin1', email: 'admin@empresa.com', cedula: '12345678', phone: '04121234567', role: 'admin', status: 'activo', createdAt: '2024-01-15' },
  { id: 2, username: 'analista1', email: 'analista@empresa.com', cedula: '23456789', phone: '04141234567', role: 'analyst', status: 'activo', createdAt: '2024-02-20' },
  { id: 3, username: 'empleado1', email: 'empleado1@empresa.com', cedula: '34567890', phone: '04161234567', role: 'employee', status: 'activo', createdAt: '2024-03-10' },
  { id: 4, username: 'empleado2', email: 'empleado2@empresa.com', cedula: '45678901', phone: '04241234567', role: 'employee', status: 'inactivo', createdAt: '2024-03-15' },
];

const roleLabels = {
  admin: 'Administrador',
  analyst: 'Analista',
  employee: 'Empleado'
};

export default function UsersManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    cedula: '',
    phone: '',
    role: 'employee',
    password: ''
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(search.toLowerCase()) ||
                          user.email.toLowerCase().includes(search.toLowerCase()) ||
                          user.cedula.includes(search);
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormData({ username: '', email: '', cedula: '', phone: '', role: 'employee', password: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({ ...user, password: '' });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleSaveUser = () => {
    if (selectedUser) {
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...formData } : u));
    } else {
      const newUser = {
        ...formData,
        id: Math.max(...users.map(u => u.id)) + 1,
        status: 'activo',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setUsers([...users, newUser]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteUser = () => {
    setUsers(users.filter(u => u.id !== selectedUser.id));
    setIsDeleteModalOpen(false);
  };

  const handleToggleStatus = (userId) => {
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'activo' ? 'inactivo' : 'activo' }
        : u
    ));
  };

  return (
    <div>
      {/* Stats */}
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
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Total Usuarios</div>
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
            <div className="stat-value">{users.filter(u => u.status === 'activo').length}</div>
            <div className="stat-label">Usuarios Activos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{users.filter(u => u.role === 'analyst').length}</div>
            <div className="stat-label">Analistas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{users.filter(u => u.role === 'employee').length}</div>
            <div className="stat-label">Empleados</div>
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
              placeholder="Buscar por nombre, email o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <select 
            className="form-select" 
            style={{ width: 'auto', minWidth: '150px' }}
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="analyst">Analista</option>
            <option value="employee">Empleado</option>
          </select>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo Usuario
          </button>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Cédula</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
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
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      {user.username}
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.cedula}</td>
                  <td>{user.phone}</td>
                  <td>
                    <span className={`badge ${
                      user.role === 'admin' ? 'badge-danger' : 
                      user.role === 'analyst' ? 'badge-info' : 'badge-secondary'
                    }`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.status === 'activo' ? 'badge-success' : 'badge-warning'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{user.createdAt}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon" 
                        title="Editar"
                        onClick={() => handleOpenEdit(user)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-icon" 
                        title={user.status === 'activo' ? 'Desactivar' : 'Activar'}
                        onClick={() => handleToggleStatus(user.id)}
                      >
                        {user.status === 'activo' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                          </svg>
                        )}
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Eliminar"
                        onClick={() => handleOpenDelete(user)}
                        style={{ color: '#ef4444' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                      </button>
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
        title={selectedUser ? 'Editar Usuario' : 'Crear Usuario'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSaveUser}>
              {selectedUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nombre de Usuario</label>
          <input
            type="text"
            className="form-input"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
          <label className="form-label">Teléfono</label>
          <input
            type="text"
            className="form-input"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Rol</label>
          <select
            className="form-select"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="employee">Empleado</option>
            <option value="analyst">Analista</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        {!selectedUser && (
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-danger" onClick={handleDeleteUser}>
              Eliminar Usuario
            </button>
          </>
        }
      >
        <p>¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUser?.username}</strong>?</p>
        <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}

