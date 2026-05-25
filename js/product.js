/**
 * Faiz Store — Product Page Logic
 */

const ProductController = {
  product: null,
  selectedVariant: null,
  quantity: 1,

  init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
      this.showNotFound();
      return;
    }

    this.product = FaizStore.getProductById(id);
    
    if (!this.product || this.product.status !== 'published') {
      this.showNotFound();
      return;
    }

    this.render();
    this.bindEvents();
    this.renderRelated();
  },

  showNotFound() {
    document.getElementById('product-not-found').classList.remove('hidden');
  },

  render() {
    document.getElementById('product-container').style.display = 'grid';
    const lang = FaizI18n.currentLang;

    // Breadcrumb
    const catName = FaizI18n.t('cat_' + this.product.category.replace('-', '_')) || this.product.category;
    document.getElementById('product-breadcrumb').innerHTML = `
      <a href="/" data-i18n="nav_home">Beranda</a> / 
      <a href="/catalog.html?cat=${this.product.category}">${catName}</a> / 
      <span style="color:var(--color-text-primary)">${lang === 'id' ? this.product.nameId : this.product.nameEn}</span>
    `;

    // Title
    document.getElementById('product-title').textContent = lang === 'id' ? this.product.nameId : this.product.nameEn;
    document.title = `${lang === 'id' ? this.product.nameId : this.product.nameEn} — Faiz Store`;

    // Stock Badge
    let stockHtml = '';
    if (this.product.stock > this.product.lowStockThreshold) {
      stockHtml = `<span class="status-pill status-pill--published">In Stock (${this.product.stock})</span>`;
    } else if (this.product.stock > 0) {
      stockHtml = `<span class="status-pill status-pill--expired">Low Stock: ${this.product.stock} left</span>`;
    } else {
      stockHtml = `<span class="status-pill status-pill--draft">Out of Stock</span>`;
      document.getElementById('btn-add-cart').disabled = true;
      document.getElementById('btn-add-cart').textContent = 'Habis Terjual';
    }
    document.getElementById('product-stock-badge').innerHTML = stockHtml;

    // Price
    let priceHtml = '';
    if (this.product.discountPrice) {
      const savings = Math.round(((this.product.price - this.product.discountPrice) / this.product.price) * 100);
      priceHtml = `
        <span class="price-main">${FaizUI.formatPrice(this.product.discountPrice)}</span>
        <span class="price-old">${FaizUI.formatPrice(this.product.price)}</span>
        <span class="price-save">Hemat ${savings}%</span>
      `;
    } else {
      priceHtml = `<span class="price-main">${FaizUI.formatPrice(this.product.price)}</span>`;
    }
    document.getElementById('product-price-wrap').innerHTML = priceHtml;

    // Images
    document.getElementById('main-img').src = this.product.image;
    let thumbsHtml = `
      <button class="thumb-btn active" data-src="${this.product.image}">
        <img src="${this.product.image}" alt="thumb">
      </button>
    `;
    // If there were multiple images, we'd loop them here. Since we only have 1 in seed, we mock a second one
    thumbsHtml += `
      <button class="thumb-btn" data-src="${this.product.image}">
        <img src="${this.product.image}" alt="thumb 2" style="filter: brightness(0.9);">
      </button>
    `;
    document.getElementById('thumb-container').innerHTML = thumbsHtml;

    // Variants
    if (this.product.variants && this.product.variants.length > 0) {
      this.selectedVariant = this.product.variants[0];
      const varHtml = `
        <div class="variant-group">
          <span class="variant-label">Varian: <span id="selected-variant-text" style="font-weight:normal; color:var(--color-text-secondary);">${this.selectedVariant}</span></span>
          <div class="variant-options">
            ${this.product.variants.map(v => `
              <button class="variant-btn ${v === this.selectedVariant ? 'active' : ''}" data-variant="${v}">${v}</button>
            `).join('')}
          </div>
        </div>
      `;
      document.getElementById('variants-container').innerHTML = varHtml;
    }

    // Description Tab
    document.getElementById('tab-desc').innerHTML = lang === 'id' ? this.product.descriptionId : this.product.descriptionEn;

    // Bundles
    this.renderBundles();
  },

  renderBundles() {
    const bundles = FaizStore.getBundlesByProduct(this.product.id);
    if (!bundles || bundles.length === 0) return;

    const lang = FaizI18n.currentLang;
    const b = bundles[0]; // just show first bundle
    const otherProducts = b.productIds.filter(pid => pid !== this.product.id).map(pid => FaizStore.getProductById(pid));
    
    let html = `
      <div class="bundle-section">
        <h4 class="bundle-title">💎 Bundle & Hemat</h4>
        <p class="text-sm text-secondary" style="margin-bottom:var(--space-4)">Beli bersama produk ini dan hemat lebih banyak.</p>
        
        <div style="display:flex; align-items:center; gap:var(--space-3); margin-bottom:var(--space-4);">
          <img src="${this.product.image}" style="width:50px; height:50px; border-radius:4px; object-fit:cover;">
          <span>+</span>
          ${otherProducts.map(p => `
            <img src="${p.image}" style="width:50px; height:50px; border-radius:4px; object-fit:cover;" title="${lang==='id'?p.nameId:p.nameEn}">
          `).join('<span>+</span>')}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
          <div>
            <div style="text-decoration:line-through; color:var(--color-text-muted); font-size:var(--text-sm);">${FaizUI.formatPrice(b.originalTotal)}</div>
            <div style="font-size:var(--text-xl); font-weight:var(--font-bold); color:var(--color-accent);">${FaizUI.formatPrice(b.bundlePrice)}</div>
          </div>
          <button class="btn btn--secondary btn--sm" onclick="ProductController.addBundleToCart('${b.id}')">Tambah Bundle</button>
        </div>
      </div>
    `;
    document.getElementById('bundle-container').innerHTML = html;
  },

  renderRelated() {
    const all = FaizStore.getProducts({ category: this.product.category, status: 'published' });
    const related = all.filter(p => p.id !== this.product.id).slice(0, 4);
    
    if (related.length > 0) {
      document.getElementById('related-section').style.display = 'block';
      const lang = FaizI18n.currentLang;
      document.getElementById('related-grid').innerHTML = related.map(p => FaizUI.renderProductCard(p, lang)).join('');
    }
  },

  bindEvents() {
    // Qty
    const qtyInput = document.getElementById('qty-input');
    document.getElementById('qty-minus').addEventListener('click', () => {
      let val = parseInt(qtyInput.value);
      if (val > 1) { qtyInput.value = val - 1; this.quantity = val - 1; }
    });
    document.getElementById('qty-plus').addEventListener('click', () => {
      let val = parseInt(qtyInput.value);
      if (val < this.product.stock) { qtyInput.value = val + 1; this.quantity = val + 1; }
    });
    qtyInput.addEventListener('change', (e) => {
      let val = parseInt(e.target.value);
      if (val < 1) val = 1;
      if (val > this.product.stock) val = this.product.stock;
      e.target.value = val;
      this.quantity = val;
    });

    // Variants
    const varContainer = document.getElementById('variants-container');
    varContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('variant-btn')) {
        document.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedVariant = e.target.dataset.variant;
        document.getElementById('selected-variant-text').textContent = this.selectedVariant;
      }
    });

    // Thumbs
    const thumbContainer = document.getElementById('thumb-container');
    const mainImg = document.getElementById('main-img');
    thumbContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.thumb-btn');
      if (btn) {
        document.querySelectorAll('.thumb-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mainImg.src = btn.dataset.src;
      }
    });

    // Add to Cart
    document.getElementById('btn-add-cart').addEventListener('click', () => {
      if (this.product.stock < 1) return;
      
      const success = FaizStore.addToCart(this.product.id, this.quantity, this.selectedVariant);
      if (success) {
        FaizUI.updateCartBadge();
        FaizUI.showToast(FaizI18n.currentLang === 'id' ? 'Berhasil ditambahkan ke keranjang' : 'Added to cart successfully');
      }
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      });
    });
  },

  addBundleToCart(bundleId) {
    const b = FaizStore.getBundles().find(x => x.id === bundleId);
    if (!b) return;
    
    // Add all products in bundle
    b.productIds.forEach(pid => {
      const p = FaizStore.getProductById(pid);
      if (p) {
        const variant = p.variants ? p.variants[0] : null;
        FaizStore.addToCart(p.id, 1, variant);
      }
    });
    
    FaizUI.updateCartBadge();
    FaizUI.showToast(FaizI18n.currentLang === 'id' ? 'Bundle ditambahkan ke keranjang' : 'Bundle added to cart');
  }
};
