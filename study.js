/* ============================================================
   SHOPLY – Studien-Tracking für die Seminarfacharbeit
   ============================================================

   WIE ES FUNKTIONIERT
   --------------------
   1. Alle Mitschüler/innen bekommen DENSELBEN Link (z.B. die
      normale GitHub-Pages-URL, ganz ohne Zusatz). Beim allerersten
      Besuch erscheint ein Overlay: "Wähle deinen Geburtsmonat".
      Diese Wahl wird im Browser gespeichert (localStorage) und ist
      danach die "Kennung" dieser Person – man sieht das Overlay nur
      einmal, auf allen drei Seiten.

      Hinweis: Da es nur 12 Monate gibt, teilen sich mehrere
      Mitschüler/innen dieselbe Kennung (= dieselbe Zuordnung
      manipuliert/normal je Produkt). Ihr bekommt also 12 Gruppen
      statt einzelner Personen – das reicht für "manipuliert vs.
      normal" völlig aus und ist nebenbei anonymer.

      Für eigene Tests könnt ihr weiterhin manuell eine eigene
      Kennung über den Link erzwingen, z.B. index.html?s=test –
      dann wird KEIN Geburtsmonat-Overlay angezeigt.
      Sonderfall index.html?s=0 (oder ?s=control): zeigt ALLES in
      der sauberen Variante – praktisch als Kontrolltest.

   2. Für JEDE Monatsgruppe wird aus der Kennung deterministisch (aber für
      Außenstehende nicht vorhersagbar) berechnet, welche HÄLFTE der
      Hauptprodukte (siehe products.js) "manipuliert" (mit Dark Patterns)
      und welche "normal" (ehrliche Darstellung) angezeigt wird. Jede
      Gruppe bekommt dabei exakt dieselbe ANZAHL manipulierter Produkte
      (z.B. 6 von 12) – nur WELCHE Produkte das sind, unterscheidet sich
      von Monat zu Monat. Das macht den Vergleich zwischen den Gruppen
      fair, weil niemand insgesamt mehr oder weniger Dark Patterns zu
      sehen bekommt als eine andere Gruppe. Gleiche Kennung = immer
      dieselbe Zuordnung, andere Kennung = andere Verteilung.

   3. Klicks auf "Details ansehen", Warenkorb-Zugänge und Käufe
      werden zusammen mit Kennung, Produkt und Variante an ein
      Google Sheet gesendet (siehe SETUP-ANLEITUNG unten).


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
  : ['tasche', 'sneaker', 'rueckwand', 'shirt', 'hoodie', 'cap'];

/* ============================================================
   GEBURTSMONAT-OVERLAY
   ============================================================
   Läuft synchron, BEVOR der Rest der Seite sichtbar wird (da
   study.js ganz am Ende von <body> eingebunden ist, existiert das
   <body>-Element schon, aber noch nichts wurde vom Nutzer gesehen).
   Erscheint nur, wenn weder ein ?s=... in der URL steht noch schon
   eine Kennung gespeichert ist. */
const STUDY_MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function needsMonthPicker() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('s')) return false; // manueller Override (Lehrer/Testing)
  return !localStorage.getItem('shoply_study_id');
}

