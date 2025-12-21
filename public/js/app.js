// Setup all event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // ==================== NAVIGATION ====================
    
    // Main navigation
    const navSearch = document.getElementById('nav-search');
    const navAllDoctors = document.getElementById('nav-all-doctor')
    const navMedicalShops = document.getElementById('nav-medical-shops');
    const navRegister = document.getElementById('nav-register');
    const navAppointments = document.getElementById('nav-appointments');
    const navMedicalShopOwner = document.getElementById('nav-medical-shop-owner');
    
    if (navSearch) {
        navSearch.addEventListener('click', function(e) {
            e.preventDefault();
            showSearchSection();
        });
    }
    
    if (navAllDoctors) {
        navAllDoctors.addEventListener('click', function(e) {
            e.preventDefault();
            showAllDoctorsSection();
        });
    }
    
    if (navMedicalShops) {
        navMedicalShops.addEventListener('click', function(e) {
            e.preventDefault();
            showMedicalShopsSection();
        });
    }
    
    if (navRegister) {
        navRegister.addEventListener('click', function(e) {
            e.preventDefault();
            showRegistrationSection();
        });
    }
    
    if (navAppointments) {
        navAppointments.addEventListener('click', function(e) {
            e.preventDefault();
            showAppointmentsSection();
        });
    }
    
    if (navMedicalShopOwner) {
        navMedicalShopOwner.addEventListener('click', function(e) {
            e.preventDefault();
            showMedicalShopOwnerSection();
        });
    }
    
    // ==================== AUTHENTICATION ====================
    
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            openAuthModal('login');
        });
    }
    
    if (signupBtn) {
        signupBtn.addEventListener('click', function() {
            openAuthModal('signup');
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
        });
    }
    
    // ==================== SEARCH FUNCTIONALITY ====================
    
    // Search form
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const symptoms = document.getElementById('symptoms-input').value.trim();
            
            if (!symptoms) {
                alert('Please enter symptoms to search for doctors.');
                return;
            }
            
            // Hide remedies section and show doctors section
            const remediesSection = document.getElementById('remedies-section');
            const resultsSection = document.getElementById('results-section');
            if (remediesSection) remediesSection.style.display = 'none';
            if (resultsSection) resultsSection.style.display = 'block';
            
            // Search for doctors ONLY
            if (typeof searchBySymptoms === 'function') {
                searchBySymptoms(symptoms);
            }
        });
    }
    
    // Remedies search button - FIXED: Only show remedies
    const remediesBtn = document.getElementById('search-remedies-btn');
    if (remediesBtn) {
        remediesBtn.addEventListener('click', function() {
            const symptoms = document.getElementById('symptoms-input').value.trim();
            if (symptoms) {
                // Hide doctors results and show remedies
                const resultsSection = document.getElementById('results-section');
                if (resultsSection) resultsSection.style.display = 'none';
                
                if (typeof displayRemedies === 'function') {
                    displayRemedies(symptoms);
                }
            } else {
                alert('Please enter symptoms to search for remedies.');
            }
        });
    }
    
    // Use current location button
    const useCurrentLocationBtn = document.getElementById('use-current-location');
    if (useCurrentLocationBtn) {
        useCurrentLocationBtn.addEventListener('click', function() {
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
    }
    
    // Quick symptom buttons - FIXED: Only show doctors
    document.querySelectorAll('.symptom-btn').forEach(button => {
        button.addEventListener('click', function() {
            const symptom = this.getAttribute('data-symptom');
            const symptomsInput = document.getElementById('symptoms-input');
            if (symptomsInput) {
                symptomsInput.value = symptom;
            }
            
            // Hide remedies and show doctors
            const remediesSection = document.getElementById('remedies-section');
            const resultsSection = document.getElementById('results-section');
            if (remediesSection) remediesSection.style.display = 'none';
            if (resultsSection) resultsSection.style.display = 'block';
            
            // Search doctors ONLY
            if (typeof searchBySymptoms === 'function') {
                searchBySymptoms(symptom);
            }
        });
    });
    
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
    const doctorRegistrationForm = document.getElementById('doctor-registration-form');
    if (doctorRegistrationForm) {
        doctorRegistrationForm.addEventListener('submit', async function(e) {
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
                
                if (doctor.error) {
                    alert('Registration failed: ' + doctor.error);
                    return;
                }
                
                alert('Doctor registered successfully!');
                
                // Update user name
                if (currentUser) {
                    currentUser.name = doctor.name;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    updateUIForUser();
                }
                
                // Show profile
                showProfileSection(doctor);
            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed. Please try again.');
            }
        });
    }
    
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
                
                if (shop.error) {
                    alert('Registration failed: ' + shop.error);
                    return;
                }
                
                alert('Medical shop registered successfully!');
                
                // Refresh dashboard
                if (typeof loadMedicalShopOwnerDashboard === 'function') {
                    loadMedicalShopOwnerDashboard();
                }
                
                // Close modal
                document.getElementById('shop-registration-modal').style.display = 'none';
            } catch (error) {
                console.error('Shop registration error:', error);
                alert('Registration failed. Please try again.');
            }
        });
    }
    
    // Setup login/signup modal tabs
    setupAuthModalTabs();
    
    console.log('Event listeners setup complete');
}

