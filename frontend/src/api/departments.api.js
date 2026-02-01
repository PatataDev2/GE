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

export const getDepartments = async () => {
  const response = await api.get('/departments/');
  return response.data;
};

export const getDepartment = async (id) => {
  const response = await api.get(`/departments/${id}/`);
  return response.data;
};

export const createDepartment = async (departmentData) => {
  const response = await api.post('/departments/', departmentData);
  return response.data;
};

export const updateDepartment = async (id, departmentData) => {
  const response = await api.put(`/departments/${id}/`, departmentData);
  return response.data;
};

export const deleteDepartment = async (id) => {
  const response = await api.delete(`/departments/${id}/`);
  return response.data;
};

export const toggleDepartmentStatus = async (id) => {
  const response = await api.patch(`/departments/${id}/toggle_status/`);
  return response.data;
};