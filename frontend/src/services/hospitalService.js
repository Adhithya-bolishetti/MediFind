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
    // params like city, hasEmergencyService
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/hospitals/search?${query}`);
    return response.data;
  },

  getNearest: async (lat, lng) => {
    const response = await api.get(`/hospitals/nearest?lat=${lat}&lng=${lng}`);
    return response.data;
  }
};

export default hospitalService;
