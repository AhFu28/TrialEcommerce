/**
 * Lumina Commerce — Configuration
 * ================================================
 * SETUP REQUIRED:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a project → APIs & Services → Credentials
 * 3. Create OAuth 2.0 Client ID (Web application)
 * 4. Add your domain to Authorized JavaScript origins
 * 5. Paste your Client ID below
 * 6. Set your admin Gmail address(es) below
 */

const STORE_CONFIG = {
  // Authentication
  GOOGLE_CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
  
  // List of emails allowed to access the admin panel
  ADMIN_EMAILS: [
    "admin@luminacommerce.com",
    "faiz@example.com"
  ],

  // Store Configuration
  STORE_NAME: "Lumina Commerce",
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
if (typeof module !== "undefined") module.exports = STORE_CONFIG;
