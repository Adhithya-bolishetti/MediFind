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
  }
};

export default appointmentService;