// NEW FUNCTION: Open auth modal with proper initialization
function openAuthModal(type) {
    const authModal = document.getElementById('auth-modal');
    const signupModal = document.getElementById('signup-modal');
    
    if (type === 'login') {
        authModal.style.display = 'flex';
        signupModal.style.display = 'none';
        
        // Initialize login form
        if (typeof initializeLoginForm === 'function') {
            initializeLoginForm();
        }
    } else {
        authModal.style.display = 'none';
        signupModal.style.display = 'flex';
        
        // Initialize signup form
        if (typeof initializeSignupForm === 'function') {
            initializeSignupForm();
        }
    }
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
            const modalTitle = document.getElementById('auth-modal-title');
            if (modalTitle) {
                modalTitle.textContent = `Login as ${type === 'medical_shop' ? 'Medical Shop Owner' : type.charAt(0).toUpperCase() + type.slice(1)}`;
            }
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
            const modalTitle = document.getElementById('signup-modal-title');
            if (modalTitle) {
                modalTitle.textContent = `Sign up as ${type === 'medical_shop' ? 'Medical Shop Owner' : type.charAt(0).toUpperCase() + type.slice(1)}`;
            }
        });
    });
    
    // Switch between login and signup
    const switchToSignup = document.getElementById('switch-to-signup');
    if (switchToSignup) {
        switchToSignup.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('auth-modal').style.display = 'none';
            document.getElementById('signup-modal').style.display = 'flex';
            
            // Initialize signup form
            if (typeof initializeSignupForm === 'function') {
                initializeSignupForm();
            }
        });
    }
    
    const switchToLogin = document.getElementById('switch-to-login');
    if (switchToLogin) {
        switchToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('signup-modal').style.display = 'none';
            document.getElementById('auth-modal').style.display = 'flex';
            
            // Initialize login form
            if (typeof initializeLoginForm === 'function') {
                initializeLoginForm();
            }
        });
    }
    
    // Login form submissions
    const customerLoginForm = document.getElementById('customer-login-form');
    if (customerLoginForm) {
        customerLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('customer-email').value;
            const password = document.getElementById('customer-password').value;
            if (typeof loginUser === 'function') {
                loginUser(email, password, 'customer');
            }
        });
    }
    
    const doctorLoginForm = document.getElementById('doctor-login-form');
    if (doctorLoginForm) {
        doctorLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('doctor-email').value;
            const password = document.getElementById('doctor-password').value;
            if (typeof loginUser === 'function') {
                loginUser(email, password, 'doctor');
            }
        });
    }
    
    const medicalShopLoginForm = document.getElementById('medical-shop-login-form');
    if (medicalShopLoginForm) {
        medicalShopLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('shop-email').value;
            const password = document.getElementById('shop-password').value;
            if (typeof loginUser === 'function') {
                loginUser(email, password, 'medical_shop');
            }
        });
    }
    
    // Signup form submissions
    const customerSignupForm = document.getElementById('customer-signup-form');
    if (customerSignupForm) {
        customerSignupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('customer-signup-name').value;
            const email = document.getElementById('customer-signup-email').value;
            const password = document.getElementById('customer-signup-password').value;
            if (typeof signupUser === 'function') {
                signupUser(name, email, password, 'customer');
            }
        });
    }
    
    const doctorSignupForm = document.getElementById('doctor-signup-form');
    if (doctorSignupForm) {
        doctorSignupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('doctor-signup-name').value;
            const email = document.getElementById('doctor-signup-email').value;
            const password = document.getElementById('doctor-signup-password').value;
            if (typeof signupUser === 'function') {
                signupUser(name, email, password, 'doctor');
            }
        });
    }
    
    const medicalShopSignupForm = document.getElementById('medical-shop-signup-form');
    if (medicalShopSignupForm) {
        medicalShopSignupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('shop-owner-name').value;
            const email = document.getElementById('shop-owner-email').value;
            const password = document.getElementById('shop-owner-password').value;
            if (typeof signupUser === 'function') {
                signupUser(name, email, password, 'medical_shop');
            }
        });
    }
}

