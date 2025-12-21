// User management functions
async function loginUser(email, password, type) {
    console.log('Login attempt for:', email, 'type:', type);
    
    try {
        const result = await apiService.login({ email, password });
        
        if (result.error) {
            alert(result.error);
            return;
        }
        
        // Verify user type matches login type
        if (type && result.type !== type) {
            let actualType = result.type;
            if (result.type === 'medical_shop') {
                actualType = 'Medical Shop Owner';
            } else {
                actualType = result.type.charAt(0).toUpperCase() + result.type.slice(1);
            }
            alert(`Please login as a ${actualType}`);
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
    console.log('Signup attempt for:', name, email, 'type:', type);
    
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

// Make functions globally available
window.loginUser = loginUser;
window.signupUser = signupUser;
window.logout = logout;
