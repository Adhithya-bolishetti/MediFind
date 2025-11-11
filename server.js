// Function to search by symptoms only
async function searchBySymptoms(symptoms) {
    if (!symptoms || symptoms.trim() === '') {
        alert('Please enter symptoms to search for doctors.');
        return;
    }
    
    try {
        console.log('🔍 Starting symptoms search for:', symptoms);
        
        // Build search parameters
        const params = {
            symptoms: symptoms.trim(),
            location: locationInput.value.trim(),
            specialty: document.getElementById('specialty-filter').value,
            rating: document.getElementById('rating-filter').value
        };
        
        // Remove empty parameters
        Object.keys(params).forEach(key => {
            if (!params[key] || params[key] === 'all' || params[key] === '0') {
                delete params[key];
            }
        });
        
        console.log('📤 Search params:', params);
        
        const filteredDoctors = await apiService.searchDoctors(params);
        console.log('📥 Search results:', filteredDoctors);

        if (filteredDoctors.length === 0) {
            console.log('❌ No doctors found with direct search, trying fallback...');
            
            // Fallback: Get all doctors and filter client-side
            const allDoctors = await apiService.getDoctors();
            console.log('📊 All doctors available:', allDoctors.length);
            
            // Enhanced client-side filtering
            const symptomsLower = symptoms.toLowerCase().trim();
            const fallbackResults = allDoctors.filter(doctor => {
                const bioMatch = doctor.bio.toLowerCase().includes(symptomsLower);
                const specialtyMatch = doctor.specialty.toLowerCase().includes(symptomsLower);
                const educationMatch = doctor.education.toLowerCase().includes(symptomsLower);
                const nameMatch = doctor.name.toLowerCase().includes(symptomsLower);
                
                return bioMatch || specialtyMatch || educationMatch || nameMatch;
            });
            
            console.log('🔄 Fallback results:', fallbackResults);
            
            if (fallbackResults.length === 0) {
                doctorsGrid.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search fa-3x"></i>
                        <h3>No doctors found</h3>
                        <p>No doctors found for "${symptoms}". Try different symptoms like "fever", "headache", or "cough".</p>
                    </div>
                `;
                resultsCount.textContent = `No results found for "${symptoms}"`;
                return;
            }
            
            // Use fallback results
            currentSearchResults = [...fallbackResults];
            showSearchResults(currentSearchResults, `Showing ${fallbackResults.length} doctors for "${symptoms}" (fallback search)`);
            
        } else {
            // Use direct search results
            currentSearchResults = [...filteredDoctors];
            showSearchResults(currentSearchResults, `Showing ${filteredDoctors.length} doctors for "${symptoms}"`);
        }
        
    } catch (error) {
        console.error('💥 Search error:', error);
        
        // Emergency fallback: Show all doctors
        try {
            const allDoctors = await apiService.getDoctors();
            currentSearchResults = [...allDoctors];
            showSearchResults(currentSearchResults, `Showing all ${allDoctors.length} doctors (emergency fallback)`);
            alert('Search encountered an error. Showing all available doctors instead.');
        } catch (fallbackError) {
            console.error('Emergency fallback failed:', fallbackError);
            doctorsGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle fa-3x"></i>
                    <h3>Search Failed</h3>
                    <p>Unable to load doctors. Please check your connection and try again.</p>
                </div>
            `;
            resultsCount.textContent = 'Search failed - please try again';
        }
    }
}

// Helper function to display search results
function showSearchResults(doctorsToShow, message) {
    // Calculate distances if user location is available for sorting
    if (userLocation) {
        doctorsToShow.forEach(doctor => {
            doctor.distance = calculateDistance(
                userLocation.lat, userLocation.lng,
                doctor.lat, doctor.lng
            );
        });
    }
    
    // Apply initial sorting
    const sortedResults = sortDoctors([...doctorsToShow], sortResults.value);
    
    // Display the doctors
    displayDoctors(sortedResults, doctorsGrid);
    searchSection.style.display = 'block';
    resultsSection.style.display = 'block';
    allDoctorsSection.style.display = 'none';
    registrationSection.style.display = 'none';
    appointmentsSection.style.display = 'none';
    profileSection.style.display = 'none';
    
    // Update results count
    resultsCount.textContent = message;
}

// New function to find doctors by location
async function findDoctorsByLocation(locationText) {
    if (!locationText || locationText.trim() === '') {
        alert('Please enter a location to search for doctors.');
        return;
    }
    
    try {
        console.log('📍 Starting location search for:', locationText);
        
        const params = {
            location: locationText.trim(),
            specialty: document.getElementById('specialty-filter').value,
            rating: document.getElementById('rating-filter').value
        };
        
        // Remove empty parameters
        Object.keys(params).forEach(key => {
            if (!params[key] || params[key] === 'all' || params[key] === '0') {
                delete params[key];
            }
        });
        
        console.log('📤 Location search params:', params);
        
        const filteredDoctors = await apiService.searchDoctors(params);
        console.log('📥 Location search results:', filteredDoctors);
        
        if (filteredDoctors.length === 0) {
            doctorsGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-map-marker-alt fa-3x"></i>
                    <h3>No doctors found in this area</h3>
                    <p>No doctors found in ${locationText}. Try a different location or search by symptoms instead.</p>
                </div>
            `;
            resultsCount.textContent = `No doctors found in ${locationText}`;
            return;
        }
        
        // Store the results for sorting
        currentSearchResults = [...filteredDoctors];
        
        // Calculate distances if user location is available for sorting
        if (userLocation) {
            currentSearchResults.forEach(doctor => {
                doctor.distance = calculateDistance(
                    userLocation.lat, userLocation.lng,
                    doctor.lat, doctor.lng
                );
            });
        }
        
        // Apply initial sorting
        const sortedResults = sortDoctors([...currentSearchResults], sortResults.value);
        
        // Display the doctors
        displayDoctors(sortedResults, doctorsGrid);
        searchSection.style.display = 'block';
        resultsSection.style.display = 'block';
        allDoctorsSection.style.display = 'none';
        registrationSection.style.display = 'none';
        appointmentsSection.style.display = 'none';
        profileSection.style.display = 'none';
        
        // Update results count
        resultsCount.textContent = `Showing ${filteredDoctors.length} doctor${filteredDoctors.length !== 1 ? 's' : ''} in ${locationText}`;
    } catch (error) {
        console.error('💥 Location search error:', error);
        doctorsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <h3>Location Search Failed</h3>
                <p>Unable to search by location. Please try again or search by symptoms instead.</p>
            </div>
        `;
        resultsCount.textContent = 'Location search failed';
    }
}

// Function to sort doctors based on selected criteria
function sortDoctors(doctorsToSort, sortValue) {
    return doctorsToSort.sort((a, b) => {
        if (sortValue === 'rating-desc') {
            return b.rating - a.rating;
        } else if (sortValue === 'distance-asc') {
            // For distance sorting, we need user location
            if (userLocation) {
                const distA = a.distance || calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
                const distB = b.distance || calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
                return distA - distB;
            } else {
                // If no location, fallback to rating
                return b.rating - a.rating;
            }
        } else if (sortValue === 'name-asc') {
            return a.name.localeCompare(b.name);
        }
        return 0;
    });
}

// Display doctors in the grid
function displayDoctors(doctorsToShow, gridElement) {
    gridElement.innerHTML = '';
    
    if (doctorsToShow.length === 0) {
        gridElement.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search fa-3x"></i>
                <h3>No doctors found</h3>
                <p>No doctors found matching your criteria. Try different symptoms or filters.</p>
            </div>
        `;
        if (gridElement === doctorsGrid) {
            resultsCount.textContent = 'Showing 0 results';
        }
        return;
    }

    // Apply filters for search results
    if (gridElement === doctorsGrid) {
        const distanceFilter = document.getElementById('location-filter').value;
        const specialtyFilter = document.getElementById('specialty-filter').value;
        const ratingFilter = parseFloat(document.getElementById('rating-filter').value);

        doctorsToShow = doctorsToShow.filter(doctor => {
            if (specialtyFilter !== 'all' && doctor.specialty.toLowerCase() !== specialtyFilter.toLowerCase()) {
                return false;
            }
            
            if (distanceFilter !== 'all' && userLocation) {
                const maxDistance = parseFloat(distanceFilter);
                const distance = doctor.distance || calculateDistance(userLocation.lat, userLocation.lng, doctor.lat, doctor.lng);
                if (distance > maxDistance) {
                    return false;
                }
            }
            
            if (ratingFilter > 0 && doctor.rating < ratingFilter) {
                return false;
            }
            
            return true;
        });
    }

    // Apply sorting for all doctors
    if (gridElement === allDoctorsGrid) {
        const sortValue = sortAllDoctors.value;
        doctorsToShow.sort((a, b) => {
            if (sortValue === 'rating-desc') {
                return b.rating - a.rating;
            } else if (sortValue === 'name-asc') {
                return a.name.localeCompare(b.name);
            } else if (sortValue === 'specialty-asc') {
                return a.specialty.localeCompare(b.specialty);
            }
            return 0;
        });
    }

    doctorsToShow.forEach(doctor => {
        const doctorCard = document.createElement('div');
        doctorCard.className = 'doctor-card';
        
        // Determine specialty badge class
        const specialtyClass = `specialty-${doctor.specialty.toLowerCase().replace(/ /g, '-')}`;
        
        // Format distance if available
        let distanceText = '';
        if (userLocation) {
            const distance = doctor.distance || calculateDistance(userLocation.lat, userLocation.lng, doctor.lat, doctor.lng);
            distanceText = `<p class="doctor-distance"><i class="fas fa-road"></i> ${distance.toFixed(1)} km away</p>`;
        }
        
        // Check if user is patient to show book appointment button
        const bookAppointmentButton = currentUser && currentUser.type !== 'doctor' 
            ? `<button class="btn btn-small book-appointment-btn" data-id="${doctor._id}">Book Appointment</button>`
            : '';
        
        doctorCard.innerHTML = `
            <div class="doctor-image">
                <i class="fas fa-user-md"></i>
            </div>
            <div class="specialty-badge ${specialtyClass}">${doctor.specialty}</div>
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
                ${distanceText}
                <p class="doctor-experience">${doctor.experience} years experience</p>
                <div class="doctor-actions">
                    <button class="btn btn-small view-reviews" data-id="${doctor._id}">View Reviews</button>
                    <button class="btn btn-small btn-warning add-review" data-id="${doctor._id}">Add Review</button>
                    <button class="btn btn-small btn-secondary show-location" data-id="${doctor._id}">Show Location</button>
                    ${bookAppointmentButton}
                </div>
            </div>
        `;
        gridElement.appendChild(doctorCard);
    });

    if (gridElement === doctorsGrid) {
        resultsCount.textContent = `Showing ${doctorsToShow.length} result${doctorsToShow.length !== 1 ? 's' : ''}`;
    } else if (gridElement === allDoctorsGrid) {
        allDoctorsCount.textContent = `Showing ${doctorsToShow.length} doctor${doctorsToShow.length !== 1 ? 's' : ''}`;
    }

    // Add event listeners to buttons
    document.querySelectorAll('.view-reviews').forEach(button => {
        button.addEventListener('click', (e) => {
            const doctorId = e.target.getAttribute('data-id');
            console.log('View reviews clicked for doctor:', doctorId);
            openReviewModal(doctorId, false);
        });
    });

    document.querySelectorAll('.add-review').forEach(button => {
        button.addEventListener('click', (e) => {
            const doctorId = e.target.getAttribute('data-id');
            console.log('Add review clicked for doctor:', doctorId);
            openReviewModal(doctorId, true);
        });
    });

    document.querySelectorAll('.show-location').forEach(button => {
        button.addEventListener('click', (e) => {
            const doctorId = e.target.getAttribute('data-id');
            showDoctorLocation(doctorId);
        });
    });

    // Add event listeners for booking appointments
    document.querySelectorAll('.book-appointment-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const doctorId = e.target.getAttribute('data-id');
            console.log('Book appointment clicked for doctor:', doctorId);
            openBookingModal(doctorId);
        });
    });
}

// Display all doctors
async function displayAllDoctors() {
    try {
        const allDoctors = await apiService.getDoctors();
        displayDoctors(allDoctors, allDoctorsGrid);
    } catch (error) {
        console.error('Load doctors error:', error);
        allDoctorsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <h3>Failed to load doctors</h3>
                <p>Unable to load doctors list. Please check your connection and try again.</p>
            </div>
        `;
        allDoctorsCount.textContent = 'Failed to load doctors';
    }
}

// Generate star rating HTML
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

// Make functions globally available
window.searchBySymptoms = searchBySymptoms;
window.findDoctorsByLocation = findDoctorsByLocation;
window.displayAllDoctors = displayAllDoctors;