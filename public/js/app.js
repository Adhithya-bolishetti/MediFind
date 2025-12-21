// Global variables
let currentUser = null;
let userLocation = null;

// DOM Elements
const searchSection = document.getElementById('search-section');
const resultsSection = document.getElementById('results-section');
const allDoctorsSection = document.getElementById('all-doctors-section');
const medicalShopsSection = document.getElementById('medical-shops-section');
const registrationSection = document.getElementById('registration-section');
const appointmentsSection = document.getElementById('appointments-section');
const profileSection = document.getElementById('profile-section');
const medicalShopOwnerSection = document.getElementById('medical-shop-owner-section');
const remediesSection = document.getElementById('remedies-section');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing MediFind');
    
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
    
    // Set up event listeners
    setupEventListeners();
    
    // Show search section by default
    showSearchSection();
    
    // Initialize current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    console.log('Application initialization complete');
});

// Setup all event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // ==================== NAVIGATION ====================
    
    // Main navigation
    document.getElementById('nav-search').addEventListener('click', function(e) {
        e.preventDefault();
        showSearchSection();
    });
    
    document.getElementById('nav-all-doctors').addEventListener('click', function(e) {
        e.preventDefault();
        showAllDoctorsSection();
    });
    
    document.getElementById('nav-medical-shops').addEventListener('click', function(e) {
        e.preventDefault();
        showMedicalShopsSection();
    });
    
    document.getElementById('nav-register').addEventListener('click', function(e) {
        e.preventDefault();
        showRegistrationSection();
    });
    
    document.getElementById('nav-appointments').addEventListener('click', function(e) {
        e.preventDefault();
        showAppointmentsSection();
    });
    
    document.getElementById('nav-medical-shop-owner').addEventListener('click', function(e) {
        e.preventDefault();
        showMedicalShopOwnerSection();
    });
    
    // Footer navigation
    document.getElementById('footer-find-doctors').addEventListener('click', function(e) {
        e.preventDefault();
        showSearchSection();
    });
    
    document.getElementById('footer-all-doctors').addEventListener('click', function(e) {
        e.preventDefault();
        showAllDoctorsSection();
    });
    
    document.getElementById('footer-medical-shops').addEventListener('click', function(e) {
        e.preventDefault();
        showMedicalShopsSection();
    });
    
    document.getElementById('footer-appointments').addEventListener('click', function(e) {
        e.preventDefault();
        showAppointmentsSection();
    });
    
    // ==================== AUTHENTICATION ====================
    
    document.getElementById('login-btn').addEventListener('click', function() {
        document.getElementById('auth-modal').style.display = 'flex';
    });
    
    document.getElementById('signup-btn').addEventListener('click', function() {
        document.getElementById('signup-modal').style.display = 'flex';
    });
    
    document.getElementById('logout-btn').addEventListener('click', function() {
        logout();
    });
    
    // ==================== SEARCH FUNCTIONALITY ====================
    
    // Search form
    document.getElementById('search-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const symptoms = document.getElementById('symptoms-input').value.trim();
        
        if (!symptoms) {
            alert('Please enter symptoms to search for doctors.');
            return;
        }
        
        // Show remedies section
        displayRemedies(symptoms);
        
        // Search for doctors
        if (typeof searchBySymptoms === 'function') {
            searchBySymptoms(symptoms);
        }
    });
    
    // Remedies search button
    const remediesBtn = document.getElementById('search-remedies-btn');
    if (remediesBtn) {
        remediesBtn.addEventListener('click', function() {
            const symptoms = document.getElementById('symptoms-input').value.trim();
            if (symptoms) {
                displayRemedies(symptoms);
            } else {
                alert('Please enter symptoms to search for remedies.');
            }
        });
    }
    
    // Use current location button
    document.getElementById('use-current-location').addEventListener('click', function() {
        const locationText = document.getElementById('location-input').value.trim();
        
        if (locationText) {
            if (typeof findDoctorsByLocation === 'function') {
                findDoctorsByLocation(locationText);
            }
        } else {
            if (typeof getCurrentLocationForSearch === 'function') {
                getCurrentLocationForSearch();
            }
        }
    });
    
    // Quick symptom buttons
    document.querySelectorAll('.symptom-btn').forEach(button => {
        button.addEventListener('click', function() {
            const symptom = this.getAttribute('data-symptom');
            document.getElementById('symptoms-input').value = symptom;
            
            // Show remedies
            displayRemedies(symptom);
            
            // Search doctors
            if (typeof searchBySymptoms === 'function') {
                searchBySymptoms(symptom);
            }
        });
    });
    
    // ==================== MODALS ====================
    
    // Close buttons for all modals
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // ==================== FORM SUBMISSIONS ====================
    
    // Doctor registration form
    document.getElementById('doctor-registration-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentUser || currentUser.type !== 'doctor') {
            alert('Only doctors can register.');
            return;
        }
        
        const doctorData = {
            name: document.getElementById('doctor-name').value,
            specialty: document.getElementById('doctor-specialty').value,
            email: document.getElementById('doctor-email').value,
            phone: document.getElementById('doctor-phone').value,
            address: document.getElementById('doctor-address').value,
            city: document.getElementById('doctor-city').value,
            lat: getRandomInRange(35, 45),
            lng: getRandomInRange(-120, -75),
            bio: document.getElementById('doctor-bio').value,
            education: document.getElementById('doctor-education').value,
            experience: parseInt(document.getElementById('doctor-experience').value),
            userId: currentUser.id
        };
        
        try {
            const doctor = await apiService.registerDoctor(doctorData);
            alert('Doctor registered successfully!');
            
            // Update user name
            currentUser.name = doctor.name;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUIForUser();
            
            // Show profile
            showProfileSection(doctor);
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed: ' + error.message);
        }
    });
    
    // Medical shop registration form
    const medicalShopForm = document.getElementById('medical-shop-registration-form');
    if (medicalShopForm) {
        medicalShopForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!currentUser || currentUser.type !== 'medical_shop') {
                alert('Only medical shop owners can register a shop.');
                return;
            }
            
            const shopData = {
                shopName: document.getElementById('shop-name').value,
                ownerName: document.getElementById('shop-owner-name').value,
                email: document.getElementById('shop-email').value,
                phone: document.getElementById('shop-phone').value,
                address: document.getElementById('shop-address').value,
                city: document.getElementById('shop-city').value,
                lat: userLocation ? userLocation.lat : getRandomInRange(40.5, 40.9),
                lng: userLocation ? userLocation.lng : getRandomInRange(-74.1, -73.9),
                licenseNumber: document.getElementById('shop-license').value,
                ownerId: currentUser.id
            };
            
            try {
                const shop = await apiService.registerMedicalShop(shopData);
                alert('Medical shop registered successfully!');
                
                // Refresh dashboard
                if (typeof loadMedicalShopOwnerDashboard === 'function') {
                    loadMedicalShopOwnerDashboard();
                }
                
                // Close modal
                document.getElementById('shop-registration-modal').style.display = 'none';
            } catch (error) {
                console.error('Shop registration error:', error);
                alert('Registration failed: ' + error.message);
            }
        });
    }
    
    // Setup login/signup modal tabs
    setupAuthModalTabs();
    
    // Medical shop search
    const searchShopsBtn = document.getElementById('search-shops-btn');
    if (searchShopsBtn) {
        searchShopsBtn.addEventListener('click', function() {
            if (typeof searchMedicalShops === 'function') {
                searchMedicalShops();
            }
        });
    }
    
    const searchMedicalShopsInput = document.getElementById('search-medical-shops');
    if (searchMedicalShopsInput) {
        searchMedicalShopsInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (typeof searchMedicalShops === 'function') {
                    searchMedicalShops();
                }
            }
        });
    }
    
    console.log('Event listeners setup complete');
}

