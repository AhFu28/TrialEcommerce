/**
 * Faiz Store — Central Data Store
 * Simulates a backend using localStorage
 */

const Store = {
  KEYS: {
    PRODUCTS: "lumina_products",
    ORDERS: "lumina_orders",
    CART: "lumina_cart",
    USERS: "lumina_users"
  },

  init() {
    this.seedProducts();
    this.seedAdmin();
  },

  _get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },

  _set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // ── Users & Auth ───────────────────────────────────────────────────
  getUsers() {
    return this._get(this.KEYS.USERS);
  },
  
  getUserByEmail(email) {
    return this.getUsers().find(u => u.email === email);
  },

  createUser(userData) {
    const users = this.getUsers();
    if (users.find(u => u.email === userData.email)) {
      throw new Error("User already exists");
    }
    userData.id = "user_" + Date.now();
    userData.createdAt = new Date().toISOString();
    users.push(userData);
    this._set(this.KEYS.USERS, users);
    return userData;
  },

  seedAdmin() {
    const users = this.getUsers();
    if (!users.find(u => u.role === 'admin')) {
      users.push({
        id: "admin_1",
        name: "Store Admin",
        email: "admin@luminacommerce.com",
        password: "admin", // Simple password for simulation
        role: "admin"
      });
      this._set(this.KEYS.USERS, users);
    }
  },

  // ── Products ───────────────────────────────────────────────────────
  getAllProducts() {
    return this._get(this.KEYS.PRODUCTS);
  },

  getProductById(id) {
    return this.getAllProducts().find(p => p.id === id);
  },

  addProduct(product) {
    const products = this.getAllProducts();
    product.id = "prod_" + Date.now();
    products.push(product);
    this._set(this.KEYS.PRODUCTS, products);
  },

  updateProduct(id, updates) {
    const products = this.getAllProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx > -1) {
      products[idx] = { ...products[idx], ...updates };
      this._set(this.KEYS.PRODUCTS, products);
    }
  },

  deleteProduct(id) {
    let products = this.getAllProducts();
    products = products.filter(p => p.id !== id);
    this._set(this.KEYS.PRODUCTS, products);
  },

  seedProducts() {
    const products = this.getAllProducts();
    if (products.length > 0) return;

    const initialProducts = [
      { id: "prod_1", name: "Premium Wireless Headphones", category: "electronics", price: 1500000, stock: 45, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80", isOfficial: true, isBestSeller: true, description: "High fidelity wireless headphones with noise cancellation." },
      { id: "prod_2", name: "Smart Watch Pro", category: "electronics", price: 2500000, stock: 12, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80", isOfficial: true, isBestSeller: false, description: "Track your health and stay connected." },
      { id: "prod_3", name: "Minimalist Leather Bag", category: "fashion", price: 850000, stock: 30, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80", isOfficial: false, isBestSeller: true, description: "Genuine leather bag for daily use." },
      { id: "prod_4", name: "Ceramic Coffee Mug", category: "home-living", price: 125000, stock: 100, image: "https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=800&q=80", isOfficial: false, isBestSeller: false, description: "Handcrafted ceramic mug." },
      { id: "prod_5", name: "Organic Green Tea", category: "kitchen", price: 85000, stock: 200, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80", isOfficial: true, isBestSeller: false, description: "Premium imported organic green tea leaves." },
      { id: "prod_6", name: "Ergonomic Office Chair", category: "home-living", price: 1850000, stock: 5, image: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800&q=80", isOfficial: true, isBestSeller: true, description: "Supportive office chair for long working hours." }
    ];
    this._set(this.KEYS.PRODUCTS, initialProducts);
  },

  // ── Cart ───────────────────────────────────────────────────────────
  getCart() {
    return this._get(this.KEYS.CART);
  },

  addToCart(productId, qty = 1) {
    const cart = this.getCart();
    const existing = cart.find(i => i.productId === productId);
    if (existing) existing.quantity += qty;
    else cart.push({ productId, quantity: qty });
    this._set(this.KEYS.CART, cart);
    this.updateCartBadge();
    alert("Added to cart!");
  },

  clearCart() {
    this._set(this.KEYS.CART, []);
    this.updateCartBadge();
  },

  updateCartBadge() {
    const cart = this.getCart();
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'inline-block' : 'none';
    });
  },

  // ── Orders ─────────────────────────────────────────────────────────
  getOrders() {
    return this._get(this.KEYS.ORDERS);
  },

  createOrder(orderData) {
    const orders = this.getOrders();
    const order = {
      id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toISOString(),
      ...orderData
    };
    orders.push(order);
    this._set(this.KEYS.ORDERS, orders);
    return order;
  },

  // ── Utilities ──────────────────────────────────────────────────────
  formatCurrency(amount) {
    return "Rp " + Number(amount).toLocaleString("id-ID");
  }
};

// Initialize on load
Store.init();
