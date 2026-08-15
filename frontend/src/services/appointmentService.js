import api from './api';

const appointmentService = {
  book: async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  getByUserId: async (userId) => {
    const response = await api.get(`/appointments/user/${userId}`);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.put(`/appointments/${id}/cancel`);
    return response.data;
  },

  accept: async (id, doctorId) => {
    const response = await api.put(`/appointments/${id}/confirm?doctorId=${doctorId}`);
    return response.data;
  },

  decline: async (id, doctorId) => {
    const response = await api.put(`/appointments/${id}/decline?doctorId=${doctorId}`);
    return response.data;
  },

  // Admin appointment management
  getAllAdmin: async (params) => {
    const response = await api.get('/admin/appointments', { params });
    return response.data;
  },

  getByIdAdmin: async (id) => {
    const response = await api.get(`/admin/appointments/${id}`);
    return response.data;
  },

  cancelAdmin: async (id) => {
    const response = await api.put(`/admin/appointments/${id}/cancel`);
    return response.data;
  },

  deleteByUser: async (userId) => {
    const response = await api.delete(`/admin/appointments/user/${userId}`);
    return response.data;
  },

  deleteByDoctor: async (doctorId) => {
    const response = await api.delete(`/admin/appointments/doctor/${doctorId}`);
    return response.data;
  }
};

export default appointmentService;
