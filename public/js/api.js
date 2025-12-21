// Global variables
let currentUser = null;
let userLocation = null;
let map = null;
let userMarker = null;
let doctorMarkers = [];
let currentDoctorId = null;
let currentSearchType = null;
let currentSearchResults = [];
let shoppingCart = [];

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
const customerOrdersSection = document.getElementById('customer-orders-section');

// Search elements
const searchForm = document.getElementById('search-form');
const symptomsInput = document.getElementById('symptoms-input');
const locationInput = document.getElementById('location-input');
const useCurrentLocationBtn = document.getElementById('use-current-location');
const doctorsGrid = document.getElementById('doctors-grid');
const allDoctorsGrid = document.getElementById('all-doctors-grid');
const medicalShopsGrid = document.getElementById('medical-shops-grid');
const resultsCount = document.getElementById('results-count');
const allDoctorsCount = document.getElementById('all-doctors-count');
const medicalShopsCount = document.getElementById('medical-shops-count');
const sortMedicalShops = document.getElementById('sort-medical-shops');
const searchMedicalShopsInput = document.getElementById('search-medical-shops');
const symptomButtons = document.querySelectorAll('.symptom-btn');

// Modal elements
const authModal = document.getElementById('auth-modal');
const signupModal = document.getElementById('signup-modal');
const reviewModal = document.getElementById('review-modal');
const mapModal = document.getElementById('map-modal');
const bookingModal = document.getElementById('booking-modal');
const cartModal = document.getElementById('cart-modal');
const shopProductsModal = document.getElementById('shop-products-modal');

// Auth elements
const authButtons = document.getElementById('auth-buttons');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const userAvatar = document.getElementById('user-avatar');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const cartIcon = document.getElementById('cart-icon');
const cartCount = document.getElementById('cart-count');

// Navigation elements
const navSearch = document.getElementById('nav-search');
const navAllDoctors = document.getElementById('nav-all-doctors');
const navMedicalShops = document.getElementById('nav-medical-shops');
const navRegister = document.getElementById('nav-register');
const navAppointments = document.getElementById('nav-appointments');
const navMedicalShopOwner = document.getElementById('nav-medical-shop-owner');
const navProfile = document.getElementById('nav-profile');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
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
    
    // Set up all event listeners
    setupEventListeners();
    
    // Show search section by default
    showSearchSection();
    
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

