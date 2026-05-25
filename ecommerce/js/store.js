/**
 * Faiz Store — Central Data Store (localStorage)
 * All product, order, promo, bundle, and config data lives here.
 */

const FaizStore = {
  // ── Keys ─────────────────────────────────────────────────────────
  KEYS: {
    PRODUCTS: "faiz_products",
    ORDERS: "faiz_orders",
    PROMOS: "faiz_promos",
    BUNDLES: "faiz_bundles",
    HIGHLIGHTS: "faiz_highlights",
    CART: "faiz_cart",
    USERS: "faiz_users",
    ANALYTICS: "faiz_analytics",
  },

  // ── Generic CRUD ─────────────────────────────────────────────────
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || null;
    } catch {
      return null;
    }
  },

  set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // ── Products ─────────────────────────────────────────────────────
  getProducts(filter = {}) {
    let products = this.get(this.KEYS.PRODUCTS) || [];
    if (filter.status) products = products.filter((p) => p.status === filter.status);
    if (filter.category) products = products.filter((p) => p.category === filter.category);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      products = products.filter(
        (p) => p.name.toLowerCase().includes(q) || p.nameId.toLowerCase().includes(q)
      );
    }
    return products;
  },

  getProductById(id) {
    const products = this.get(this.KEYS.PRODUCTS) || [];
    return products.find((p) => p.id === id) || null;
  },

  saveProduct(product) {
    const products = this.get(this.KEYS.PRODUCTS) || [];
    if (!product.id) {
      product.id = "prod_" + Date.now();
      product.createdAt = new Date().toISOString();
      products.push(product);
    } else {
      const idx = products.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        product.updatedAt = new Date().toISOString();
        products[idx] = product;
      }
    }
    this.set(this.KEYS.PRODUCTS, products);
    return product;
  },

  deleteProduct(id) {
    const products = (this.get(this.KEYS.PRODUCTS) || []).filter((p) => p.id !== id);
    this.set(this.KEYS.PRODUCTS, products);
  },

  // ── Cart ─────────────────────────────────────────────────────────
  getCart() {
    return this.get(this.KEYS.CART) || [];
  },

  addToCart(productId, qty = 1, variant = null) {
    const cart = this.getCart();
    const existing = cart.find(
      (i) => i.productId === productId && JSON.stringify(i.variant) === JSON.stringify(variant)
    );
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ productId, qty, variant, addedAt: new Date().toISOString() });
    }
    this.set(this.KEYS.CART, cart);
    FaizUI.updateCartBadge();
    return cart;
  },

  updateCartQty(productId, qty, variant = null) {
    const cart = this.getCart();
    const item = cart.find(
      (i) => i.productId === productId && JSON.stringify(i.variant) === JSON.stringify(variant)
    );
    if (item) {
      item.qty = Math.max(0, qty);
      if (item.qty === 0) return this.removeFromCart(productId, variant);
    }
    this.set(this.KEYS.CART, cart);
    FaizUI.updateCartBadge();
  },

  removeFromCart(productId, variant = null) {
    const cart = this.getCart().filter(
      (i) =>
        !(i.productId === productId && JSON.stringify(i.variant) === JSON.stringify(variant))
    );
    this.set(this.KEYS.CART, cart);
    FaizUI.updateCartBadge();
  },

  clearCart() {
    this.set(this.KEYS.CART, []);
    FaizUI.updateCartBadge();
  },

  getCartTotal() {
    const cart = this.getCart();
    return cart.reduce((sum, item) => {
      const product = this.getProductById(item.productId);
      if (!product) return sum;
      const price = product.discountPrice || product.price;
      return sum + price * item.qty;
    }, 0);
  },

  getCartCount() {
    return this.getCart().reduce((sum, item) => sum + item.qty, 0);
  },

  // ── Promos ───────────────────────────────────────────────────────
  getPromos() {
    return this.get(this.KEYS.PROMOS) || [];
  },

  validatePromo(code, cartTotal) {
    const promos = this.getPromos();
    const promo = promos.find(
      (p) =>
        p.code.toUpperCase() === code.toUpperCase() &&
        p.status === "active" &&
        (!p.expiry || new Date(p.expiry) >= new Date()) &&
        (!p.usageLimit || p.usageCount < p.usageLimit)
    );
    if (!promo) return { valid: false };
    if (promo.minPurchase && cartTotal < promo.minPurchase) {
      return {
        valid: false,
        reason: `Minimum purchase Rp ${Number(promo.minPurchase).toLocaleString("id-ID")}`,
      };
    }
    let discount = 0;
    if (promo.type === "percentage") discount = (cartTotal * promo.value) / 100;
    else if (promo.type === "fixed") discount = promo.value;
    return { valid: true, promo, discount: Math.min(discount, cartTotal) };
  },

  savePromo(promo) {
    const promos = this.get(this.KEYS.PROMOS) || [];
    if (!promo.id) {
      promo.id = "promo_" + Date.now();
      promo.usageCount = 0;
      promos.push(promo);
    } else {
      const idx = promos.findIndex((p) => p.id === promo.id);
      if (idx >= 0) promos[idx] = promo;
    }
    this.set(this.KEYS.PROMOS, promos);
    return promo;
  },

  deletePromo(id) {
    this.set(
      this.KEYS.PROMOS,
      (this.get(this.KEYS.PROMOS) || []).filter((p) => p.id !== id)
    );
  },

  // ── Bundles ──────────────────────────────────────────────────────
  getBundles() {
    return this.get(this.KEYS.BUNDLES) || [];
  },

  getBundlesByProduct(productId) {
    return this.getBundles().filter(
      (b) => b.status === "active" && b.productIds.includes(productId)
    );
  },

  saveBundle(bundle) {
    const bundles = this.get(this.KEYS.BUNDLES) || [];
    if (!bundle.id) {
      bundle.id = "bundle_" + Date.now();
      bundles.push(bundle);
    } else {
      const idx = bundles.findIndex((b) => b.id === bundle.id);
      if (idx >= 0) bundles[idx] = bundle;
    }
    this.set(this.KEYS.BUNDLES, bundles);
    return bundle;
  },

  deleteBundle(id) {
    this.set(
      this.KEYS.BUNDLES,
      (this.get(this.KEYS.BUNDLES) || []).filter((b) => b.id !== id)
    );
  },

  // ── Highlights ───────────────────────────────────────────────────
  getHighlights() {
    return (
      this.get(this.KEYS.HIGHLIGHTS) || {
        hero: { type: "product", productId: null, headline: "", cta: "Shop Now" },
        featured: [],
        newArrivals: [],
        badges: {},
      }
    );
  },

  saveHighlights(data) {
    this.set(this.KEYS.HIGHLIGHTS, data);
  },

  // ── Orders ───────────────────────────────────────────────────────
  getOrders() {
    return this.get(this.KEYS.ORDERS) || [];
  },

  saveOrder(order) {
    const orders = this.get(this.KEYS.ORDERS) || [];
    order.id = "order_" + Date.now();
    order.createdAt = new Date().toISOString();
    order.status = "pending";
    orders.push(order);
    this.set(this.KEYS.ORDERS, orders);
    this.recordAnalytics(order);
    return order;
  },

  // ── Analytics ────────────────────────────────────────────────────
  recordAnalytics(order) {
    const analytics = this.get(this.KEYS.ANALYTICS) || { daily: {}, promos: {} };
    const today = new Date().toISOString().split("T")[0];
    if (!analytics.daily[today]) analytics.daily[today] = { revenue: 0, orders: 0 };
    analytics.daily[today].revenue += order.total;
    analytics.daily[today].orders += 1;
    this.set(this.KEYS.ANALYTICS, analytics);
  },

  getAnalytics() {
    return this.get(this.KEYS.ANALYTICS) || { daily: {}, promos: {} };
  },

  // ── Users ────────────────────────────────────────────────────────
  getUsers() {
    return this.get(this.KEYS.USERS) || [];
  },

  getUserByEmail(email) {
    return this.getUsers().find((u) => u.email === email) || null;
  },

  saveUser(user) {
    const users = this.get(this.KEYS.USERS) || [];
    const idx = users.findIndex((u) => u.email === user.email);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    this.set(this.KEYS.USERS, users);
    return user;
  },

  // ── Seed Data ────────────────────────────────────────────────────
  seedIfEmpty() {
    if (this.get(this.KEYS.PRODUCTS)) return; // already seeded

    const products = [
      // Home Decor
      {
        id: "prod_001", name: "Ceramic Vase Set", nameId: "Set Vas Keramik",
        category: "home-decor", price: 185000, compareAtPrice: 250000,
        stock: 24, costPrice: 80000, status: "published",
        badge: "Best Seller", tags: ["bestseller", "decor"],
        description: "Elegant ceramic vase set, perfect for any room. Available in matte white and sage green.",
        descriptionId: "Set vas keramik elegan, sempurna untuk ruangan mana pun. Tersedia dalam warna putih matte dan sage green.",
        images: ["https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&q=80"],
        variants: [{ name: "Color", options: ["White", "Sage"] }],
        sold: 142, rating: 4.8, reviewCount: 38, createdAt: "2026-01-15T00:00:00.000Z",
      },
      {
        id: "prod_002", name: "Macramé Wall Hanging", nameId: "Hiasan Dinding Macramé",
        category: "home-decor", price: 145000, compareAtPrice: null,
        stock: 15, costPrice: 60000, status: "published",
        badge: "New", tags: ["new", "decor"],
        description: "Handcrafted macramé wall hanging, adds warmth and texture to any space.",
        descriptionId: "Hiasan dinding macramé buatan tangan, menambah kehangatan dan tekstur di ruangan mana pun.",
        images: ["https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80"],
        variants: [], sold: 28, rating: 4.6, reviewCount: 12, createdAt: "2026-03-10T00:00:00.000Z",
      },
      {
        id: "prod_003", name: "Aromatherapy Candle", nameId: "Lilin Aromaterapi",
        category: "home-decor", price: 85000, compareAtPrice: null,
        stock: 50, costPrice: 30000, status: "published",
        badge: "Best Seller", tags: ["bestseller", "candle"],
        description: "Soy wax aromatherapy candle with calming lavender & eucalyptus scent. 40hr burn time.",
        descriptionId: "Lilin aromaterapi soy wax dengan aroma lavender & eucalyptus yang menenangkan. Waktu bakar 40 jam.",
        images: ["https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=400&q=80"],
        variants: [{ name: "Scent", options: ["Lavender", "Vanilla", "Eucalyptus"] }],
        sold: 215, rating: 4.9, reviewCount: 67, createdAt: "2026-01-01T00:00:00.000Z",
      },
      // Daily Needs
      {
        id: "prod_004", name: "Organic Green Tea", nameId: "Teh Hijau Organik",
        category: "daily-needs", price: 65000, compareAtPrice: 80000,
        stock: 100, costPrice: 25000, status: "published",
        badge: "Sale", tags: ["sale", "beverage"],
        description: "Premium organic green tea from highland farms. 50 teabags per box.",
        descriptionId: "Teh hijau organik premium dari ladang pegunungan. 50 kantong teh per kotak.",
        images: ["https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80"],
        variants: [], sold: 320, rating: 4.7, reviewCount: 89, createdAt: "2026-02-01T00:00:00.000Z",
      },
      {
        id: "prod_005", name: "Natural Hand Soap Bar", nameId: "Sabun Tangan Alami",
        category: "daily-needs", price: 35000, compareAtPrice: null,
        stock: 200, costPrice: 12000, status: "published",
        badge: null, tags: ["daily", "soap"],
        description: "Cold-pressed natural soap bar with shea butter and coconut oil. Gentle on all skin types.",
        descriptionId: "Sabun batang alami cold-pressed dengan shea butter dan minyak kelapa. Lembut untuk semua jenis kulit.",
        images: ["https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=400&q=80"],
        variants: [{ name: "Scent", options: ["Rose", "Lemon", "Mint", "Unscented"] }],
        sold: 450, rating: 4.8, reviewCount: 123, createdAt: "2026-01-20T00:00:00.000Z",
      },
      {
        id: "prod_006", name: "Vitamin C Supplement", nameId: "Suplemen Vitamin C",
        category: "daily-needs", price: 95000, compareAtPrice: 120000,
        stock: 80, costPrice: 40000, status: "published",
        badge: "Sale", tags: ["health", "sale"],
        description: "High-potency Vitamin C 1000mg, 60 tablets. Supports immune system.",
        descriptionId: "Vitamin C 1000mg dosis tinggi, 60 tablet. Mendukung sistem imun.",
        images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80"],
        variants: [], sold: 178, rating: 4.6, reviewCount: 45, createdAt: "2026-02-15T00:00:00.000Z",
      },
      // Kitchen & Dining
      {
        id: "prod_007", name: "Bamboo Cutting Board Set", nameId: "Set Talenan Bambu",
        category: "kitchen", price: 125000, compareAtPrice: null,
        stock: 35, costPrice: 50000, status: "published",
        badge: "Best Seller", tags: ["kitchen", "bestseller"],
        description: "Eco-friendly bamboo cutting board set of 3 sizes. Antimicrobial and durable.",
        descriptionId: "Set talenan bambu ramah lingkungan 3 ukuran. Antimikroba dan tahan lama.",
        images: ["https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80"],
        variants: [], sold: 98, rating: 4.7, reviewCount: 31, createdAt: "2026-01-10T00:00:00.000Z",
      },
      {
        id: "prod_008", name: "Ceramic Dinnerware Set", nameId: "Set Piring Keramik",
        category: "kitchen", price: 320000, compareAtPrice: 400000,
        stock: 18, costPrice: 140000, status: "published",
        badge: "Sale", tags: ["kitchen", "sale"],
        description: "16-piece ceramic dinnerware set. Microwave and dishwasher safe. Elegant matte finish.",
        descriptionId: "Set peralatan makan keramik 16 buah. Aman untuk microwave dan mesin cuci piring. Finishing matte elegan.",
        images: ["https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=400&q=80"],
        variants: [{ name: "Color", options: ["Stone Grey", "Cream White", "Sage Green"] }],
        sold: 64, rating: 4.9, reviewCount: 22, createdAt: "2026-03-01T00:00:00.000Z",
      },
      {
        id: "prod_009", name: "Glass Storage Jars", nameId: "Toples Kaca Penyimpanan",
        category: "kitchen", price: 75000, compareAtPrice: null,
        stock: 60, costPrice: 28000, status: "published",
        badge: "New", tags: ["kitchen", "new"],
        description: "Airtight glass storage jars set of 4. Perfect for pantry organization.",
        descriptionId: "Set toples kaca kedap udara isi 4 buah. Sempurna untuk organisasi dapur.",
        images: ["https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400&q=80"],
        variants: [], sold: 87, rating: 4.5, reviewCount: 28, createdAt: "2026-04-01T00:00:00.000Z",
      },
      // Bedroom & Living
      {
        id: "prod_010", name: "Linen Throw Pillow Cover", nameId: "Sarung Bantal Linen",
        category: "bedroom", price: 89000, compareAtPrice: null,
        stock: 45, costPrice: 35000, status: "published",
        badge: null, tags: ["bedroom", "linen"],
        description: "Pure linen throw pillow cover, 45x45cm. Breathable and naturally textured.",
        descriptionId: "Sarung bantal linen murni, 45x45cm. Bernapas dan bertekstur alami.",
        images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80"],
        variants: [{ name: "Color", options: ["Natural", "Dusty Pink", "Sage", "Navy"] }],
        sold: 156, rating: 4.8, reviewCount: 52, createdAt: "2026-02-10T00:00:00.000Z",
      },
      {
        id: "prod_011", name: "Bohemian Woven Basket", nameId: "Keranjang Anyaman Boho",
        category: "bedroom", price: 165000, compareAtPrice: 200000,
        stock: 22, costPrice: 70000, status: "published",
        badge: "Sale", tags: ["bedroom", "storage", "sale"],
        description: "Handwoven seagrass storage basket. Perfect for blankets, toys, or laundry.",
        descriptionId: "Keranjang penyimpanan seagrass anyaman tangan. Sempurna untuk selimut, mainan, atau laundry.",
        images: ["https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=400&q=80"],
        variants: [{ name: "Size", options: ["S", "M", "L"] }],
        sold: 73, rating: 4.7, reviewCount: 19, createdAt: "2026-03-20T00:00:00.000Z",
      },
      // Bath & Personal Care
      {
        id: "prod_012", name: "Bamboo Toothbrush Set", nameId: "Set Sikat Gigi Bambu",
        category: "bath", price: 45000, compareAtPrice: null,
        stock: 150, costPrice: 15000, status: "published",
        badge: "Best Seller", tags: ["bath", "eco", "bestseller"],
        description: "Pack of 4 biodegradable bamboo toothbrushes with charcoal-infused bristles.",
        descriptionId: "Isi 4 sikat gigi bambu biodegradable dengan bulu sikat berbahan arang.",
        images: ["https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=400&q=80"],
        variants: [], sold: 380, rating: 4.9, reviewCount: 95, createdAt: "2026-01-05T00:00:00.000Z",
      },
      {
        id: "prod_013", name: "Essential Oil Diffuser", nameId: "Diffuser Minyak Esensial",
        category: "bath", price: 225000, compareAtPrice: 280000,
        stock: 30, costPrice: 90000, status: "published",
        badge: "Featured", tags: ["featured", "bath", "wellness"],
        description: "Ultrasonic aroma diffuser with 7-color LED light. Covers up to 30m². Auto shut-off.",
        descriptionId: "Diffuser aroma ultrasonik dengan lampu LED 7 warna. Jangkauan hingga 30m². Mati otomatis.",
        images: ["https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=400&q=80"],
        variants: [], sold: 112, rating: 4.8, reviewCount: 41, createdAt: "2026-02-20T00:00:00.000Z",
      },
      // Cleaning & Laundry
      {
        id: "prod_014", name: "Eco Laundry Pods", nameId: "Pods Laundry Ramah Lingkungan",
        category: "cleaning", price: 55000, compareAtPrice: null,
        stock: 200, costPrice: 20000, status: "published",
        badge: "New", tags: ["cleaning", "eco", "new"],
        description: "Plant-based laundry pods, 30 washes. Biodegradable packaging, fresh lavender scent.",
        descriptionId: "Pods laundry berbahan tanaman, 30 cucian. Kemasan biodegradable, aroma lavender segar.",
        images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80"],
        variants: [], sold: 234, rating: 4.6, reviewCount: 58, createdAt: "2026-04-10T00:00:00.000Z",
      },
      {
        id: "prod_015", name: "Microfiber Cleaning Set", nameId: "Set Lap Microfiber",
        category: "cleaning", price: 79000, compareAtPrice: 95000,
        stock: 75, costPrice: 30000, status: "published",
        badge: "Sale", tags: ["cleaning", "sale"],
        description: "12-piece premium microfiber cleaning cloths. Ultra-absorbent, lint-free, machine washable.",
        descriptionId: "12 lembar kain microfiber premium. Ultra-absorbent, bebas serat, bisa dicuci mesin.",
        images: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80"],
        variants: [{ name: "Pack", options: ["12 pcs", "24 pcs"] }],
        sold: 167, rating: 4.7, reviewCount: 44, createdAt: "2026-03-05T00:00:00.000Z",
      },
    ];

    this.set(this.KEYS.PRODUCTS, products);

    // Seed highlights
    this.set(this.KEYS.HIGHLIGHTS, {
      hero: {
        type: "product",
        productId: "prod_001",
        headline: "Elevate Your Space",
        headlineId: "Percantik Ruangan Anda",
        subtitle: "Discover premium home essentials curated just for you",
        subtitleId: "Temukan kebutuhan rumah premium yang dikurasi khusus untuk Anda",
        cta: "Shop Now",
        ctaId: "Belanja Sekarang",
      },
      featured: ["prod_001", "prod_003", "prod_007", "prod_013", "prod_005", "prod_010", "prod_008", "prod_004"],
      newArrivals: ["prod_002", "prod_009", "prod_014"],
      badges: {
        prod_001: "Best Seller",
        prod_003: "Best Seller",
        prod_013: "Featured",
      },
    });

    // Seed promos
    this.set(this.KEYS.PROMOS, [
      {
        id: "promo_001", code: "WELCOME20", type: "percentage", value: 20,
        minPurchase: 0, expiry: "2026-12-31", usageLimit: 1000,
        usageCount: 47, status: "active",
        descriptionEn: "20% off your first order", descriptionId: "Diskon 20% untuk pesanan pertama",
      },
      {
        id: "promo_002", code: "HEMAT50K", type: "fixed", value: 50000,
        minPurchase: 300000, expiry: "2026-08-31", usageLimit: 200,
        usageCount: 12, status: "active",
        descriptionEn: "Rp 50,000 off orders above Rp 300,000",
        descriptionId: "Diskon Rp 50.000 untuk pembelian di atas Rp 300.000",
      },
      {
        id: "promo_003", code: "FLASH30", type: "percentage", value: 30,
        minPurchase: 150000, expiry: "2026-06-30", usageLimit: 50,
        usageCount: 23, status: "active",
        descriptionEn: "Flash Sale: 30% off", descriptionId: "Flash Sale: Diskon 30%",
      },
    ]);

    // Seed bundles
    this.set(this.KEYS.BUNDLES, [
      {
        id: "bundle_001",
        name: "Cozy Home Starter Kit",
        nameId: "Paket Rumah Nyaman",
        productIds: ["prod_001", "prod_003", "prod_010"],
        bundlePrice: 295000,
        status: "active",
        createdAt: "2026-03-01T00:00:00.000Z",
      },
      {
        id: "bundle_002",
        name: "Daily Wellness Pack",
        nameId: "Paket Kesehatan Harian",
        productIds: ["prod_004", "prod_005", "prod_006"],
        bundlePrice: 165000,
        status: "active",
        createdAt: "2026-03-15T00:00:00.000Z",
      },
    ]);

    // Seed analytics (30 days of simulated data)
    const analytics = { daily: {}, promos: { WELCOME20: 47, HEMAT50K: 12, FLASH30: 23 } };
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      analytics.daily[key] = {
        revenue: Math.floor(Math.random() * 3000000) + 500000,
        orders: Math.floor(Math.random() * 25) + 5,
      };
    }
    this.set(this.KEYS.ANALYTICS, analytics);

    console.log("✅ Faiz Store: seed data loaded.");
  },
};

