import api from './axios';

export const getDocumentTypes = async () => {
  const response = await api.get('api/document-types/');
  return response.data;
};

export const getDocumentType = async (id) => {
  const response = await api.get('api/document-types/' + id + '/');
  return response.data;
};

export const createDocumentType = async (documentTypeData) => {
  const response = await api.post('api/document-types/', documentTypeData);
  return response.data;
};

export const updateDocumentType = async (id, documentTypeData) => {
  const response = await api.put('api/document-types/' + id + '/', documentTypeData);
  return response.data;
};

export const deleteDocumentType = async (id) => {
  const response = await api.delete('api/document-types/' + id + '/');
  return response.data;
};

export const toggleDocumentTypeStatus = async (id) => {
  const response = await api.patch('api/document-types/' + id + '/toggle_status/');
  return response.data;
};

export default api;
