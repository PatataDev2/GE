'use client';

import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { getExpedientes, solicitarExpediente, respuestaFinal } from '../../api/expedientes-flujo.api';
import { getUsers } from '../../api/users.api';

const estadoLabels = {
  solicitado: { label: 'Solicitado', class: 'badge-warning' },
  en_proceso: { label: 'En Proceso', class: 'badge-info' },
  revision_analista: { label: 'Revisión Analista', class: 'badge-warning' },
  aprobado: { label: 'Aprobado', class: 'badge-success' },
  rechazado: { label: 'Rechazado', class: 'badge-danger' },
  cerrado: { label: 'Cerrado', class: 'badge-secondary' }
};

export default function GestionExpedientes() {
  const [expedientes, setExpedientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRespuestaModalOpen, setIsRespuestaModalOpen] = useState(false);
  const [selectedExpediente, setSelectedExpediente] = useState(null);

  const departamentos = ['sala situacional', 'gestion humana', 'administracion', 'asesoria legal', 'direccion', 'taquilla unica', 'ecosocialismo', 'division de gestion integral de la basura', 'formacion', 'diversidad biologica', 'patrimonio forestal', 'fiscalizacion', 'area 3', 'guarderia ambiental', 'oficina de la UPA'];

  const [solicitudForm, setSolicitudForm] = useState({
    empleado_id: '',
    nombre_expediente: '',
    departamento: ''
  });

  const [respuestaForm, setRespuestaForm] = useState({
    accion: 'aprobar',
    respuesta: ''
  });

  useEffect(() => {
    fetchExpedientes();
    fetchEmpleados();
  }, []);

  const fetchExpedientes = async () => {
    try {
      setLoading(true);
      const response = await getExpedientes();
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setExpedientes(data);
    } catch (error) {
      console.error('Error fetching expedientes:', error);
      setExpedientes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmpleados = async () => {
    try {
      const response = await getUsers();
      // Filtrar solo empleados (no admin ni analistas)
      const empleadosFiltrados = response.data.filter(user => 
        user.role?.name === 'employee' || user.role === 3
      );
      setEmpleados(empleadosFiltrados);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleOpenSolicitud = () => {
    setSolicitudForm({
      empleado_id: '',
      nombre_expediente: '',
      departamento: ''
    });
    setIsModalOpen(true);
  };

  const handleSolicitar = async () => {
    if (!solicitudForm.empleado_id || !solicitudForm.nombre_expediente || !solicitudForm.departamento) {
      alert('Por favor complete todos los campos');
      return;
    }

    try {
      await solicitarExpediente(solicitudForm);
      await fetchExpedientes();
      setIsModalOpen(false);
      alert('Solicitud enviada exitosamente');
    } catch (error) {
      console.error('Error creating solicitud:', error);
      alert('Error al enviar solicitud');
    }
  };

  const handleOpenRespuesta = (expediente) => {
    setSelectedExpediente(expediente);
    setRespuestaForm({
      accion: 'aprobar',
      respuesta: ''
    });
    setIsRespuestaModalOpen(true);
  };

  const handleRespuestaFinal = async () => {
    if (!respuestaForm.respuesta.trim()) {
      alert('Por favor ingrese una respuesta');
      return;
    }

    try {
      await respuestaFinal(selectedExpediente.id, respuestaForm);
      await fetchExpedientes();
      setIsRespuestaModalOpen(false);
      alert('Respuesta final enviada exitosamente');
    } catch (error) {
      console.error('Error sending respuesta:', error);
      alert('Error al enviar respuesta');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>Cargando expedientes...</div>
      </div>
    );
  }

  return (
    <div>
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
            <div className="stat-value">{expedientes.filter(e => e.estado === 'aprobado').length}</div>
            <div className="stat-label">Aprobados</div>
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
            <div className="stat-value">{expedientes.filter(e => e.estado === 'revision_analista').length}</div>
            <div className="stat-label">En Revisión</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{expedientes.filter(e => e.estado === 'rechazado').length}</div>
            <div className="stat-label">Rechazados</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Gestión de Expedientes</h3>
          <button className="btn btn-primary" onClick={handleOpenSolicitud}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Solicitar Expediente
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Empleado</th>
                <th>Departamento</th>
                <th>Solicitado por</th>
                <th>Estado</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expedientes.map(exp => (
                <tr key={exp.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: '500', color: '#2563eb' }}>{exp.codigo}</span>
                  </td>
                  <td>{exp.nombre_expediente}</td>
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
                        {exp.empleado?.username?.charAt(0)?.toUpperCase()}
                      </div>
                      {exp.empleado?.username}
                    </div>
                  </td>
                  <td>{exp.departamento}</td>
                  <td>{exp.solicitado_por?.username}</td>
                  <td>
                    <span className={`badge ${estadoLabels[exp.estado].class}`}>
                      {estadoLabels[exp.estado].label}
                    </span>
                  </td>
                  <td>{new Date(exp.fecha_creacion).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      {(exp.estado === 'aprobado' || exp.estado === 'rechazado') ? (
                        <button 
                          className="btn-icon" 
                          title="Dar Respuesta Final"
                          onClick={() => handleOpenRespuesta(exp)}
                          style={{ color: '#2563eb' }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>En proceso...</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Solicitud */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Solicitar Nuevo Expediente"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSolicitar}>
              Enviar Solicitud
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Empleado</label>
          <select
            className="form-select"
            value={solicitudForm.empleado_id}
            onChange={(e) => setSolicitudForm({ ...solicitudForm, empleado_id: e.target.value })}
          >
            <option value="">Seleccionar empleado</option>
            {empleados.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.username} - {emp.email}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Nombre del Expediente</label>
          <input
            type="text"
            className="form-input"
            value={solicitudForm.nombre_expediente}
            onChange={(e) => setSolicitudForm({ ...solicitudForm, nombre_expediente: e.target.value })}
            placeholder="Ej: Solicitud de Vacaciones, Ingreso de Documentos..."
          />
        </div>
        <div className="form-group">
          <label className="form-label">Departamento</label>
          <select
            className="form-select"
            value={solicitudForm.departamento}
            onChange={(e) => setSolicitudForm({ ...solicitudForm, departamento: e.target.value })}
          >
            <option value="">Seleccionar departamento</option>
            {departamentos.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
        </div>
      </Modal>

      {/* Modal de Respuesta Final */}
      <Modal
        isOpen={isRespuestaModalOpen}
        onClose={() => setIsRespuestaModalOpen(false)}
        title={`Respuesta Final - ${selectedExpediente?.codigo}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsRespuestaModalOpen(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleRespuestaFinal}>
              Enviar Respuesta
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Acción</label>
          <select
            className="form-select"
            value={respuestaForm.accion}
            onChange={(e) => setRespuestaForm({ ...respuestaForm, accion: e.target.value })}
          >
            <option value="aprobar">Aprobar</option>
            <option value="rechazar">Rechazar</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Respuesta Final</label>
          <textarea
            className="form-input"
            rows="4"
            value={respuestaForm.respuesta}
            onChange={(e) => setRespuestaForm({ ...respuestaForm, respuesta: e.target.value })}
            placeholder="Ingrese la respuesta final para el expediente..."
          />
        </div>
      </Modal>
    </div>
  );
}