// Setup auth modal tabs
function setupAuthModalTabs() {
    // Login options
    document.querySelectorAll('#auth-modal .login-option').forEach(option => {
        option.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            
            // Update active tab
            document.querySelectorAll('#auth-modal .login-option').forEach(opt => {
                opt.classList.remove('active');
            });
            this.classList.add('active');
            
            // Show corresponding form
            document.querySelectorAll('#auth-modal .login-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(`${type}-login-form`).classList.add('active');
            
            // Update modal title
            document.getElementById('auth-modal-title').textContent = `Login as ${type === 'medical_shop' ? 'Medical Shop Owner' : type.charAt(0).toUpperCase() + type.slice(1)}`;
        });
    });
    
    // Signup options
    document.querySelectorAll('#signup-modal .login-option').forEach(option => {
        option.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            
            // Update active tab
            document.querySelectorAll('#signup-modal .login-option').forEach(opt => {
                opt.classList.remove('active');
            });
            this.classList.add('active');
            
            // Show corresponding form
            document.querySelectorAll('#signup-modal .login-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(`${type}-signup-form`).classList.add('active');
            
            // Update modal title
            document.getElementById('signup-modal-title').textContent = `Sign up as ${type === 'medical_shop' ? 'Medical Shop Owner' : type.charAt(0).toUpperCase() + type.slice(1)}`;
        });
    });
    
    // Switch between login and signup
    document.getElementById('switch-to-signup').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('auth-modal').style.display = 'none';
        document.getElementById('signup-modal').style.display = 'flex';
    });
    
    document.getElementById('switch-to-login').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('signup-modal').style.display = 'none';
        document.getElementById('auth-modal').style.display = 'flex';
    });
    
    // Login form submissions
    document.getElementById('customer-login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('customer-email').value;
        const password = document.getElementById('customer-password').value;
        loginUser(email, password, 'customer');
    });
    
    document.getElementById('doctor-login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('doctor-email').value;
        const password = document.getElementById('doctor-password').value;
        loginUser(email, password, 'doctor');
    });
    
    document.getElementById('medical-shop-login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('shop-email').value;
        const password = document.getElementById('shop-password').value;
        loginUser(email, password, 'medical_shop');
    });
    
    // Signup form submissions
    document.getElementById('customer-signup-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('customer-signup-name').value;
        const email = document.getElementById('customer-signup-email').value;
        const password = document.getElementById('customer-signup-password').value;
        signupUser(name, email, password, 'customer');
    });
    
    document.getElementById('doctor-signup-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('doctor-signup-name').value;
        const email = document.getElementById('doctor-signup-email').value;
        const password = document.getElementById('doctor-signup-password').value;
        signupUser(name, email, password, 'doctor');
    });
    
    document.getElementById('medical-shop-signup-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('shop-owner-name').value;
        const email = document.getElementById('shop-owner-email').value;
        const password = document.getElementById('shop-owner-password').value;
        signupUser(name, email, password, 'medical_shop');
    });
}

