/**
 * Lumina Commerce — Cart & Checkout Logic
 */

const CartController = {
  step: 1, // 1: Cart, 2: Checkout
  activePromo: null,
  paymentMethod: 'transfer',

  init() {
    this.render();
    this.bindEvents();
    this.prefillUser();
  },

  prefillUser() {
    const user = FaizAuth.getCurrentUser();
    if (user) {
      document.getElementById('chk-name').value = user.firstName + (user.lastName ? ' ' + user.lastName : '');
      document.getElementById('chk-email').value = user.email;
    }
  },

  render() {
    const cart = FaizStore.getCart();
    
    if (cart.items.length === 0) {
      document.getElementById('cart-empty').classList.remove('hidden');
      document.getElementById('cart-content').style.display = 'none';
      return;
    }

    document.getElementById('cart-empty').classList.add('hidden');
    document.getElementById('cart-content').style.display = 'grid';

    // Render items
    const lang = FaizI18n.currentLang;
    const itemsHtml = cart.items.map((item, index) => {
      const p = FaizStore.getProductById(item.productId);
      if (!p) return '';
      
      const price = p.discountPrice || p.price;
      const name = lang === 'id' ? p.nameId : p.nameEn;
      const variantText = item.variant ? `Varian: ${item.variant}` : '';

      return `
        <div class="cart-item">
          <img src="${p.image}" class="cart-item__img" alt="${name}">
          <div class="cart-item__info">
            <h4 class="cart-item__title"><a href="/product.html?id=${p.id}">${name}</a></h4>
            <div class="cart-item__variant">${variantText}</div>
            
            <div class="cart-item__actions">
              <div class="qty-control" style="height:32px; border-radius:4px;">
                <button class="qty-btn" style="width:30px; font-size:1rem;" onclick="CartController.updateQty(${index}, ${item.quantity - 1})">−</button>
                <input type="number" class="qty-input" style="width:40px; font-size:14px;" value="${item.quantity}" readonly>
                <button class="qty-btn" style="width:30px; font-size:1rem;" onclick="CartController.updateQty(${index}, ${item.quantity + 1})">+</button>
              </div>
              <button class="cart-item__remove" onclick="CartController.removeItem(${index})">Hapus</button>
            </div>
          </div>
          <div class="cart-item__price">${FaizUI.formatPrice(price * item.quantity)}</div>
        </div>
      `;
    }).join('');

    document.getElementById('cart-items-container').innerHTML = itemsHtml;

    // Render Summary
    let subtotal = 0;
    cart.items.forEach(item => {
      const p = FaizStore.getProductById(item.productId);
      if (p) {
        const price = p.discountPrice || p.price;
        subtotal += price * item.quantity;
      }
    });

    document.getElementById('summary-subtotal').textContent = FaizUI.formatPrice(subtotal);

    let shipping = subtotal > 200000 ? 0 : 20000;
    document.getElementById('summary-shipping').textContent = shipping === 0 ? 'Gratis' : FaizUI.formatPrice(shipping);

    let discountAmount = 0;
    if (this.activePromo) {
      if (subtotal >= this.activePromo.minPurchase) {
        if (this.activePromo.type === 'percentage') {
          discountAmount = subtotal * (this.activePromo.value / 100);
        } else {
          discountAmount = this.activePromo.value;
        }
      } else {
        // Minimum purchase not met anymore, remove promo
        this.activePromo = null;
        FaizUI.showToast(FaizI18n.currentLang === 'id' ? 'Promo dihapus karena tidak memenuhi minimum belanja' : 'Promo removed due to minimum purchase limit');
      }
    }

    if (discountAmount > 0) {
      document.getElementById('summary-discount-row').style.display = 'flex';
      document.getElementById('summary-discount').textContent = `- ${FaizUI.formatPrice(discountAmount)}`;
      document.getElementById('promo-group').style.display = 'none';
      document.getElementById('active-promo').style.display = 'block';
      document.getElementById('active-promo-code').textContent = this.activePromo.code;
    } else {
      document.getElementById('summary-discount-row').style.display = 'none';
      document.getElementById('promo-group').style.display = 'flex';
      document.getElementById('active-promo').style.display = 'none';
    }

    let total = subtotal - discountAmount + shipping;
    document.getElementById('summary-total').textContent = FaizUI.formatPrice(total);
  },

  updateQty(index, newQty) {
    const cart = FaizStore.getCart();
    if (newQty < 1) return;
    
    const p = FaizStore.getProductById(cart.items[index].productId);
    if (!p) return;
    
    if (newQty > p.stock) {
      FaizUI.showToast(FaizI18n.currentLang === 'id' ? 'Stok tidak mencukupi' : 'Insufficient stock');
      return;
    }

    cart.items[index].quantity = newQty;
    FaizStore.saveCart(cart);
    FaizUI.updateCartBadge();
    this.render();
  },

  removeItem(index) {
    const cart = FaizStore.getCart();
    cart.items.splice(index, 1);
    FaizStore.saveCart(cart);
    FaizUI.updateCartBadge();
    this.render();
  },

  bindEvents() {
    // Promo
    document.getElementById('btn-apply-promo').addEventListener('click', () => {
      const code = document.getElementById('promo-input').value.trim().toUpperCase();
      if (!code) return;

      const res = FaizStore.validatePromo(code);
      if (res.valid) {
        this.activePromo = res.promo;
        document.getElementById('promo-input').value = '';
        this.render();
        FaizUI.showToast(FaizI18n.currentLang === 'id' ? 'Promo berhasil digunakan' : 'Promo applied successfully');
      } else {
        FaizUI.showToast(res.message);
      }
    });

    document.getElementById('btn-remove-promo').addEventListener('click', () => {
      this.activePromo = null;
      this.render();
    });

    // Checkout Navigation
    const btnAction = document.getElementById('btn-action');
    btnAction.addEventListener('click', () => {
      if (this.step === 1) {
        // Check if logged in
        if (!FaizAuth.getCurrentUser()) {
          sessionStorage.setItem('redirect_after_login', '/cart.html');
          window.location.href = './login.html';
          return;
        }
        
        this.step = 2;
        document.getElementById('step1-cart').classList.remove('active');
        document.getElementById('step2-checkout').classList.add('active');
        document.getElementById('step2-indicator').classList.add('active');
        btnAction.textContent = FaizI18n.currentLang === 'id' ? 'Buat Pesanan' : 'Place Order';
      } else {
        this.placeOrder();
      }
    });

    document.getElementById('btn-back').addEventListener('click', () => {
      this.step = 1;
      document.getElementById('step2-checkout').classList.remove('active');
      document.getElementById('step1-cart').classList.add('active');
      document.getElementById('step2-indicator').classList.remove('active');
      btnAction.textContent = FaizI18n.currentLang === 'id' ? 'Checkout' : 'Checkout';
    });

    // Payment methods
    document.querySelectorAll('.payment-method').forEach(el => {
      el.addEventListener('click', (e) => {
        document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
        const method = e.currentTarget;
        method.classList.add('active');
        this.paymentMethod = method.dataset.method;
      });
    });
  },

  placeOrder() {
    // Basic validation
    const requiredFields = ['chk-name', 'chk-email', 'chk-phone', 'chk-address', 'chk-city', 'chk-zip'];
    let isValid = true;
    requiredFields.forEach(id => {
      if (!document.getElementById(id).value.trim()) isValid = false;
    });

    if (!isValid) {
      FaizUI.showToast(FaizI18n.currentLang === 'id' ? 'Mohon lengkapi semua data' : 'Please fill all required fields');
      return;
    }

    const orderData = {
      customerName: document.getElementById('chk-name').value,
      email: document.getElementById('chk-email').value,
      phone: document.getElementById('chk-phone').value,
      address: document.getElementById('chk-address').value,
      city: document.getElementById('chk-city').value,
      zip: document.getElementById('chk-zip').value,
      paymentMethod: this.paymentMethod,
      promoCode: this.activePromo ? this.activePromo.code : null
    };

    const orderId = FaizStore.saveOrder(orderData);
    
    if (orderId) {
      FaizStore.clearCart();
      FaizUI.updateCartBadge();
      
      // Simple success overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.95);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;';
      overlay.innerHTML = `
        <div style="font-size:4rem; margin-bottom:1rem;">🎉</div>
        <h2 style="font-size:2rem; font-weight:bold; margin-bottom:0.5rem; font-family:var(--font-heading)">Pesanan Berhasil!</h2>
        <p style="color:var(--color-text-secondary); margin-bottom:2rem;">ID Pesanan: <strong>${orderId}</strong></p>
        <p style="max-width:400px; margin-bottom:2rem; line-height:1.6;">Terima kasih telah berbelanja di Lumina Commerce. Kami telah mengirimkan email konfirmasi pesanan Anda.</p>
        <a href="/" class="btn btn--primary">Kembali ke Beranda</a>
      `;
      document.body.appendChild(overlay);
    }
  }
};
