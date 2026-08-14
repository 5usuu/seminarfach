/* ============================================================
   SHOPLY – Demo-Shop für die Seminarfacharbeit "Dark Patterns"
   Dieses Skript enthält AUSSCHLIESSLICH Demo-Logik. Es findet
   keine echte Bestellung, kein echtes Tracking und keine
   echte Kommunikation mit einem Server statt (außer dem
   Formspree-Testendpunkt in den Formularen).
   ============================================================ */

/* ---------- Zentraler "Warenkorb" (localStorage) ---------- */
let cart = JSON.parse(localStorage.getItem('shoply_cart') || '[]');

function saveCart() {
  localStorage.setItem('shoply_cart', JSON.stringify(cart));
}

function addToCart(name, price, emoji, productId) {
  cart.push({ name: name, price: price, emoji: emoji, productId: productId || null });
  saveCart();
  updateNavCart();
  trackInteraction('add_to_cart', { name: name, price: price, productId: productId });
  // Studien-Tracking (siehe study.js): nur, wenn eine Produkt-ID übergeben wurde,
  // also für die 6 Hauptprodukte der Studie – nicht für Cross-Sell-Zubehör.
  if (productId && typeof trackStudyEvent === 'function') {
    trackStudyEvent('add_to_cart', productId, { price: price });
  }
  flashCartIcon();
}

function flashCartIcon() {
  const btn = document.querySelector('.cart-icon-btn');
  if (!btn) return;
  btn.classList.add('cart-bump');
  setTimeout(() => btn.classList.remove('cart-bump'), 300);
}

/* Renders the mini cart dropdown that lives in the navbar on every page */
function updateNavCart() {
  const badge = document.getElementById('cartBadge');
  const dropCount = document.getElementById('cartDropCount');
  const dropItems = document.getElementById('cartDropItems');
  const dropTotal = document.getElementById('cartDropTotal');
  if (!badge) return;

  if (cart.length === 0) {
    badge.style.display = 'none';
  } else {
    badge.textContent = cart.length;
    badge.style.display = 'inline-flex';
  }

  if (dropCount) dropCount.textContent = cart.length + (cart.length === 1 ? ' Artikel' : ' Artikel');

  let total = 0;
  if (dropItems) {
    if (cart.length === 0) {
      dropItems.innerHTML = `
        <div class="cart-empty-msg">
          <div class="empty-icon">🛒</div>
          <p>Dein Warenkorb ist leer</p>
        </div>`;
    } else {
      dropItems.innerHTML = cart.map(item => {
        total += item.price;
        return `
        <div class="cart-item">
          <span class="item-emoji">${item.emoji || '📦'}</span>
          <span style="flex:1">${item.name}</span>
          <span>${item.price.toFixed(2).replace('.', ',')} €</span>
        </div>`;
      }).join('');
    }
  } else {
    total = cart.reduce((s, i) => s + i.price, 0);
  }

  if (dropTotal) dropTotal.textContent = total.toFixed(2).replace('.', ',') + ' €';
}

function toggleCartDropdown(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('cartDropdown');
  if (!dropdown) return;
  updateNavCart();
  dropdown.classList.toggle('open');
}

/* Close the cart dropdown when clicking anywhere else on the page */
document.addEventListener('click', function (e) {
  const dropdown = document.getElementById('cartDropdown');
  const wrapper = document.querySelector('.cart-wrapper');
  if (dropdown && dropdown.classList.contains('open') && wrapper && !wrapper.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});

/* ---------- "Tracking" (Demo) ----------
   In einem echten Dark-Pattern-Setup würden hier Klicks/Entscheidungen
   an ein Analytics-Backend gesendet. Für die Demo wird nur geloggt,
   damit man beim Vorführen in der Konsole sehen kann, wann welches
   Pattern "greift". */
function trackInteraction(eventName, data) {
  console.log('[SHOPLY tracking]', eventName, data || {});
}

/* ============================================================
   COOKIE BANNER  – "Privacy Zuckering"
   ============================================================ */
const COOKIE_TOGGLES = ['analytics', 'marketing', 'thirdparty', 'personalization', 'fingerprint'];

function acceptCookies() {
  trackInteraction('cookies_accept_all', {});
  localStorage.setItem('shoply_cookie_consent', 'all');
  hideCookieBanner();
}

function showCookieSettings() {
  trackInteraction('cookie_settings_opened', {});
  document.getElementById('cookieModal').style.display = 'flex';
}

function toggleCookie(name) {
  const checkbox = document.getElementById(name);
  const btn = document.querySelector(`.toggle-btn[onclick="toggleCookie('${name}')"]`);
  checkbox.checked = !checkbox.checked;
  if (btn) {
    btn.textContent = checkbox.checked ? 'AN' : 'AUS';
    btn.classList.toggle('active', checkbox.checked);
  }
  trackInteraction('cookie_toggle', { name: name, checked: checkbox.checked });
}

function saveCookieSettings() {
  const consent = {};
  COOKIE_TOGGLES.forEach(name => {
    const el = document.getElementById(name);
    if (el) consent[name] = el.checked;
  });
  localStorage.setItem('shoply_cookie_consent', JSON.stringify(consent));
  trackInteraction('cookie_settings_saved', consent);
  document.getElementById('cookieModal').style.display = 'none';
  hideCookieBanner();
}

function hideCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.style.display = 'none';
}

