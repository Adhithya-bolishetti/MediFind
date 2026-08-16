import api from './api';

const hospitalService = {
  getAll: async () => {
    const response = await api.get('/hospitals');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/hospitals/${id}`);
    return response.data;
  },

  search: async (params) => {
    // params like q, city, type
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/hospitals/search?${query}`);
    return response.data;
  },

  getNearest: async (lat, lng) => {
    const response = await api.get(`/hospitals/nearest?lat=${lat}&lng=${lng}`);
    return response.data;
  },

  // ─────────── Hospital-owner self-service ───────────
  getMyProfile: async () => {
    const response = await api.get('/hospitals/profile/me');
    return response.data;
  },

  createProfile: async (profileData) => {
    const response = await api.post('/hospitals/profile', profileData);
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/hospitals/profile/me', profileData);
    return response.data;
  },

  getProfileStatus: async () => {
    const response = await api.get('/hospitals/profile/status');
    return response.data;
  },

  // ─────────── Hospital images ───────────
  addImage: async (hospitalId, imageUrl) => {
    const response = await api.post(`/hospitals/${hospitalId}/images`, { imageUrl });
    return response.data;
  },

  replaceImage: async (imageId, imageUrl) => {
    const response = await api.put(`/hospitals/images/${imageId}`, { imageUrl });
    return response.data;
  },

  deleteImage: async (imageId) => {
    const response = await api.delete(`/hospitals/images/${imageId}`);
    return response.data;
  },

  reorderImages: async (hospitalId, orderedIds) => {
    const response = await api.put(`/hospitals/${hospitalId}/images/reorder`, { orderedIds });
    return response.data;
  },

  // ─────────── Reviews ───────────
  getReviews: async (hospitalId) => {
    const response = await api.get(`/hospitals/${hospitalId}/reviews`);
    return response.data;
  },

  createReview: async (hospitalId, data) => {
    const response = await api.post(`/hospitals/${hospitalId}/reviews`, data);
    return response.data;
  },

  // ─────────── Admin hospital management ───────────
  getAllAdmin: async () => {
    const response = await api.get('/admin/hospitals');
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/admin/hospitals/${id}/status`, { status });
    return response.data;
  },

  getPendingReviews: async () => {
    const response = await api.get('/admin/hospitals/reviews/pending');
    return response.data;
  },

  updateReviewStatus: async (reviewId, status) => {
    const response = await api.put(`/admin/hospitals/reviews/${reviewId}/status`, { status });
    return response.data;
  },

  getAllWithInactive: async () => {
    const response = await api.get('/hospitals', { params: { includeInactive: true } });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/hospitals', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/hospitals/${id}`, data);
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/hospitals/${id}`);
    return response.data;
  }
};

export default hospitalService;
