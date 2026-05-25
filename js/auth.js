/**
 * Faiz Store — Authentication (Email/Password)
 */

const Auth = {
  SESSION_KEY: "lumina_session",
  ADMIN_SESSION_KEY: "lumina_admin_session",

  // ── Helpers ─────────────────────────────────────────────────────
  hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const chr = password.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    return "lumina_" + Math.abs(hash).toString(36) + "_" + password.length;
  },

  // ── User Session ─────────────────────────────────────────────────
  getCurrentUser() {
    try {
      return JSON.parse(sessionStorage.getItem(this.SESSION_KEY)) || null;
    } catch { return null; }
  },

  setSession(user) {
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
  },

  clearSession() {
    sessionStorage.removeItem(this.SESSION_KEY);
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  requireUser() {
    if (!this.isLoggedIn()) {
      sessionStorage.setItem('redirect_after_login', window.location.href);
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  // ── Admin Session ────────────────────────────────────────────────
  getCurrentAdmin() {
    try {
      return JSON.parse(sessionStorage.getItem(this.ADMIN_SESSION_KEY)) || null;
    } catch { return null; }
  },

  isAdmin() {
    return !!this.getCurrentAdmin();
  },

  requireAdmin() {
    if (!this.isAdmin()) {
      window.location.href = './login.html'; // relative to admin folder
      return false;
    }
    return true;
  },

  setAdminSession(data) {
    sessionStorage.setItem(this.ADMIN_SESSION_KEY, JSON.stringify(data));
  },

  // ── Email/Password Register ──────────────────────────────────────
  register({ firstName, lastName, email, password }) {
    const existing = Store.getUserByEmail(email);
    if (existing) return { success: false, error: "Email already registered." };

    try {
      const user = Store.createUser({
        firstName, lastName,
        email: email.toLowerCase(),
        passwordHash: this.hashPassword(password),
        role: "customer"
      });
      this.setSession({ id: user.id, firstName, lastName, email: user.email, role: "customer" });
      return { success: true, user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── Email/Password Login ─────────────────────────────────────────
  login(email, password) {
    const user = Store.getUserByEmail(email.toLowerCase());
    if (!user) return { success: false, error: "No account found with this email." };
    
    // Check if it's admin logging in from customer portal
    if (user.role === 'admin' && !window.location.pathname.includes('/admin/')) {
       // Allow admins to login as customers too for testing
    }

    if (user.passwordHash && user.passwordHash !== this.hashPassword(password)) {
      if (user.password && user.password !== password) {
        return { success: false, error: "Incorrect password." };
      }
    } else if (user.password && user.password !== password) {
       return { success: false, error: "Incorrect password." };
    }

    this.setSession({ id: user.id, firstName: user.firstName || user.name, lastName: user.lastName, email: user.email, role: user.role || 'customer' });
    return { success: true };
  },

  // ── Admin Login ──────────────────────────────────────────────────
  adminLogin(email, password) {
    const user = Store.getUserByEmail(email.toLowerCase());
    if (!user || user.role !== 'admin') {
      return { success: false, error: "Not an authorized admin account." };
    }
    
    if (user.password !== password) {
      return { success: false, error: "Incorrect admin password." };
    }

    this.setAdminSession({ id: user.id, name: user.name, email: user.email, role: "admin", loginAt: new Date().toISOString() });
    return { success: true };
  },

  // ── Logout ───────────────────────────────────────────────────────
  logout() {
    this.clearSession();
    const redirect = sessionStorage.getItem('redirect_after_login') || 'index.html';
    sessionStorage.removeItem('redirect_after_login');
    window.location.href = redirect;
  },

  adminLogout() {
    sessionStorage.removeItem(this.ADMIN_SESSION_KEY);
    window.location.href = "login.html";
  },
};
