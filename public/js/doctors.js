// Search by symptoms
async function searchBySymptoms(symptoms) {
    console.log('Searching by symptoms:', symptoms);
    
    try {
        // Hide remedies section
        const remediesSection = document.getElementById('remedies-section');
        if (remediesSection) remediesSection.style.display = 'none';
        
        // Show results section
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) resultsSection.style.display = 'block';
        
        const params = {
            symptoms: symptoms,
            location: document.getElementById('location-input').value.trim(),
            specialty: document.getElementById('specialty-filter').value,
            rating: document.getElementById('rating-filter').value
        };
        
        console.log('Search params:', params);
        const doctors = await apiService.searchDoctors(params);
        console.log('Found doctors:', doctors);
        
        if (doctors.error) {
            showSearchResults([], `Error: ${doctors.error}`);
            return;
        }
        
        // Show results
        showSearchResults(doctors, `Found ${doctors.length} doctors for "${symptoms}"`);
        
    } catch (error) {
        console.error('Search error:', error);
        showSearchResults([], 'Search failed. Please try again.');
    }
}

// Find doctors by location
async function findDoctorsByLocation(location) {
    console.log('Finding doctors by location:', location);
    
    try {
        // Hide remedies section
        const remediesSection = document.getElementById('remedies-section');
        if (remediesSection) remediesSection.style.display = 'none';
        
        // Show results section
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) resultsSection.style.display = 'block';
        
        const params = {
            location: location,
            specialty: document.getElementById('specialty-filter').value,
            rating: document.getElementById('rating-filter').value
        };
        
        const doctors = await apiService.searchDoctors(params);
        
        if (doctors.error) {
            showSearchResults([], `Error: ${doctors.error}`);
            return;
        }
        
        showSearchResults(doctors, `Found ${doctors.length} doctors in "${location}"`);
        
    } catch (error) {
        console.error('Location search error:', error);
        showSearchResults([], 'Location search failed. Please try again.');
    }
}

