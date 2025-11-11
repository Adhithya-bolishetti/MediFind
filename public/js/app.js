// Global variables
let currentUser = null;
let userLocation = null;
let map = null;
let userMarker = null;
let doctorMarkers = [];
let currentDoctorId = null;
let currentSearchType = null;
let currentSearchResults = [];

// DOM Elements
const searchSection = document.getElementById('search-section');
const resultsSection = document.getElementById('results-section');
const allDoctorsSection = document.getElementById('all-doctors-section');
const registrationSection = document.getElementById('registration-section');
const appointmentsSection = document.getElementById('appointments-section');
const profileSection = document.getElementById('profile-section');
const searchForm = document.getElementById('search-form');
const symptomsInput = document.getElementById('symptoms-input');
const locationInput = document.getElementById('location-input');
const useCurrentLocationBtn = document.getElementById('use-current-location');
const doctorsGrid = document.getElementById('doctors-grid');
const allDoctorsGrid = document.getElementById('all-doctors-grid');
const resultsCount = document.getElementById('results-count');
const allDoctorsCount = document.getElementById('all-doctors-count');
const doctorRegistrationForm = document.getElementById('doctor-registration-form');
const reviewModal = document.getElementById('review-modal');
const reviewForm = document.getElementById('review-form');
const closeModal = document.getElementById('close-modal');
const reviewsList = document.getElementById('reviews-list');
const modalDoctorName = document.getElementById('modal-doctor-name');
const navSearch = document.getElementById('nav-search');
const navAllDoctors = document.getElementById('nav-all-doctors');
const navRegister = document.getElementById('nav-register');
const navProfile = document.getElementById('nav-profile');
const navAppointments = document.getElementById('nav-appointments');
const sortAllDoctors = document.getElementById('sort-all-doctors');
const sortResults = document.getElementById('sort-results');
const symptomButtons = document.querySelectorAll('.symptom-btn');

// Auth elements
const authButtons = document.getElementById('auth-buttons');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const userAvatar = document.getElementById('user-avatar');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const authModal = document.getElementById('auth-modal');
const signupModal = document.getElementById('signup-modal');
const closeAuthModal = document.getElementById('close-auth-modal');
const closeSignupModal = document.getElementById('close-signup-modal');
const loginOptions = document.querySelectorAll('.login-option');
const customerLoginForm = document.getElementById('customer-login-form');
const doctorLoginForm = document.getElementById('doctor-login-form');
const customerSignupForm = document.getElementById('customer-signup-form');
const doctorSignupForm = document.getElementById('doctor-signup-form');
const switchToSignup = document.getElementById('switch-to-signup');
const switchToLogin = document.getElementById('switch-to-login');

// Map modal elements
const mapModal = document.getElementById('map-modal');
const closeMapModal = document.getElementById('close-map-modal');
const mapInfo = document.getElementById('map-info');
const mapDoctorName = document.getElementById('map-doctor-name');

// New booking modal elements
const bookingModal = document.getElementById('booking-modal');
const closeBookingModal = document.getElementById('close-booking-modal');
const bookingForm = document.getElementById('booking-form');
const bookingDoctor = document.getElementById('booking-doctor');
const bookingDate = document.getElementById('booking-date');
const bookingTime = document.getElementById('booking-time');
const bookingReason = document.getElementById('booking-reason');
const slotError = document.getElementById('slot-error');
const availableSlots = document.getElementById('available-slots');
const slotOptions = document.getElementById('slot-options');

// Appointments elements
const appointmentsList = document.getElementById('appointments-list');

