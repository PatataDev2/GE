import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { getUsers, createFuncionario, updateFuncionario, toggleActivo, resetPassword } from '../../api/users.api';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logger';

const rolLabels = {
  admin: 'Administrador',
  analyst: 'Analista',
  recepcionista: 'Recepcionista',
};

export default function UsersManagement() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [editGeneratedPassword, setEditGeneratedPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    cedula: '',
    first_name: '',
    last_name: '',
    email: '',
    rol: 'recepcionista',
  });

  useEffect(() => { const ac = new AbortController(); fetchUsers(ac.signal); return () => ac.abort(); }, []);

  const fetchUsers = async (signal) => {
    try {
      setLoading(true);
      const response = await api.get('users/api/v1/', { signal });
      setUsers(response.data.results || response.data);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        logError('Error fetching users:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (user.first_name || '').toLowerCase().includes(q) ||
      (user.last_name || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q) ||
      (user.cedula || '').includes(q);
    const matchesRole = !filterRole || user.rol === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setEditing(false);
    setFormData({ cedula: '', first_name: '', last_name: '', email: '', rol: 'recepcionista' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditing(true);
    setFormData({
      cedula: user.cedula,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email,
      rol: user.rol,
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      if (editing && selectedUser) {
        await updateFuncionario(selectedUser.id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          rol: formData.rol,
        });
        setUsers(users.map(u =>
          u.id === selectedUser.id
            ? { ...u, ...formData, first_name: formData.first_name, last_name: formData.last_name }
            : u
        ));
        setIsModalOpen(false);
      } else {
        const res = await createFuncionario(formData);
        setGeneratedPassword(res.data.password);
        setIsPasswordReset(false);
        setIsPasswordModalOpen(true);
        setIsModalOpen(false);
        await fetchUsers();
      }
    } catch (error) {
      logError('Error saving user:', error);
      showToast(error.response?.data?.cedula?.[0] || 'Error al guardar usuario', 'error');
    }
  };

  const handleToggleActivo = async (userId) => {
    try {
      const res = await toggleActivo(userId);
      setUsers(users.map(u =>
        u.id === userId ? { ...u, cuenta_activa: res.data.cuenta_activa } : u
      ));
    } catch (error) {
      logError('Error toggling user status:', error);
      showToast('Error al cambiar estado del usuario', 'error');
    }
  };

  const handleGeneratePasswordInEdit = async () => {
    if (!selectedUser) return;
    try {
      const res = await resetPassword(selectedUser.id);
      setEditGeneratedPassword(res.data.password);
      setShowEditPassword(true);
    } catch (error) {
      logError('Error generating password:', error);
      showToast('Error al generar contraseña', 'error');
    }
  };

  const handleResetPassword = async (user) => {
    try {
      const res = await resetPassword(user.id);
      setGeneratedPassword(res.data.password);
      setIsPasswordReset(true);
      setIsPasswordModalOpen(true);
    } catch (error) {
      logError('Error resetting password:', error);
      showToast('Error al restablecer contraseña', 'error');
    }
  };

  const stats = {
    total: users.length,
    activos: users.filter(u => u.cuenta_activa).length,
    analysts: users.filter(u => u.rol === 'analyst').length,
    employees: users.filter(u => u.rol === 'recepcionista').length,
  };

  return (
    <div>
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
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Funcionarios</div>
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
            <div className="stat-value">{stats.activos}</div>
            <div className="stat-label">Cuentas Activas</div>
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
            <div className="stat-value">{stats.analysts}</div>
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
            <div className="stat-value">{stats.employees}</div>
            <div className="stat-label">Recepcionistas</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-input flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="form-input pl-10"
              placeholder="Buscar por nombre, email o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select w-auto min-w-[150px]"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="analyst">Analista</option>
            <option value="recepcionista">Recepcionista</option>
          </select>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo Funcionario
          </button>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="text-center p-8">Cargando funcionarios...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Cédula</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className={!user.cuenta_activa ? 'opacity-[0.45] bg-slate-100' : ''}>
                    <td><strong>{user.cedula}</strong></td>
                    <td>{user.first_name || '-'}</td>
                    <td>{user.last_name || '-'}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${
                        user.rol === 'admin' ? 'badge-danger' :
                        user.rol === 'analyst' ? 'badge-info' : 'badge-secondary'
                      }`}>
                        {rolLabels[user.rol] || user.rol}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.cuenta_activa ? 'badge-success' : 'badge-warning'}`}>
                        {user.cuenta_activa ? 'Activo' : 'Inactivo'}
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
                          title={user.cuenta_activa ? 'Inactivar' : 'Activar'}
                          onClick={() => handleToggleActivo(user.id)}
                        >
                          {user.cuenta_activa ? (
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Editar Funcionario' : 'Nuevo Funcionario'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSaveUser}>
              {editing ? 'Guardar Cambios' : 'Crear Funcionario'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Cédula</label>
          <input
            type="text"
            className={editing ? 'form-input bg-slate-200 cursor-not-allowed' : 'form-input'}
            value={formData.cedula}
            disabled={editing}
            maxLength={8}
            onChange={(e) => setFormData({ ...formData, cedula: e.target.value.replace(/\D/g, '').slice(0, 8) })}
          />
          {editing && <small className="text-slate-400">La cédula no se puede modificar</small>}
        </div>
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            className="form-input"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Apellido</label>
          <input
            type="text"
            className="form-input"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Correo</label>
          <input
            type="email"
            className="form-input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Rol</label>
          <select
            className="form-select"
            value={formData.rol}
            onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
          >
            <option value="recepcionista">Recepcionista</option>
            <option value="analyst">Analista</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        {editing && (
          <div className="form-group border-t border-slate-200 pt-4">
            <label className="form-label">Contraseña</label>
            <button
              type="button"
              className="btn btn-secondary w-full"
              onClick={handleGeneratePasswordInEdit}
            >
              Generar Contraseña Aleatoria
            </button>
            {showEditPassword && (
              <div className="mt-3 text-center text-xl font-bold font-mono bg-green-50 text-green-600 px-4 py-2 rounded-lg tracking-widest">
                {editGeneratedPassword}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Funcionario Creado"
        footer={
          <button className="btn btn-primary" onClick={() => setIsPasswordModalOpen(false)}>
            Cerrar
          </button>
        }
      >
        <div className="text-center py-4">
          <p>El funcionario se ha registrado correctamente.</p>
          <p className="mt-4 font-semibold">Clave temporal generada:</p>
          <div className="text-2xl font-bold font-mono bg-green-50 text-green-600 px-6 py-3 rounded-lg mt-2 inline-block tracking-widest">
            {generatedPassword}
          </div>
          <p className="mt-4 text-slate-500 text-sm">
            Entrégale esta clave al funcionario. Deberá cambiarla al iniciar sesión.
          </p>
        </div>
      </Modal>
    </div>
  );
}
