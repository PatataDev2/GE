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
  return config;
});

export const solicitarExpediente = (data) => api.post('solicitar_expediente/', data);
export const iniciarProceso = (id) => api.post(`${id}/iniciar_proceso/`);
export const validarDocumento = (id, data) => api.post(`${id}/validar_documento/`, data);
export const respuestaFinal = (id, data) => api.post(`${id}/respuesta_final/`, data);

export default api;