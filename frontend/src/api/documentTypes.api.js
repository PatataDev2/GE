import axios from 'axios';

const BASE = import.meta.env.VITE_BASE_API_URL;

const api = axios.create({
  baseURL: BASE,
});

// Agregar interceptor para incluir token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Agregar interceptor para incluir token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const getDocumentTypes = async () => {
  const response = await api.get('/document-types/');
  return response.data;
};

export const getDocumentType = async (id) => {
  const response = await api.get(`/document-types/${id}/`);
  return response.data;
};

export const createDocumentType = async (documentTypeData) => {
  const response = await api.post('/document-types/', documentTypeData);
  return response.data;
};

export const updateDocumentType = async (id, documentTypeData) => {
  const response = await api.put(`/document-types/${id}/`, documentTypeData);
  return response.data;
};

export const deleteDocumentType = async (id) => {
  const response = await api.delete(`/document-types/${id}/`);
  return response.data;
};

export const toggleDocumentTypeStatus = async (id) => {
  const response = await api.patch(`/document-types/${id}/toggle_status/`);
  return response.data;
};