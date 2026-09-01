/* ============================================================
   SHOPLY – Zentrale Produkt- und Farbdatenbank
   ============================================================
   Hier alle Produkte + Farben pflegen – index.html, product.html
   und checkout.html lesen alle von hier. Neues Produkt hinzufügen
   = einfach unten einen neuen Eintrag in PRODUCTS ergänzen, keine
   HTML-Datei muss angefasst werden.

   WICHTIG für die Studie: newPrice ist in jeder Variante gleich –
   nur oldPrice/uvp (Fake-Referenzpreise) werden ausgeblendet, wenn
   für eine Person die "saubere" Variante gilt (siehe study.js).
   ============================================================ */

const COLORS = [
  { id: 'schwarz', name: 'Schwarz', hex: '#1B1E2B' },
  { id: 'weiss',   name: 'Weiß',    hex: '#F5F5F0' },
  { id: 'rot',     name: 'Rot',     hex: '#E8402D' },
  { id: 'blau',    name: 'Blau',    hex: '#2563EB' },
  { id: 'gruen',   name: 'Grün',    hex: '#1E9E62' }
];
const ALL_COLOR_IDS = COLORS.map(c => c.id);

function euro(n) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

function colorById(id) {
  return COLORS.find(c => c.id === id) || COLORS[0];
}

// Leichte Farbeinfärbung für die Emoji-"Produktbilder" (Alpha-Kanal am Hex-Wert)
function colorTint(id) {
  return colorById(id).hex + '26';
}

/* ============================================================
   ICON-SET (echte SVG-Icons statt Emoji als funktionale Icons)
   Schlanke, strichbasierte Icons im Feather-Stil, currentColor
   ============================================================ */
const ICONS = {
  clock: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>',
  eye: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  alertTriangle: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 4.6 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9.5" x2="12" y2="13.5"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  flame: '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M8.5 14.5a2.5 2.5 0 0 0 2.5-2.5c0-1.4-.5-2-1-3-1-2 0-4 2-6 .5 2.5 2 5 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  truck: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="4" width="14" height="12" rx="1"/><path d="M15 9h4l4 3v4h-8"/><circle cx="6" cy="19" r="2"/><circle cx="17.5" cy="19" r="2"/></svg>',
  lock: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11"/></svg>',
  refresh: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="2 4 2 10 8 10"/><path d="M4 15a9 9 0 1 0 2-9.5L2 10"/></svg>',
  star: '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3"/></svg>',
  check: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  checkCircle: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="8 12.5 10.8 15 16 9.5"/></svg>',
  x: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>'
};

/* Baut das Markup für das Produktbild: echtes Foto (p.photo), falls
   gesetzt, sonst automatisch das Emoji als Fallback – so bricht nichts,
   solange noch nicht für jedes Produkt ein Foto hinterlegt ist.
   WICHTIG: Der Fallback greift auch, wenn "photo" zwar gesetzt ist, die
   Datei aber (noch) nicht existiert oder nicht lädt (onerror) – z.B. wenn
   der Pfad schon eingetragen wurde, das Bild selbst aber erst später
   hochgeladen wird. Ohne das würde stattdessen ein kaputtes Bild-Icon
   angezeigt.
   Eigene Fotos hinzufügen: Bilddatei in einen "images/"-Ordner neben
   den HTML-Dateien legen und unten bei "photo" den Pfad eintragen,
   z.B. photo: 'images/kopfhoerer.jpg'. */
function productImageHTML(p, extraAttrs) {
  extraAttrs = extraAttrs || '';
  const fallbackEmoji = p.emoji || p.image || '📦';
  if (p.photo) {
    return '<img src="' + p.photo + '" alt="' + p.name + '" loading="lazy" ' + extraAttrs +
      ' onerror="handleProductImgError(this, \'' + fallbackEmoji + '\')">';
  }
  return '<span class="product-emoji-fallback">' + fallbackEmoji + '</span>';
}

/* Wird vom onerror-Handler oben aufgerufen, falls ein Produktfoto nicht
   lädt (404, noch nicht hochgeladen, etc.) – ersetzt das kaputte <img>
   durch dieselbe Emoji-Darstellung, die auch ohne "photo"-Feld verwendet
   würde. */
