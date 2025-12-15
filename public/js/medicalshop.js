// Medical Shop functionality
let currentMedicalShop = null;
let medicalShopProducts = [];

// DOM Elements for Medical Shop
let medicalShopSection;
let shopOwnerSection;
let shopProductsGrid;
let addProductForm;
let shopOrdersList;

// Medical Shop Owner Registration
async function registerMedicalShopOwner(name, email, password, shopName, shopAddress, licenseNumber) {
    try {
        const result = await apiService.signup({ 
            name, 
            email, 
            password, 
            type: 'medical_shop' 
        });
        
        if (result.error) {
            alert(result.error);
            return;
        }
        
        // Create shop profile
        const shopData = {
            shopName,
            shopAddress,
            licenseNumber,
            ownerId: result.id,
            ownerName: name,
            email: email,
            rating: 0,
            reviewCount: 0,
            createdAt: new Date()
        };
        
        const shopResult = await apiService.registerMedicalShop(shopData);
        
        currentUser = result;
        currentMedicalShop = shopResult;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('currentMedicalShop', JSON.stringify(currentMedicalShop));
        
        updateUIForUser();
        alert(`Medical Shop "${shopName}" registered successfully!`);
        showMedicalShopOwnerSection();
    } catch (error) {
        alert('Medical shop registration failed. Please try again.');
        console.error('Medical shop registration error:', error);
    }
}

// Display Medical Shops to Customers
async function displayMedicalShops() {
    try {
        const shops = await apiService.getMedicalShops();
        const shopsGrid = document.getElementById('medical-shops-grid');
        
        if (!shopsGrid) return;
        
        shopsGrid.innerHTML = '';
        
        if (shops.length === 0) {
            shopsGrid.innerHTML = '<p>No medical shops registered yet.</p>';
            return;
        }
        
        shops.forEach(shop => {
            const shopCard = document.createElement('div');
            shopCard.className = 'medical-shop-card';
            shopCard.innerHTML = `
                <div class="shop-image">
                    <i class="fas fa-clinic-medical"></i>
                </div>
                <div class="shop-info">
                    <h3 class="shop-name">${shop.shopName}</h3>
                    <p class="shop-location">
                        <i class="fas fa-map-marker-alt"></i> ${shop.shopAddress}
                    </p>
                    <p class="shop-license">
                        <i class="fas fa-certificate"></i> License: ${shop.licenseNumber}
                    </p>
                    <div class="shop-rating">
                        <div class="stars">${getStarRating(shop.rating || 0)}</div>
                        <span class="rating-value">${shop.rating || 0}</span>
                        <span class="reviews-count">(${shop.reviewCount || 0} reviews)</span>
                    </div>
                    <div class="shop-actions">
                        <button class="btn btn-small view-shop-products" data-shop-id="${shop._id}">
                            View Products
                        </button>
                        <button class="btn btn-small btn-secondary view-shop-location" data-address="${shop.shopAddress}">
                            View Location
                        </button>
                    </div>
                </div>
            `;
            shopsGrid.appendChild(shopCard);
        });
        
        // Add event listeners
        document.querySelectorAll('.view-shop-products').forEach(button => {
            button.addEventListener('click', (e) => {
                const shopId = e.target.getAttribute('data-shop-id');
                viewShopProducts(shopId);
            });
        });
        
        document.querySelectorAll('.view-shop-location').forEach(button => {
            button.addEventListener('click', (e) => {
                const address = e.target.getAttribute('data-address');
                showShopLocationOnMap(address);
            });
        });
        
    } catch (error) {
        console.error('Error loading medical shops:', error);
    }
}

// View Products of a Specific Shop
async function viewShopProducts(shopId) {
    try {
        const products = await apiService.getShopProducts(shopId);
        const productsGrid = document.getElementById('shop-products-grid');
        
        if (!productsGrid) return;
        
        productsGrid.innerHTML = '';
        
        if (products.length === 0) {
            productsGrid.innerHTML = '<p>No products available in this shop.</p>';
            return;
        }
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image">
                    <i class="fas fa-pills"></i>
                </div>
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-description">${product.description}</p>
                    <p class="product-category">
                        <i class="fas fa-tag"></i> ${product.category}
                    </p>
                    <p class="product-brand">
                        <i class="fas fa-industry"></i> ${product.brand}
                    </p>
                    <div class="product-details">
                        <span class="product-price">₹${product.price}</span>
                        <span class="product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                            ${product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                        </span>
                    </div>
                    ${currentUser && currentUser.type === 'customer' ? `
                        <button class="btn btn-small add-to-cart" data-product-id="${product._id}">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    ` : ''}
                </div>
            `;
            productsGrid.appendChild(productCard);
        });
        
        // Add to cart functionality for customers
        if (currentUser && currentUser.type === 'customer') {
            document.querySelectorAll('.add-to-cart').forEach(button => {
                button.addEventListener('click', (e) => {
                    const productId = e.target.getAttribute('data-product-id');
                    addToCart(productId);
                });
            });
        }
        
        // Show products modal
        document.getElementById('shop-products-modal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading shop products:', error);
    }
}

// Medical Shop Owner Dashboard
function showMedicalShopOwnerSection() {
    hideAllSections();
    shopOwnerSection.style.display = 'block';
    loadShopOwnerDashboard();
}

async function loadShopOwnerDashboard() {
    if (!currentMedicalShop) {
        // Try to load from API
        const shops = await apiService.getMedicalShops();
        currentMedicalShop = shops.find(shop => shop.ownerId === currentUser.id);
        
        if (!currentMedicalShop) {
            // Show registration form
            document.getElementById('shop-registration-form').style.display = 'block';
            document.getElementById('shop-dashboard').style.display = 'none';
            return;
        }
    }
    
    document.getElementById('shop-registration-form').style.display = 'none';
    document.getElementById('shop-dashboard').style.display = 'block';
    
    // Load shop info
    document.getElementById('shop-dashboard-name').textContent = currentMedicalShop.shopName;
    document.getElementById('shop-dashboard-address').textContent = currentMedicalShop.shopAddress;
    document.getElementById('shop-dashboard-license').textContent = currentMedicalShop.licenseNumber;
    
    // Load products
    await loadShopProducts();
    // Load orders
    await loadShopOrders();
}

async function loadShopProducts() {
    try {
        medicalShopProducts = await apiService.getShopProducts(currentMedicalShop._id);
        shopProductsGrid.innerHTML = '';
        
        medicalShopProducts.forEach(product => {
            const productRow = document.createElement('tr');
            productRow.innerHTML = `
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.brand}</td>
                <td>₹${product.price}</td>
                <td class="${product.stock > 10 ? 'stock-high' : product.stock > 0 ? 'stock-low' : 'stock-out'}">
                    ${product.stock}
                </td>
                <td>
                    <button class="btn btn-small btn-warning edit-product" data-id="${product._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger delete-product" data-id="${product._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            shopProductsGrid.appendChild(productRow);
        });
    } catch (error) {
        console.error('Error loading shop products:', error);
    }
}

