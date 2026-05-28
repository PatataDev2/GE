import axios from 'axios';

const BASE = import.meta.env.VITE_BASE_API_URL;

const api = axios.create({ 
  baseURL: `${BASE}/users/api/v1/`,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if(token){
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const getCurrentUser = () => api.get('me/');
export const loginUser = (credentials) => api.post('login/', credentials);
export const refreshToken = (refreshToken) => axios.post(`${BASE}/users/api/v1/token/refresh/`, { refresh: refreshToken });

export const registerUser = (userData) => api.post('register/', userData);
export const getUsers = () => api.get('');
export const createFuncionario = (data) => api.post('admin/create-funcionario/', data);
export const updateFuncionario = (userId, data) => api.put(`admin/update-funcionario/${userId}/`, data);
export const toggleActivo = (userId) => api.put(`admin/toggle-activo/${userId}/`);
export const resetPassword = (userId) => api.put(`admin/reset-password/${userId}/`);

export default api;