// NEW FUNCTION: Initialize login form visibility
function initializeLoginForm() {
    const loginOptions = document.querySelectorAll('#auth-modal .login-option');
    const loginForms = document.querySelectorAll('#auth-modal .login-form');
    
    if (loginOptions.length > 0 && loginForms.length > 0) {
        // Activate first option
        loginOptions.forEach(opt => opt.classList.remove('active'));
        loginOptions[0].classList.add('active');
        
        // Show first form
        loginForms.forEach(form => form.classList.remove('active'));
        loginForms[0].classList.add('active');
        
        // Update modal title
        const modalTitle = document.getElementById('auth-modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Login as Customer';
        }
    }
}

// NEW FUNCTION: Initialize signup form visibility
function initializeSignupForm() {
    const signupOptions = document.querySelectorAll('#signup-modal .login-option');
    const signupForms = document.querySelectorAll('#signup-modal .login-form');
    
    if (signupOptions.length > 0 && signupForms.length > 0) {
        // Activate first option
        signupOptions.forEach(opt => opt.classList.remove('active'));
        signupOptions[0].classList.add('active');
        
        // Show first form
        signupForms.forEach(form => form.classList.remove('active'));
        signupForms[0].classList.add('active');
        
        // Update modal title
        const modalTitle = document.getElementById('signup-modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Sign up as Customer';
        }
    }
}

// ==================== NAVIGATION FUNCTIONS ====================

function showSearchSection() {
    console.log('Showing Search Section');
    hideAllSections();
    const searchSection = document.getElementById('search-section');
    const resultsSection = document.getElementById('results-section');
    if (searchSection) searchSection.style.display = 'block';
    if (resultsSection) resultsSection.style.display = 'block';
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
    const allDoctorsSection = document.getElementById('all-doctors-section');
    if (allDoctorsSection) allDoctorsSection.style.display = 'block';
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
    const medicalShopsSection = document.getElementById('medical-shops-section');
    if (medicalShopsSection) medicalShopsSection.style.display = 'block';
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
            openAuthModal('login');
        }
        return;
    }
    
    hideAllSections();
    const registrationSection = document.getElementById('registration-section');
    if (registrationSection) registrationSection.style.display = 'block';
    updateActiveNav('nav-register');
    
    // Pre-fill form
    const doctorName = document.getElementById('doctor-name');
    const doctorEmail = document.getElementById('doctor-email');
    if (doctorName && doctorEmail && currentUser) {
        doctorName.value = currentUser.name;
        doctorEmail.value = currentUser.email;
    }
}

function showAppointmentsSection() {
    console.log('Showing Appointments Section');
    
    if (!currentUser || currentUser.type !== 'doctor') {
        alert('Only doctors can access appointments.');
        return;
    }
    
    hideAllSections();
    const appointmentsSection = document.getElementById('appointments-section');
    if (appointmentsSection) appointmentsSection.style.display = 'block';
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
            openAuthModal('login');
        }
        return;
    }
    
    hideAllSections();
    const medicalShopOwnerSection = document.getElementById('medical-shop-owner-section');
    if (medicalShopOwnerSection) medicalShopOwnerSection.style.display = 'block';
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
    const profileSection = document.getElementById('profile-section');
    if (profileSection) profileSection.style.display = 'block';
    updateActiveNav('nav-profile');
    
    // Load profile data
    if (typeof loadProfileData === 'function') {
        loadProfileData(doctor);
    }
}

function hideAllSections() {
    console.log('Hiding all sections');
    const sections = [
        'search-section', 'results-section', 'all-doctors-section', 'medical-shops-section',
        'registration-section', 'appointments-section', 'profile-section', 
        'medical-shop-owner-section', 'remedies-section'
    ];
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'none';
        }
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
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.style.display = 'none';
        }
        
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
        const signupModal = document.getElementById('signup-modal');
        if (signupModal) {
            signupModal.style.display = 'none';
        }
        
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

// ==================== UTILITY FUNCTIONS ====================

function getRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

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
    
    // Initialize auth forms
    initializeLoginForm();
    initializeSignupForm();
    
    // Show search section by default
    showSearchSection();
    
    // Initialize current year in footer
    const currentYear = document.getElementById('current-year');
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }
    
    console.log('Application initialization complete');
});

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
window.getRandomInRange = getRandomInRange;
window.openAuthModal = openAuthModal;
window.initializeLoginForm = initializeLoginForm;
window.initializeSignupForm = initializeSignupForm;