// Profile elements
const profileSuccessMessage = document.getElementById('profile-success-message');
const editProfileBtn = document.getElementById('edit-profile-btn');
const viewAppointmentsBtn = document.getElementById('view-appointments-btn');
const profileDoctorName = document.getElementById('profile-doctor-name');
const profileSpecialty = document.getElementById('profile-specialty');
const profileLocation = document.getElementById('profile-location');
const profileRating = document.getElementById('profile-rating');
const profileRatingValue = document.getElementById('profile-rating-value');
const profileReviewsCount = document.getElementById('profile-reviews-count');
const profileEmail = document.getElementById('profile-email');
const profilePhone = document.getElementById('profile-phone');
const profileEducation = document.getElementById('profile-education');
const profileBio = document.getElementById('profile-bio');
const profileExperience = document.getElementById('profile-experience');
const registrationSubmitBtn = document.getElementById('registration-submit-btn');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForUser();
    }
    
    // Initialize map
    initMap();
    
    // Set up event listeners
    setupEventListeners();
    
    // Show search section by default
    showSearchSection();
    
    // Set minimum date to today for booking
    const today = new Date().toISOString().split('T')[0];
    bookingDate.min = today;
    
    // Add event listener for date change to update available slots
    bookingDate.addEventListener('change', function() {
        if (currentDoctorId) {
            updateAvailableSlots(currentDoctorId, this.value);
        }
    });
});

