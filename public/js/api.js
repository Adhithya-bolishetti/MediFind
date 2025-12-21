
// API Service
const apiService = {
    // Base URL for API
    baseURL: 'http://localhost:3000/api',
    
    // User Authentication
    async login(credentials) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
            return await response.json();
        } catch (error) {
            console.error('Login API error:', error);
            return { error: 'Network error. Please try again.' };
        }
    },
    
    async signup(userData) {
        try {
            const response = await fetch(`${this.baseURL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            return await response.json();
        } catch (error) {
            console.error('Signup API error:', error);
            return { error: 'Network error. Please try again.' };
        }
    },
    
    // Doctors
    async getDoctors() {
        try {
            const response = await fetch(`${this.baseURL}/doctors`);
            return await response.json();
        } catch (error) {
            console.error('Get doctors error:', error);
            return { error: 'Failed to load doctors.' };
        }
    },
    
    async getDoctorById(id) {
        try {
            const response = await fetch(`${this.baseURL}/doctors/${id}`);
            return await response.json();
        } catch (error) {
            console.error('Get doctor by ID error:', error);
            return { error: 'Failed to load doctor.' };
        }
    },
    
    async searchDoctors(params) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${this.baseURL}/doctors/search?${queryString}`);
            return await response.json();
        } catch (error) {
            console.error('Search doctors error:', error);
            return { error: 'Search failed.' };
        }
    },
    
    async registerDoctor(doctorData) {
        try {
            const response = await fetch(`${this.baseURL}/doctors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(doctorData)
            });
            return await response.json();
        } catch (error) {
            console.error('Register doctor error:', error);
            return { error: 'Registration failed.' };
        }
    },
    
    // Reviews
    async getReviews(doctorId) {
        try {
            const response = await fetch(`${this.baseURL}/reviews/doctor/${doctorId}`);
            return await response.json();
        } catch (error) {
            console.error('Get reviews error:', error);
            return { error: 'Failed to load reviews.' };
        }
    },
    
    async addReview(reviewData) {
        try {
            const response = await fetch(`${this.baseURL}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reviewData)
            });
            return await response.json();
        } catch (error) {
            console.error('Add review error:', error);
            return { error: 'Failed to submit review.' };
        }
    },
    
    // Appointments
    async getDoctorAppointments(doctorId) {
        try {
            const response = await fetch(`${this.baseURL}/appointments/doctor/${doctorId}`);
            return await response.json();
        } catch (error) {
            console.error('Get appointments error:', error);
            return { error: 'Failed to load appointments.' };
        }
    },
    
    async bookAppointment(appointmentData) {
        try {
            const response = await fetch(`${this.baseURL}/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            });
            return await response.json();
        } catch (error) {
            console.error('Book appointment error:', error);
            return { error: 'Failed to book appointment.' };
        }
    },
    
    async updateAppointment(appointmentId, status) {
        try {
            const response = await fetch(`${this.baseURL}/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            return await response.json();
        } catch (error) {
            console.error('Update appointment error:', error);
            return { error: 'Failed to update appointment.' };
        }
    },
    
    async deleteAppointment(appointmentId) {
        try {
            const response = await fetch(`${this.baseURL}/appointments/${appointmentId}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('Delete appointment error:', error);
            return { error: 'Failed to delete appointment.' };
        }
    },
    
    // Medical Shops
    async getMedicalShops(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${this.baseURL}/medicalshops?${queryString}`);
            return await response.json();
        } catch (error) {
            console.error('Get medical shops error:', error);
            return { error: 'Failed to load medical shops.' };
        }
    },
    
    async getMedicalShopByOwner(ownerId) {
        try {
            const response = await fetch(`${this.baseURL}/medicalshops/owner/${ownerId}`);
            return await response.json();
        } catch (error) {
            console.error('Get medical shop by owner error:', error);
            return { error: 'Failed to load medical shop.' };
        }
    },
    
    async registerMedicalShop(shopData) {
        try {
            const response = await fetch(`${this.baseURL}/medicalshops/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(shopData)
            });
            return await response.json();
        } catch (error) {
            console.error('Register medical shop error:', error);
            return { error: 'Registration failed.' };
        }
    },
    
    // Remedies
    async getRemedies(symptoms) {
        try {
            const response = await fetch(`${this.baseURL}/remedies?symptoms=${encodeURIComponent(symptoms)}`);
            return await response.json();
        } catch (error) {
            console.error('Get remedies error:', error);
            return { error: 'Failed to load remedies.' };
        }
    }
};

// Make apiService globally available
window.apiService = apiService;

// Global variables
let currentUser = null;
let userLocation = null;
let map = null;
let userMarker = null;
let doctorMarkers = [];
let currentDoctorId = null;
let currentSearchType = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('Found saved user:', currentUser);
            updateUIForUser();
        } catch (e) {
            console.error('Error parsing saved user:', e);
            localStorage.removeItem('currentUser');
        }
    }
    
    // Initialize map
    if (typeof initMap === 'function') {
        initMap();
    }
    
    // Set minimum date to today for booking
    const today = new Date().toISOString().split('T')[0];
    const bookingDate = document.getElementById('booking-date');
    if (bookingDate) {
        bookingDate.min = today;
    }
    
    // Update footer year
    const currentYear = document.getElementById('current-year');
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }
    
    console.log('Application initialized successfully');
});

// Update UI for user
function updateUIForUser() {
    console.log('Updating UI for user:', currentUser);
    
    const navSearch = document.getElementById('nav-search');
    const navAllDoctors = document.getElementById('nav-all-doctors');
    const navMedicalShops = document.getElementById('nav-medical-shops');
    const navRegister = document.getElementById('nav-register');
    const navAppointments = document.getElementById('nav-appointments');
    const navProfile = document.getElementById('nav-profile');
    const navMedicalShopOwner = document.getElementById('nav-medical-shop-owner');
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    
    if (currentUser) {
        // Show user info, hide auth buttons
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userName) userName.textContent = currentUser.name;
        if (userAvatar) userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
        
        // Reset all navigation items first
        if (navSearch) navSearch.style.display = 'none';
        if (navAllDoctors) navAllDoctors.style.display = 'none';
        if (navMedicalShops) navMedicalShops.style.display = 'none';
        if (navRegister) navRegister.style.display = 'none';
        if (navAppointments) navAppointments.style.display = 'none';
        if (navProfile) navProfile.style.display = 'none';
        if (navMedicalShopOwner) navMedicalShopOwner.style.display = 'none';
        
        // Set navigation based on user type
        if (currentUser.type === 'customer') {
            // Customer: Can see Find Doctors, All Doctors, Medical Shops
            if (navSearch) navSearch.style.display = 'block';
            if (navAllDoctors) navAllDoctors.style.display = 'block';
            if (navMedicalShops) navMedicalShops.style.display = 'block';
            
        } else if (currentUser.type === 'doctor') {
            // Doctor: Can see Doctor Registration, Appointments
            if (navRegister) navRegister.style.display = 'block';
            if (navAppointments) navAppointments.style.display = 'block';
            if (navProfile) navProfile.style.display = 'block';
            
        } else if (currentUser.type === 'medical_shop') {
            // Medical Shop Owner: Can see Medical Shop Registration
            if (navMedicalShopOwner) navMedicalShopOwner.style.display = 'block';
        }
        
    } else {
        // No user logged in - show public navigation
        if (authButtons) authButtons.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';
        
        // Show only public features
        if (navSearch) navSearch.style.display = 'block';
        if (navAllDoctors) navAllDoctors.style.display = 'block';
        if (navMedicalShops) navMedicalShops.style.display = 'block';
        
        // Hide authenticated features
        if (navRegister) navRegister.style.display = 'none';
        if (navAppointments) navAppointments.style.display = 'none';
        if (navProfile) navProfile.style.display = 'none';
        if (navMedicalShopOwner) navMedicalShopOwner.style.display = 'none';
    }
}

// Logout function
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUIForUser();
    
    alert('You have been logged out.');
    
    // Redirect to search section
    if (typeof showSearchSection === 'function') {
        showSearchSection();
    }
}

// Make functions globally available
window.updateUIForUser = updateUIForUser;
window.logout = logout;