// Main event listener setup
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // ==================== NAVIGATION EVENT LISTENERS ====================
    
    // Main navigation
    if (navSearch) {
        navSearch.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Search navigation clicked');
            showSearchSection();
        });
    }
    
    if (navAllDoctors) {
        navAllDoctors.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('All Doctors navigation clicked');
            showAllDoctorsSection();
        });
    }
    
    if (navMedicalShops) {
        navMedicalShops.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Medical Shops navigation clicked');
            showMedicalShopsSection();
        });
    }
    
    if (navRegister) {
        navRegister.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Doctor Registration navigation clicked');
            showRegistrationSection();
        });
    }
    
    if (navAppointments) {
        navAppointments.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Appointments navigation clicked');
            showAppointmentsSection();
        });
    }
    
    if (navMedicalShopOwner) {
        navMedicalShopOwner.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Medical Shop Owner navigation clicked');
            showMedicalShopOwnerSection();
        });
    }
    
    if (navProfile) {
        navProfile.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Profile navigation clicked');
            showProfileSection();
        });
    }
    
    // ==================== SEARCH & LOCATION EVENT LISTENERS ====================
    
    // Search form
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const symptoms = symptomsInput.value.trim().toLowerCase();
            currentSearchType = 'symptoms';
            
            if (!symptoms) {
                alert('Please enter symptoms to search for doctors.');
                return;
            }
            
            console.log('Searching for symptoms:', symptoms);
            
            // Show remedies
            if (typeof displayRemedies === 'function') {
                displayRemedies(symptoms);
            }
            
            // Search doctors
            if (typeof searchBySymptoms === 'function') {
                searchBySymptoms(symptoms);
            }
        });
    }
    
    // Location button
    if (useCurrentLocationBtn) {
        useCurrentLocationBtn.addEventListener('click', function() {
            const locationText = locationInput.value.trim();
            currentSearchType = 'location';
            
            if (locationText) {
                console.log('Searching by location:', locationText);
                if (typeof findDoctorsByLocation === 'function') {
                    findDoctorsByLocation(locationText);
                }
            } else {
                console.log('Getting current location');
                if (typeof getCurrentLocationForSearch === 'function') {
                    getCurrentLocationForSearch();
                } else {
                    alert('Location services not available.');
                }
            }
        });
    }
    
    // Quick symptom buttons
    if (symptomButtons && symptomButtons.length > 0) {
        symptomButtons.forEach(button => {
            button.addEventListener('click', function() {
                const symptom = this.getAttribute('data-symptom');
                if (symptomsInput) {
                    symptomsInput.value = symptom;
                }
                currentSearchType = 'symptoms';
                
                console.log('Quick symptom search:', symptom);
                
                // Show remedies
                if (typeof displayRemedies === 'function') {
                    displayRemedies(symptom);
                }
                
                // Search doctors
                if (typeof searchBySymptoms === 'function') {
                    searchBySymptoms(symptom);
                }
            });
        });
    }
    
    // Medical Shop search and sort
    if (searchMedicalShopsInput) {
        searchMedicalShopsInput.addEventListener('input', function() {
            console.log('Medical shop search:', this.value);
            if (typeof debounce === 'function') {
                debounce(() => searchMedicalShops(), 300)();
            } else {
                searchMedicalShops();
            }
        });
    }
    
    if (sortMedicalShops) {
        sortMedicalShops.addEventListener('change', function() {
            console.log('Medical shop sort changed:', this.value);
            searchMedicalShops();
        });
    }
    
    // ==================== AUTHENTICATION EVENT LISTENERS ====================
    
    // Login button
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log('Login button clicked');
            authModal.style.display = 'flex';
        });
    }
    
    // Signup button
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            console.log('Signup button clicked');
            signupModal.style.display = 'flex';
        });
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('Logout button clicked');
            if (typeof logout === 'function') {
                logout();
            }
        });
    }
    
    // Cart icon
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            console.log('Cart icon clicked');
            if (typeof showCartModal === 'function') {
                showCartModal();
            }
        });
    }
    
    // ==================== MODAL CLOSE BUTTONS ====================
    
    // Close modals when clicking X
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // ==================== FORM SUBMISSIONS ====================
    
    // Doctor registration form
    const doctorRegistrationForm = document.getElementById('doctor-registration-form');
    if (doctorRegistrationForm) {
        doctorRegistrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Doctor registration form submitted');
            
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
                
                // Update user name if changed
                if (currentUser && currentUser.type === 'doctor') {
                    currentUser.name = doctor.name;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    updateUIForUser();
                }
                
                showProfileSection(doctor);
            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed: ' + (error.message || 'Please try again.'));
            }
        });
    }
    
    // Medical shop registration form
    const medicalShopRegistrationForm = document.getElementById('medical-shop-registration-form');
    if (medicalShopRegistrationForm) {
        medicalShopRegistrationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Medical shop registration form submitted');
            
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
                
                // Update UI
                if (typeof loadMedicalShopOwnerDashboard === 'function') {
                    loadMedicalShopOwnerDashboard();
                }
            } catch (error) {
                console.error('Shop registration error:', error);
                alert('Registration failed: ' + (error.message || 'Please try again.'));
            }
        });
    }
    
    // Booking form
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Booking form submitted');
            
            if (!currentDoctorId) {
                alert('No doctor selected.');
                return;
            }
            
            if (!currentUser) {
                alert('Please login to book an appointment.');
                authModal.style.display = 'flex';
                return;
            }
            
            const appointmentData = {
                doctorId: currentDoctorId,
                doctorName: document.getElementById('booking-doctor').value,
                doctorSpecialty: '', // You might want to populate this
                patientId: currentUser.id,
                patientName: currentUser.name,
                date: document.getElementById('booking-date').value,
                time: document.getElementById('booking-time').value,
                reason: document.getElementById('booking-reason').value,
                status: 'pending',
                duration: 30
            };
            
            try {
                const appointment = await apiService.bookAppointment(appointmentData);
                alert('Appointment booked successfully!');
                bookingModal.style.display = 'none';
                
                // Refresh appointments if on appointments page
                if (appointmentsSection.style.display === 'block' && currentUser.type === 'doctor') {
                    if (typeof displayAppointments === 'function') {
                        displayAppointments();
                    }
                }
            } catch (error) {
                console.error('Booking error:', error);
                alert('Booking failed: ' + (error.message || 'Please try again.'));
            }
        });
    }
    
    // Review form
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Review form submitted');
            
            if (!currentDoctorId) {
                alert('No doctor selected.');
                return;
            }
            
            const reviewData = {
                doctorId: currentDoctorId,
                reviewer: document.getElementById('reviewer-name').value,
                rating: parseInt(document.getElementById('rating-value').value),
                comment: document.getElementById('review-comment').value
            };
            
            try {
                const review = await apiService.addReview(reviewData);
                alert('Review submitted successfully!');
                reviewModal.style.display = 'none';
                
                // Refresh reviews
                if (typeof displayReviews === 'function') {
                    await displayReviews(currentDoctorId);
                }
                
                // Refresh doctor displays
                if (resultsSection.style.display !== 'none') {
                    if (currentSearchType === 'symptoms') {
                        const symptoms = symptomsInput.value.trim().toLowerCase();
                        if (symptoms && typeof searchBySymptoms === 'function') {
                            searchBySymptoms(symptoms);
                        }
                    }
                }
            } catch (error) {
                console.error('Review submission error:', error);
                alert('Failed to submit review: ' + (error.message || 'Please try again.'));
            }
        });
    }
    
    console.log('All event listeners set up');
}