function setupEventListeners() {
    // Navigation
    navSearch.addEventListener('click', (e) => {
        e.preventDefault();
        showSearchSection();
    });

    navAllDoctors.addEventListener('click', (e) => {
        e.preventDefault();
        showAllDoctorsSection();
    });

    navRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showRegistrationSection();
    });

    navProfile.addEventListener('click', (e) => {
        e.preventDefault();
        showProfileSection();
    });

    navAppointments.addEventListener('click', (e) => {
        e.preventDefault();
        showAppointmentsSection();
    });

    // Location functionality
    useCurrentLocationBtn.addEventListener('click', function() {
        const locationText = locationInput.value.trim();
        currentSearchType = 'location';
        
        if (locationText) {
            findDoctorsByLocation(locationText);
        } else {
            getCurrentLocationForSearch();
        }
    });

    // Auth
    loginBtn.addEventListener('click', () => {
        authModal.style.display = 'flex';
    });

    signupBtn.addEventListener('click', () => {
        signupModal.style.display = 'flex';
    });

    logoutBtn.addEventListener('click', logout);

    closeAuthModal.addEventListener('click', () => {
        authModal.style.display = 'none';
    });

    closeSignupModal.addEventListener('click', () => {
        signupModal.style.display = 'none';
    });

    closeMapModal.addEventListener('click', () => {
        mapModal.style.display = 'none';
    });

    closeBookingModal.addEventListener('click', () => {
        bookingModal.style.display = 'none';
    });

    // Login options
    loginOptions.forEach(option => {
        option.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            
            // Remove active class from all options
            loginOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to clicked option
            this.classList.add('active');
            
            // Show appropriate form
            if (this.closest('.modal').id === 'auth-modal') {
                customerLoginForm.classList.remove('active');
                doctorLoginForm.classList.remove('active');
                
                if (type === 'customer') {
                    customerLoginForm.classList.add('active');
                } else {
                    doctorLoginForm.classList.add('active');
                }
            } else {
                customerSignupForm.classList.remove('active');
                doctorSignupForm.classList.remove('active');
                
                if (type === 'customer') {
                    customerSignupForm.classList.add('active');
                } else {
                    doctorSignupForm.classList.add('active');
                }
            }
        });
    });

    // Login forms
    customerLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('customer-email').value;
        const password = document.getElementById('customer-password').value;
        loginUser(email, password, 'customer');
    });

    doctorLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('doctor-email').value;
        const password = document.getElementById('doctor-password').value;
        loginUser(email, password, 'doctor');
    });

    // Signup forms
    customerSignupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('customer-signup-name').value;
        const email = document.getElementById('customer-signup-email').value;
        const password = document.getElementById('customer-signup-password').value;
        signupUser(name, email, password, 'customer');
    });

    doctorSignupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('doctor-signup-name').value;
        const email = document.getElementById('doctor-signup-email').value;
        const password = document.getElementById('doctor-signup-password').value;
        signupUser(name, email, password, 'doctor');
    });

    // Switch between login and signup
    switchToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        authModal.style.display = 'none';
        signupModal.style.display = 'flex';
    });

    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupModal.style.display = 'none';
        authModal.style.display = 'flex';
    });

    // Quick symptom buttons
    symptomButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const symptom = e.target.getAttribute('data-symptom');
            symptomsInput.value = symptom;
            currentSearchType = 'symptoms';
            searchBySymptoms(symptom);
        });
    });

    // Search functionality
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const symptoms = symptomsInput.value.trim().toLowerCase();
        currentSearchType = 'symptoms';
        
        if (symptoms === '') {
            alert('Please enter symptoms to search for doctors.');
            return;
        }

        searchBySymptoms(symptoms);
    });

    // Doctor registration
    doctorRegistrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            // Check if this is an update or new registration
            const allDoctors = await apiService.getDoctors();
            const existingDoctor = allDoctors.find(d => 
                d.email === currentUser.email || d.userId === currentUser.id
            );
            
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
            
            let doctor;
            if (existingDoctor) {
                doctor = await apiService.updateDoctor(existingDoctor._id, doctorData);
                alert('Profile updated successfully!');
            } else {
                doctor = await apiService.registerDoctor(doctorData);
                alert('Registration successful! Your profile has been added to our system.');
            }
            
            // Update user data
            if (currentUser && currentUser.type === 'doctor') {
                currentUser.name = doctor.name;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUIForUser();
            }
            
            showProfileSection(doctor);
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed. Please try again.');
        }
    });

    // Review modal functionality
    closeModal.addEventListener('click', () => {
        reviewModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === reviewModal) reviewModal.style.display = 'none';
        if (e.target === authModal) authModal.style.display = 'none';
        if (e.target === signupModal) signupModal.style.display = 'none';
        if (e.target === mapModal) mapModal.style.display = 'none';
        if (e.target === bookingModal) bookingModal.style.display = 'none';
    });

    // Star rating interaction
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', (e) => {
            const rating = parseInt(e.target.getAttribute('data-rating'));
            setStarRating(rating);
        });
    });

    // Sort all doctors when sort option changes
    sortAllDoctors.addEventListener('change', () => {
        if (allDoctorsSection.style.display !== 'none') {
            displayAllDoctors();
        }
    });

    // Sort results when sort option changes
    sortResults.addEventListener('change', () => {
        if (resultsSection.style.display !== 'none' && currentSearchResults.length > 0) {
            const sortedResults = sortDoctors([...currentSearchResults], sortResults.value);
            displayDoctors(sortedResults, doctorsGrid);
        }
    });

    // Booking form submission
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        bookAppointment();
    });

    // Profile buttons
    editProfileBtn.addEventListener('click', () => {
        showRegistrationSection();
    });
    
    viewAppointmentsBtn.addEventListener('click', () => {
        showAppointmentsSection();
    });
}

// Navigation functions
function showSearchSection() {
    hideAllSections();
    searchSection.style.display = 'block';
    resultsSection.style.display = 'block';
    updateActiveNav(navSearch);
}

function showAllDoctorsSection() {
    hideAllSections();
    allDoctorsSection.style.display = 'block';
    updateActiveNav(navAllDoctors);
    displayAllDoctors();
}