// ── Shared UI Helpers ────────────────────────────────────────────────────────
const FaizUI = {
  updateCartBadge() {
    const count = FaizStore.getCartCount();
    document.querySelectorAll(".cart-badge").forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? "flex" : "none";
    });
  },

  showToast(message, type = "success") {
    const existing = document.getElementById("faiz-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.id = "faiz-toast";
    toast.className = `faiz-toast faiz-toast--${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  formatPrice(amount) {
    return "Rp " + Number(amount).toLocaleString("id-ID");
  },

  renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let html = "";
    for (let i = 0; i < 5; i++) {
      if (i < full) html += '<span class="star full">★</span>';
      else if (i === full && half) html += '<span class="star half">★</span>';
      else html += '<span class="star empty">☆</span>';
    }
    return html;
  },

  renderProductCard(product, lang = "id") {
    const name = lang === "id" ? product.nameId || product.name : product.name;
    const price = product.discountPrice || product.price;
    const badge = product.badge;
    const badgeClass = badge ? `badge--${badge.toLowerCase().replace(" ", "-")}` : "";
    return `
      <div class="product-card" data-id="${product.id}">
        <a href="product.html?id=${product.id}" class="product-card__img-wrap">
          <img src="${product.images[0]}" alt="${name}" loading="lazy">
          ${badge ? `<span class="product-badge ${badgeClass}">${badge}</span>` : ""}
          ${product.compareAtPrice ? `<span class="product-badge badge--sale">Sale</span>` : ""}
          <button class="product-card__quick-add" onclick="event.preventDefault(); FaizStore.addToCart('${product.id}'); FaizUI.showToast('${lang === "id" ? "Ditambahkan ke keranjang!" : "Added to cart!"}')">+</button>
        </a>
        <div class="product-card__info">
          <p class="product-card__category">${product.category.replace("-", " ")}</p>
          <h3 class="product-card__name"><a href="product.html?id=${product.id}">${name}</a></h3>
          <div class="product-card__rating">
            ${this.renderStars(product.rating)}
            <span class="rating-count">(${product.reviewCount})</span>
          </div>
          <div class="product-card__price">
            <span class="price-current">${this.formatPrice(price)}</span>
            ${product.compareAtPrice ? `<span class="price-original">${this.formatPrice(product.compareAtPrice)}</span>` : ""}
          </div>
        </div>
      </div>
    `;
  },
};

// Init seed data on load
FaizStore.seedIfEmpty();
