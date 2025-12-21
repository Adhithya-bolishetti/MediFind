// Load medical shops
async function loadMedicalShops() {
    console.log('Loading medical shops');
    
    try {
        const params = {};
        
        // Add search parameter
        const searchInput = document.getElementById('search-medical-shops');
        if (searchInput && searchInput.value.trim()) {
            params.search = searchInput.value.trim();
        }
        
        // Add sort parameter
        const sortSelect = document.getElementById('sort-medical-shops');
        if (sortSelect) {
            params.sort = sortSelect.value;
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
        alert('Failed to load medical shops.');
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
        medicalShopsGrid.innerHTML = '<p>No medical shops found.</p>';
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
                <p class="shop-license"><i class="fas fa-certificate"></i> License: ${shop.licenseNumber}</p>
                ${distanceInfo}
                <div class="shop-rating">
                    <div class="stars">${getStarRating(shop.rating || 0)}</div>
                    <span class="rating-value">${shop.rating || 0}</span>
                    <span class="reviews-count">(${shop.reviewCount || 0} reviews)</span>
                </div>
            </div>
        `;
        medicalShopsGrid.appendChild(shopCard);
    });
    
    medicalShopsCount.textContent = `Showing ${shops.length} medical shops`;
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
            return;
        }
        
        // Show dashboard
        document.getElementById('shop-registration-prompt').style.display = 'none';
        document.getElementById('shop-dashboard').style.display = 'block';
        
        // Update shop info
        document.getElementById('shop-dashboard-name').textContent = shop.shopName;
        document.getElementById('shop-dashboard-address').textContent = `${shop.address}, ${shop.city}`;
        document.getElementById('shop-dashboard-license').textContent = shop.licenseNumber;
        
    } catch (error) {
        console.error('Load dashboard error:', error);
        alert('Failed to load dashboard.');
    }
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