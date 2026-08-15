/* ============================================================
   SHOPLY – Studien-Tracking für die Seminarfacharbeit
   ============================================================

   WIE ES FUNKTIONIERT
   --------------------
   1. Jede/r Mitschüler/in bekommt einen eigenen Link mit einer
      Kennung, z.B.:
         index.html?s=schueler1
         index.html?s=schueler2
      Die Kennung wird beim ersten Aufruf im Browser gespeichert
      (localStorage), man muss sie also nicht auf jeder Unterseite
      erneut anhängen.

   2. Für JEDES Hauptprodukt (siehe products.js) wird aus der Schüler-Kennung
      deterministisch (aber für Außenstehende nicht vorhersagbar)
      berechnet, ob es bei dieser Person "manipuliert" (mit Dark
      Patterns) oder "normal" (ehrliche Darstellung) angezeigt
      wird. Gleiche Person + gleiches Produkt = immer dasselbe
      Ergebnis. Andere Person = andere Verteilung.

   3. Klicks auf "Details ansehen", Warenkorb-Zugänge und Käufe
      werden zusammen mit Schüler-Kennung, Produkt und Variante
      an ein Google Sheet gesendet (siehe SETUP-ANLEITUNG unten).


   SETUP-ANLEITUNG (einmalig, ca. 5 Minuten)
   ------------------------------------------
   1. Neues Google Sheet anlegen (sheets.new).
   2. Erweiterungen -> Apps Script.
   3. Den kompletten Code aus "apps-script-code.gs" (liegt bei den
      anderen Dateien) einfügen und speichern.
   4. Oben rechts auf "Bereitstellen" -> "Neue Bereitstellung".
   5. Typ auswählen: "Web-App".
      - Ausführen als: "Ich" (dein Google-Konto)
      - Zugriff: "Jeder" (Anonymer Zugriff, wichtig, sonst
        blockiert Google die Anfragen aus dem Browser!)
   6. Bereitstellen -> die angezeigte Web-App-URL kopieren
      (endet auf ".../exec").
   7. Diese URL unten bei STUDY_ENDPOINT einfügen.
   8. Datei speichern, alle drei HTML-Seiten + study.js zusammen
      hochladen (GitHub Pages o.ä.).

   Alle Events landen dann live in deinem Google Sheet – du musst
   nichts manuell abrufen, es aktualisiert sich von selbst.
   ============================================================ */

// TODO: Nach dem Setup (siehe oben) hier die eigene Apps-Script-Web-App-URL eintragen
const STUDY_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxdzhbbq-xcbSA5AwcmCwE2u66EzABJyRPYSCz3uIAjckohn1LpnaqsBMBjKc6W7AFi/exec';

// Die Hauptprodukte, die Teil der Studie sind – wird automatisch aus
// products.js übernommen (dort einfach neue Produkte ergänzen, sie werden
// dann automatisch mit in die Studie aufgenommen).
const STUDY_PRODUCTS = (typeof PRODUCTS !== 'undefined')
  ? PRODUCTS.map(p => p.id)
  : ['kopfhoerer', 'smartwatch', 'tasche', 'maus', 'sneaker', 'rueckwand'];

/* ---------- Schüler-Kennung ermitteln & merken ---------- */
function getStudentId() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('s');
  if (fromUrl) {
    localStorage.setItem('shoply_study_id', fromUrl);
    return fromUrl;
  }
  return localStorage.getItem('shoply_study_id') || 'unbekannt';
}

const STUDY_ID = getStudentId();

/* ---------- Deterministische Varianten-Zuordnung ---------- */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // in 32-Bit-Integer umwandeln
  }
  return Math.abs(hash);
}

// true = für diese Person wird das Produkt MIT Dark Patterns gezeigt (Standard im HTML)
// false = für diese Person wird das Produkt in der ehrlichen "Normal"-Variante gezeigt
function isManipulated(productId) {
  return hashString(STUDY_ID + ':' + productId) % 2 === 0;
}

/* ---------- Events an das Google Sheet senden ---------- */
function trackStudyEvent(eventType, productId, extra) {
  const payload = {
    studentId: STUDY_ID,
    eventType: eventType,
    productId: productId || '',
    variant: productId ? (isManipulated(productId) ? 'manipuliert' : 'normal') : '',
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
    extra: extra || {}
  };

  if (!STUDY_ENDPOINT || STUDY_ENDPOINT.indexOf('HIER_DEINE') === 0) {
    console.warn('[Studie] Kein Endpoint konfiguriert (STUDY_ENDPOINT in study.js) – Event nur lokal geloggt:', payload);
    return;
  }

  // mode: 'no-cors', weil Apps-Script-Web-Apps keine CORS-Header senden.
  // Dadurch kann die Antwort nicht ausgelesen werden – das ist für reines
  // Protokollieren aber unproblematisch.
  fetch(STUDY_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify(payload)
  }).catch(err => console.error('[Studie] Event konnte nicht gesendet werden:', err));
}

/* ============================================================
   Dark-Pattern-Elemente je nach Variante ein-/ausblenden
   ============================================================ */

/* --- Startseite: Produktkarten --- */
function applyVariantToCard(card) {
  const productId = card.dataset.product;
  if (!STUDY_PRODUCTS.includes(productId) || isManipulated(productId)) return;

  const timer = card.querySelector('.product-timer');
  const stock = card.querySelector('.product-stock-low');
  const social = card.querySelector('.product-social');
  const badge = card.querySelector('.product-badge');
  const oldPrice = card.querySelector('.old-price');
  const discount = card.querySelector('.discount');

  if (timer) timer.remove();
  if (stock) stock.remove();
  if (social) social.remove();
  if (oldPrice) oldPrice.remove();
  if (discount) discount.remove();
  if (badge && /🔥/.test(badge.textContent)) badge.remove();
}

function applyVariantToProductGrid() {
  document.querySelectorAll('.product-card[data-product]').forEach(applyVariantToCard);
}

/* --- Produktdetailseite --- */
function applyVariantToProductDetail(productId) {
  if (!STUDY_PRODUCTS.includes(productId) || isManipulated(productId)) return;

  ['pdStock', 'pdSocial', 'pdTimer', 'pdInflated', 'liveSalesCounter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  const bait = document.querySelector('.bait-section');
  if (bait) bait.remove();

  const badge = document.getElementById('pdBadge');
  if (badge && /🔥/.test(badge.textContent)) badge.remove();

  // Preis ehrlich anzeigen: nur der tatsächliche Preis, ohne
  // durchgestrichenen "UVP" und ohne Rabatt-Sticker
  const priceEl = document.getElementById('pdPrice');
  if (priceEl) {
    const newPriceSpan = priceEl.querySelector('.new-price');
    if (newPriceSpan) priceEl.innerHTML = `<span class="new-price">${newPriceSpan.textContent}</span>`;
  }
  const stickyOld = document.getElementById('stickyOld');
  if (stickyOld) stickyOld.remove();

  // Verhindert das Confirmshaming-Exit-Popup auf dieser Seite (siehe product.html)
  window.__shoplyStudyNoExitModal = true;
}

/* ---------- Klicks auf "Details ansehen" auf der Startseite tracken ---------- */
function initStudyClickTracking() {
  document.querySelectorAll('.product-card[data-product] .btn-product').forEach(link => {
    link.addEventListener('click', function () {
      const productId = this.closest('.product-card').dataset.product;
      trackStudyEvent('click_details', productId);
    });
  });
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', function () {
  applyVariantToProductGrid();
  initStudyClickTracking();
});
