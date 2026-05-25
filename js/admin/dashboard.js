/**
 * Faiz Store Admin — Dashboard Section
 * KPI cards, charts, recent orders, low stock alerts
 */

const AdminDashboard = {
  revenueChart: null,
  categoryChart: null,
  topProductsChart: null,

  init() {
    this.renderKPIs();
    this.renderCharts();
    this.renderRecentOrders();
    this.renderLowStock();
  },

  // ── KPI Cards ──────────────────────────────────────────────────────────────
  renderKPIs() {
    const orders  = FaizStore.getOrders();
    const products = FaizStore.getProducts({ status: 'published' });
    const promos  = FaizStore.getPromos().filter(p => p.status === 'active');
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Simulated growth (compare last 7 days vs prev 7 days via analytics)
    const analytics = FaizStore.getAnalytics();
    const daily = analytics.daily || {};
    const days = Object.keys(daily).sort();
    const last7 = days.slice(-7).reduce((s, k) => s + (daily[k]?.revenue || 0), 0);
    const prev7 = days.slice(-14, -7).reduce((s, k) => s + (daily[k]?.revenue || 0), 0);
    const growth = prev7 > 0 ? (((last7 - prev7) / prev7) * 100).toFixed(1) : null;

    const kpis = [
      {
        label: 'Total Revenue',
        value: formatRupiah(totalRevenue || last7 * 4),
        icon: '💰',
        iconClass: 'kpi-icon--revenue',
        trend: growth ? `${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth)}% vs prev 7d` : 'No comparison',
        trendClass: growth >= 0 ? 'kpi-card__trend--up' : 'kpi-card__trend--down'
      },
      {
        label: 'Total Orders',
        value: orders.length || (days.reduce((s, k) => s + (daily[k]?.orders || 0), 0)),
        icon: '📦',
        iconClass: 'kpi-icon--orders',
        trend: `${days.slice(-7).reduce((s, k) => s + (daily[k]?.orders || 0), 0)} this week`,
        trendClass: 'kpi-card__trend--up'
      },
      {
        label: 'Active Products',
        value: products.length,
        icon: '🛍️',
        iconClass: 'kpi-icon--products',
        trend: `${FaizStore.getProducts().length} total`,
        trendClass: 'kpi-card__trend--up'
      },
      {
        label: 'Active Promos',
        value: promos.length,
        icon: '🏷️',
        iconClass: 'kpi-icon--promos',
        trend: `${FaizStore.getPromos().length} total codes`,
        trendClass: 'kpi-card__trend--up'
      }
    ];

    document.getElementById('kpiGrid').innerHTML = kpis.map(k => `
      <div class="kpi-card">
        <div class="kpi-card__header">
          <span class="kpi-card__label">${k.label}</span>
          <div class="kpi-card__icon ${k.iconClass}">${k.icon}</div>
        </div>
        <div class="kpi-card__value">${k.value}</div>
        <div class="kpi-card__trend ${k.trendClass}">${k.trend}</div>
      </div>
    `).join('');
  },

  // ── Charts ─────────────────────────────────────────────────────────────────
  renderCharts() {
    const analytics = FaizStore.getAnalytics();
    const daily = analytics.daily || {};

    // Last 7 days
    const last7Keys = Object.keys(daily).sort().slice(-7);
    const labels = last7Keys.map(k => {
      const d = new Date(k);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const revenues = last7Keys.map(k => daily[k]?.revenue || 0);

    // Destroy old charts
    if (this.revenueChart) this.revenueChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.topProductsChart) this.topProductsChart.destroy();

    // Revenue Line Chart
    const rCtx = document.getElementById('revenueChart').getContext('2d');
    this.revenueChart = new Chart(rCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue',
          data: revenues,
          borderColor: '#C8A882',
          backgroundColor: 'rgba(200,168,130,0.10)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#C8A882',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: {
              callback: v => 'Rp ' + (v / 1000000).toFixed(1) + 'jt',
              font: { size: 11 }
            },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });

    // Category Doughnut Chart
    const products = FaizStore.getProducts();
    const catMap = {};
    products.forEach(p => {
      catMap[p.category] = (catMap[p.category] || 0) + (p.sold || 0);
    });
    const catLabels = Object.keys(catMap).map(c => c.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()));
    const catData   = Object.values(catMap);

    const cCtx = document.getElementById('categoryChart').getContext('2d');
    this.categoryChart = new Chart(cCtx, {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catData,
          backgroundColor: ['#C8A882','#4A90D9','#4CAF6E','#F5A623','#E05555','#9B59B6'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } }
        },
        cutout: '62%'
      }
    });

    // Top 5 Products Bar Chart
    const topProducts = [...products].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 5);
    const tCtx = document.getElementById('topProductsChart').getContext('2d');
    this.topProductsChart = new Chart(tCtx, {
      type: 'bar',
      data: {
        labels: topProducts.map(p => p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name),
        datasets: [{
          label: 'Units Sold',
          data: topProducts.map(p => p.sold || 0),
          backgroundColor: 'rgba(200,168,130,0.75)',
          borderColor: '#C8A882',
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 } } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } }
        }
      }
    });
  },

  // ── Recent Orders ──────────────────────────────────────────────────────────
  renderRecentOrders() {
    const orders = FaizStore.getOrders().slice(-5).reverse();
    const tbody = document.getElementById('recentOrdersBody');

    if (orders.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No orders yet. They'll appear here once customers place orders.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => {
      const date = new Date(o.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const statusClass = o.status === 'completed' ? 'status-pill--active' :
                          o.status === 'pending'   ? 'status-pill--draft'  : 'status-pill--expired';
      return `
        <tr>
          <td><span style="font-family:monospace;font-size:12px;">${o.id?.slice(0,15) || '—'}</span></td>
          <td>${o.customerName || o.customer?.name || 'Guest'}</td>
          <td>${o.items?.length || 0} item(s)</td>
          <td>${formatRupiah(o.total || 0)}</td>
          <td><span class="status-pill ${statusClass}">${o.status || 'pending'}</span></td>
        </tr>
      `;
    }).join('');
  },

  // ── Low Stock ──────────────────────────────────────────────────────────────
  renderLowStock() {
    const threshold = STORE_CONFIG.LOW_STOCK_THRESHOLD || 5;
    const lowStock = FaizStore.getProducts().filter(p => p.stock < threshold).slice(0, 8);
    const container = document.getElementById('lowStockList');

    if (lowStock.length === 0) {
      container.innerHTML = `<div class="low-stock-empty">✅ All products well-stocked!</div>`;
      return;
    }

    container.innerHTML = lowStock.map(p => `
      <div class="low-stock-item">
        <img src="${p.images?.[0] || ''}" alt="${p.name}" onerror="this.style.display='none'">
        <div style="flex:1;min-width:0;">
          <div style="font-size:var(--text-sm);font-weight:var(--font-medium);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${p.category}</div>
        </div>
        <span class="low-stock-count">${p.stock} left</span>
      </div>
    `).join('');
  }
};
