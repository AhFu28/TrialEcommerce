/**
 * Faiz Store — Catalog Page Logic
 */

const CatalogController = {
  currentCategory: 'all',
  currentSort: 'newest',
  currentSearch: '',

  init() {
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    if (params.has('cat')) {
      this.currentCategory = params.get('cat');
      const radio = document.querySelector(`input[name="cat"][value="${this.currentCategory}"]`);
      if (radio) radio.checked = true;
    }

    this.bindEvents();
    this.renderPromos();
    this.renderProducts();
  },

  bindEvents() {
    // Category radios
    document.querySelectorAll('input[name="cat"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.currentCategory = e.target.value;
        this.updateURL();
        this.renderProducts();
      });
    });

    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      // Debounce search
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.currentSearch = e.target.value;
          this.renderProducts();
        }, 300);
      });
    }

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.renderProducts();
      });
    }

    // Reset filters
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.currentCategory = 'all';
        this.currentSearch = '';
        this.currentSort = 'newest';
        
        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'newest';
        
        const allRadio = document.querySelector('input[name="cat"][value="all"]');
        if (allRadio) allRadio.checked = true;
        
        this.updateURL();
        this.renderProducts();
      });
    }

    // Mobile filter drawer
    const openBtn = document.getElementById('open-filter');
    const closeBtn = document.getElementById('close-filter');
    const sidebar = document.getElementById('catalog-sidebar');
    const overlay = document.getElementById('mobile-overlay');

    if (openBtn && closeBtn && sidebar && overlay) {
      const openFilter = () => {
        sidebar.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
      };
      const closeFilter = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      };
      
      openBtn.addEventListener('click', openFilter);
      closeBtn.addEventListener('click', closeFilter);
      overlay.addEventListener('click', closeFilter);
    }
  },

  updateURL() {
    const url = new URL(window.location);
    if (this.currentCategory === 'all') {
      url.searchParams.delete('cat');
    } else {
      url.searchParams.set('cat', this.currentCategory);
    }
    window.history.replaceState({}, '', url);
  },

  renderPromos() {
    const promos = FaizStore.getPromos().filter(p => p.status === 'active');
    const bannerContainer = document.getElementById('active-promos-banner');
    if (!bannerContainer || promos.length === 0) return;

    // Just show the first active promo
    const promo = promos[0];
    const lang = FaizI18n.currentLang;
    const desc = lang === 'id' ? (promo.descriptionId || promo.descriptionEn) : promo.descriptionEn;

    bannerContainer.innerHTML = `
      <div style="background: var(--color-accent-bg); border: 1px solid var(--color-accent-light); padding: var(--space-4); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap;">
        <div>
          <span style="font-weight: var(--font-semi); color: var(--color-text-primary); margin-right: var(--space-2);">Promo:</span>
          <span style="color: var(--color-text-secondary);">${desc}</span>
        </div>
        <div style="font-family: monospace; font-weight: var(--font-bold); background: white; padding: 4px 12px; border-radius: 4px; border: 1px dashed var(--color-accent); color: var(--color-accent-dark);">
          ${promo.code}
        </div>
      </div>
    `;
  },

  renderProducts() {
    // 1. Fetch filtered
    const filterParams = { status: 'published' };
    if (this.currentCategory !== 'all') filterParams.category = this.currentCategory;
    if (this.currentSearch) filterParams.search = this.currentSearch;
    
    let products = FaizStore.getProducts(filterParams);

    // 2. Sort
    products.sort((a, b) => {
      if (this.currentSort === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (this.currentSort === 'popular') {
        return (b.sold || 0) - (a.sold || 0);
      } else if (this.currentSort === 'price-low') {
        const priceA = a.discountPrice || a.price;
        const priceB = b.discountPrice || b.price;
        return priceA - priceB;
      } else if (this.currentSort === 'price-high') {
        const priceA = a.discountPrice || a.price;
        const priceB = b.discountPrice || b.price;
        return priceB - priceA;
      }
      return 0;
    });

    // 3. Render
    const grid = document.getElementById('catalog-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (products.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
      const lang = FaizI18n.currentLang;
      grid.innerHTML = products.map(p => FaizUI.renderProductCard(p, lang)).join('');
    }
  }
};