// ==================== NAVIGATION FUNCTIONS ====================

function showSearchSection() {
    hideAllSections();
    searchSection.style.display = 'block';
    resultsSection.style.display = 'block';
    updateActiveNav('nav-search');
    console.log('Showing search section');
}

function showAllDoctorsSection() {
    hideAllSections();
    allDoctorsSection.style.display = 'block';
    updateActiveNav('nav-all-doctors');
    
    if (typeof displayAllDoctors === 'function') {
        displayAllDoctors();
    }
    console.log('Showing all doctors section');
}

function showMedicalShopsSection() {
    hideAllSections();
    medicalShopsSection.style.display = 'block';
    updateActiveNav('nav-medical-shops');
    
    if (typeof loadMedicalShops === 'function') {
        loadMedicalShops();
    }
    console.log('Showing medical shops section');
}

function showRegistrationSection() {
    if (!currentUser || currentUser.type !== 'doctor') {
        alert('Only doctors can access the registration page.');
        if (!currentUser) {
            authModal.style.display = 'flex';
        }
        return;
    }
    
    hideAllSections();
    registrationSection.style.display = 'block';
    updateActiveNav('nav-register');
    
    // Pre-fill form with user data
    const doctorName = document.getElementById('doctor-name');
    const doctorEmail = document.getElementById('doctor-email');
    
    if (doctorName && doctorEmail && currentUser) {
        doctorName.value = currentUser.name;
        doctorEmail.value = currentUser.email;
    }
    console.log('Showing registration section');
}

function showAppointmentsSection() {
    if (!currentUser || currentUser.type !== 'doctor') {
        alert('Only doctors can access the appointments page.');
        return;
    }
    
    hideAllSections();
    appointmentsSection.style.display = 'block';
    updateActiveNav('nav-appointments');
    
    if (typeof displayAppointments === 'function') {
        displayAppointments();
    }
    console.log('Showing appointments section');
}

function showMedicalShopOwnerSection() {
    if (!currentUser || currentUser.type !== 'medical_shop') {
        alert('Only medical shop owners can access this page.');
        if (!currentUser) {
            authModal.style.display = 'flex';
        }
        return;
    }
    
    hideAllSections();
    medicalShopOwnerSection.style.display = 'block';
    updateActiveNav('nav-medical-shop-owner');
    
    if (typeof loadMedicalShopOwnerDashboard === 'function') {
        loadMedicalShopOwnerDashboard();
    }
    console.log('Showing medical shop owner section');
}

