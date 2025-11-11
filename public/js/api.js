// api.js - Enhanced version with better error handling
const API_BASE_URL = window.location.origin + '/api';

// Helper function to handle API responses
async function handleResponse(response) {
    const text = await response.text();
    
    if (!response.ok) {
        let errorMessage = 'Network response was not ok';
        try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
    }
    
    try {
        return text ? JSON.parse(text) : {};
    } catch (e) {
        throw new Error('Invalid JSON response from server');
    }
}

const apiService = {
    // Auth endpoints
    async signup(userData) {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return handleResponse(response);
    },

    async login(credentials) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return handleResponse(response);
    },

    // Doctor endpoints
    async getDoctors() {
        const response = await fetch(`${API_BASE_URL}/doctors`);
        return handleResponse(response);
    },

    async getDoctorById(id) {
        const response = await fetch(`${API_BASE_URL}/doctors/${id}`);
        return handleResponse(response);
    },

    async searchDoctors(params) {
        const queryString = new URLSearchParams(params).toString();
        console.log('Making search request to:', `${API_BASE_URL}/doctors/search?${queryString}`);
        
        const response = await fetch(`${API_BASE_URL}/doctors/search?${queryString}`);
        return handleResponse(response);
    },

    async registerDoctor(doctorData) {
        const response = await fetch(`${API_BASE_URL}/doctors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(doctorData)
        });
        return handleResponse(response);
    },

    async updateDoctor(id, doctorData) {
        const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(doctorData)
        });
        return handleResponse(response);
    },

    // Review endpoints
    async getReviews(doctorId) {
        const response = await fetch(`${API_BASE_URL}/reviews/doctor/${doctorId}`);
        return handleResponse(response);
    },

    async addReview(reviewData) {
        const response = await fetch(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
        return handleResponse(response);
    },

    // Appointment endpoints
    async getDoctorAppointments(doctorId) {
        const response = await fetch(`${API_BASE_URL}/appointments/doctor/${doctorId}`);
        return handleResponse(response);
    },

    async getUserAppointments(userId) {
        const response = await fetch(`${API_BASE_URL}/appointments/user/${userId}`);
        return handleResponse(response);
    },

    async bookAppointment(appointmentData) {
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointmentData)
        });
        return handleResponse(response);
    },

    async updateAppointment(id, status) {
        const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        return handleResponse(response);
    },

    async deleteAppointment(id) {
        const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
            method: 'DELETE'
        });
        return handleResponse(response);
    }
};

// Make apiService globally available
window.apiService = apiService;