function handleProductImgError(imgEl, fallbackEmoji) {
  if (!imgEl || !imgEl.parentNode) return;
  const span = document.createElement('span');
  span.className = 'product-emoji-fallback';
  span.textContent = fallbackEmoji;
  imgEl.parentNode.replaceChild(span, imgEl);
}

const PRODUCTS = [
  {
    id: 'tasche', name: 'Leder Tasche Deluxe', emoji: '👜',
    badge: 'NEU', badgeClass: 'new',
    ratingStars: '★★★★★', ratingText: '4.8 – 967 Bewertungen',
    newPrice: 79.99, oldPrice: 249.99, uvp: 379.99, discountReal: '-68%', discountInflated: '-80%',
    desc: 'Handgefertigte Ledertasche aus italienischem Leder. Zeitlos elegant.',
    stockLeft: 5, viewers: 53, timerStart: '03:22:15', colors: ALL_COLOR_IDS, photo: ''
  },
  {
    id: 'sneaker', name: 'Sneaker Limited Edition', emoji: '👟',
    badge: 'LIMITIERT', badgeClass: 'hot',
    ratingStars: '★★★★★', ratingText: '4.9 – 743 Bewertungen',
    newPrice: 54.99, oldPrice: 179.99, uvp: 259.99, discountReal: '-70%', discountInflated: '-80%',
    desc: 'Exklusive Limited-Edition-Sneaker. Nur 500 Paar weltweit. Sammlerstück!',
    stockLeft: 1, viewers: 312, timerStart: '00:29:18', colors: ALL_COLOR_IDS, photo: ''
  },
  {
    id: 'rueckwand', name: 'Premium Rucksack 40L', emoji: '🎒',
    badge: 'NEU', badgeClass: 'new',
    ratingStars: '★★★★☆', ratingText: '4.5 – 1.234 Bewertungen',
    newPrice: 39.99, oldPrice: 129.99, uvp: 199.99, discountReal: '-69%', discountInflated: '-80%',
    desc: 'Wasserdichter Trekkingrucksack mit Laptop-Fach und USB-Ladeport.',
    stockLeft: 4, viewers: 67, timerStart: '04:15:08', colors: ALL_COLOR_IDS, photo: ''
  },
  {
    id: 'shirt', name: 'GG Hildburghausen T-Shirt', emoji: '👕',
    badge: 'NEU', badgeClass: 'new',
    ratingStars: '★★★★☆', ratingText: '4.4 – 203 Bewertungen',
    newPrice: 19.99, oldPrice: 34.99, uvp: 44.99, discountReal: '-43%', discountInflated: '-56%',
    desc: 'Weiches Baumwoll-T-Shirt mit gesticktem Gymnasium-Georgianum-Wappen. Fairtrade-zertifiziert.',
    stockLeft: 12, viewers: 18, timerStart: '06:11:03', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  },
  {
    id: 'hoodie', name: 'GG Hildburghausen Hoodie', emoji: '🧥',
    badge: 'BESTSELLER', badgeClass: '',
    ratingStars: '★★★★★', ratingText: '4.7 – 356 Bewertungen',
    newPrice: 34.99, oldPrice: 59.99, uvp: 79.99, discountReal: '-42%', discountInflated: '-56%',
    desc: 'Kuscheliger Hoodie mit gesticktem Gymnasium-Georgianum-Wappen. Unisex-Schnitt.',
    stockLeft: 7, viewers: 41, timerStart: '01:58:27', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  },
  {
    id: 'cap', name: 'GG Hildburghausen Cap', emoji: '🧢',
    badge: '', badgeClass: '',
    ratingStars: '★★★★☆', ratingText: '4.3 – 129 Bewertungen',
    newPrice: 14.99, oldPrice: 24.99, uvp: 34.99, discountReal: '-40%', discountInflated: '-57%',
    desc: 'Verstellbare Cap mit gesticktem Gymnasium-Georgianum-Wappen. One Size fits all.',
    stockLeft: 15, viewers: 12, timerStart: '07:22:55', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  },
  {
    id: 'flasche', name: 'GG Hildburghausen Trinkflasche', emoji: '🍶',
    badge: 'NEU', badgeClass: 'new',
    ratingStars: '★★★★★', ratingText: '4.9 – 87 Bewertungen',
    newPrice: 12.99, oldPrice: 19.99, uvp: 29.99, discountReal: '-35%', discountInflated: '-57%',
    desc: 'Auslaufsichere Edelstahl-Trinkflasche, 750ml, hält 12h kalt, mit graviertem Gymnasium-Georgianum-Wappen.',
    stockLeft: 20, viewers: 9, timerStart: '08:15:30', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  },
  {
    id: 'hose', name: 'GG Hildburghausen Jogginghose', emoji: '👖',
    badge: 'NEU', badgeClass: 'new',
    ratingStars: '★★★★☆', ratingText: '4.5 – 178 Bewertungen',
    newPrice: 29.99, oldPrice: 49.99, uvp: 69.99, discountReal: '-40%', discountInflated: '-57%',
    desc: 'Bequeme Jogginghose mit elastischem Bund und gesticktem Gymnasium-Georgianum-Wappen. Perfekt für Schule und Freizeit.',
    stockLeft: 10, viewers: 22, timerStart: '03:45:12', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  },
  {
    id: 'hemd', name: 'GG Hildburghausen Flanell-Hemd', emoji: '👔',
    badge: '', badgeClass: '',
    ratingStars: '★★★★☆', ratingText: '4.4 – 96 Bewertungen',
    newPrice: 34.99, oldPrice: 54.99, uvp: 74.99, discountReal: '-36%', discountInflated: '-53%',
    desc: 'Kariertes Flanell-Hemd aus weicher Baumwolle mit kleinem Gymnasium-Georgianum-Wappen auf der Brust. Lässig und vielseitig kombinierbar.',
    stockLeft: 9, viewers: 15, timerStart: '05:33:47', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  },
  {
    id: 'cargohose', name: 'GG Hildburghausen Cargo-Hose', emoji: '👖',
    badge: 'BESTSELLER', badgeClass: '',
    ratingStars: '★★★★★', ratingText: '4.6 – 241 Bewertungen',
    newPrice: 39.99, oldPrice: 64.99, uvp: 89.99, discountReal: '-38%', discountInflated: '-56%',
    desc: 'Robuste Cargo-Hose mit praktischen Seitentaschen und aufgesticktem Gymnasium-Georgianum-Wappen. Der Streetwear-Klassiker.',
    stockLeft: 6, viewers: 38, timerStart: '01:12:39', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  },
  {
    id: 'sweatshirt', name: 'GG Hildburghausen Sweatshirt', emoji: '👚',
    badge: 'BESTSELLER', badgeClass: '',
    ratingStars: '★★★★★', ratingText: '4.7 – 289 Bewertungen',
    newPrice: 29.99, oldPrice: 49.99, uvp: 69.99, discountReal: '-40%', discountInflated: '-57%',
    desc: 'Klassisches Rundhals-Sweatshirt mit gesticktem Gymnasium-Georgianum-Wappen. Schwerer Baumwoll-Fleece, angenehm warm.',
    stockLeft: 11, viewers: 27, timerStart: '02:33:19', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  },
  {
    id: 'turnbeutel', name: 'GG Hildburghausen Sporttasche', emoji: '🎒',
    badge: 'NEU', badgeClass: 'new',
    ratingStars: '★★★★☆', ratingText: '4.5 – 64 Bewertungen',
    newPrice: 24.99, oldPrice: 39.99, uvp: 54.99, discountReal: '-38%', discountInflated: '-55%',
    desc: 'Weekender-Sporttasche mit Tragegriffen, abnehmbarem Schultergurt und kleiner Fronttasche. Gymnasium-Georgianum-Wappen auf dem Hauptfach und der Fronttasche.',
    stockLeft: 12, viewers: 8, timerStart: '09:02:10', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  },
  {
    id: 'jutebeutel', name: 'GG Hildburghausen Jutebeutel', emoji: '👜',
    badge: '', badgeClass: '',
    ratingStars: '★★★★☆', ratingText: '4.6 – 41 Bewertungen',
    newPrice: 6.99, oldPrice: 11.99, uvp: 16.99, discountReal: '-42%', discountInflated: '-59%',
    desc: 'Stabiler Jute-Stoffbeutel mit Gymnasium-Georgianum-Wappen. Praktisch für Bücher, Einkauf oder als Schultasche für unterwegs.',
    stockLeft: 30, viewers: 6, timerStart: '10:15:44', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  },
  {
    id: 'tasse', name: 'GG Hildburghausen Kaffeetasse', emoji: '☕',
    badge: 'BESTSELLER', badgeClass: '',
    ratingStars: '★★★★★', ratingText: '4.8 – 156 Bewertungen',
    newPrice: 9.99, oldPrice: 15.99, uvp: 21.99, discountReal: '-38%', discountInflated: '-55%',
    desc: 'Klassische Keramiktasse (300ml) mit Gymnasium-Georgianum-Wappen. Spülmaschinen- und mikrowellenfest.',
    stockLeft: 18, viewers: 14, timerStart: '04:48:52', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  },
  {
    id: 'thermobecher', name: 'GG Hildburghausen Thermobecher', emoji: '🥤',
    badge: 'NEU', badgeClass: 'new',
    ratingStars: '★★★★☆', ratingText: '4.6 – 52 Bewertungen',
    newPrice: 16.99, oldPrice: 27.99, uvp: 39.99, discountReal: '-39%', discountInflated: '-58%',
    desc: 'Doppelwandiger Thermobecher (350ml) mit Gymnasium-Georgianum-Wappen, hält Getränke bis zu 6h warm.',
    stockLeft: 14, viewers: 11, timerStart: '06:27:36', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  },
  {
    id: 'notizbuch', name: 'GG Hildburghausen Notizbuch', emoji: '📓',
    badge: '', badgeClass: '',
    ratingStars: '★★★★☆', ratingText: '4.4 – 73 Bewertungen',
    newPrice: 7.99, oldPrice: 12.99, uvp: 17.99, discountReal: '-38%', discountInflated: '-56%',
    desc: 'Hardcover-Notizbuch (A5, liniert) mit geprägtem Gymnasium-Georgianum-Wappen auf dem Einband. 120 Seiten.',
    stockLeft: 22, viewers: 5, timerStart: '11:03:27', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  },
  {
    id: 'schluesselanhaenger', name: 'GG Hildburghausen Schlüsselanhänger', emoji: '🔑',
    badge: '', badgeClass: '',
    ratingStars: '★★★★★', ratingText: '4.9 – 38 Bewertungen',
    newPrice: 4.99, oldPrice: 8.99, uvp: 12.99, discountReal: '-44%', discountInflated: '-62%',
    desc: 'Robuster Metall-Schlüsselanhänger mit graviertem Gymnasium-Georgianum-Wappen.',
    stockLeft: 35, viewers: 4, timerStart: '12:41:09', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  },
  {
    id: 'beanie', name: 'GG Hildburghausen Beanie', emoji: '🧢',
    badge: 'NEU', badgeClass: 'new',
    ratingStars: '★★★★☆', ratingText: '4.5 – 47 Bewertungen',
    newPrice: 12.99, oldPrice: 19.99, uvp: 27.99, discountReal: '-35%', discountInflated: '-54%',
    desc: 'Warme Strickmütze mit gesticktem Gymnasium-Georgianum-Wappen. One Size, für Herbst & Winter.',
    stockLeft: 16, viewers: 9, timerStart: '03:59:14', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  },
  {
    id: 'schal', name: 'GG Hildburghausen Schal', emoji: '🧣',
    badge: '', badgeClass: '',
    ratingStars: '★★★★☆', ratingText: '4.3 – 29 Bewertungen',
    newPrice: 14.99, oldPrice: 22.99, uvp: 31.99, discountReal: '-35%', discountInflated: '-53%',
    desc: 'Kuscheliger Strickschal mit eingewebtem Gymnasium-Georgianum-Wappen. Perfekt für den Schulweg im Winter.',
    stockLeft: 13, viewers: 7, timerStart: '07:38:52', colors: ALL_COLOR_IDS, photo: 'images/logo-ggh.png'
  }
];

