
'use client';

import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users.api';



const roleLabels = {
  1: 'Administrador',
  2: 'Analista',
  3: 'Empleado',
  4: 'Usuario Normal'
};

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };
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
    password: '',
    confirmPassword: ''
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
    setFormData({ username: '', email: '', cedula: '', phone: '', role: 'employee', password: '', confirmPassword: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    const roleMap = {
      1: 'admin',
      2: 'analyst', 
      3: 'employee',
      4: 'user'
    };
    setFormData({ 
      ...user, 
      role: roleMap[user.role] || 'employee', 
      password: '', 
      confirmPassword: '' 
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      if (selectedUser) {
        const roleMap = {
          'admin': 1,
          'analyst': 2,
          'employee': 3,
          'user': 4
        };
        
        await updateUser(selectedUser.id, {
          username: formData.username,
          email: formData.email,
          cedula: formData.cedula,
          phone: formData.phone,
          role: roleMap[formData.role]
        });
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...formData } : u));
      } else {
        if (formData.password !== formData.confirmPassword) {
          alert('Las contraseñas no coinciden');
          return;
        }
        const roleMap = {
          'admin': 1,
          'analyst': 2, 
          'employee': 3,
          'user': 4
        };
        
        await createUser({
          username: formData.username,
          email: formData.email,
          cedula: formData.cedula,
          phone: formData.phone,
          role: roleMap[formData.role],
          password: formData.password,
          password2: formData.confirmPassword
        });
        await fetchUsers();
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error al guardar usuario');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser(selectedUser.id);
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      await updateUser(userId, { is_active: !user.is_active });
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, is_active: !u.is_active }
          : u
      ));
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Error al cambiar estado del usuario');
    }
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
            <div className="stat-value">{users.filter(u => u.is_active).length}</div>
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
            <div className="stat-value">{users.filter(u => u.role?.id === 2 || u.role === 2).length}</div>
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
            <div className="stat-value">{users.filter(u => u.role?.id === 3 || u.role === 3).length}</div>
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
            <option value="user">Usuario Normal</option>
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
           {loading ? (
             <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando usuarios...</div>
           ) : (
             <table>
               <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Cédula</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Estado</th>
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
                       user.role?.id === 1 || user.role === 1 ? 'badge-danger' : 
                       user.role?.id === 2 || user.role === 2 ? 'badge-info' : 
                       user.role?.id === 4 || user.role === 4 ? 'badge-primary' : 'badge-secondary'
                     }`}>
                       {roleLabels[user.role?.id || user.role] || 'Empleado'}
                     </span>
                   </td>
                   <td>
                     <span className={`badge ${user.is_active ? 'badge-success' : 'badge-warning'}`}>
                       {user.is_active ? 'activo' : 'inactivo'}
                     </span>
                   </td>
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
                         title={user.is_active ? 'Desactivar' : 'Activar'}
                         onClick={() => handleToggleStatus(user.id)}
                       >
                         {user.is_active ? (
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
           )}
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
            <option value="user">Usuario Normal</option>
            <option value="user">Usuario Normal</option>
            <option value="employee">Empleado</option>
            <option value="analyst">Analista</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
         {!selectedUser && (
           <>
             <div className="form-group">
               <label className="form-label">Contraseña</label>
               <input
                 type="password"
                 className="form-input"
                 value={formData.password}
                 onChange={(e) => setFormData({ ...formData, password: e.target.value })}
               />
             </div>
             <div className="form-group">
               <label className="form-label">Confirmar Contraseña</label>
               <input
                 type="password"
                 className="form-input"
                 value={formData.confirmPassword}
                 onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
               />
             </div>
           </>
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

