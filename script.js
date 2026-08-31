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

function addToCart(name, price, emoji, productId, color) {
  cart.push({ name: name, price: price, emoji: emoji, productId: productId || null, color: color || null });
  saveCart();
  updateNavCart();
  trackInteraction('add_to_cart', { name: name, price: price, productId: productId, color: color });
  // Studien-Tracking (siehe study.js): nur, wenn eine Produkt-ID übergeben wurde,
  // also für die Hauptprodukte der Studie – nicht für Cross-Sell-Zubehör.
  if (productId && typeof trackStudyEvent === 'function') {
    trackStudyEvent('add_to_cart', productId, { price: price, color: color || null });
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
        const colorLabel = (item.color && typeof colorById === 'function') ? ` <small style="color:var(--text-muted)">(${colorById(item.color).name})</small>` : '';
        return `
        <div class="cart-item">
          <span class="item-emoji">${item.emoji || '📦'}</span>
          <span style="flex:1">${item.name}${colorLabel}</span>
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
  const isOpening = !dropdown.classList.contains('open');
  dropdown.classList.toggle('open');
  // ROACH MOTEL: der Premium-Trap greift genau in dem Moment, wo die
  // Person voller Vorfreude ihren Warenkorb öffnet – nicht erst später im
  // Checkout, wo man schon eher auf der Hut ist. Siehe Abschnitt
  // "CART PREMIUM UPSELL" weiter unten.
  if (isOpening) maybeShowCartPremiumUpsell();
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
  // Studie: schneller Weg gewählt – alle Kategorien gelten als akzeptiert
  if (typeof trackStudyEvent === 'function') {
    trackStudyEvent('cookie_accept_all', null, {
      acceptedCount: COOKIE_TOGGLES.length,
      accepted: COOKIE_TOGGLES.slice()
    });
  }
}

function showCookieSettings() {
  trackInteraction('cookie_settings_opened', {});
  document.getElementById('cookieModal').style.display = 'flex';
  // Studie: mühsamerer Weg gewählt (Einstellungen statt direkt "Alle akzeptieren")
  if (typeof trackStudyEvent === 'function') {
    trackStudyEvent('cookie_open_settings', null, {});
  }
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
  const accepted = [];
  COOKIE_TOGGLES.forEach(name => {
    const el = document.getElementById(name);
    if (el) {
      consent[name] = el.checked;
      if (el.checked) accepted.push(name);
    }
  });
  localStorage.setItem('shoply_cookie_consent', JSON.stringify(consent));
  trackInteraction('cookie_settings_saved', consent);
  document.getElementById('cookieModal').style.display = 'none';
  hideCookieBanner();
  // Studie: Endergebnis nach manueller Auswahl – wie viele/welche Kategorien blieben an?
  if (typeof trackStudyEvent === 'function') {
    trackStudyEvent('cookie_save_settings', null, {
      acceptedCount: accepted.length,
      accepted: accepted,
      allAccepted: accepted.length === COOKIE_TOGGLES.length,
      allRejected: accepted.length === 0
    });
  }
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
   CART PREMIUM UPSELL – "Roach Motel" (Forced Continuity)
   ============================================================
   Trick: Der Premium-Vorschlag erscheint NICHT erst im Checkout (wo man
   schon konzentriert am Bestellen ist), sondern genau dann, wenn die
   Person zum ersten Mal in dieser Sitzung auf das Warenkorb-Symbol
   klickt – ein Moment mit wenig Widerstand. Lehnt sie ab, kommt ein
   Guilt-Trip-Zwischenschritt (großer "Doch aktivieren"-Button, winziger
   Ablehnen-Link) – exakt dieselbe Masche wie beim Confirmshaming-Exit-
   Popup auf der Produktseite. Die Entscheidung wird in localStorage
   gemerkt (shoply_premium_decision: 'accepted' | 'declined'), damit sie
   nicht bei jedem Warenkorb-Klick erneut nervt UND damit der bereits
   bestehende Premium-Kasten im Checkout (siehe checkout.html) den
   gleichen Stand anzeigt statt nochmal zu fragen. */

function buildCartPremiumOverlays() {
  if (document.getElementById('cartPremiumOverlay')) return; // schon gebaut

  const upsell = document.createElement('div');
  upsell.id = 'cartPremiumOverlay';
  upsell.className = 'modal-overlay';
  upsell.style.display = 'none';
  upsell.innerHTML = `
    <div class="modal subscription-modal">
      <div class="sub-header">
        <h3>🌟 SHOPLY Premium Mitgliedschaft</h3>
        <span class="sub-badge">EMPFOHLEN</span>
      </div>
      <p>Bevor's weitergeht: Mit deiner Bestellung erhältst du <strong>30 Tage kostenlosen Zugang</strong> zu SHOPLY Premium!</p>
      <ul class="sub-benefits">
        <li><span class="li-icon" data-icon="check"></span>Kostenloser Express-Versand bei jeder Bestellung</li>
        <li><span class="li-icon" data-icon="check"></span>Exklusive Premium-Rabatte bis zu 80%</li>
        <li><span class="li-icon" data-icon="check"></span>Früher Zugang zu Flash Sales</li>
        <li><span class="li-icon" data-icon="check"></span>Persönlicher Einkaufsberater</li>
      </ul>
      <div class="sub-choice">
        <button type="button" class="btn-sub-accept" id="cartSubAccept" onclick="acceptCartPremium()">Ja, ich möchte Premium!</button>
        <button type="button" class="btn-sub-decline" id="cartSubDecline" onclick="declineCartPremium()">Nein danke</button>
      </div>
      <p class="sub-fine-print">* Nach 30 Tagen: 9,99 €/Monat. Kündigung nur telefonisch während der Geschäftszeiten (Mo-Fr 9-17 Uhr) oder per Einschreiben.</p>
    </div>`;
  document.body.appendChild(upsell);
  if (typeof initStaticIcons === 'function') initStaticIcons();

  const guilt = document.createElement('div');
  guilt.id = 'cartSubDeclineModal';
  guilt.className = 'modal-overlay';
  guilt.style.display = 'none';
  guilt.innerHTML = `
    <div class="modal exit-modal">
      <h2>😟 Bist du dir sicher?</h2>
      <p>Mit SHOPLY Premium sparst du durchschnittlich <strong>47 € pro Monat</strong>. Möchtest du das wirklich verpassen?</p>
      <div class="sub-modal-benefits">
        <p>✗ Kein kostenloser Express-Versand</p>
        <p>✗ Keine exklusiven Premium-Rabatte</p>
        <p>✗ Kein früher Zugang zu Sales</p>
        <p>✗ Kein persönlicher Einkaufsberater</p>
      </div>
      <button class="btn-stay" onclick="closeCartSubModal(true)">Doch Premium aktivieren!</button>
      <a href="#" class="exit-leave" onclick="closeCartSubModal(false)">Nein, ich bin zu dumm zum Sparen</a>
    </div>`;
  document.body.appendChild(guilt);
}

function maybeShowCartPremiumUpsell() {
  if (cart.length === 0) return; // bei leerem Warenkorb ergibt das Angebot keinen Sinn
  if (localStorage.getItem('shoply_premium_decision')) return; // schon entschieden
  if (window.__shoplyCartPremiumShown) return; // schon in dieser Sitzung gezeigt
  window.__shoplyCartPremiumShown = true;

  buildCartPremiumOverlays();
  document.getElementById('cartPremiumOverlay').style.display = 'flex';
  trackInteraction('cart_premium_shown', {});
  if (typeof trackStudyEvent === 'function') trackStudyEvent('cart_premium_shown', null, {});
}

function acceptCartPremium() {
  localStorage.setItem('shoply_premium_decision', 'accepted');
  document.getElementById('cartPremiumOverlay').style.display = 'none';
  trackInteraction('cart_premium_accepted', {});
  if (typeof trackStudyEvent === 'function') trackStudyEvent('cart_premium_accepted', null, {});
  syncCheckoutSubscriptionUI();
}

function declineCartPremium() {
  trackInteraction('cart_premium_decline_click', {});
  if (typeof trackStudyEvent === 'function') trackStudyEvent('cart_premium_decline_click', null, {});
  document.getElementById('cartSubDeclineModal').style.display = 'flex';
}

function closeCartSubModal(reconsider) {
  document.getElementById('cartSubDeclineModal').style.display = 'none';
  if (reconsider) {
    acceptCartPremium();
    return;
  }
  localStorage.setItem('shoply_premium_decision', 'declined');
  document.getElementById('cartPremiumOverlay').style.display = 'none';
  trackInteraction('cart_premium_declined_final', {});
  if (typeof trackStudyEvent === 'function') trackStudyEvent('cart_premium_declined_final', null, {});
  syncCheckoutSubscriptionUI();
}

/* Spiegelt eine bereits (am Warenkorb) getroffene Premium-Entscheidung im
   bestehenden Subscription-Kasten auf der Checkout-Seite (siehe
   checkout.html), damit dort nicht ein zweites Mal gefragt wird. Auf
   Seiten ohne diesen Kasten (index.html, product.html) passiert einfach
   nichts. */
function syncCheckoutSubscriptionUI() {
  const box = document.querySelector('.subscription-box');
  if (!box) return;
  const decision = localStorage.getItem('shoply_premium_decision');
  const acceptBtn = document.getElementById('subAccept');
  const declineBtn = document.getElementById('subDecline');
  if (decision === 'accepted') {
    if (acceptBtn) {
      acceptBtn.textContent = '✓ Premium aktiviert!';
      acceptBtn.classList.add('activated');
      acceptBtn.disabled = true;
    }
    if (declineBtn) declineBtn.style.display = 'none';
  } else if (decision === 'declined') {
    const p = document.createElement('p');
    p.className = 'sub-fine-print';
    p.textContent = 'Du hast Premium bereits abgelehnt.';
    if (acceptBtn) acceptBtn.style.display = 'none';
    if (declineBtn) declineBtn.style.display = 'none';
    box.appendChild(p);
  }
}

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
  tasche: [
    { name: 'Lederpflege-Set', price: 11.99, oldPrice: '18,99 €', emoji: '🧴' },
    { name: 'Schlüsselanhänger Leder', price: 6.99, oldPrice: '11,99 €', emoji: '🔑' }
  ],
  sneaker: [
    { name: 'Schuhpflege-Kit', price: 9.99, oldPrice: '15,99 €', emoji: '🧽' },
    { name: 'Ersatz-Schnürsenkel', price: 3.99, oldPrice: '6,99 €', emoji: '👟' }
  ],
  rueckwand: [
    { name: 'Regenschutzhülle', price: 9.99, oldPrice: '15,99 €', emoji: '☔' },
    { name: 'Packwürfel-Set', price: 13.99, oldPrice: '21,99 €', emoji: '🧳' }
  ],
  shirt: [
    { name: 'GG Hildburghausen Cap', price: 14.99, oldPrice: '24,99 €', emoji: '🧢' },
    { name: 'GG Hildburghausen Trinkflasche', price: 12.99, oldPrice: '19,99 €', emoji: '🍶' }
  ],
  hoodie: [
    { name: 'GG Hildburghausen T-Shirt', price: 19.99, oldPrice: '34,99 €', emoji: '👕' },
    { name: 'GG Hildburghausen Cap', price: 14.99, oldPrice: '24,99 €', emoji: '🧢' }
  ],
  cap: [
    { name: 'GG Hildburghausen T-Shirt', price: 19.99, oldPrice: '34,99 €', emoji: '👕' },
    { name: 'GG Hildburghausen Trinkflasche', price: 12.99, oldPrice: '19,99 €', emoji: '🍶' }
  ],
  flasche: [
    { name: 'GG Hildburghausen Cap', price: 14.99, oldPrice: '24,99 €', emoji: '🧢' },
    { name: 'GG Hildburghausen Hoodie', price: 34.99, oldPrice: '59,99 €', emoji: '🧥' }
  ],
  hose: [
    { name: 'GG Hildburghausen Hoodie', price: 34.99, oldPrice: '59,99 €', emoji: '🧥' },
    { name: 'GG Hildburghausen Cap', price: 14.99, oldPrice: '24,99 €', emoji: '🧢' }
  ],
  hemd: [
    { name: 'GG Hildburghausen Jogginghose', price: 29.99, oldPrice: '49,99 €', emoji: '👖' },
    { name: 'GG Hildburghausen Beanie', price: 12.99, oldPrice: '19,99 €', emoji: '🧢' }
  ],
  cargohose: [
    { name: 'GG Hildburghausen T-Shirt', price: 19.99, oldPrice: '34,99 €', emoji: '👕' },
    { name: 'Sneaker Limited Edition', price: 54.99, oldPrice: '179,99 €', emoji: '👟' }
  ],
  sweatshirt: [
    { name: 'GG Hildburghausen Jogginghose', price: 29.99, oldPrice: '49,99 €', emoji: '👖' },
    { name: 'GG Hildburghausen Beanie', price: 12.99, oldPrice: '19,99 €', emoji: '🧢' }
  ],
  turnbeutel: [
    { name: 'GG Hildburghausen Thermobecher', price: 16.99, oldPrice: '27,99 €', emoji: '🥤' },
    { name: 'GG Hildburghausen Schlüsselanhänger', price: 4.99, oldPrice: '8,99 €', emoji: '🔑' }
  ],
  jutebeutel: [
    { name: 'GG Hildburghausen Notizbuch', price: 7.99, oldPrice: '12,99 €', emoji: '📓' },
    { name: 'GG Hildburghausen Kaffeetasse', price: 9.99, oldPrice: '15,99 €', emoji: '☕' }
  ],
  tasse: [
    { name: 'GG Hildburghausen Notizbuch', price: 7.99, oldPrice: '12,99 €', emoji: '📓' },
    { name: 'GG Hildburghausen Thermobecher', price: 16.99, oldPrice: '27,99 €', emoji: '🥤' }
  ],
  thermobecher: [
    { name: 'GG Hildburghausen Kaffeetasse', price: 9.99, oldPrice: '15,99 €', emoji: '☕' },
    { name: 'GG Hildburghausen Turnbeutel', price: 9.99, oldPrice: '16,99 €', emoji: '🎒' }
  ],
  notizbuch: [
    { name: 'GG Hildburghausen Kaffeetasse', price: 9.99, oldPrice: '15,99 €', emoji: '☕' },
    { name: 'GG Hildburghausen Jutebeutel', price: 6.99, oldPrice: '11,99 €', emoji: '👜' }
  ],
  schluesselanhaenger: [
    { name: 'GG Hildburghausen Turnbeutel', price: 9.99, oldPrice: '16,99 €', emoji: '🎒' },
    { name: 'GG Hildburghausen Notizbuch', price: 7.99, oldPrice: '12,99 €', emoji: '📓' }
  ],
  beanie: [
    { name: 'GG Hildburghausen Schal', price: 14.99, oldPrice: '22,99 €', emoji: '🧣' },
    { name: 'GG Hildburghausen Hoodie', price: 34.99, oldPrice: '59,99 €', emoji: '🧥' }
  ],
  schal: [
    { name: 'GG Hildburghausen Beanie', price: 12.99, oldPrice: '19,99 €', emoji: '🧢' },
    { name: 'GG Hildburghausen Sweatshirt', price: 29.99, oldPrice: '49,99 €', emoji: '👚' }
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
  addToCart(p.name, pricePer, p.image, productId, window.__shoplySelectedColor || null);
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
   PRODUKTÜBERSICHT (index.html) – wird aus products.js gerendert
   ============================================================ */
function colorSwatchesHTML(productId, colorIds, selectedId) {
  return '<div class="color-swatches">' + colorIds.map(function (cid) {
    const c = colorById(cid);
    const active = cid === selectedId ? ' active' : '';
    return '<button type="button" class="color-swatch' + active + '" style="background:' + c.hex +
      '" data-color="' + cid + '" title="' + c.name + '" ' +
      'onclick="selectProductColor(this, \'' + productId + '\')"></button>';
  }).join('') + '</div>';
}

function renderProductCard(p) {
  const defaultColor = p.colors[0];
  const badgeIcon = p.badgeClass === 'hot' ? ICONS.flame : '';
  const badgeHtml = p.badge
    ? '<div class="product-badge' + (p.badgeClass ? ' ' + p.badgeClass : '') + '">' + badgeIcon + '<span>' + p.badge + '</span></div>'
    : '';
  return `
    <div class="product-card" data-product="${p.id}" data-selected-color="${defaultColor}">
      ${badgeHtml}
      <div class="product-stock-low">${ICONS.alertTriangle}<span>Nur noch ${p.stockLeft} auf Lager!</span></div>
      <div class="product-image" style="background:${colorTint(defaultColor)}">${productImageHTML(p)}</div>
      <h3>${p.name}</h3>
      <div class="product-rating">${p.ratingStars} <span>(${p.ratingText})</span></div>
      ${colorSwatchesHTML(p.id, p.colors, defaultColor)}
      <div class="product-price">
        <span class="old-price">${euro(p.oldPrice)}</span>
        <span class="new-price">${euro(p.newPrice)}</span>
        <span class="discount">${p.discountReal}</span>
      </div>
      <p class="product-desc">${p.desc}</p>
      <div class="product-social">${ICONS.eye}<span>${p.viewers} Personen schauen sich dieses Produkt an</span></div>
      <div class="product-timer">${ICONS.clock}<span>Deal endet in <span class="product-countdown">${p.timerStart}</span></span></div>
      <a href="product.html?id=${p.id}" class="btn-product">Details ansehen</a>
      <button class="btn-add-cart" onclick="addToCartFromCard('${p.id}')">In den Warenkorb</button>
    </div>`;
}

function renderProductGrid() {
  const container = document.getElementById('productsGrid');
  if (!container || typeof PRODUCTS === 'undefined') return;
  container.innerHTML = PRODUCTS.map(renderProductCard).join('');
}

/* Klick auf einen Farb-Swatch auf einer Produktkarte */
function selectProductColor(btn, productId) {
  const card = btn.closest('.product-card');
  if (!card) return;
  const cid = btn.dataset.color;
  card.dataset.selectedColor = cid;
  card.querySelectorAll('.color-swatch').forEach(function (s) { s.classList.remove('active'); });
  btn.classList.add('active');
  const img = card.querySelector('.product-image');
  if (img) img.style.background = colorTint(cid);
}

/* "In den Warenkorb" auf der Produktkarte: berücksichtigt die gewählte Farbe */
function addToCartFromCard(productId) {
  const p = PRODUCTS_BY_ID[productId];
  if (!p) return;
  const card = document.querySelector('.product-card[data-product="' + productId + '"]');
  const color = card ? card.dataset.selectedColor : p.colors[0];
  addToCart(p.name, p.newPrice, p.emoji, productId, color);
}

/* Füllt jedes Element mit [data-icon="name"] automatisch mit dem
   passenden SVG aus ICONS (products.js) – so reicht im HTML ein
   Platzhalter, ganz ohne Emoji. */
function initStaticIcons() {
  document.querySelectorAll('[data-icon]').forEach(function (el) {
    const name = el.dataset.icon;
    if (typeof ICONS !== 'undefined' && ICONS[name]) el.innerHTML = ICONS[name];
  });
}

/* ============================================================
   INIT – läuft auf jeder Seite
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  initStaticIcons();
  renderProductGrid(); // muss vor Studien-Skript & Countdown-Init laufen
  updateNavCart();
  initAllCountdowns();
  renderRecentlyViewed();
  syncCheckoutSubscriptionUI(); // spiegelt ggf. schon am Warenkorb getroffene Premium-Entscheidung
});