function showRegistrationSection() {
    if (currentUser && currentUser.type === 'doctor') {
        hideAllSections();
        registrationSection.style.display = 'block';
        updateActiveNav(navRegister);
        
        // Pre-fill form with existing data or user data
        apiService.getDoctors().then(allDoctors => {
            const existingDoctor = allDoctors.find(d => 
                d.email === currentUser.email || d.userId === currentUser.id
            );
            
            if (existingDoctor) {
                document.getElementById('doctor-name').value = existingDoctor.name;
                document.getElementById('doctor-specialty').value = existingDoctor.specialty;
                document.getElementById('doctor-email').value = existingDoctor.email;
                document.getElementById('doctor-phone').value = existingDoctor.phone;
                document.getElementById('doctor-address').value = existingDoctor.address;
                document.getElementById('doctor-city').value = existingDoctor.city;
                document.getElementById('doctor-bio').value = existingDoctor.bio;
                document.getElementById('doctor-education').value = existingDoctor.education;
                document.getElementById('doctor-experience').value = existingDoctor.experience;
                registrationSubmitBtn.textContent = 'Update Profile';
            } else {
                doctorRegistrationForm.reset();
                document.getElementById('doctor-name').value = currentUser.name;
                document.getElementById('doctor-email').value = currentUser.email;
                registrationSubmitBtn.textContent = 'Register as Doctor';
            }
        });
    } else {
        alert('Only doctors can access the registration page. Please log in as a doctor.');
        authModal.style.display = 'flex';
    }
}

function showAppointmentsSection() {
    if (currentUser && currentUser.type === 'doctor') {
        hideAllSections();
        appointmentsSection.style.display = 'block';
        updateActiveNav(navAppointments);
        displayAppointments();
    } else {
        alert('Only doctors can access the appointments page.');
        showSearchSection();
    }
}

function showProfileSection(doctor = null) {
    if (!currentUser || currentUser.type !== 'doctor') {
        alert('Doctor profile not available.');
        showSearchSection();
        return;
    }
    
    hideAllSections();
    profileSection.style.display = 'block';
    updateActiveNav(navProfile);
    
    // Load and display profile data
    loadProfileData(doctor);
}

// Helper functions
function hideAllSections() {
    const sections = [searchSection, resultsSection, allDoctorsSection, 
                     registrationSection, appointmentsSection, profileSection];
    sections.forEach(section => section.style.display = 'none');
}

function updateActiveNav(activeNav) {
    const navItems = [navSearch, navAllDoctors, navRegister, navProfile, navAppointments];
    navItems.forEach(nav => nav.classList.remove('active'));
    activeNav.classList.add('active');
}

async function loadProfileData(doctor = null) {
    try {
        let currentDoctor = doctor;
        if (!currentDoctor) {
            const allDoctors = await apiService.getDoctors();
            currentDoctor = allDoctors.find(d => 
                d.email === currentUser.email || d.userId === currentUser.id
            );
        }
        
        if (!currentDoctor) {
            profileSection.innerHTML = `
                <div class="no-profile">
                    <i class="fas fa-user-md fa-3x"></i>
                    <h3>No Profile Found</h3>
                    <p>Please complete your doctor registration to view your profile.</p>
                    <button class="btn" onclick="showRegistrationSection()">Complete Registration</button>
                </div>
            `;
            return;
        }
        
        // Update profile information
        profileDoctorName.textContent = currentDoctor.name;
        profileSpecialty.textContent = currentDoctor.specialty;
        profileLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${currentDoctor.address}, ${currentDoctor.city}`;
        profileRating.innerHTML = getStarRating(currentDoctor.rating);
        profileRatingValue.textContent = currentDoctor.rating.toFixed(1);
        profileReviewsCount.textContent = `(${currentDoctor.reviewCount} reviews)`;
        profileEmail.textContent = currentDoctor.email;
        profilePhone.textContent = currentDoctor.phone;
        profileEducation.textContent = currentDoctor.education;
        profileBio.textContent = currentDoctor.bio;
        profileExperience.textContent = currentDoctor.experience;
        
        if (doctor) {
            profileSuccessMessage.style.display = 'block';
        } else {
            profileSuccessMessage.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Error loading profile data.');
    }
}

// Make functions globally available
window.showSearchSection = showSearchSection;
window.showRegistrationSection = showRegistrationSection;
window.showAppointmentsSection = showAppointmentsSection;