/* Only show the banner if the visitor hasn't "decided" yet (demo-friendly) */
(function initCookieBanner() {
  document.addEventListener('DOMContentLoaded', function () {
    if (localStorage.getItem('shoply_cookie_consent')) {
      hideCookieBanner();
    }
  });
})();

/* ============================================================
   COUNTDOWN-TIMER  – "Fake Urgency"
   Jeder Countdown zählt einfach lokal im Browser herunter,
   startend beim im HTML hinterlegten Wert. Läuft er ab,
   springt er zurück auf einen zufälligen Wert nahe dem
   Ausgangswert, damit die Dringlichkeit "endlos" wirkt.
   ============================================================ */
function parseHMS(text) {
  const parts = text.trim().split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function formatHMS(totalSeconds, withHours) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (withHours) {
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
  }
  return [m, s].map(n => String(n).padStart(2, '0')).join(':');
}

function startCountdown(el) {
  const withHours = el.textContent.trim().split(':').length === 3;
  let seconds = parseHMS(el.textContent);
  setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      // "Endlose" Dringlichkeit: Timer springt wieder auf einen hohen Wert
      seconds = withHours ? 3600 + Math.floor(Math.random() * 10800) : 600 + Math.floor(Math.random() * 900);
    }
    el.textContent = formatHMS(seconds, withHours);
  }, 1000);
}

function initAllCountdowns() {
  // #cartTimer wird auf checkout.html bereits durch ein eigenes Inline-Skript
  // heruntergezählt – hier bewusst ausgeschlossen, um doppelte Intervalle
  // (und damit einen doppelt so schnell laufenden Timer) zu vermeiden.
  document.querySelectorAll('#heroTimer, .product-countdown').forEach(startCountdown);
}

/* ============================================================
   PRODUKT-DETAILSEITE: Menge, Live-Verkaufszähler, Sticky-Bar
   ============================================================ */
var selectedQty = 2;

function changeQty(delta) {
  setQty(selectedQty + delta);
}

function setQty(value) {
  selectedQty = Math.min(99, Math.max(1, value || 1));
  const input = document.getElementById('qtyInput');
  if (input) input.value = selectedQty;
  const stickyQty = document.getElementById('stickyQty');
  if (stickyQty) stickyQty.textContent = selectedQty;
}

function startLiveCounter() {
  const counterEl = document.getElementById('liveSalesCount');
  if (!counterEl) return;
  setInterval(() => {
    const current = parseInt(counterEl.textContent, 10) || 0;
    counterEl.textContent = current + 1;
  }, 15000 + Math.random() * 10000);
}

function initStickyBar() {
  const bar = document.getElementById('stickyCartBar');
  const trigger = document.querySelector('.purchase-actions');
  if (!bar || !trigger) return;
  window.addEventListener('scroll', () => {
    const triggerBottom = trigger.getBoundingClientRect().bottom;
    if (triggerBottom < 0) {
      bar.classList.add('visible');
    } else {
      bar.classList.remove('visible');
    }
  });
}

/* ============================================================
   CROSS-SELL / "Häufig zusammen gekauft"
   ============================================================ */