const PRODUCTS_BY_ID = {};
PRODUCTS.forEach(p => { PRODUCTS_BY_ID[p.id] = p; });

/* Wandelt einen PRODUCTS-Eintrag in das Format um, das die
   Produktdetailseite (product.html) erwartet (Preise als fertig
   formatierte Euro-Strings, Rating als HTML-String, etc.) */
function productToDetailShape(p) {
  const ratingParts = p.ratingText.split(' – '); // z.B. "4.6 – 3.102 Bewertungen"
  return {
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    image: p.emoji,
    photo: p.photo,
    badge: p.badge,
    badgeClass: p.badgeClass,
    rating: p.ratingStars + ' <span>(' + p.ratingText + ')</span>',
    ratingStars: p.ratingStars,
    ratingValue: ratingParts[0] || p.ratingText,
    ratingCountText: ratingParts[1] || '',
    oldPrice: euro(p.oldPrice),
    newPrice: euro(p.newPrice),
    uvp: euro(p.uvp),
    discount: p.discountInflated,
    realDiscount: p.discountReal,
    desc: p.desc,
    stock: 'Nur noch ' + p.stockLeft + ' auf Lager!',
    social: p.viewers + ' Personen schauen sich dieses Produkt an',
    timerStart: p.timerStart,
    colors: p.colors
  };
}

