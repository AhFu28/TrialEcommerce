/**
 * Faiz Store — main.js
 * Shared behavior: navbar, scroll effects, intersection observer, init
 */

document.addEventListener("DOMContentLoaded", () => {
  FaizStore.seedIfEmpty();
  FaizI18n.init();
  NavbarController.init();
  FaizUI.updateCartBadge();
  AnimationController.init();
  UserMenuController.init();
});

// ── Navbar Controller ────────────────────────────────────────────────────────
const NavbarController = {
  init() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    // Scroll effect
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 20);
    });

    // Active link highlight
    const links = navbar.querySelectorAll(".navbar__link");
    links.forEach((link) => {
      if (link.href === window.location.href) {
        link.classList.add("active");
      }
    });

    // Mobile hamburger
    const hamburger = document.getElementById("navbar-hamburger");
    const mobileNav = document.getElementById("navbar-mobile");
    if (hamburger && mobileNav) {
      hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("open");
        mobileNav.classList.toggle("open");
        document.body.style.overflow = mobileNav.classList.contains("open") ? "hidden" : "";
      });
      // Close on link click
      mobileNav.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => {
          hamburger.classList.remove("open");
          mobileNav.classList.remove("open");
          document.body.style.overflow = "";
        });
      });
    }
  },
};

// ── User Menu Controller ────────────────────────────────────────────────────
const UserMenuController = {
  init() {
    const user = FaizAuth.getCurrentUser();
    const loginBtn = document.getElementById("navbar-login-btn");
    const userMenu = document.getElementById("navbar-user-menu");
    const userAvatar = document.getElementById("navbar-user-avatar");
    const userNameEl = document.getElementById("navbar-user-name");
    const logoutBtn = document.getElementById("navbar-logout-btn");

    if (user) {
      if (loginBtn) loginBtn.style.display = "none";
      if (userMenu) userMenu.style.display = "flex";
      if (userNameEl) userNameEl.textContent = user.firstName;
      if (userAvatar) {
        if (user.picture) {
          userAvatar.innerHTML = `<img src="${user.picture}" alt="${user.firstName}">`;
        } else {
          userAvatar.textContent = user.firstName[0].toUpperCase();
        }
      }
    } else {
      if (loginBtn) loginBtn.style.display = "flex";
      if (userMenu) userMenu.style.display = "none";
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => FaizAuth.logout());
    }

    // Admin link visibility
    const adminLink = document.getElementById("navbar-admin-link");
    if (adminLink && FaizAuth.isAdmin()) {
      adminLink.style.display = "flex";
    }
  },
};

// ── Intersection Observer for Fade-In Animations ────────────────────────────
const AnimationController = {
  init() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
  },
};

// ── Shared Navbar HTML Generator ─────────────────────────────────────────────
function renderNavbar() {
  const nav = document.getElementById("main-navbar");
  if (!nav) return;

  nav.innerHTML = `
    <div class="announcement-bar">
      🚚 <span data-i18n="free_shipping_label">Gratis ongkir untuk pembelian di atas Rp 200.000</span>
    </div>
    <nav class="navbar" role="navigation">
      <div class="container navbar__inner">
        <a href="/index.html" class="navbar__logo">
          <div class="navbar__logo-icon">F</div>
          <span class="navbar__logo-text">Faiz <span>Store</span></span>
        </a>

        <div class="navbar__links">
          <a href="/index.html" class="navbar__link" data-i18n="nav_home">Beranda</a>
          <a href="/catalog.html" class="navbar__link" data-i18n="nav_catalog">Belanja</a>
          <a href="/about.html" class="navbar__link" data-i18n="nav_about">Tentang Kami</a>
          <a href="/blog.html" class="navbar__link" data-i18n="nav_blog">Blog</a>
          <a href="/contact.html" class="navbar__link" data-i18n="nav_contact">Kontak</a>
        </div>

        <div class="navbar__actions">
          <button class="lang-toggle" id="lang-toggle">EN</button>

          <a href="/cart.html" class="navbar__cart" id="navbar-cart-link" aria-label="Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span class="cart-badge" id="cart-badge">0</span>
          </a>

          <!-- Not logged in -->
          <a href="/login.html" id="navbar-login-btn" class="btn btn--secondary btn--sm" data-i18n="nav_login">Masuk</a>

          <!-- Logged in -->
          <div class="navbar__user" id="navbar-user-menu" style="display:none;">
            <button class="navbar__user-btn">
              <div class="navbar__user-avatar" id="navbar-user-avatar">U</div>
              <span id="navbar-user-name">User</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div class="navbar__dropdown">
              <a href="#" class="navbar__dropdown-item" data-i18n="nav_account">Akun Saya</a>
              <a href="/admin/index.html" class="navbar__dropdown-item" id="navbar-admin-link" style="display:none;" data-i18n="nav_admin">Panel Admin</a>
              <div class="navbar__dropdown-divider"></div>
              <button class="navbar__dropdown-item navbar__dropdown-item--danger" id="navbar-logout-btn" data-i18n="nav_logout">Keluar</button>
            </div>
          </div>
        </div>

        <button class="navbar__hamburger" id="navbar-hamburger" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>

    <!-- Mobile Drawer -->
    <div class="navbar__mobile" id="navbar-mobile">
      <a href="/index.html" class="navbar__mobile-link" data-i18n="nav_home">Beranda</a>
      <a href="/catalog.html" class="navbar__mobile-link" data-i18n="nav_catalog">Belanja</a>
      <a href="/about.html" class="navbar__mobile-link" data-i18n="nav_about">Tentang Kami</a>
      <a href="/blog.html" class="navbar__mobile-link" data-i18n="nav_blog">Blog</a>
      <a href="/contact.html" class="navbar__mobile-link" data-i18n="nav_contact">Kontak</a>
      <a href="/testimonials.html" class="navbar__mobile-link">Ulasan Pelanggan</a>
      <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--color-border-light);">
        <a href="/login.html" class="btn btn--primary btn--full" data-i18n="nav_login">Masuk</a>
      </div>
    </div>
  `;
}

