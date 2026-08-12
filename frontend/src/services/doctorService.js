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
    // Note: Assuming there's an API for slots. If not, we fall back to generic slots handling.
    const response = await api.get(`/doctors/${doctorId}/available-slots?date=${date}`);
    return response.data;
  }
};

export default doctorService;
