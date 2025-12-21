// Search by symptoms
async function searchBySymptoms(symptoms) {
    console.log('Searching by symptoms:', symptoms);
    
    try {
        const params = {
            symptoms: symptoms,
            location: document.getElementById('location-input').value.trim(),
            specialty: document.getElementById('specialty-filter').value,
            rating: document.getElementById('rating-filter').value
        };
        
        console.log('Search params:', params);
        const doctors = await apiService.searchDoctors(params);
        console.log('Found doctors:', doctors.length);
        
        // Show results
        showSearchResults(doctors, `Found ${doctors.length} doctors for "${symptoms}"`);
        
    } catch (error) {
        console.error('Search error:', error);
        alert('Search failed. Please try again.');
    }
}

// Find doctors by location
async function findDoctorsByLocation(location) {
    console.log('Finding doctors by location:', location);
    
    try {
        const params = {
            location: location,
            specialty: document.getElementById('specialty-filter').value,
            rating: document.getElementById('rating-filter').value
        };
        
        const doctors = await apiService.searchDoctors(params);
        showSearchResults(doctors, `Found ${doctors.length} doctors in "${location}"`);
        
    } catch (error) {
        console.error('Location search error:', error);
        alert('Location search failed. Please try again.');
    }
}

// Display search results
function showSearchResults(doctors, message) {
    console.log('Showing search results:', doctors.length, 'doctors');
    
    const doctorsGrid = document.getElementById('doctors-grid');
    const resultsCount = document.getElementById('results-count');
    
    if (!doctorsGrid || !resultsCount) return;
    
    doctorsGrid.innerHTML = '';
    
    if (doctors.length === 0) {
        doctorsGrid.innerHTML = '<p>No doctors found matching your criteria.</p>';
        resultsCount.textContent = 'No results found';
        return;
    }
    
    // Display each doctor
    doctors.forEach(doctor => {
        const doctorCard = document.createElement('div');
        doctorCard.className = 'doctor-card';
        doctorCard.innerHTML = `
            <div class="doctor-image">
                <i class="fas fa-user-md"></i>
            </div>
            <div class="specialty-badge specialty-${doctor.specialty.toLowerCase().replace(/ /g, '-')}">
                ${doctor.specialty}
            </div>
            <div class="doctor-info">
                <h3 class="doctor-name">${doctor.name}</h3>
                <p class="doctor-specialty">${doctor.specialty}</p>
                <p class="doctor-location">
                    <i class="fas fa-map-marker-alt"></i> ${doctor.address}, ${doctor.city}
                </p>
                <div class="doctor-rating">
                    <div class="stars">${getStarRating(doctor.rating)}</div>
                    <span class="rating-value">${doctor.rating}</span>
                    <span class="reviews-count">(${doctor.reviewCount} reviews)</span>
                </div>
                <p class="doctor-experience">${doctor.experience} years experience</p>
                <div class="doctor-actions">
                    <button class="btn btn-small view-reviews" data-id="${doctor._id}">
                        View Reviews
                    </button>
                    <button class="btn btn-small btn-warning add-review" data-id="${doctor._id}">
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

// Display all doctors
async function displayAllDoctors() {
    console.log('Displaying all doctors');
    
    try {
        const doctors = await apiService.getDoctors();
        const allDoctorsGrid = document.getElementById('all-doctors-grid');
        const allDoctorsCount = document.getElementById('all-doctors-count');
        
        if (!allDoctorsGrid || !allDoctorsCount) return;
        
        allDoctorsGrid.innerHTML = '';
        
        if (doctors.length === 0) {
            allDoctorsGrid.innerHTML = '<p>No doctors registered yet.</p>';
            allDoctorsCount.textContent = 'No doctors';
            return;
        }
        
        doctors.forEach(doctor => {
            const doctorCard = document.createElement('div');
            doctorCard.className = 'doctor-card';
            doctorCard.innerHTML = `
                <div class="doctor-image">
                    <i class="fas fa-user-md"></i>
                </div>
                <div class="specialty-badge specialty-${doctor.specialty.toLowerCase().replace(/ /g, '-')}">
                    ${doctor.specialty}
                </div>
                <div class="doctor-info">
                    <h3 class="doctor-name">${doctor.name}</h3>
                    <p class="doctor-specialty">${doctor.specialty}</p>
                    <p class="doctor-location">
                        <i class="fas fa-map-marker-alt"></i> ${doctor.address}, ${doctor.city}
                    </p>
                    <div class="doctor-rating">
                        <div class="stars">${getStarRating(doctor.rating)}</div>
                        <span class="rating-value">${doctor.rating}</span>
                        <span class="reviews-count">(${doctor.reviewCount} reviews)</span>
                    </div>
                    <p class="doctor-experience">${doctor.experience} years experience</p>
                    <div class="doctor-actions">
                        <button class="btn btn-small view-reviews" data-id="${doctor._id}">
                            View Reviews
                        </button>
                        <button class="btn btn-small btn-warning add-review" data-id="${doctor._id}">
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
        alert('Failed to load doctors.');
    }
}

// Star rating helper
function getStarRating(rating) {
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

// Make functions available globally
window.searchBySymptoms = searchBySymptoms;
window.findDoctorsByLocation = findDoctorsByLocation;
window.displayAllDoctors = displayAllDoctors;
window.getStarRating = getStarRating;