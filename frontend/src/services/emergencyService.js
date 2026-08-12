import api from './api';

const emergencyService = {
  checkEmergency: async (symptoms) => {
    const response = await api.post('/emergency/check', { symptoms });
    return response.data;
  }
};

export default emergencyService;