const CROSS_SELL_DATA = {
  kopfhoerer: [
    { name: 'Ladecase Deluxe', price: 14.99, oldPrice: '24,99 €', emoji: '🔌' },
    { name: 'Ohrpolster-Set', price: 9.99, oldPrice: '16,99 €', emoji: '🎧' }
  ],
  smartwatch: [
    { name: 'Ersatzarmband Sport', price: 12.99, oldPrice: '19,99 €', emoji: '⌚' },
    { name: 'Displayschutz 3er-Set', price: 7.99, oldPrice: '12,99 €', emoji: '🛡️' }
  ],
  tasche: [
    { name: 'Lederpflege-Set', price: 11.99, oldPrice: '18,99 €', emoji: '🧴' },
    { name: 'Schlüsselanhänger Leder', price: 6.99, oldPrice: '11,99 €', emoji: '🔑' }
  ],
  maus: [
    { name: 'Mauspad XXL', price: 8.99, oldPrice: '14,99 €', emoji: '🖥️' },
    { name: 'Ersatz-Mausfüße', price: 4.99, oldPrice: '8,99 €', emoji: '🔧' }
  ],
  sneaker: [
    { name: 'Schuhpflege-Kit', price: 9.99, oldPrice: '15,99 €', emoji: '🧽' },
    { name: 'Ersatz-Schnürsenkel', price: 3.99, oldPrice: '6,99 €', emoji: '👟' }
  ],
  rueckwand: [
    { name: 'Regenschutzhülle', price: 9.99, oldPrice: '15,99 €', emoji: '☔' },
    { name: 'Packwürfel-Set', price: 13.99, oldPrice: '21,99 €', emoji: '🧳' }
  ]
};

function toggleCrossSell(el) {
  el.classList.toggle('deselected');
  recalcBundlePrice();
  trackInteraction('cross_sell_toggle', { name: el.dataset.name, active: !el.classList.contains('deselected') });
}

function recalcBundlePrice() {
  const p = window.__shoplyCurrentProduct;
  if (!p) return;
  let total = parseFloat(p.newPrice.replace(' €', '').replace(',', '.'));
  document.querySelectorAll('.cross-sell-card').forEach(card => {
    if (!card.classList.contains('deselected')) {
      total += parseFloat(card.dataset.price);
    }
  });
  const bundleEl = document.getElementById('bundlePrice');
  if (bundleEl) bundleEl.textContent = 'Gesamt: ' + total.toFixed(2).replace('.', ',') + ' €';
}

function addBundleToCart(productId) {
  const p = window.__shoplyCurrentProduct;
  if (!p) return;
  const pricePer = parseFloat(p.newPrice.replace(' €', '').replace(',', '.'));
  addToCart(p.name, pricePer, p.image, productId);
  document.querySelectorAll('.cross-sell-card').forEach(card => {
    if (!card.classList.contains('deselected')) {
      addToCart(card.dataset.name, parseFloat(card.dataset.price), card.dataset.emoji);
    }
  });
  trackInteraction('bundle_add_to_cart', { productId: productId });
  window.location.href = 'checkout.html';
}

/* ============================================================
   ZULETZT ANGESEHEN
   ============================================================ */
function trackRecentlyViewed(id, name, price, emoji) {
  let viewed = JSON.parse(localStorage.getItem('shoply_recently_viewed') || '[]');
  viewed = viewed.filter(v => v.id !== id);
  viewed.unshift({ id: id, name: name, price: price, emoji: emoji });
  viewed = viewed.slice(0, 6);
  localStorage.setItem('shoply_recently_viewed', JSON.stringify(viewed));
}

function renderRecentlyViewed() {
  const grid = document.getElementById('recentlyViewed');
  if (!grid) return;
  const viewed = JSON.parse(localStorage.getItem('shoply_recently_viewed') || '[]');
  const currentId = new URLSearchParams(window.location.search).get('id');
  const items = viewed.filter(v => v.id !== currentId);

  const section = grid.closest('section');
  if (items.length === 0) {
    if (section) section.style.display = 'none';
    return;
  }
  if (section) section.style.display = '';

  grid.innerHTML = items.map(v => `
    <a class="rv-card" href="product.html?id=${v.id}">
      <span class="rv-emoji">${v.emoji}</span>
      <span class="rv-name">${v.name}</span>
      <span class="rv-price">${v.price} €</span>
    </a>
  `).join('');
}

/* ============================================================
   INIT – läuft auf jeder Seite
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  updateNavCart();
  initAllCountdowns();
  renderRecentlyViewed();
});
