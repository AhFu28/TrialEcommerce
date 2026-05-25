/**
 * Lumina Commerce — Admin App
 * Handles routing, modals, and shared admin state
 */

const AdminApp = {
  currentSection: 'dashboard',
  charts: {},

  init() {
    // Auth Check
    if (!sessionStorage.getItem('faiz_admin_session')) {
      Auth.requireAdmin();
      return;
    }
    
    this.setupRouting();
    this.render();
  },

  setupRouting() {
    const navItems = document.querySelectorAll('.admin-nav__item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        this.currentSection = item.dataset.target;
        this.render();
      });
    });
  },

  render() {
    const main = document.getElementById('admin-main-content');
    switch (this.currentSection) {
      case 'dashboard':
        this.renderDashboard(main);
        break;
      case 'products':
        this.renderProducts(main);
        break;
      case 'orders':
        this.renderOrders(main);
        break;
      case 'inventory':
      case 'settings':
        main.innerHTML = `<div class="admin-header"><h1 class="admin-page-title">Coming Soon</h1></div>`;
        break;
      default:
        this.renderDashboard(main);
    }
  },

  // ── Dashboard ────────────────────────────────────────────────────────
  renderDashboard(container) {
    const products = Store.getAllProducts();
    const orders = Store.getOrders();
    const totalProducts = products.length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const aov = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
    
    container.innerHTML = `
      <div class="admin-header">
        <div>
          <h1 class="admin-page-title">Sales Performance Overview</h1>
          <p class="admin-page-desc">Monitor your store's key metrics and product trends.</p>
        </div>
        <div class="admin-filter-bar">
          <div class="admin-filter-box">
            <input type="text" value="2023-10-01" class="admin-filter-input" style="width: 120px;">
            <input type="text" value="2023-10-31" class="admin-filter-input" style="width: 120px;">
          </div>
          <button class="btn-admin">Apply Filter</button>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <div class="kpi-title">Total Revenue</div>
            <div class="kpi-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          </div>
          <div class="kpi-value">${Store.formatCurrency(totalRevenue)}</div>
          <div class="kpi-trend positive"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><polyline points="17 6 23 6 23 12"/></svg> LIVE</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-header">
            <div class="kpi-title">Orders</div>
            <div class="kpi-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg></div>
          </div>
          <div class="kpi-value">${totalOrders}</div>
          <div class="kpi-trend positive"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><polyline points="17 6 23 6 23 12"/></svg> LIVE</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-header">
            <div class="kpi-title">Average Order Value</div>
            <div class="kpi-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
          </div>
          <div class="kpi-value">${Store.formatCurrency(aov)}</div>
          <div class="kpi-trend positive"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><polyline points="17 6 23 6 23 12"/></svg> LIVE</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-header">
            <div class="kpi-title">Active Products</div>
            <div class="kpi-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg></div>
          </div>
          <div class="kpi-value">${totalProducts}</div>
          <div class="kpi-trend positive"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><polyline points="17 6 23 6 23 12"/></svg> LIVE</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">Sales Over Time</div>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </div>
          <div class="chart-placeholder">
            <div class="chart-bar active" style="height: 60%;"></div>
            <div class="chart-bar" style="height: 40%;"></div>
            <div class="chart-bar active" style="height: 80%;"></div>
            <div class="chart-bar" style="height: 50%;"></div>
            <div class="chart-bar active" style="height: 95%;"></div>
            <div class="chart-bar" style="height: 30%;"></div>
          </div>
          <div style="display:flex; justify-content:space-around; margin-top: 10px; font-size: 0.75rem; color: var(--admin-text-secondary);">
            <span>Oct 01</span><span>Oct 05</span><span>Oct 10</span><span>Oct 15</span><span>Oct 20</span><span>Oct 25</span>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">Top Performing Products</div>
            <a href="#" style="color: var(--admin-primary); font-size: 0.8125rem; font-weight: 600; text-decoration: none;">View All</a>
          </div>
          <div class="top-products-list">
            ${products.slice(0,4).map(p => `
              <div class="top-product-item">
                <img src="${p.image}" class="top-product-img">
                <div class="top-product-info">
                  <div class="top-product-name">${p.name.substring(0, 20)}...</div>
                  <div class="top-product-sales">${p.stock * 3} units sold</div>
                </div>
                <div class="top-product-rev">$${(p.price * 3.5).toLocaleString()}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="table-panel">
        <div class="table-header">
          <div class="panel-title">Product Performance Table</div>
          <input type="text" class="table-search" placeholder="Search products...">
        </div>
        <table class="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Views</th>
              <th>Sales</th>
              <th>Growth %</th>
            </tr>
          </thead>
          <tbody>
            ${products.slice(0,5).map(p => `
              <tr>
                <td>
                  <div class="td-product">
                    <img src="${p.image}">
                    ${p.name.substring(0,25)}...
                  </div>
                </td>
                <td style="color: var(--admin-text-secondary);">${p.category}</td>
                <td>${(Math.random() * 15000 + 1000).toFixed(0)}</td>
                <td style="font-weight: 600;">${(Math.random() * 500 + 50).toFixed(0)}</td>
                <td><span class="growth-badge">↑ ${(Math.random() * 20 + 2).toFixed(1)}%</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // ── Products ────────────────────────────────────────────────────────
  renderProducts(container) {
    const products = Store.getAllProducts();
    
    container.innerHTML = `
      <div class="admin-header">
        <div>
          <h1 class="admin-page-title">Product Catalog</h1>
          <p class="admin-page-desc">Manage your products, pricing, and inventory.</p>
        </div>
        <button class="btn-admin" onclick="AdminApp.showProductModal()">+ Add New Product</button>
      </div>

      <div class="table-panel">
        <div class="table-header">
          <input type="text" class="table-search" placeholder="Search catalog...">
        </div>
        <table class="admin-table">
          <thead>
            <tr>
              <th>Product Details</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td>
                  <div class="td-product">
                    <img src="${p.image}">
                    <div>
                      <div style="font-weight: 600; font-size: 0.875rem;">${p.name}</div>
                      <div style="font-size: 0.75rem; color: var(--admin-text-secondary); margin-top:2px;">ID: ${p.id}</div>
                    </div>
                  </div>
                </td>
                <td style="font-weight: 600;">${Store.formatCurrency(p.price)}</td>
                <td>
                  <span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:600; background-color: ${p.stock > 10 ? '#E5F6EE' : '#FFEEE8'}; color: ${p.stock > 10 ? 'var(--admin-primary)' : '#FF5722'};">${p.stock} in stock</span>
                </td>
                <td>${p.category}</td>
                <td>
                  <button class="btn-admin btn-admin--outline" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="AdminApp.showProductModal('${p.id}')">Edit</button>
                  <button class="btn-admin" style="padding: 0.25rem 0.75rem; font-size: 0.75rem; background-color: #D32F2F;" onclick="AdminApp.deleteProduct('${p.id}')">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // ── Product Modal (Add/Edit) ──────────────────────────────────────
  showProductModal(productId = null) {
    const product = productId ? Store.getProductById(productId) : null;
    const isEdit = !!product;

    const main = document.getElementById('admin-main-content');
    
    main.innerHTML = `
      <div class="admin-header" style="margin-bottom: 1.5rem;">
        <div>
          <h1 class="admin-page-title">${isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p class="admin-page-desc">Input product details to list in the catalog.</p>
        </div>
        <div style="display:flex; gap: 1rem;">
          <button class="btn-admin btn-admin--outline" onclick="AdminApp.render()">Discard</button>
          <button class="btn-admin" onclick="AdminApp.saveProduct('${productId || ''}')">Save Product</button>
        </div>
      </div>

      <div class="pm-layout">
        <div class="pm-col-left">
          <div class="pm-card">
            <h2 class="pm-card-title">Basic Information</h2>
            <div class="pm-group">
              <label class="pm-label">Product Name</label>
              <input type="text" id="pm-name" class="pm-input" placeholder="e.g., Premium Ergonomic Chair" value="${isEdit ? product.name : ''}">
            </div>
            <div class="pm-group">
              <label class="pm-label">Description</label>
              <textarea id="pm-desc" class="pm-textarea" placeholder="Detailed product description...">${isEdit ? product.description : ''}</textarea>
            </div>
          </div>
          
          <div class="pm-row">
            <div class="pm-card">
              <h2 class="pm-card-title">Pricing</h2>
              <div class="pm-group">
                <label class="pm-label">Regular Price</label>
                <input type="number" id="pm-price" class="pm-input" placeholder="$ 0.00" value="${isEdit ? product.price : ''}">
              </div>
            </div>
            <div class="pm-card">
              <h2 class="pm-card-title">Inventory</h2>
              <div class="pm-group">
                <label class="pm-label">Stock Quantity</label>
                <input type="number" id="pm-stock" class="pm-input" placeholder="0" value="${isEdit ? product.stock : ''}">
              </div>
            </div>
          </div>
        </div>

        <div class="pm-col-right">
          <div class="pm-card">
            <h2 class="pm-card-title">Product Media</h2>
            <div class="pm-upload-box">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              <div>Click to upload image</div>
              <div style="font-size: 0.75rem; margin-top: 4px;">SVG, PNG, JPG or GIF (max. 800x400px)</div>
            </div>
            <div class="pm-group" style="margin-top: 1rem;">
              <label class="pm-label">Or Image URL</label>
              <input type="text" id="pm-image" class="pm-input" placeholder="https://..." value="${isEdit ? product.image : ''}">
            </div>
          </div>

          <div class="pm-card">
            <h2 class="pm-card-title">Organization</h2>
            <div class="pm-group">
              <label class="pm-label">Category</label>
              <select id="pm-category" class="pm-input">
                <option value="home-decor" ${isEdit && product.category === 'home-decor' ? 'selected' : ''}>Home Decor</option>
                <option value="daily-needs" ${isEdit && product.category === 'daily-needs' ? 'selected' : ''}>Daily Needs</option>
                <option value="kitchen" ${isEdit && product.category === 'kitchen' ? 'selected' : ''}>Kitchen & Dining</option>
                <option value="bedroom" ${isEdit && product.category === 'bedroom' ? 'selected' : ''}>Bedroom</option>
                <option value="bath" ${isEdit && product.category === 'bath' ? 'selected' : ''}>Bath & Body</option>
              </select>
            </div>
            <div class="pm-group" style="margin-top: 1.5rem;">
              <label class="pm-label" style="display:flex; align-items:center; gap:0.5rem;">
                <input type="checkbox" id="pm-official" ${isEdit && product.isOfficial ? 'checked' : ''}>
                Official Store Item
              </label>
              <label class="pm-label" style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem;">
                <input type="checkbox" id="pm-bestseller" ${isEdit && product.isBestSeller ? 'checked' : ''}>
                Best Seller
              </label>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  saveProduct(productId) {
    const name = document.getElementById('pm-name').value;
    const desc = document.getElementById('pm-desc').value;
    const price = parseFloat(document.getElementById('pm-price').value);
    const stock = parseInt(document.getElementById('pm-stock').value, 10);
    const image = document.getElementById('pm-image').value || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
    const category = document.getElementById('pm-category').value;
    const isOfficial = document.getElementById('pm-official').checked;
    const isBestSeller = document.getElementById('pm-bestseller').checked;

    if (!name || isNaN(price)) {
      alert("Name and Price are required!");
      return;
    }

    if (productId) {
      Store.updateProduct(productId, { name, description: desc, price, stock, image, category, isOfficial, isBestSeller });
    } else {
      Store.addProduct({ name, description: desc, price, stock, image, category, isOfficial, isBestSeller });
    }

    this.currentSection = 'products';
    this.render();
  },

  deleteProduct(id) {
    if (confirm("Are you sure you want to delete this product?")) {
      Store.deleteProduct(id);
      this.render();
    }
  },

  // ── Orders ───────────────────────────────────────────
  renderOrders(container) {
    const orders = Store.getOrders();

    container.innerHTML = `
      <div class="admin-header">
        <h1 class="admin-page-title">Order Management</h1>
      </div>
      <div class="table-panel">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${orders.length > 0 ? orders.map(o => `
              <tr>
                <td style="font-weight: 600;">${o.id}</td>
                <td>${new Date(o.date).toLocaleDateString()}</td>
                <td>
                  <div>${o.customerName}</div>
                  <div style="font-size: 0.75rem; color: var(--admin-text-secondary);">${o.customerEmail}</div>
                </td>
                <td style="font-weight: 600;">${Store.formatCurrency(o.total)}</td>
                <td><span style="display:inline-block; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:600; background-color: #E5F6EE; color: var(--admin-primary);">${o.status}</span></td>
              </tr>
            `).join('') : `<tr><td colspan="5" style="text-align:center; padding: 2rem;">No orders yet.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});