function showProfileSection(doctor = null) {
    if (!currentUser || currentUser.type !== 'doctor') {
        alert('Doctor profile not available.');
        showSearchSection();
        return;
    }
    
    hideAllSections();
    profileSection.style.display = 'block';
    updateActiveNav('nav-profile');
    
    if (typeof loadProfileData === 'function') {
        loadProfileData(doctor);
    }
    console.log('Showing profile section');
}

function hideAllSections() {
    const sections = [
        searchSection, resultsSection, allDoctorsSection, medicalShopsSection,
        registrationSection, appointmentsSection, profileSection, 
        medicalShopOwnerSection, remediesSection, customerOrdersSection
    ];
    
    sections.forEach(section => {
        if (section) {
            section.style.display = 'none';
        }
    });
    console.log('All sections hidden');
}

function updateActiveNav(navId) {
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
    console.log('Active nav updated to:', navId);
}

// ==================== MEDICAL SHOPS FUNCTIONS ====================

async function loadMedicalShops() {
    try {
        console.log('Loading medical shops...');
        medicalShopsGrid.innerHTML = '<p>Loading medical shops...</p>';
        
        const params = {};
        
        // Add search parameter
        if (searchMedicalShopsInput && searchMedicalShopsInput.value.trim() !== '') {
            params.search = searchMedicalShopsInput.value.trim();
        }
        
        // Add sort parameter
        if (sortMedicalShops) {
            params.sort = sortMedicalShops.value;
        }
        
        // Add location if available
        if (userLocation) {
            params.lat = userLocation.lat;
            params.lng = userLocation.lng;
        }
        
        const shops = await apiService.getMedicalShops(params);
        displayMedicalShops(shops);
        
    } catch (error) {
        console.error('Error loading medical shops:', error);
        medicalShopsGrid.innerHTML = '<p>Error loading medical shops. Please try again.</p>';
    }
}

async function searchMedicalShops() {
    console.log('Searching medical shops...');
    await loadMedicalShops();
}

function displayMedicalShops(shops) {
    if (!medicalShopsGrid) return;
    
    medicalShopsGrid.innerHTML = '';
    
    if (!shops || shops.length === 0) {
        medicalShopsGrid.innerHTML = '<p>No medical shops found matching your search.</p>';
        if (medicalShopsCount) {
            medicalShopsCount.textContent = 'Showing 0 shops';
        }
        return;
    }
    
    shops.forEach(shop => {
        const shopCard = document.createElement('div');
        shopCard.className = 'medical-shop-card';
        
        let distanceInfo = '';
        if (shop.distance !== undefined) {
            distanceInfo = `<p class="shop-distance"><i class="fas fa-road"></i> ${shop.distance.toFixed(1)} km away</p>`;
        }
        
        shopCard.innerHTML = `
            <div class="shop-image">
                <i class="fas fa-clinic-medical"></i>
            </div>
            <div class="shop-info">
                <h3 class="shop-name">${shop.shopName}</h3>
                <p class="shop-owner"><i class="fas fa-user"></i> ${shop.ownerName}</p>
                <p class="shop-location">
                    <i class="fas fa-map-marker-alt"></i> ${shop.address}, ${shop.city}
                </p>
                <p class="shop-contact"><i class="fas fa-phone"></i> ${shop.phone}</p>
                ${distanceInfo}
                <div class="shop-rating">
                    <div class="stars">${getStarRating(shop.rating || 0)}</div>
                    <span class="rating-value">${shop.rating || 0}</span>
                    <span class="reviews-count">(${shop.reviewCount || 0} reviews)</span>
                </div>
                <div class="shop-actions">
                    <button class="btn btn-small view-products" data-shop-id="${shop._id}">
                        <i class="fas fa-box"></i> View Products
                    </button>
                    <button class="btn btn-small btn-secondary get-directions" 
                            data-lat="${shop.lat}" 
                            data-lng="${shop.lng}"
                            data-name="${shop.shopName}">
                        <i class="fas fa-directions"></i> Get Directions
                    </button>
                </div>
            </div>
        `;
        medicalShopsGrid.appendChild(shopCard);
    });
    
    if (medicalShopsCount) {
        medicalShopsCount.textContent = `Showing ${shops.length} shop${shops.length !== 1 ? 's' : ''}`;
    }
    
    // Add event listeners to shop buttons
    setTimeout(() => {
        document.querySelectorAll('.view-products').forEach(button => {
            button.addEventListener('click', function() {
                const shopId = this.getAttribute('data-shop-id');
                console.log('View products clicked for shop:', shopId);
                if (typeof viewShopProducts === 'function') {
                    viewShopProducts(shopId);
                }
            });
        });
        
        document.querySelectorAll('.get-directions').forEach(button => {
            button.addEventListener('click', function() {
                const lat = parseFloat(this.getAttribute('data-lat'));
                const lng = parseFloat(this.getAttribute('data-lng'));
                const name = this.getAttribute('data-name');
                console.log('Get directions clicked for:', name);
                if (typeof showDirections === 'function') {
                    showDirections(lat, lng, name);
                }
            });
        });
    }, 100);
}

