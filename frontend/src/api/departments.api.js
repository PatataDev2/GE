import api from './axios';

export const getDepartments = async () => {
  const response = await api.get('api/departments/');
  return response.data;
};

export const getDepartment = async (id) => {
  const response = await api.get('api/departments/' + id + '/');
  return response.data;
};

export const createDepartment = async (departmentData) => {
  const response = await api.post('api/departments/', departmentData);
  return response.data;
};

export const updateDepartment = async (id, departmentData) => {
  const response = await api.put('api/departments/' + id + '/', departmentData);
  return response.data;
};

export const deleteDepartment = async (id) => {
  const response = await api.delete('api/departments/' + id + '/');
  return response.data;
};

export const toggleDepartmentStatus = async (id) => {
  const response = await api.patch('api/departments/' + id + '/toggle_status/');
  return response.data;
};

export default api;
