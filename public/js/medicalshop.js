
// Load medical shops for customers
async function loadMedicalShops() {
    console.log('Loading medical shops');
    
    try {
        const medicalShopsGrid = document.getElementById('medical-shops-grid');
        const medicalShopsCount = document.getElementById('medical-shops-count');
        
        if (!medicalShopsGrid || !medicalShopsCount) return;
        
        medicalShopsGrid.innerHTML = '<div class="loading-shops"><i class="fas fa-spinner fa-spin"></i><p>Loading medical shops...</p></div>';
        
        const params = {};
        
        // Add search parameter
        const searchInput = document.getElementById('search-medical-shops');
        if (searchInput && searchInput.value.trim()) {
            params.search = searchInput.value.trim();
        }
        
        // Add location if available
        if (window.userLocation) {
            params.lat = window.userLocation.lat;
            params.lng = window.userLocation.lng;
        }
        
        const shops = await apiService.getMedicalShops(params);
        displayMedicalShops(shops);
        
    } catch (error) {
        console.error('Load medical shops error:', error);
        const medicalShopsGrid = document.getElementById('medical-shops-grid');
        if (medicalShopsGrid) {
            medicalShopsGrid.innerHTML = '<div class="error-message"><p>Failed to load medical shops. Please try again.</p></div>';
        }
    }
}

