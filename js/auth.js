/**
 * Lumina Commerce — Authentication (Email/Password + Google Identity Services)
 */

const FaizAuth = {
  SESSION_KEY: "faiz_session",
  ADMIN_SESSION_KEY: "faiz_admin_session",

  // ── Helpers ─────────────────────────────────────────────────────
  hashPassword(password) {
    // Simple hash for demo (in production: use bcrypt on server)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const chr = password.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    return "faiz_" + Math.abs(hash).toString(36) + "_" + password.length;
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
    sessionStorage.removeItem(this.ADMIN_SESSION_KEY);
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
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
      window.location.href = './login.html';
      return false;
    }
    return true;
  },

  setAdminSession(data) {
    sessionStorage.setItem(this.ADMIN_SESSION_KEY, JSON.stringify(data));
  },

  // ── Email/Password Register ──────────────────────────────────────
  register({ firstName, lastName, email, password }) {
    const existing = FaizStore.getUserByEmail(email);
    if (existing) return { success: false, error: "Email already registered." };

    const user = {
      id: "user_" + Date.now(),
      firstName, lastName,
      email: email.toLowerCase(),
      passwordHash: this.hashPassword(password),
      provider: "email",
      createdAt: new Date().toISOString(),
      orders: [],
    };
    FaizStore.saveUser(user);
    this.setSession({ id: user.id, firstName, lastName, email: user.email, provider: "email" });
    return { success: true, user };
  },

  // ── Email/Password Login ─────────────────────────────────────────
  login(email, password) {
    const user = FaizStore.getUserByEmail(email.toLowerCase());
    if (!user) return { success: false, error: "No account found with this email." };
    if (user.provider === "google") return { success: false, error: "Please use Google Sign-In for this account." };
    if (user.passwordHash !== this.hashPassword(password)) return { success: false, error: "Incorrect password." };

    this.setSession({ id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, provider: "email" });
    return { success: true };
  },

  // ── Google Sign-In (GIS) ─────────────────────────────────────────
  initGoogleSignIn(buttonId, onSuccess, isAdmin = false) {
    if (typeof google === "undefined") {
      console.warn("Google Identity Services not loaded. Check your Client ID.");
      return;
    }
    google.accounts.id.initialize({
      client_id: STORE_CONFIG.GOOGLE_CLIENT_ID,
      callback: (response) => this.handleGoogleCredential(response, onSuccess, isAdmin),
    });
    google.accounts.id.renderButton(document.getElementById(buttonId), {
      theme: "outline",
      size: "large",
      text: "continue_with",
      width: "100%",
      shape: "rectangular",
    });
  },

  handleGoogleCredential(response, onSuccess, isAdmin = false) {
    // Decode JWT
    const payload = JSON.parse(atob(response.credential.split(".")[1]));
    const { email, given_name, family_name, name, picture, sub } = payload;

    if (isAdmin) {
      // Check if email is in admin list
      if (STORE_CONFIG.ADMIN_EMAILS.length > 0 && !STORE_CONFIG.ADMIN_EMAILS.includes(email)) {
        alert("Access denied. This Google account is not authorized as admin.");
        return;
      }
      this.setAdminSession({ email, name, picture, provider: "google", loginAt: new Date().toISOString() });
      onSuccess({ email, name, isAdmin: true });
      return;
    }

    // Regular user Google sign-in
    let user = FaizStore.getUserByEmail(email);
    if (!user) {
      user = {
        id: "user_" + sub,
        firstName: given_name || name.split(" ")[0],
        lastName: family_name || "",
        email, picture, provider: "google",
        createdAt: new Date().toISOString(),
        orders: [],
      };
      FaizStore.saveUser(user);
    }
    this.setSession({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email, picture, provider: "google",
    });
    onSuccess({ email, name: user.firstName, isAdmin: false });
  },

  // ── Admin Password Login ─────────────────────────────────────────
  adminLogin(password) {
    if (password === STORE_CONFIG.ADMIN_PASSWORD) {
      this.setAdminSession({ email: "admin", name: "Admin", provider: "password", loginAt: new Date().toISOString() });
      return { success: true };
    }
    return { success: false, error: "Invalid admin password." };
  },

  // ── Logout ───────────────────────────────────────────────────────
  logout() {
    this.clearSession();
    const redirect = sessionStorage.getItem('redirect_after_login') || './index.html';
    sessionStorage.removeItem('redirect_after_login');
    window.location.href = redirect;
  },

  adminLogout() {
    sessionStorage.removeItem(this.ADMIN_SESSION_KEY);
    window.location.href = "/admin/login.html";
  },
};
