import api from './axios';

export const getMyExpedients = () => api.get('api/expedients/my/');
export const getExpedientDocuments = (expedientId) => api.get('api/documents/?expedient=' + expedientId);
export const uploadDocument = (formData) => api.post('api/documents/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getDocumentTypes = () => api.get('api/document-types/');
export const requestCreateExpedient = (data) => api.post('api/expedients/request_create/', data);
export const reassignExpedient = (id, data) => api.post('api/expedients/' + id + '/reassign/', data);
export const getPendingDocs = () => api.get('api/expedients/pending_docs/');

export default api;
