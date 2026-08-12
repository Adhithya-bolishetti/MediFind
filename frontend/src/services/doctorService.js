import api from './api';

const doctorService = {
  getAll: async () => {
    const response = await api.get('/doctors');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/doctors/${id}`);
    return response.data;
  },

  search: async (params) => {
    // params can include specialty, city, hospitalId
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/doctors/search?${query}`);
    return response.data;
  },

  getRecommendationsBySymptoms: async (symptoms) => {
    const response = await api.post('/doctors/recommendations/symptoms', { symptoms });
    return response.data;
  },

  getAvailableSlots: async (doctorId, date) => {
    const response = await api.get(`/doctors/${doctorId}/available-slots?date=${date}`);
    return response.data;
  },

  // Day 6: Doctor Onboarding APIs
  getMyProfile: async () => {
    const response = await api.get('/doctors/profile/me');
    return response.data;
  },

  createProfile: async (profileData) => {
    const response = await api.post('/doctors/profile', profileData);
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/doctors/profile/me', profileData);
    return response.data;
  },

  uploadLicense: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/doctors/profile/license', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  submitProfile: async () => {
    const response = await api.post('/doctors/profile/submit');
    return response.data;
  },

  getProfileStatus: async () => {
    const response = await api.get('/doctors/profile/status');
    return response.data;
  },

  // Admin APIs
  getPendingDoctors: async () => {
    const response = await api.get('/admin/doctors/pending');
    return response.data;
  },

  approveDoctor: async (id) => {
    const response = await api.put(`/admin/doctors/${id}/approve`);
    return response.data;
  },

  rejectDoctor: async (id, reason) => {
    const response = await api.put(`/admin/doctors/${id}/reject`, { reason });
    return response.data;
  }
};

export default doctorService;
