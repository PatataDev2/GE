import axios from 'axios';

const BASE = import.meta.env.VITE_BASE_API_URL;

const api = axios.create({ 
  baseURL: `${BASE}/api/`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if(token){
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const getMyExpedients = () => api.get('expedients/my/');
export const getExpedientDocuments = (expedientId) => api.get(`documents/?expedient=${expedientId}`);
export const uploadDocument = (formData) => api.post('documents/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getDocumentTypes = () => api.get('document-types/');

export default api;