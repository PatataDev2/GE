import api from './axios';

export const getNotifications = (config) => api.get('/api/notifications/', config);

export const getUnreadCount = () => api.get('/api/notifications/unread_count/');

export const markAsRead = (id) => api.post(`/api/notifications/${id}/mark_read/`);

export const markAllAsRead = () => api.post('/api/notifications/mark_all_read/');

export const deleteNotification = (id) => api.delete(`/api/notifications/${id}/`);