// ==================== NAVIGATION FUNCTIONS ====================

function showSearchSection() {
    console.log('Showing Search Section');
    hideAllSections();
    searchSection.style.display = 'block';
    resultsSection.style.display = 'block';
    updateActiveNav('nav-search');
}

function showAllDoctorsSection() {
    console.log('Showing All Doctors Section');
    
    // Check if user is customer or not logged in
    if (currentUser && currentUser.type !== 'customer') {
        alert('Only customers can view all doctors.');
        return;
    }
    
    hideAllSections();
    allDoctorsSection.style.display = 'block';
    updateActiveNav('nav-all-doctors');
    
    // Load doctors
    if (typeof displayAllDoctors === 'function') {
        displayAllDoctors();
    }
}

function showMedicalShopsSection() {
    console.log('Showing Medical Shops Section');
    
    // Check if user is customer or not logged in
    if (currentUser && currentUser.type !== 'customer') {
        alert('Only customers can view medical shops.');
        return;
    }
    
    hideAllSections();
    medicalShopsSection.style.display = 'block';
    updateActiveNav('nav-medical-shops');
    
    // Load medical shops
    if (typeof loadMedicalShops === 'function') {
        loadMedicalShops();
    }
}

function showRegistrationSection() {
    console.log('Showing Doctor Registration Section');
    
    if (!currentUser || currentUser.type !== 'doctor') {
        alert('Only doctors can access this page.');
        if (!currentUser) {
            document.getElementById('auth-modal').style.display = 'flex';
        }
        return;
    }
    
    hideAllSections();
    registrationSection.style.display = 'block';
    updateActiveNav('nav-register');
    
    // Pre-fill form
    document.getElementById('doctor-name').value = currentUser.name;
    document.getElementById('doctor-email').value = currentUser.email;
}

function showAppointmentsSection() {
    console.log('Showing Appointments Section');
    
    if (!currentUser || currentUser.type !== 'doctor') {
        alert('Only doctors can access appointments.');
        return;
    }
    
    hideAllSections();
    appointmentsSection.style.display = 'block';
    updateActiveNav('nav-appointments');
    
    // Load appointments
    if (typeof displayAppointments === 'function') {
        displayAppointments();
    }
}

function showMedicalShopOwnerSection() {
    console.log('Showing Medical Shop Owner Section');
    
    if (!currentUser || currentUser.type !== 'medical_shop') {
        alert('Only medical shop owners can access this page.');
        if (!currentUser) {
            document.getElementById('auth-modal').style.display = 'flex';
        }
        return;
    }
    
    hideAllSections();
    medicalShopOwnerSection.style.display = 'block';
    updateActiveNav('nav-medical-shop-owner');
    
    // Load dashboard
    if (typeof loadMedicalShopOwnerDashboard === 'function') {
        loadMedicalShopOwnerDashboard();
    }
}

function showProfileSection(doctor = null) {
    console.log('Showing Profile Section');
    
    if (!currentUser || currentUser.type !== 'doctor') {
        alert('Doctor profile not available.');
        return;
    }
    
    hideAllSections();
    profileSection.style.display = 'block';
    updateActiveNav('nav-profile');
    
    // Load profile data
    if (typeof loadProfileData === 'function') {
        loadProfileData(doctor);
    }
}