function showMonthPicker() {
  const overlay = document.createElement('div');
  overlay.id = 'monthPickerOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal month-picker-modal">
      <h2>🎁 Für dein persönliches Angebot</h2>
      <p class="modal-subtitle">Wähle kurz deinen Geburtsmonat, damit wir dir passende Deals zeigen können.</p>
      <div class="month-picker-grid">
        ${STUDY_MONTHS.map((m, i) => `<button type="button" class="month-btn" data-month="${i + 1}">${m}</button>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelectorAll('.month-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const month = this.dataset.month;
      const logCode = Math.random().toString(36).slice(2, 6).toUpperCase(); // z.B. "K7F2"
      localStorage.setItem('shoply_study_month', month);
      localStorage.setItem('shoply_study_id', 'monat-' + month + '-' + logCode);
      window.location.reload();
    });
  });
}

if (needsMonthPicker()) {
  // document.body existiert bereits (study.js steht am Ende von <body>),
  // aber DOMContentLoaded ist noch nicht gefeuert – die Seite dahinter
  // ist also noch nirgends interaktiv, wenn das Overlay erscheint.
  if (document.body) {
    showMonthPicker();
  } else {
    document.addEventListener('DOMContentLoaded', showMonthPicker);
  }
}

/* ---------- Kennung ermitteln (Geburtsmonat-Overlay ODER manueller ?s=...-Override) ----------
   STUDY_ID  = eindeutige Anzeige-Kennung fürs Sheet (z.B. "monat-5-K7F2")
   STUDY_KEY = Zuordnungs-Schlüssel, der bestimmt, welche Produkte manipuliert
               sind (nur der Monat, damit alle in derselben Gruppe dieselbe
               Zuordnung sehen – siehe isManipulated) */
function getStudentId() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('s');
  if (fromUrl) {
    localStorage.setItem('shoply_study_id', fromUrl);
    return fromUrl;
  }
  return localStorage.getItem('shoply_study_id') || 'unbekannt';
}

function getStudentKey() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('s');
  if (fromUrl) return fromUrl; // manueller Override: Zuordnung direkt über die übergebene Kennung
  return localStorage.getItem('shoply_study_month') || STUDY_ID;
}

const STUDY_ID = getStudentId();
const STUDY_KEY = getStudentKey();

/* ---------- Deterministische, FAIR BALANCIERTE Varianten-Zuordnung ----------
   Wichtig fürs Studiendesign, gleich in zweifacher Hinsicht:
   1. Jede Monatsgruppe bekommt exakt dieselbe ANZAHL manipulierter Produkte
      (z.B. bei 12 Produkten immer genau 6).
   2. Jedes einzelne Produkt wird über alle 12 Monate hinweg so gleich wie
      möglich manipuliert – bei einer Produktanzahl n, die NICHT glatt durch
      12 teilbar ist (z.B. 17 Produkte), ist absolute Gleichheit mathematisch
      unmöglich (12 * half muss durch n teilbar sein, sonst geht's nicht
      exakt auf). Der Algorithmus unten erreicht aber nachweislich das
      bestmögliche Ergebnis: die Differenz zwischen dem am häufigsten und am
      seltensten manipulierten Produkt ist NIE größer als 1 (bei aktuell 17
      Produkten z.B.: 11 Produkte 6x, 6 Produkte 5x – mehr Gleichheit ist bei
      dieser Zahl nicht erreichbar).

   Dafür wird KEIN Zufallsgenerator verwendet, sondern echtes Rundlaufprinzip
   (Round-Robin): Die 12 Monatsfenster werden NAHTLOS aneinandergereiht
   (Fenster für Monat 2 beginnt exakt dort, wo Fenster für Monat 1 endet –
   kein Runden, keine Bruchrechnung dazwischen). Das ist der entscheidende
   Unterschied zur Vorgängerversion, die den Startpunkt pro Monat einzeln
   gerundet hat (Math.round((monat-1) * n / 12)) – dabei summierten sich die
   Rundungsfehler über die 12 Monate zu einer spürbaren Schieflage auf,
   sobald n nicht mehr glatt zu 12 passte (z.B. bei den inzwischen 17 statt
   ursprünglich 6 Produkten). Mit nahtlos aneinandergereihten Fenstern kann
   das nicht mehr passieren. */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // in 32-Bit-Integer umwandeln
  }
  return Math.abs(hash);
}

let _manipulatedSetCache = null;

// Berechnet EINMAL pro Seitenaufruf, welche Produkte für diese Kennung
// manipuliert sind – als Set, damit isManipulated() schnell nachschlagen kann.
function getManipulatedSet() {
  if (_manipulatedSetCache) return _manipulatedSetCache;

  if (STUDY_KEY === '0' || STUDY_KEY === 'control') {
    _manipulatedSetCache = new Set(); // Kontrollgruppe: nichts manipuliert
    return _manipulatedSetCache;
  }

  const n = STUDY_PRODUCTS.length;
  const half = Math.round(n / 2);

  // Bei echten Geburtsmonaten (Kennung "1".."12") wird der Startpunkt NICHT
  // mehr über eine gerundete Bruchrechnung bestimmt (das war der alte, leicht
  // unfaire Ansatz), sondern über nahtloses Rundlaufprinzip: Monat 1 startet
  // bei Index 0, Monat 2 exakt dort, wo Monat 1 aufgehört hat (Index `half`),
  // usw. – die Fenster reihen sich lückenlos aneinander, ohne Rundungsfehler.
  // Das garantiert die bestmögliche Verteilung (siehe Kommentarblock oben).
  // Bei manuellen Test-Kennungen (?s=irgendwas) wird weiterhin ein Hash als
  // Ersatz-Startpunkt verwendet – die Anzahl je Gruppe bleibt balanciert,
  // die Rundum-Balance über alle Monate hinweg gilt aber wie gehabt nur für
  // die echten Monatswerte 1-12.
  const monthNumber = parseInt(STUDY_KEY, 10);
  const isRealMonth = !isNaN(monthNumber) && String(monthNumber) === STUDY_KEY;
  const offset = isRealMonth
    ? (monthNumber - 1) * half % n
    : hashString(STUDY_KEY) % n;

  const manipulated = new Set();
  for (let k = 0; k < half; k++) {
    manipulated.add(STUDY_PRODUCTS[(offset + k) % n]);
  }
  _manipulatedSetCache = manipulated;
  return _manipulatedSetCache;
}

// true = für diese Person wird das Produkt MIT Dark Patterns gezeigt (Standard im HTML)
// false = für diese Person wird das Produkt in der ehrlichen "Normal"-Variante gezeigt
function isManipulated(productId) {
  return getManipulatedSet().has(productId);
}

/* ---------- Events an das Google Sheet senden ---------- */
function trackStudyEvent(eventType, productId, extra) {
  // Solange das Geburtsmonat-Overlay noch offen ist (Kennung unbekannt),
  // wird nichts gesendet – sonst gäbe es "unbekannt"-Datenmüll im Sheet.
  if (STUDY_ID === 'unbekannt') return;

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
  if (badge) badge.remove();
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
  if (badge) badge.remove();

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