// Display search results
function showSearchResults(doctors, message) {
    console.log('Showing search results:', doctors);
    
    const doctorsGrid = document.getElementById('doctors-grid');
    const resultsCount = document.getElementById('results-count');
    
    if (!doctorsGrid || !resultsCount) return;
    
    doctorsGrid.innerHTML = '';
    
    if (!doctors || doctors.length === 0) {
        doctorsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search fa-3x"></i>
                <h3>No doctors found</h3>
                <p>Try adjusting your search criteria or filters.</p>
            </div>
        `;
        resultsCount.textContent = 'No results found';
        return;
    }
    
    // Display each doctor
    doctors.forEach(doctor => {
        const doctorCard = document.createElement('div');
        doctorCard.className = 'doctor-card';
        
        // Get specialty class for badge
        const specialtyClass = doctor.specialty ? 
            doctor.specialty.toLowerCase().replace(/ /g, '-') : 'general-practice';
        
        doctorCard.innerHTML = `
            <div class="doctor-image">
                <i class="fas fa-user-md"></i>
            </div>
            <div class="specialty-badge specialty-${specialtyClass}">
                ${doctor.specialty || 'General Practice'}
            </div>
            <div class="doctor-info">
                <h3 class="doctor-name">${doctor.name || 'Dr. Unknown'}</h3>
                <p class="doctor-specialty">${doctor.specialty || 'General Practice'}</p>
                <p class="doctor-location">
                    <i class="fas fa-map-marker-alt"></i> ${doctor.address || 'Address not available'}, ${doctor.city || 'City'}
                </p>
                <div class="doctor-rating">
                    <div class="stars">${getStarRating(doctor.rating || 0)}</div>
                    <span class="rating-value">${doctor.rating || 0}</span>
                    <span class="reviews-count">(${doctor.reviewCount || 0} reviews)</span>
                </div>
                <p class="doctor-experience">${doctor.experience || 0} years experience</p>
                <div class="doctor-actions">
                    <button class="btn btn-small view-reviews" data-id="${doctor._id || doctor.id}">
                        View Reviews
                    </button>
                    <button class="btn btn-small btn-warning add-review" data-id="${doctor._id || doctor.id}">
                        Add Review
                    </button>
                </div>
            </div>
        `;
        doctorsGrid.appendChild(doctorCard);
    });
    
    resultsCount.textContent = message;
    
    // Add event listeners to buttons
    setTimeout(() => {
        document.querySelectorAll('.view-reviews').forEach(button => {
            button.addEventListener('click', function() {
                const doctorId = this.getAttribute('data-id');
                console.log('View reviews for doctor:', doctorId);
                if (typeof openReviewModal === 'function') {
                    openReviewModal(doctorId, false);
                }
            });
        });
        
        document.querySelectorAll('.add-review').forEach(button => {
            button.addEventListener('click', function() {
                const doctorId = this.getAttribute('data-id');
                console.log('Add review for doctor:', doctorId);
                if (typeof openReviewModal === 'function') {
                    openReviewModal(doctorId, true);
                }
            });
        });
    }, 100);
}

// Display all doctors - FIXED: Ensure this function works properly
async function displayAllDoctors() {
    console.log('Displaying all doctors');
    
    try {
        // Hide remedies section
        const remediesSection = document.getElementById('remedies-section');
        if (remediesSection) remediesSection.style.display = 'none';
        
        const doctors = await apiService.getDoctors();
        const allDoctorsGrid = document.getElementById('all-doctors-grid');
        const allDoctorsCount = document.getElementById('all-doctors-count');
        
        if (!allDoctorsGrid || !allDoctorsCount) {
            console.error('Required elements not found');
            return;
        }
        
        allDoctorsGrid.innerHTML = '';
        
        if (doctors.error) {
            allDoctorsGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle fa-3x"></i>
                    <h3>Error Loading Doctors</h3>
                    <p>${doctors.error}</p>
                </div>
            `;
            allDoctorsCount.textContent = 'Error loading doctors';
            return;
        }
        
        if (!doctors || doctors.length === 0) {
            allDoctorsGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-user-md fa-3x"></i>
                    <h3>No doctors registered yet</h3>
                    <p>Be the first doctor to register!</p>
                </div>
            `;
            allDoctorsCount.textContent = 'No doctors';
            return;
        }
        
        doctors.forEach(doctor => {
            const doctorCard = document.createElement('div');
            doctorCard.className = 'doctor-card';
            
            // Get specialty class for badge
            const specialtyClass = doctor.specialty ? 
                doctor.specialty.toLowerCase().replace(/ /g, '-') : 'general-practice';
            
            doctorCard.innerHTML = `
                <div class="doctor-image">
                    <i class="fas fa-user-md"></i>
                </div>
                <div class="specialty-badge specialty-${specialtyClass}">
                    ${doctor.specialty || 'General Practice'}
                </div>
                <div class="doctor-info">
                    <h3 class="doctor-name">${doctor.name || 'Dr. Unknown'}</h3>
                    <p class="doctor-specialty">${doctor.specialty || 'General Practice'}</p>
                    <p class="doctor-location">
                        <i class="fas fa-map-marker-alt"></i> ${doctor.address || 'Address not available'}, ${doctor.city || 'City'}
                    </p>
                    <div class="doctor-rating">
                        <div class="stars">${getStarRating(doctor.rating || 0)}</div>
                        <span class="rating-value">${doctor.rating || 0}</span>
                        <span class="reviews-count">(${doctor.reviewCount || 0} reviews)</span>
                    </div>
                    <p class="doctor-experience">${doctor.experience || 0} years experience</p>
                    <div class="doctor-actions">
                        <button class="btn btn-small view-reviews" data-id="${doctor._id || doctor.id}">
                            View Reviews
                        </button>
                        <button class="btn btn-small btn-warning add-review" data-id="${doctor._id || doctor.id}">
                            Add Review
                        </button>
                    </div>
                </div>
            `;
            allDoctorsGrid.appendChild(doctorCard);
        });
        
        allDoctorsCount.textContent = `Showing ${doctors.length} doctors`;
        
        // Add event listeners
        setTimeout(() => {
            document.querySelectorAll('.view-reviews').forEach(button => {
                button.addEventListener('click', function() {
                    const doctorId = this.getAttribute('data-id');
                    if (typeof openReviewModal === 'function') {
                        openReviewModal(doctorId, false);
                    }
                });
            });
            
            document.querySelectorAll('.add-review').forEach(button => {
                button.addEventListener('click', function() {
                    const doctorId = this.getAttribute('data-id');
                    if (typeof openReviewModal === 'function') {
                        openReviewModal(doctorId, true);
                    }
                });
            });
        }, 100);
        
    } catch (error) {
        console.error('Display doctors error:', error);
        const allDoctorsGrid = document.getElementById('all-doctors-grid');
        if (allDoctorsGrid) {
            allDoctorsGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle fa-3x"></i>
                    <h3>Error Loading Doctors</h3>
                    <p>Failed to load doctors. Please try again later.</p>
                </div>
            `;
        }
    }
}

// Star rating helper
function getStarRating(rating) {
    if (rating === undefined || rating === null) rating = 0;
    
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

// Get current location for search
async function getCurrentLocationForSearch() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Update location input with reverse geocoded address
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`);
                    const data = await response.json();
                    if (data && data.display_name) {
                        document.getElementById('location-input').value = data.display_name;
                    }
                } catch (error) {
                    console.error('Reverse geocoding error:', error);
                }
                
                // Hide remedies section
                const remediesSection = document.getElementById('remedies-section');
                if (remediesSection) remediesSection.style.display = 'none';
                
                // Show results section
                const resultsSection = document.getElementById('results-section');
                if (resultsSection) resultsSection.style.display = 'block';
                
                // Search doctors by coordinates
                const params = {
                    lat: userLocation.lat,
                    lng: userLocation.lng,
                    specialty: document.getElementById('specialty-filter').value,
                    rating: document.getElementById('rating-filter').value
                };
                
                const doctors = await apiService.searchDoctors(params);
                showSearchResults(doctors, `Found ${doctors.length} doctors near your location`);
            },
            (error) => {
                alert('Unable to retrieve your location. Please enter a location manually.');
                console.error('Geolocation error:', error);
            }
        );
    } else {
        alert('Geolocation is not supported by this browser. Please enter your location manually.');
    }
}

// Make functions available globally
window.searchBySymptoms = searchBySymptoms;
window.findDoctorsByLocation = findDoctorsByLocation;
window.displayAllDoctors = displayAllDoctors;
window.getStarRating = getStarRating;
window.getCurrentLocationForSearch = getCurrentLocationForSearch;
