import api from './axios';

export const getCurrentUser = () => api.get('users/api/v1/me/');
export const loginUser = (credentials) => api.post('users/api/v1/login/', credentials);
export const refreshToken = (refreshTokenValue) => api.post('users/api/v1/token/refresh/', { refresh: refreshTokenValue });
export const registerUser = (userData) => api.post('users/api/v1/register/', userData);
export const getUsers = () => api.get('users/api/v1/');
export const createFuncionario = (data) => api.post('users/api/v1/admin/create-funcionario/', data);
export const updateFuncionario = (userId, data) => api.put('users/api/v1/admin/update-funcionario/' + userId + '/', data);
export const toggleActivo = (userId) => api.put('users/api/v1/admin/toggle-activo/' + userId + '/');
export const resetPassword = (userId) => api.put('users/api/v1/admin/reset-password/' + userId + '/');
export const changePassword = (data) => api.post('users/api/v1/change-password/', data);

export default api;