function hideAllSections() {
    console.log('Hiding all sections');
    const sections = [
        searchSection, resultsSection, allDoctorsSection, medicalShopsSection,
        registrationSection, appointmentsSection, profileSection, 
        medicalShopOwnerSection, remediesSection
    ];
    
    sections.forEach(section => {
        if (section) section.style.display = 'none';
    });
}

function updateActiveNav(navId) {
    console.log('Updating active nav to:', navId);
    const navItems = ['nav-search', 'nav-all-doctors', 'nav-medical-shops', 
                     'nav-register', 'nav-appointments', 'nav-medical-shop-owner', 'nav-profile'];
    
    navItems.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('active');
        }
    });
    
    const activeNav = document.getElementById(navId);
    if (activeNav) {
        activeNav.classList.add('active');
    }
}

// ==================== AUTHENTICATION FUNCTIONS ====================

async function loginUser(email, password, type) {
    console.log('Attempting login for:', email, 'type:', type);
    
    try {
        const result = await apiService.login({ email, password });
        
        if (result.error) {
            alert(result.error);
            return;
        }
        
        // Check if user type matches
        if (type && result.type !== type) {
            alert(`Please login as a ${result.type === 'medical_shop' ? 'Medical Shop Owner' : result.type}`);
            return;
        }
        
        currentUser = result;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUIForUser();
        
        // Close modal
        document.getElementById('auth-modal').style.display = 'none';
        
        alert(`Welcome back, ${currentUser.name}!`);
        
        // Redirect based on user type
        if (currentUser.type === 'doctor') {
            showRegistrationSection();
        } else if (currentUser.type === 'medical_shop') {
            showMedicalShopOwnerSection();
        } else {
            showSearchSection();
        }
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please check your credentials.');
    }
}

async function signupUser(name, email, password, type) {
    console.log('Attempting signup for:', name, email, 'type:', type);
    
    try {
        const result = await apiService.signup({ name, email, password, type });
        
        if (result.error) {
            alert(result.error);
            return;
        }
        
        currentUser = result;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUIForUser();
        
        // Close modal
        document.getElementById('signup-modal').style.display = 'none';
        
        alert(`Account created successfully! Welcome, ${name}!`);
        
        // Redirect based on user type
        if (currentUser.type === 'doctor') {
            showRegistrationSection();
        } else if (currentUser.type === 'medical_shop') {
            showMedicalShopOwnerSection();
        } else {
            showSearchSection();
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed. Please try again.');
    }
}

function logout() {
    console.log('Logging out');
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUIForUser();
    alert('You have been logged out.');
    showSearchSection();
}

function updateUIForUser() {
    console.log('Updating UI for user:', currentUser);
    
    // Reset all nav items first
    document.getElementById('nav-search').style.display = 'none';
    document.getElementById('nav-all-doctors').style.display = 'none';
    document.getElementById('nav-medical-shops').style.display = 'none';
    document.getElementById('nav-register').style.display = 'none';
    document.getElementById('nav-appointments').style.display = 'none';
    document.getElementById('nav-medical-shop-owner').style.display = 'none';
    
    if (currentUser) {
        // Show user info, hide auth buttons
        document.getElementById('auth-buttons').style.display = 'none';
        document.getElementById('user-info').style.display = 'flex';
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
        
        // Show appropriate navigation based on user type
        if (currentUser.type === 'customer') {
            document.getElementById('nav-search').style.display = 'block';
            document.getElementById('nav-all-doctors').style.display = 'block';
            document.getElementById('nav-medical-shops').style.display = 'block';
            
        } else if (currentUser.type === 'doctor') {
            document.getElementById('nav-register').style.display = 'block';
            document.getElementById('nav-appointments').style.display = 'block';
            
        } else if (currentUser.type === 'medical_shop') {
            document.getElementById('nav-medical-shop-owner').style.display = 'block';
        }
        
    } else {
        // No user logged in
        document.getElementById('auth-buttons').style.display = 'flex';
        document.getElementById('user-info').style.display = 'none';
        
        // Show public navigation
        document.getElementById('nav-search').style.display = 'block';
        document.getElementById('nav-all-doctors').style.display = 'block';
        document.getElementById('nav-medical-shops').style.display = 'block';
    }
}

// ==================== UTILITY FUNCTIONS ====================

function getRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Make functions globally available
window.showSearchSection = showSearchSection;
window.showAllDoctorsSection = showAllDoctorsSection;
window.showMedicalShopsSection = showMedicalShopsSection;
window.showRegistrationSection = showRegistrationSection;
window.showAppointmentsSection = showAppointmentsSection;
window.showMedicalShopOwnerSection = showMedicalShopOwnerSection;
window.showProfileSection = showProfileSection;
window.loginUser = loginUser;
window.signupUser = signupUser;
window.logout = logout;
window.getRandomInRange = getRandomInRange;

console.log('App.js loaded successfully');
