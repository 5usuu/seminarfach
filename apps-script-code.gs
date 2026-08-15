/* ============================================================
   SHOPLY Studie – Google Apps Script Backend
   ============================================================
   Diese Datei gehört NICHT auf GitHub Pages, sondern in den
   Apps-Script-Editor eines Google Sheets:

   1. sheets.new -> neues, leeres Google Sheet öffnen
   2. Menü "Erweiterungen" -> "Apps Script"
   3. Den kompletten Inhalt dieser Datei in den Editor kopieren
      (den mitgelieferten Beispielcode vorher löschen)
   4. Speichern (Diskette-Symbol)
   5. "Bereitstellen" -> "Neue Bereitstellung" -> Typ "Web-App"
        Ausführen als: Ich
        Zugriff: Jeder
   6. "Bereitstellen" klicken, den Zugriff bestätigen
   7. Die angezeigte Web-App-URL (endet auf /exec) kopieren und
      in study.js bei STUDY_ENDPOINT einfügen.

   Falls du den Code SPÄTER nochmal änderst: danach unbedingt über
   "Bereitstellen" -> "Bereitstellungen verwalten" -> Stift-Symbol
   -> "Neue Version" erneut bereitstellen, sonst läuft weiter die
   alte Version!

   ⚠️ WICHTIG BEI DIESEM UPDATE: Die Spalten-Reihenfolge hat sich
   geändert (neue Spalte "Monatsgruppe" dazugekommen). Bitte VOR dem
   ersten Test die Tabellenblätter "Events" und "Auswertung" in
   deinem Sheet komplett löschen (Rechtsklick auf den Reiter unten
   -> Löschen) – sie werden beim nächsten Event automatisch neu und
   mit den richtigen Spalten angelegt. Alte Testdaten sonst vorher
   sichern, falls sie noch gebraucht werden.

   ERGEBNIS: Es entstehen automatisch ZWEI Tabellenblätter:
   - "Events"      -> jede einzelne Aktion als eigene Zeile
                      (Rohdaten, für Nachvollziehbarkeit). Die
                      "Kennung" ist pro Browser eindeutig
                      (z.B. "monat-5-K7F2"), damit sich einzelne
                      Käufe/Besuche auch bei vielen Personen aus
                      derselben Monatsgruppe unterscheiden lassen.
   - "Auswertung"  -> fertige Zusammenfassungen (Aufrufe, Warenkorb,
                      Käufe je Produkt + Variante, sowie Aktivität
                      je Monatsgruppe), aktualisiert sich automatisch
                      mit den Events – nichts manuell nötig.
   ============================================================ */

const EVENTS_SHEET_NAME = 'Events';
const SUMMARY_SHEET_NAME = 'Auswertung';

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateEventsSheet(ss);
  getOrCreateSummarySheet(ss); // legt die Auswertung beim allerersten Event mit an

  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    data = {};
  }
  var extra = data.extra || {};
  var studentId = data.studentId || '';

  // "monat-5-K7F2" -> "Monat 5" (für die Zusammenfassung je Monatsgruppe).
  // Bei manuellen Test-Kennungen (kein "monat-..."-Muster) wird einfach die
  // Kennung selbst als Gruppe verwendet.
  var monthMatch = studentId.match(/^monat-(\d+)/);
  var monthGroup = monthMatch ? ('Monat ' + monthMatch[1]) : studentId;

  sheet.appendRow([
    new Date(),
    studentId,
    monthGroup,
    data.eventType || '',
    data.productId || '',
    data.variant || '',
    extra.price != null ? extra.price : '',
    extra.color || '',
    data.page || '',
    JSON.stringify(extra)   // Rohdaten bleiben zusätzlich als Sicherheit erhalten
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Einfacher Test-Endpunkt: Web-App-URL im Browser öffnen, um zu prüfen,
   ob sie erreichbar ist. */
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateEventsSheet(ss);
  getOrCreateSummarySheet(ss);
  return ContentService
    .createTextOutput('SHOPLY-Studie: Web-App ist erreichbar ✔')
    .setMimeType(ContentService.MimeType.TEXT);
}

function getOrCreateEventsSheet(ss) {
  var sheet = ss.getSheetByName(EVENTS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(EVENTS_SHEET_NAME);
    sheet.appendRow(['Zeitstempel', 'Kennung', 'Monatsgruppe', 'Event', 'Produkt', 'Variante', 'Preis', 'Farbe', 'Seite', 'Zusatzinfo (roh)']);
    sheet.setFrozenRows(1);
    sheet.getRange('A1:J1').setFontWeight('bold');
    sheet.setColumnWidths(1, 10, 130);
  }
  return sheet;
}

/* Legt (einmalig) das Blatt "Auswertung" mit live berechneten
   QUERY-Zusammenfassungen an. Läuft automatisch mit, sobald neue
   Zeilen in "Events" dazukommen – nichts manuell nötig. */
function getOrCreateSummarySheet(ss) {
  var sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (sheet) return sheet;

  sheet = ss.insertSheet(SUMMARY_SHEET_NAME);

  sheet.getRange('A1').setValue('👁️ Seitenaufrufe je Produkt & Variante').setFontWeight('bold');
  sheet.getRange('A2').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:J, ' +
    '"select E, F, count(A) where D = \'view_product\' and E <> \'\' group by E, F ' +
    'label E \'Produkt\', F \'Variante\', count(A) \'Aufrufe\'", 0), "Noch keine Daten")'
  );

  sheet.getRange('E1').setValue('🛒 In den Warenkorb je Produkt & Variante').setFontWeight('bold');
  sheet.getRange('E2').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:J, ' +
    '"select E, F, count(A) where D = \'add_to_cart\' and E <> \'\' group by E, F ' +
    'label E \'Produkt\', F \'Variante\', count(A) \'Warenkorb\'", 0), "Noch keine Daten")'
  );

  sheet.getRange('I1').setValue('✅ Käufe je Produkt & Variante').setFontWeight('bold');
  sheet.getRange('I2').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:J, ' +
    '"select E, F, count(A) where D = \'purchase\' and E <> \'\' group by E, F ' +
    'label E \'Produkt\', F \'Variante\', count(A) \'Käufe\'", 0), "Noch keine Daten")'
  );

  sheet.getRange('A4').setValue('📊 Aktivität je Monatsgruppe (unabhängig vom Produkt)').setFontWeight('bold');
  sheet.getRange('A5').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:J, ' +
    '"select C, count(A) where C <> \'\' group by C order by C ' +
    'label C \'Monatsgruppe\', count(A) \'Anzahl Events\'", 0), "Noch keine Daten")'
  );

  sheet.getRange('E4').setValue('👤 Aktivität je einzelner Kennung (wer war wie oft aktiv)').setFontWeight('bold');
  sheet.getRange('E5').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:J, ' +
    '"select B, count(A) where B <> \'\' group by B order by B ' +
    'label B \'Kennung\', count(A) \'Anzahl Events\'", 0), "Noch keine Daten")'
  );

  sheet.setColumnWidths(1, 14, 130);
  return sheet;
}
