/**
 * Faiz Store — Configuration
 * ================================================
 * SETUP REQUIRED:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a project → APIs & Services → Credentials
 * 3. Create OAuth 2.0 Client ID (Web application)
 * 4. Add your domain to Authorized JavaScript origins
 * 5. Paste your Client ID below
 * 6. Set your admin Gmail address(es) below
 */

const FAIZ_CONFIG = {
  // ── Google OAuth (for Sign In with Google) ──────────────────────
  GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",

  // ── Admin Settings ───────────────────────────────────────────────
  ADMIN_PASSWORD: "admin123",
  ADMIN_EMAILS: [
    // Add your Gmail addresses that will have admin access
    // Example: "youremail@gmail.com"
  ],

  // ── Store Info ───────────────────────────────────────────────────
  STORE_NAME: "Faiz Store",
  STORE_TAGLINE_EN: "Your Everyday Lifestyle Essentials",
  STORE_TAGLINE_ID: "Kebutuhan Sehari-hari & Gaya Hidup Anda",
  STORE_EMAIL: "hello@faizstore.com",
  STORE_PHONE: "+62 812-3456-7890",
  STORE_ADDRESS: "Jakarta, Indonesia",

  // ── Currency ─────────────────────────────────────────────────────
  CURRENCY: "IDR",
  CURRENCY_SYMBOL: "Rp",

  // ── Default Language ("en" or "id") ──────────────────────────────
  DEFAULT_LANG: "id",

  // ── Low Stock Alert Threshold ─────────────────────────────────────
  LOW_STOCK_THRESHOLD: 5,

  // ── Free Shipping Minimum (IDR) ───────────────────────────────────
  FREE_SHIPPING_MIN: 200000,
  SHIPPING_FEE: 15000,
};

// Helper: format IDR currency
function formatRupiah(amount) {
  return "Rp " + Number(amount).toLocaleString("id-ID");
}

// Export for modules
if (typeof module !== "undefined") module.exports = FAIZ_CONFIG;
