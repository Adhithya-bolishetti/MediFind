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
  },

  // Hospital Reviews
  getHospitalReviews: async (hospitalId) => {
    const response = await api.get(`/hospitals/${hospitalId}/reviews`);
    return response.data;
  },

  submitHospitalReview: async (hospitalId, reviewData) => {
    const response = await api.post(`/hospitals/${hospitalId}/reviews`, reviewData);
    return response.data;
  },

  updateHospitalReview: async (hospitalId, reviewId, reviewData) => {
    const response = await api.put(`/hospitals/${hospitalId}/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  deleteHospitalReview: async (hospitalId, reviewId) => {
    const response = await api.delete(`/hospitals/${hospitalId}/reviews/${reviewId}`);
    return response.data;
  }
};

export default reviewService;
