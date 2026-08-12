import api from './api';

const reviewService = {
  getByDoctorId: async (doctorId) => {
    const response = await api.get(`/doctors/${doctorId}/reviews`);
    return response.data;
  },

  submitReview: async (doctorId, reviewData) => {
    const response = await api.post(`/doctors/${doctorId}/reviews`, reviewData);
    return response.data;
  },

  updateReview: async (doctorId, reviewId, reviewData) => {
    const response = await api.put(`/doctors/${doctorId}/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  deleteReview: async (doctorId, reviewId) => {
    const response = await api.delete(`/doctors/${doctorId}/reviews/${reviewId}`);
    return response.data;
  }
};

export default reviewService;