// Display medical shops
function displayMedicalShops(shops) {
    console.log('Displaying medical shops:', shops.length);
    
    const medicalShopsGrid = document.getElementById('medical-shops-grid');
    const medicalShopsCount = document.getElementById('medical-shops-count');
    
    if (!medicalShopsGrid || !medicalShopsCount) return;
    
    medicalShopsGrid.innerHTML = '';
    
    if (shops.length === 0) {
        medicalShopsGrid.innerHTML = `
            <div class="no-shops-found">
                <i class="fas fa-search fa-3x"></i>
                <h3>No medical shops found</h3>
                <p>Try searching with different keywords or check back later.</p>
            </div>
        `;
        medicalShopsCount.textContent = 'No shops found';
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
                <p class="shop-email"><i class="fas fa-envelope"></i> ${shop.email}</p>
                <p class="shop-license"><i class="fas fa-certificate"></i> License: ${shop.licenseNumber}</p>
                ${distanceInfo}
                <div class="shop-rating">
                    <div class="stars">${getStarRating(shop.rating || 0)}</div>
                    <span class="rating-value">${shop.rating || 0}</span>
                    <span class="reviews-count">(${shop.reviewCount || 0} reviews)</span>
                </div>
                <div class="shop-actions">
                    <button class="btn btn-small get-directions" 
                            data-lat="${shop.lat}" 
                            data-lng="${shop.lng}"
                            data-name="${shop.shopName}"
                            data-address="${shop.address}, ${shop.city}">
                        <i class="fas fa-directions"></i> Get Directions
                    </button>
                    <button class="btn btn-small btn-secondary view-on-map" 
                            data-lat="${shop.lat}" 
                            data-lng="${shop.lng}"
                            data-name="${shop.shopName}">
                        <i class="fas fa-map"></i> View on Map
                    </button>
                </div>
            </div>
        `;
        medicalShopsGrid.appendChild(shopCard);
    });
    
    medicalShopsCount.textContent = `Showing ${shops.length} medical shop${shops.length !== 1 ? 's' : ''}`;
    
    // Add event listeners to shop buttons
    setTimeout(() => {
        document.querySelectorAll('.get-directions').forEach(button => {
            button.addEventListener('click', function() {
                const lat = parseFloat(this.getAttribute('data-lat'));
                const lng = parseFloat(this.getAttribute('data-lng'));
                const name = this.getAttribute('data-name');
                const address = this.getAttribute('data-address');
                console.log('Get directions clicked for:', name);
                showDirections(lat, lng, name, address);
            });
        });
        
        document.querySelectorAll('.view-on-map').forEach(button => {
            button.addEventListener('click', function() {
                const lat = parseFloat(this.getAttribute('data-lat'));
                const lng = parseFloat(this.getAttribute('data-lng'));
                const name = this.getAttribute('data-name');
                console.log('View on map clicked for:', name);
                showShopOnMap(lat, lng, name);
            });
        });
    }, 100);
}

// Medical shop owner dashboard
async function loadMedicalShopOwnerDashboard() {
    console.log('Loading medical shop owner dashboard');
    
    try {
        const shop = await apiService.getMedicalShopByOwner(currentUser.id);
        
        if (!shop) {
            // Show registration form
            document.getElementById('shop-registration-prompt').style.display = 'block';
            document.getElementById('shop-dashboard').style.display = 'none';
            
            // Add event listener to registration button
            const registerBtn = document.getElementById('register-shop-btn');
            if (registerBtn) {
                registerBtn.addEventListener('click', function() {
                    openShopRegistrationModal();
                });
            }
            return;
        }
        
        // Show dashboard
        document.getElementById('shop-registration-prompt').style.display = 'none';
        document.getElementById('shop-dashboard').style.display = 'block';
        
        // Update shop info
        document.getElementById('shop-dashboard-name').textContent = shop.shopName;
        document.getElementById('shop-dashboard-address').textContent = `${shop.address}, ${shop.city}`;
        document.getElementById('shop-dashboard-license').textContent = `License: ${shop.licenseNumber}`;
        
        // Update dashboard details
        document.getElementById('dashboard-owner-name').textContent = shop.ownerName;
        document.getElementById('dashboard-email').textContent = shop.email;
        document.getElementById('dashboard-phone').textContent = shop.phone;
        document.getElementById('dashboard-address').textContent = shop.address;
        document.getElementById('dashboard-city').textContent = shop.city;
        document.getElementById('dashboard-license').textContent = shop.licenseNumber;
        
        // Initialize shop map
        initializeShopMap(shop);
        
        // Add event listeners to dashboard buttons
        const editShopBtn = document.getElementById('edit-shop-btn');
        if (editShopBtn) {
            editShopBtn.addEventListener('click', function() {
                openEditShopModal(shop);
            });
        }
        
        const viewOnMapBtn = document.getElementById('view-on-map-btn');
        if (viewOnMapBtn) {
            viewOnMapBtn.addEventListener('click', function() {
                showShopOnMap(shop.lat, shop.lng, shop.shopName);
            });
        }
        
    } catch (error) {
        console.error('Load dashboard error:', error);
        alert('Failed to load dashboard. Please try again.');
    }
}

// Initialize shop map for owner dashboard
function initializeShopMap(shop) {
    const mapElement = document.getElementById('shop-map');
    if (!mapElement) return;
    
    // Clear any existing map
    mapElement.innerHTML = '';
    
    // Create map
    const shopMap = L.map('shop-map').setView([shop.lat, shop.lng], 15);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(shopMap);
    
    // Add marker for shop location
    L.marker([shop.lat, shop.lng])
        .addTo(shopMap)
        .bindPopup(`
            <b>${shop.shopName}</b><br>
            ${shop.address}<br>
            ${shop.city}
        `)
        .openPopup();
}

// Open shop registration modal
function openShopRegistrationModal() {
    const modal = document.getElementById('shop-registration-modal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Pre-fill owner name with user name
        const ownerNameInput = document.getElementById('shop-owner-name');
        if (ownerNameInput && currentUser) {
            ownerNameInput.value = currentUser.name;
        }
        
        // Pre-fill email with user email
        const emailInput = document.getElementById('shop-email');
        if (emailInput && currentUser) {
            emailInput.value = currentUser.email;
        }
    }
}

// Open edit shop modal
function openEditShopModal(shop) {
    // You can implement this function if you want edit functionality
    alert('Edit feature coming soon! For now, please contact support to update shop details.');
}

// Show directions to shop
function showDirections(lat, lng, name, address) {
    // Open Google Maps for directions
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name + ' ' + address)}`;
    window.open(url, '_blank');
}

// Show shop on map in modal
function showShopOnMap(lat, lng, name) {
    const mapModal = document.getElementById('map-modal');
    const mapElement = document.getElementById('map');
    const mapDoctorName = document.getElementById('map-doctor-name');
    
    if (!mapModal || !mapElement || !mapDoctorName) return;
    
    // Update title
    mapDoctorName.textContent = name;
    
    // Initialize map if not already done
    if (!window.map) {
        initMap();
    }
    
    // Clear existing markers
    if (window.userMarker) {
        window.map.removeLayer(window.userMarker);
    }
    window.doctorMarkers.forEach(marker => window.map.removeLayer(marker));
    window.doctorMarkers = [];
    
    // Add shop marker
    const shopMarker = L.marker([lat, lng])
        .addTo(window.map)
        .bindPopup(`<b>${name}</b>`)
        .openPopup();
    window.doctorMarkers.push(shopMarker);
    
    // Center map on shop location
    window.map.setView([lat, lng], 15);
    
    // Show modal
    mapModal.style.display = 'flex';
}

// Search medical shops
async function searchMedicalShops() {
    console.log('Searching medical shops');
    await loadMedicalShops();
}

// Make functions available globally
window.loadMedicalShops = loadMedicalShops;
window.loadMedicalShopOwnerDashboard = loadMedicalShopOwnerDashboard;
window.searchMedicalShops = searchMedicalShops;
window.openShopRegistrationModal = openShopRegistrationModal;