// ── Shared Footer HTML Generator ─────────────────────────────────────────────
function renderFooter() {
  const footer = document.getElementById("main-footer");
  if (!footer) return;

  footer.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <div class="footer__brand">
            <a href="/index.html" class="footer__logo">
              <div class="footer__logo-icon">F</div>
              <span class="footer__logo-text">Faiz Store</span>
            </a>
            <p class="footer__desc" data-i18n="footer_tagline">Kebutuhan Sehari-hari & Gaya Hidup Anda</p>
            <div class="footer__social">
              <a href="#" class="footer__social-link" aria-label="Instagram">📸</a>
              <a href="#" class="footer__social-link" aria-label="WhatsApp">💬</a>
              <a href="#" class="footer__social-link" aria-label="TikTok">🎵</a>
              <a href="#" class="footer__social-link" aria-label="Facebook">👤</a>
            </div>
          </div>
          <div>
            <h4 class="footer__col-title">Shop</h4>
            <ul class="footer__links">
              <li><a href="/catalog.html" class="footer__link" data-i18n="cat_home_decor">Dekorasi Rumah</a></li>
              <li><a href="/catalog.html?cat=daily-needs" class="footer__link" data-i18n="cat_daily_needs">Kebutuhan Harian</a></li>
              <li><a href="/catalog.html?cat=kitchen" class="footer__link" data-i18n="cat_kitchen">Dapur & Makan</a></li>
              <li><a href="/catalog.html?cat=bedroom" class="footer__link" data-i18n="cat_bedroom">Kamar & Ruang Tamu</a></li>
              <li><a href="/catalog.html?cat=bath" class="footer__link" data-i18n="cat_bath">Mandi & Perawatan</a></li>
            </ul>
          </div>
          <div>
            <h4 class="footer__col-title">Info</h4>
            <ul class="footer__links">
              <li><a href="/about.html" class="footer__link" data-i18n="nav_about">Tentang Kami</a></li>
              <li><a href="/blog.html" class="footer__link" data-i18n="nav_blog">Blog</a></li>
              <li><a href="/testimonials.html" class="footer__link" data-i18n="testimonials_title">Ulasan</a></li>
              <li><a href="/contact.html" class="footer__link" data-i18n="nav_contact">Kontak</a></li>
            </ul>
          </div>
          <div>
            <h4 class="footer__col-title">Bantuan</h4>
            <ul class="footer__links">
              <li><a href="#" class="footer__link">FAQ</a></li>
              <li><a href="#" class="footer__link">Kebijakan Pengiriman</a></li>
              <li><a href="#" class="footer__link">Kebijakan Pengembalian</a></li>
              <li><a href="#" class="footer__link">Syarat & Ketentuan</a></li>
              <li><a href="#" class="footer__link">Kebijakan Privasi</a></li>
            </ul>
          </div>
        </div>
        <div class="footer__bottom">
          <p class="footer__copyright">
            &copy; ${new Date().getFullYear()} Faiz Store. <span data-i18n="footer_rights">Hak cipta dilindungi.</span>
          </p>
          <div class="footer__payment">
            <span class="payment-icon">Visa</span>
            <span class="payment-icon">Mastercard</span>
            <span class="payment-icon">GoPay</span>
            <span class="payment-icon">OVO</span>
            <span class="payment-icon">DANA</span>
            <span class="payment-icon">BCA</span>
          </div>
        </div>
      </div>
    </footer>
  `;
}