async function loadShopOrders() {
    try {
        const orders = await apiService.getShopOrders(currentMedicalShop._id);
        shopOrdersList.innerHTML = '';
        
        if (orders.length === 0) {
            shopOrdersList.innerHTML = '<tr><td colspan="6">No orders yet</td></tr>';
            return;
        }
        
        orders.forEach(order => {
            const orderRow = document.createElement('tr');
            orderRow.innerHTML = `
                <td>#${order.orderNumber}</td>
                <td>${order.customerName}</td>
                <td>${order.items.length} items</td>
                <td>₹${order.totalAmount}</td>
                <td class="status-${order.status}">${order.status}</td>
                <td>
                    ${order.status === 'pending' ? `
                        <button class="btn btn-small btn-success confirm-order" data-id="${order._id}">
                            Confirm
                        </button>
                    ` : ''}
                    <button class="btn btn-small view-order-details" data-id="${order._id}">
                        Details
                    </button>
                </td>
            `;
            shopOrdersList.appendChild(orderRow);
        });
    } catch (error) {
        console.error('Error loading shop orders:', error);
    }
}

// Add/Edit Product
async function saveProduct(productData, productId = null) {
    try {
        if (productId) {
            // Update existing product
            await apiService.updateProduct(productId, productData);
            alert('Product updated successfully!');
        } else {
            // Add new product
            productData.shopId = currentMedicalShop._id;
            await apiService.addProduct(productData);
            alert('Product added successfully!');
        }
        
        addProductForm.reset();
        await loadShopProducts();
        
    } catch (error) {
        alert('Error saving product. Please try again.');
        console.error('Save product error:', error);
    }
}

// Shopping Cart for Customers
let shoppingCart = [];

function addToCart(productId) {
    const product = medicalShopProducts.find(p => p._id === productId);
    if (!product) return;
    
    if (product.stock <= 0) {
        alert('This product is out of stock.');
        return;
    }
    
    const existingItem = shoppingCart.find(item => item.productId === productId);
    
    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            alert('Cannot add more than available stock.');
            return;
        }
        existingItem.quantity += 1;
    } else {
        shoppingCart.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            shopId: product.shopId
        });
    }
    
    updateCartCount();
    alert(`${product.name} added to cart!`);
}

function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = shoppingCart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'inline' : 'none';
    }
}

async function checkout() {
    if (shoppingCart.length === 0) {
        alert('Your cart is empty.');
        return;
    }
    
    try {
        const orderData = {
            shopId: shoppingCart[0].shopId, // Assuming all items from same shop
            customerId: currentUser.id,
            customerName: currentUser.name,
            items: shoppingCart,
            totalAmount: shoppingCart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: 'pending',
            orderDate: new Date().toISOString()
        };
        
        await apiService.createOrder(orderData);
        
        // Clear cart
        shoppingCart = [];
        updateCartCount();
        
        alert('Order placed successfully! The shop will contact you for delivery.');
        
    } catch (error) {
        alert('Error placing order. Please try again.');
        console.error('Checkout error:', error);
    }
}

// Initialize Medical Shop Section
function initializeMedicalShop() {
    medicalShopSection = document.getElementById('medical-shops-section');
    shopOwnerSection = document.getElementById('medical-shop-owner-section');
    shopProductsGrid = document.getElementById('shop-products-grid');
    addProductForm = document.getElementById('add-product-form');
    shopOrdersList = document.getElementById('shop-orders-list');
    
    // Load saved medical shop data
    const savedShop = localStorage.getItem('currentMedicalShop');
    if (savedShop) {
        currentMedicalShop = JSON.parse(savedShop);
    }
    
    // Initialize shopping cart
    const savedCart = localStorage.getItem('shoppingCart');
    if (savedCart) {
        shoppingCart = JSON.parse(savedCart);
        updateCartCount();
    }
}

// Save cart to localStorage when page unloads
window.addEventListener('beforeunload', () => {
    localStorage.setItem('shoppingCart', JSON.stringify(shoppingCart));
});