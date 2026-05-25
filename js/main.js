/**
 * Faiz Store — main.js
 */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof Store !== 'undefined' && Store.updateCartBadge) {
    Store.updateCartBadge();
  }
  NavbarController.init();
  UserMenuController.init();
  AnimationController.init();
  
  // Render navbar and footer if they are empty
  const nav = document.getElementById("main-navbar");
  if (nav && nav.innerHTML.trim() === "") {
    renderNavbar();
    NavbarController.init(); // Re-init after render
    UserMenuController.init();
  }
  
  const footer = document.getElementById("main-footer");
  if (footer && footer.innerHTML.trim() === "") {
    renderFooter();
  }
});

const NavbarController = {
  init() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 20);
    });

    const hamburger = document.getElementById("navbar-hamburger");
    const mobileNav = document.getElementById("navbar-mobile");
    if (hamburger && mobileNav) {
      hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("open");
        mobileNav.classList.toggle("open");
        document.body.style.overflow = mobileNav.classList.contains("open") ? "hidden" : "";
      });
    }
  }
};

const UserMenuController = {
  init() {
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const loginBtn = document.getElementById("navbar-login-btn");
    const userMenu = document.getElementById("navbar-user-menu");
    const userNameEl = document.getElementById("navbar-user-name");
    const logoutBtn = document.getElementById("navbar-logout-btn");
    const adminLink = document.getElementById("navbar-admin-link");

    if (user) {
      if (loginBtn) loginBtn.style.display = "none";
      if (userMenu) userMenu.style.display = "flex";
      if (userNameEl) userNameEl.textContent = user.firstName || user.name;
    } else {
      if (loginBtn) loginBtn.style.display = "flex";
      if (userMenu) userMenu.style.display = "none";
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => Auth.logout());
    }

    if (adminLink && user && user.role === 'admin') {
      adminLink.style.display = "flex";
    }
  }
};

const AnimationController = {
  init() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
  }
};

function renderNavbar() {
  const nav = document.getElementById("main-navbar");
  if (!nav) return;
  const basePath = window.location.pathname.includes('/admin/') ? '../' : './';

  nav.innerHTML = `
    <nav class="navbar" role="navigation">
      <div class="container navbar__inner">
        <a href="${basePath}index.html" class="navbar__logo">
          <div class="navbar__logo-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span class="navbar__logo-text">Lumina <span>Commerce</span></span>
        </a>

        <div class="navbar__links">
          <a href="${basePath}index.html" class="navbar__link">Home</a>
          <a href="${basePath}catalog.html" class="navbar__link">Catalog</a>
        </div>

        <div class="navbar__search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
          <input type="text" placeholder="Search products...">
        </div>

        <div class="navbar__actions">
          <button class="navbar__btn-icon" onclick="history.back()" aria-label="Go Back" title="Go Back">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>

          <a href="${basePath}cart.html" class="navbar__cart" id="navbar-cart-link" aria-label="Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span class="cart-badge" id="cart-badge" style="display:none;">0</span>
          </a>

          <a href="${basePath}login.html" id="navbar-login-btn" class="btn btn--secondary btn--sm">Login</a>

          <div class="navbar__user" id="navbar-user-menu" style="display:none; position:relative; cursor:pointer;">
            <div style="display:flex; align-items:center; gap:8px;" onclick="this.nextElementSibling.classList.toggle('show')">
              <div style="width:32px; height:32px; background:var(--color-primary); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">U</div>
              <span id="navbar-user-name">User</span>
            </div>
            <div class="navbar__dropdown" style="display:none; position:absolute; top:40px; right:0; background:white; border:1px solid #ccc; border-radius:4px; padding:8px; width:150px; z-index:100;">
              <a href="${basePath}admin/index.html" id="navbar-admin-link" style="display:none; padding:8px; color:inherit; text-decoration:none; border-bottom:1px solid #eee;">Admin Portal</a>
              <div id="navbar-logout-btn" style="padding:8px; color:red; cursor:pointer;">Logout</div>
            </div>
          </div>
        </div>

        <button class="navbar__hamburger" id="navbar-hamburger" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  `;
}

function renderFooter() {
  const footer = document.getElementById("main-footer");
  if (!footer) return;
  const basePath = window.location.pathname.includes('/admin/') ? '../' : './';
  footer.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <div class="footer__brand">
            <a href="${basePath}index.html" class="footer__logo">
              <span class="footer__logo-text">Faiz Store</span>
            </a>
            <p class="footer__desc">Professional Quality, Delivered Daily</p>
          </div>
        </div>
        <div class="footer__bottom">
          <p class="footer__copy">&copy; 2024 Faiz Store. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  `;
}
