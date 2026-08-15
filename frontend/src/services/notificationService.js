import api from './api';

// The backend returns `read` (boolean). The UI uses `isRead` everywhere,
// so normalize responses once here.
const normalize = (data) => {
  if (Array.isArray(data)) {
    return data.map(n => ({
      ...n,
      isRead: n.isRead !== undefined ? n.isRead : !!n.read,
    }));
  }
  if (data && typeof data === 'object') {
    return { ...data, isRead: data.isRead !== undefined ? data.isRead : !!data.read };
  }
  return data;
};

const notificationService = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return normalize(response.data);
  },

  getUnread: async () => {
    const response = await api.get('/notifications/unread');
    return normalize(response.data);
  },

  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return normalize(response.data);
  },

  delete: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  }
};

export default notificationService;
