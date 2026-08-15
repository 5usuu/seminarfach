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

const PRODUCTS = [
  {
    id: 'kopfhoerer', name: 'Premium Kopfhörer X1', emoji: '🎧',
    badge: 'BESTSELLER', badgeClass: '',
    ratingStars: '★★★★★', ratingText: '4.9 – 2.341 Bewertungen',
    newPrice: 59.99, oldPrice: 199.99, uvp: 299.99, discountReal: '-70%', discountInflated: '-80%',
    desc: 'Hochwertige Noise-Cancelling Kopfhörer mit 40h Akkulaufzeit. Perfekt für Musikliebhaber.',
    stockLeft: 3, viewers: 127, timerStart: '02:14:33', colors: ALL_COLOR_IDS
  },
  {
    id: 'smartwatch', name: 'Smart Watch Pro', emoji: '⌚',
    badge: '🔥 HEISS', badgeClass: 'hot',
    ratingStars: '★★★★☆', ratingText: '4.7 – 1.892 Bewertungen',
    newPrice: 99.99, oldPrice: 349.99, uvp: 499.99, discountReal: '-71%', discountInflated: '-80%',
    desc: 'Die ultimative Smartwatch mit GPS, Herzfrequenzmesser und 7 Tagen Akkulaufzeit.',
    stockLeft: 1, viewers: 89, timerStart: '01:47:22', colors: ALL_COLOR_IDS
  },
  {
    id: 'tasche', name: 'Leder Tasche Deluxe', emoji: '👜',
    badge: 'NEU', badgeClass: 'new',
    ratingStars: '★★★★★', ratingText: '4.8 – 967 Bewertungen',
    newPrice: 79.99, oldPrice: 249.99, uvp: 379.99, discountReal: '-68%', discountInflated: '-80%',
    desc: 'Handgefertigte Lederhochtasche aus italienischem Leder. Zeitlos elegant.',
    stockLeft: 5, viewers: 53, timerStart: '03:22:15', colors: ALL_COLOR_IDS
  },
  {
    id: 'maus', name: 'Gaming Maus RGB Pro', emoji: '🖱️',
    badge: 'BESTSELLER', badgeClass: '',
    ratingStars: '★★★★☆', ratingText: '4.6 – 3.102 Bewertungen',
    newPrice: 29.99, oldPrice: 89.99, uvp: 139.99, discountReal: '-67%', discountInflated: '-78%',
    desc: 'Präzise Gaming-Maus mit 16.000 DPI, RGB-Beleuchtung und ergonomischem Design.',
    stockLeft: 2, viewers: 201, timerStart: '00:58:47', colors: ALL_COLOR_IDS
  },
  {
    id: 'sneaker', name: 'Sneaker Limited Edition', emoji: '👟',
    badge: '🔥 LIMITIERT', badgeClass: 'hot',
    ratingStars: '★★★★★', ratingText: '4.9 – 743 Bewertungen',
    newPrice: 54.99, oldPrice: 179.99, uvp: 259.99, discountReal: '-70%', discountInflated: '-80%',
    desc: 'Exklusive Limited-Edition-Sneaker. Nur 500 Paar weltweit. Sammlerstück!',
    stockLeft: 1, viewers: 312, timerStart: '00:29:18', colors: ALL_COLOR_IDS
  },
  {
    id: 'rueckwand', name: 'Premium Rückwand 40L', emoji: '🎒',
    badge: 'NEU', badgeClass: 'new',
    ratingStars: '★★★★☆', ratingText: '4.5 – 1.234 Bewertungen',
    newPrice: 39.99, oldPrice: 129.99, uvp: 199.99, discountReal: '-69%', discountInflated: '-80%',
    desc: 'Wasserdichter Trekkingrucksack mit Laptop-Fach und USB-Ladeport.',
    stockLeft: 4, viewers: 67, timerStart: '04:15:08', colors: ALL_COLOR_IDS
  },
  {
    id: 'tastatur', name: 'Mechanische Tastatur RGB', emoji: '⌨️',
    badge: 'BESTSELLER', badgeClass: '',
    ratingStars: '★★★★☆', ratingText: '4.6 – 1.567 Bewertungen',
    newPrice: 49.99, oldPrice: 129.99, uvp: 189.99, discountReal: '-62%', discountInflated: '-74%',
    desc: 'Mechanische Gaming-Tastatur mit RGB-Beleuchtung und heißaustauschbaren Switches.',
    stockLeft: 6, viewers: 44, timerStart: '02:40:10', colors: ALL_COLOR_IDS
  },
  {
    id: 'sonnenbrille', name: 'Sonnenbrille Retro', emoji: '🕶️',
    badge: 'NEU', badgeClass: 'new',
    ratingStars: '★★★★★', ratingText: '4.8 – 512 Bewertungen',
    newPrice: 24.99, oldPrice: 69.99, uvp: 99.99, discountReal: '-64%', discountInflated: '-75%',
    desc: 'Polarisierte Retro-Sonnenbrille mit UV400-Schutz. Zeitloses Design.',
    stockLeft: 8, viewers: 29, timerStart: '05:02:41', colors: ALL_COLOR_IDS
  },
  {
    id: 'shirt', name: 'Campus T-Shirt', emoji: '👕',
    badge: 'NEU', badgeClass: 'new',
    ratingStars: '★★★★☆', ratingText: '4.4 – 203 Bewertungen',
    newPrice: 19.99, oldPrice: 34.99, uvp: 44.99, discountReal: '-43%', discountInflated: '-56%',
    desc: 'Weiches Baumwoll-T-Shirt mit Campus-Logo. Fairtrade-zertifiziert.',
    stockLeft: 12, viewers: 18, timerStart: '06:11:03', colors: ALL_COLOR_IDS
  },
  {
    id: 'hoodie', name: 'Campus Hoodie', emoji: '🧥',
    badge: 'BESTSELLER', badgeClass: '',
    ratingStars: '★★★★★', ratingText: '4.7 – 356 Bewertungen',
    newPrice: 34.99, oldPrice: 59.99, uvp: 79.99, discountReal: '-42%', discountInflated: '-56%',
    desc: 'Kuscheliger Hoodie mit gesticktem Campus-Logo. Unisex-Schnitt.',
    stockLeft: 7, viewers: 41, timerStart: '01:58:27', colors: ALL_COLOR_IDS
  },
  {
    id: 'cap', name: 'Campus Cap', emoji: '🧢',
    badge: '', badgeClass: '',
    ratingStars: '★★★★☆', ratingText: '4.3 – 129 Bewertungen',
    newPrice: 14.99, oldPrice: 24.99, uvp: 34.99, discountReal: '-40%', discountInflated: '-57%',
    desc: 'Verstellbare Cap mit gesticktem Campus-Logo. One Size fits all.',
    stockLeft: 15, viewers: 12, timerStart: '07:22:55', colors: ALL_COLOR_IDS
  },
  {
    id: 'flasche', name: 'Campus Trinkflasche', emoji: '🍶',
    badge: 'NEU', badgeClass: 'new',
    ratingStars: '★★★★★', ratingText: '4.9 – 87 Bewertungen',
    newPrice: 12.99, oldPrice: 19.99, uvp: 29.99, discountReal: '-35%', discountInflated: '-57%',
    desc: 'Auslaufsichere Edelstahl-Trinkflasche, 750ml, hält 12h kalt.',
    stockLeft: 20, viewers: 9, timerStart: '08:15:30', colors: ALL_COLOR_IDS
  }
];

const PRODUCTS_BY_ID = {};
PRODUCTS.forEach(p => { PRODUCTS_BY_ID[p.id] = p; });

/* Wandelt einen PRODUCTS-Eintrag in das Format um, das die
   Produktdetailseite (product.html) erwartet (Preise als fertig
   formatierte Euro-Strings, Rating als HTML-String, etc.) */
function productToDetailShape(p) {
  return {
    id: p.id,
    name: p.name,
    image: p.emoji,
    badge: p.badge,
    rating: p.ratingStars + ' <span>(' + p.ratingText + ')</span>',
    oldPrice: euro(p.oldPrice),
    newPrice: euro(p.newPrice),
    uvp: euro(p.uvp),
    discount: p.discountInflated,
    realDiscount: p.discountReal,
    desc: p.desc,
    stock: '⚠️ Nur noch ' + p.stockLeft + ' auf Lager!',
    social: '👥 ' + p.viewers + ' Personen schauen sich dieses Produkt an',
    colors: p.colors
  };
}