/* ============================================================
   BEWERTUNGEN – pro Produkt passend generiert
   ============================================================
   Vorher waren die Kundenbewertungen auf der Produktseite fest
   eincodiert und redeten immer über Kopfhörer ("Klangqualität",
   "Noise-Cancelling") – auch auf der Seite für z.B. die
   Trinkflasche. Jetzt werden plausible, produktbezogene
   Bewertungen aus der echten Produktbeschreibung generiert,
   und die Bewertungszahl/-anzahl kommt aus den echten
   Produktdaten (ratingText) statt einem fixen "4.9".
   ============================================================ */
const REVIEW_NAME_POOL = [
  'Sarah M.', 'Michael T.', 'Lisa K.', 'Jonas B.', 'Anna W.',
  'Tom H.', 'Nina R.', 'Felix S.', 'Julia P.', 'David L.'
];

const REVIEW_TEMPLATES = [
  p => `Sehr zufrieden mit meinem Kauf – ${p.name} kam schnell an und die Qualität hat mich positiv überrascht!`,
  p => `Für den Preis unschlagbar. Kann ${p.name} nur weiterempfehlen, hat alle Erwartungen übertroffen.`,
  p => `Mein Kumpel hat mir den Shop empfohlen und ich muss sagen: top! ${p.name} ist genau wie beschrieben, teilweise sogar besser.`,
  p => `${p.desc} Genauso ist es auch angekommen – wirklich empfehlenswert.`,
  p => `War erst skeptisch wegen des Preises, aber ${p.name} überzeugt auf ganzer Linie. Würde wieder bestellen.`
];

const REVIEW_DAYS = ['vor 2 Tagen', 'vor 4 Tagen', 'vor 5 Tagen', 'vor 1 Woche', 'vor 2 Wochen'];

function generateReviewsFor(p) {
  const seed = productsHash(p.id);
  const reviews = [];
  for (let i = 0; i < 3; i++) {
    const nameIdx = (seed + i * 3) % REVIEW_NAME_POOL.length;
    const templateIdx = (seed + i * 7) % REVIEW_TEMPLATES.length;
    const dayIdx = (seed + i * 2) % REVIEW_DAYS.length;
    reviews.push({
      name: REVIEW_NAME_POOL[nameIdx],
      text: REVIEW_TEMPLATES[templateIdx](p),
      date: REVIEW_DAYS[dayIdx]
    });
  }
  return reviews;
}

// Kleine, deterministische Hash-Funktion (kein Zufall nötig – gleiche
// Produkt-ID ergibt immer dieselbe Auswahl an Name/Text/Datum)
function productsHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
