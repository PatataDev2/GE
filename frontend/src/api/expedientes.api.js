import axios from 'axios';

const BASE = import.meta.env.VITE_BASE_API_URL;

const api = axios.create({
  baseURL: `${BASE}/expedientes/api/v1/`
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Solo set multipart content type para uploads de archivos
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  }
  
  return config;
});

export const getExpedientes = () => api.get('');
export const createExpediente = (expedienteData) => api.post('', expedienteData);
export const getExpediente = (id) => api.get(`${id}/`);
export const updateExpediente = (id, data) => api.patch(`${id}/`, data);
export const cambiarEstadoExpediente = (id, estado, observaciones) => 
  api.post(`${id}/cambiar_estado/`, { estado, observaciones });
export const iniciarProceso = (id) => api.post(`${id}/iniciar_proceso/`);

export const getDocumentos = (expedienteId) => 
  api.get(`documentos/?expediente=${expedienteId}`);
export const uploadDocumento = (expedienteId, formData) => 
  api.post(`${expedienteId}/upload_documento/`, formData);
export const updateDocumento = (id, data) => api.patch(`documentos/${id}/`, data);
export const cambiarEstadoDocumento = (id, estado, observaciones) => 
  api.post(`documentos/${id}/cambiar_estado/`, { estado, observaciones });

export default api;