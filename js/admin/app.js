/**
 * Faiz Store — Admin App
 * Handles routing, modals, and shared admin state
 */

const AdminApp = {
  currentSection: 'dashboard',
  charts: {},

  init() {
    // Auth Check
    if (!sessionStorage.getItem('faiz_admin_session')) {
      window.location.href = 'login.html';
      return;
    }

    this.bindEvents();
    this.renderSection('dashboard');
  },

  bindEvents() {
    // Navigation
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        
        const section = target.dataset.section;
        this.renderSection(section);
        
        // Update Title
        document.getElementById('page-title').textContent = target.textContent.trim().replace(/^.+ /, '');

        // Close mobile sidebar
        document.getElementById('admin-sidebar').classList.remove('mobile-open');
      });
    });

    // Logout
    document.getElementById('admin-logout').addEventListener('click', () => {
      sessionStorage.removeItem('faiz_admin_session');
      window.location.href = 'login.html';
    });

    // Mobile Sidebar Toggle
    const toggle = document.getElementById('mobile-sidebar-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        document.getElementById('admin-sidebar').classList.toggle('mobile-open');
      });
    }

    // Modal Close
    document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
    document.getElementById('admin-modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'admin-modal-overlay') this.closeModal();
    });
  },

  renderSection(section) {
    this.currentSection = section;
    const content = document.getElementById('admin-content');
    
    // Clear existing charts
    Object.values(this.charts).forEach(c => c.destroy());
    this.charts = {};

    switch(section) {
      case 'dashboard': this.renderDashboard(content); break;
      case 'products': this.renderProducts(content); break;
      case 'highlights': this.renderHighlights(content); break;
      case 'pricing': this.renderPricing(content); break;
      case 'promos': this.renderPromos(content); break;
      case 'bundles': this.renderBundles(content); break;
      case 'orders': this.renderOrders(content); break;
      case 'performance': this.renderPerformance(content); break;
    }
  },

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${type === 'success' ? 'var(--color-success)' : 'var(--color-error)'};
      color: white; padding: 12px 24px; border-radius: 8px; font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: fadein 0.3s;
    `;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  openModal(title, bodyHtml, footerHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-footer').innerHTML = footerHtml;
    document.getElementById('admin-modal-overlay').classList.add('open');
  },

  closeModal() {
    document.getElementById('admin-modal-overlay').classList.remove('open');
  },

  formatMoney(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
  },

  // ==========================================
  // DASHBOARD SECTION
  // ==========================================
  renderDashboard(container) {
    const stats = FaizStore.getAnalytics();
    const products = FaizStore.getProducts();
    const activeProducts = products.filter(p => p.status === 'published').length;
    const promos = FaizStore.getPromos().filter(p => p.status === 'active').length;
    
    // Low stock
    const lowStock = products.filter(p => p.stock <= p.lowStockThreshold);

    container.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-card__header">
            <span class="kpi-card__label">Total Revenue</span>
            <div class="kpi-card__icon kpi-icon--revenue">💰</div>
          </div>
          <div class="kpi-card__value">${this.formatMoney(stats.totalRevenue)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-card__header">
            <span class="kpi-card__label">Total Orders</span>
            <div class="kpi-card__icon kpi-icon--orders">🛒</div>
          </div>
          <div class="kpi-card__value">${stats.totalOrders}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-card__header">
            <span class="kpi-card__label">Active Products</span>
            <div class="kpi-card__icon kpi-icon--products">📦</div>
          </div>
          <div class="kpi-card__value">${activeProducts}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-card__header">
            <span class="kpi-card__label">Active Promos</span>
            <div class="kpi-card__icon kpi-icon--promos">🏷️</div>
          </div>
          <div class="kpi-card__value">${promos}</div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">Revenue (Last 7 Days)</h3>
          </div>
          <canvas id="chart-revenue" height="250"></canvas>
        </div>
        <div class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">Top Categories</h3>
          </div>
          <canvas id="chart-categories" height="250"></canvas>
        </div>
      </div>

      <div class="charts-grid">
        <div class="admin-table-wrap">
          <div class="admin-table-header">
            <h3 class="admin-table-header__title">Recent Orders</h3>
          </div>
          <table class="admin-table">
            <thead><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td colspan="4" style="text-align:center;">No recent orders (Demo data)</td></tr>
            </tbody>
          </table>
        </div>
        
        <div class="chart-card">
          <h3 class="chart-card__title" style="margin-bottom:var(--space-4)">Low Stock Alerts</h3>
          ${lowStock.length === 0 ? '<p class="text-sm text-secondary">All products are well stocked.</p>' : ''}
          ${lowStock.map(p => `
            <div class="low-stock-item">
              <img src="${p.image}">
              <div style="flex:1">
                <div class="text-sm font-medium">${p.nameEn}</div>
                <div class="text-xs text-secondary">Threshold: ${p.lowStockThreshold}</div>
              </div>
              <div class="low-stock-count">${p.stock} left</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Render Charts
    setTimeout(() => {
      const ctxRev = document.getElementById('chart-revenue').getContext('2d');
      this.charts.rev = new Chart(ctxRev, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{ label: 'Revenue (Rp)', data: [1500000, 2100000, 1800000, 2900000, 1200000, 4100000, 3200000], borderColor: '#C8A882', tension: 0.4 }]
        }
      });

      const ctxCat = document.getElementById('chart-categories').getContext('2d');
      this.charts.cat = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
          labels: ['Decor', 'Daily', 'Kitchen', 'Bath'],
          datasets: [{ data: [35, 25, 20, 20], backgroundColor: ['#C8A882', '#4A90E2', '#4CAF50', '#F5A623'] }]
        }
      });
    }, 100);
  },

  // ==========================================
  // PRODUCTS SECTION
  // ==========================================
  renderProducts(container) {
    const products = FaizStore.getProducts();
    
    let html = `
      <div class="admin-table-wrap">
        <div class="admin-table-header">
          <div class="admin-search">
            <span>🔍</span>
            <input type="text" id="prod-search" placeholder="Search products...">
          </div>
          <div class="admin-table-header__actions">
            <button class="btn btn--primary btn--sm" id="btn-add-product">Add Product</button>
          </div>
        </div>
        <table class="admin-table" id="prod-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => this.getProductRowHtml(p)).join('')}
          </tbody>
        </table>
      </div>
    `;
    container.innerHTML = html;

    // Search filter
    document.getElementById('prod-search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#prod-table tbody tr');
      rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        row.style.display = name.includes(q) ? '' : 'none';
      });
    });

    // Add Product
    document.getElementById('btn-add-product').addEventListener('click', () => this.openProductModal(null));

    // Edit/Delete binds
    document.getElementById('prod-table').addEventListener('click', (e) => {
      const editBtn = e.target.closest('.edit-btn');
      if (editBtn) this.openProductModal(editBtn.dataset.id);
      
      const delBtn = e.target.closest('.del-btn');
      if (delBtn && confirm('Are you sure you want to delete this product?')) {
        FaizStore.deleteProduct(delBtn.dataset.id);
        this.renderProducts(container);
        this.showToast('Product deleted');
      }
    });
  },

  getProductRowHtml(p) {
    return `
      <tr>
        <td><img src="${p.image}" class="admin-table__img"></td>
        <td>
          <div style="font-weight:var(--font-medium)">${p.nameEn}</div>
          <div class="text-xs text-secondary">${p.nameId}</div>
        </td>
        <td>${p.category}</td>
        <td>${this.formatMoney(p.price)}</td>
        <td>
          <span class="${p.stock <= p.lowStockThreshold ? 'text-error font-bold' : ''}">${p.stock}</span>
        </td>
        <td>
          <span class="status-pill status-pill--${p.status}">${p.status}</span>
        </td>
        <td>
          <div class="admin-table__actions">
            <button class="table-action-btn edit-btn" data-id="${p.id}">Edit</button>
            <button class="table-action-btn table-action-btn--danger del-btn" data-id="${p.id}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  },

  openProductModal(id) {
    const p = id ? FaizStore.getProductById(id) : null;
    const title = p ? 'Edit Product' : 'Add Product';
    
    const bodyHtml = `
      <div class="form-grid-2 mb-4">
        <div class="form-group"><label>Name (EN)</label><input type="text" id="p-name-en" value="${p?p.nameEn:''}"></div>
        <div class="form-group"><label>Name (ID)</label><input type="text" id="p-name-id" value="${p?p.nameId:''}"></div>
      </div>
      <div class="form-group mb-4">
        <label>Category</label>
        <select id="p-cat" class="form-input" style="width:100%; padding:0.75rem; border:1px solid var(--color-border); border-radius:var(--radius-md)">
          <option value="home-decor" ${p&&p.category==='home-decor'?'selected':''}>Home Decor</option>
          <option value="daily-needs" ${p&&p.category==='daily-needs'?'selected':''}>Daily Needs</option>
          <option value="kitchen" ${p&&p.category==='kitchen'?'selected':''}>Kitchen & Dining</option>
          <option value="bedroom" ${p&&p.category==='bedroom'?'selected':''}>Bedroom & Living</option>
          <option value="bath" ${p&&p.category==='bath'?'selected':''}>Bath & Personal Care</option>
          <option value="cleaning" ${p&&p.category==='cleaning'?'selected':''}>Cleaning & Laundry</option>
        </select>
      </div>
      <div class="form-grid-3 mb-4">
        <div class="form-group"><label>Price (Rp)</label><input type="number" id="p-price" value="${p?p.price:''}"></div>
        <div class="form-group"><label>Discount Price (Rp)</label><input type="number" id="p-disc" value="${p&&p.discountPrice?p.discountPrice:''}" placeholder="Optional"></div>
        <div class="form-group"><label>Cost Price (Rp)</label><input type="number" id="p-cost" value="${p?p.costPrice:''}"></div>
      </div>
      <div class="form-grid-2 mb-4">
        <div class="form-group"><label>Stock</label><input type="number" id="p-stock" value="${p?p.stock:''}"></div>
        <div class="form-group"><label>Low Stock Threshold</label><input type="number" id="p-thresh" value="${p?p.lowStockThreshold:5}"></div>
      </div>
      <div class="form-group mb-4"><label>Image URL</label><input type="text" id="p-img" value="${p?p.image:''}"></div>
      <div class="form-group mb-4">
        <label>Status</label>
        <select id="p-status" class="form-input" style="width:100%; padding:0.75rem; border:1px solid var(--color-border); border-radius:var(--radius-md)">
          <option value="published" ${p&&p.status==='published'?'selected':''}>Published</option>
          <option value="draft" ${p&&p.status==='draft'?'selected':''}>Draft</option>
        </select>
      </div>
    `;
    const footerHtml = `<button class="btn btn--primary" id="btn-save-prod">Save Product</button>`;
    
    this.openModal(title, bodyHtml, footerHtml);

    document.getElementById('btn-save-prod').addEventListener('click', () => {
      const prodData = {
        nameEn: document.getElementById('p-name-en').value,
        nameId: document.getElementById('p-name-id').value,
        descriptionEn: p ? p.descriptionEn : 'Product description here',
        descriptionId: p ? p.descriptionId : 'Deskripsi produk di sini',
        category: document.getElementById('p-cat').value,
        price: Number(document.getElementById('p-price').value),
        costPrice: Number(document.getElementById('p-cost').value),
        discountPrice: Number(document.getElementById('p-disc').value) || null,
        stock: Number(document.getElementById('p-stock').value),
        lowStockThreshold: Number(document.getElementById('p-thresh').value),
        image: document.getElementById('p-img').value,
        status: document.getElementById('p-status').value
      };
      
      if (id) prodData.id = id;

      FaizStore.saveProduct(prodData);
      this.closeModal();
      this.renderProducts(document.getElementById('admin-content'));
      this.showToast('Product saved successfully');
    });
  },

  // ==========================================
  // HIGHLIGHTS SECTION
  // ==========================================
  renderHighlights(container) {
    container.innerHTML = `
      <div class="admin-alert admin-alert--info">
        Highlights control the home page Hero banner and the Featured Products grid.
      </div>
      <p><em>(Highlights section implementation would go here — using FaizStore.updateHighlights())</em></p>
    `;
  },

  // ==========================================
  // PRICING SECTION
  // ==========================================
  renderPricing(container) {
    const products = FaizStore.getProducts();
    container.innerHTML = `
      <div class="admin-table-wrap">
        <div class="admin-table-header">
          <h3 class="admin-table-header__title">Pricing & Margins</h3>
          <button class="btn btn--primary btn--sm" id="btn-save-pricing">Save All Changes</button>
        </div>
        <table class="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Cost Price</th>
              <th>Selling Price</th>
              <th>Discount Price</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => {
              const sellPrice = p.discountPrice || p.price;
              const margin = p.costPrice ? Math.round(((sellPrice - p.costPrice) / sellPrice) * 100) : 0;
              let marginClass = 'good';
              if (margin < 20) marginClass = 'low';
              else if (margin < 50) marginClass = 'ok';
              
              return `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                      <img src="${p.image}" style="width:30px;height:30px;border-radius:4px;object-fit:cover;">
                      <span style="font-size:12px;font-weight:500">${p.nameEn}</span>
                    </div>
                  </td>
                  <td><input type="number" class="pricing-table-input" value="${p.costPrice}" data-id="${p.id}" data-field="costPrice"></td>
                  <td><input type="number" class="pricing-table-input" value="${p.price}" data-id="${p.id}" data-field="price"></td>
                  <td><input type="number" class="pricing-table-input" value="${p.discountPrice||''}" data-id="${p.id}" data-field="discountPrice"></td>
                  <td><span class="margin-pill margin-pill--${marginClass}">${margin}%</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-save-pricing').addEventListener('click', () => {
      // In a real app we'd batch update. Here we just show success since it's a demo
      this.showToast('Pricing changes saved');
    });
  },

  // ==========================================
  // PROMOS & BUNDLES (Placeholders for brevity)
  // ==========================================
  renderPromos(container) {
    container.innerHTML = `<div class="admin-table-wrap" style="padding:20px;">Promos management goes here (FaizStore.getPromos)</div>`;
  },
  renderBundles(container) {
    container.innerHTML = `<div class="admin-table-wrap" style="padding:20px;">Bundles management goes here (FaizStore.getBundles)</div>`;
  },
  renderOrders(container) {
    container.innerHTML = `<div class="admin-table-wrap" style="padding:20px;">Order history table goes here</div>`;
  },
  renderPerformance(container) {
    container.innerHTML = `<div class="admin-table-wrap" style="padding:20px;">Detailed Analytics going here</div>`;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  AdminApp.init();
});