// ==================== UTILITY FUNCTIONS ====================

function getRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

function getStarRating(rating) {
    if (typeof window.getStarRating === 'function') {
        return window.getStarRating(rating);
    }
    
    // Fallback implementation
    let stars = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        stars += '★';
    }
    
    if (halfStar) {
        stars += '½';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '☆';
    }
    
    return stars;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== GLOBAL EXPORTS ====================

// Make functions globally available for onclick handlers
window.showSearchSection = showSearchSection;
window.showAllDoctorsSection = showAllDoctorsSection;
window.showMedicalShopsSection = showMedicalShopsSection;
window.showMedicalShopOwnerSection = showMedicalShopOwnerSection;
window.showRegistrationSection = showRegistrationSection;
window.showAppointmentsSection = showAppointmentsSection;
window.showProfileSection = showProfileSection;

// Make utility functions available
window.getRandomInRange = getRandomInRange;
window.getStarRating = getStarRating;
window.debounce = debounce;

// Initialize shopping cart
function initializeShoppingCart() {
    const savedCart = localStorage.getItem('shoppingCart');
    if (savedCart) {
        try {
            shoppingCart = JSON.parse(savedCart);
            updateCartCount();
        } catch (e) {
            console.error('Error parsing shopping cart:', e);
            shoppingCart = [];
        }
    }
}

function updateCartCount() {
    if (cartCount) {
        const totalItems = shoppingCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'inline' : 'none';
    }
}

function showCartModal() {
    if (!cartModal) return;
    
    const cartItems = document.getElementById('cart-items');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    
    if (!cartItems || !cartTotalAmount) return;
    
    cartItems.innerHTML = '';
    
    if (shoppingCart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty.</p>';
        cartTotalAmount.textContent = '0';
    } else {
        let total = 0;
        
        shoppingCart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>₹${item.price} × ${item.quantity}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateCartQuantity('${item.productId}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartQuantity('${item.productId}', 1)">+</button>
                    <button class="btn btn-small btn-danger" onclick="removeFromCart('${item.productId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            cartItems.appendChild(cartItem);
            total += item.price * item.quantity;
        });
        
        cartTotalAmount.textContent = total;
    }
    
    cartModal.style.display = 'flex';
}

window.updateCartQuantity = function(productId, change) {
    const item = shoppingCart.find(item => item.productId === productId);
    if (item) {
        const newQuantity = item.quantity + change;
        if (newQuantity > 0) {
            item.quantity = newQuantity;
        } else {
            shoppingCart = shoppingCart.filter(item => item.productId !== productId);
        }
        updateCartCount();
        localStorage.setItem('shoppingCart', JSON.stringify(shoppingCart));
        showCartModal();
    }
};

window.removeFromCart = function(productId) {
    shoppingCart = shoppingCart.filter(item => item.productId !== productId);
    updateCartCount();
    localStorage.setItem('shoppingCart', JSON.stringify(shoppingCart));
    showCartModal();
};

// Initialize cart on load
initializeShoppingCart();

console.log('app.js loaded successfully');