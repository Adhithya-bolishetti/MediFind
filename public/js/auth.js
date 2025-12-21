// User management functions
async function loginUser(email, password, type) {
    try {
        const result = await apiService.login({ email, password });
        
        if (result.error) {
            alert(result.error);
            return;
        }
        
        // Verify user type matches login type
        if (result.type !== type) {
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
        alert('Login failed. Please check your credentials and try again.');
    }
}

async function signupUser(name, email, password, type) {
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

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUIForUser();
    
    alert('You have been logged out.');
    
    // Redirect to search section
    showSearchSection();
}

function updateUIForUser() {
    console.log('Updating UI for user:', currentUser);
    
    // Navigation elements
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
    const cartIcon = document.getElementById('cart-icon');
    
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
        if (cartIcon) cartIcon.style.display = 'none';
        
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
        if (cartIcon) cartIcon.style.display = 'none';
        
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

// Make functions globally available
window.loginUser = loginUser;
window.signupUser = signupUser;
window.logout = logout;
