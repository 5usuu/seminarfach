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

   ERGEBNIS: Es entstehen automatisch ZWEI Tabellenblätter:
   - "Events"      -> jede einzelne Aktion als eigene Zeile
                      (Rohdaten, für Nachvollziehbarkeit)
   - "Auswertung"  -> drei fertige Zusammenfassungen (Aufrufe,
                      Warenkorb, Käufe je Produkt + Variante),
                      aktualisiert sich automatisch mit den Events
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

  sheet.appendRow([
    new Date(),
    data.studentId || '',
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
    sheet.appendRow(['Zeitstempel', 'Kennung', 'Event', 'Produkt', 'Variante', 'Preis', 'Farbe', 'Seite', 'Zusatzinfo (roh)']);
    sheet.setFrozenRows(1);
    sheet.getRange('A1:I1').setFontWeight('bold');
    sheet.setColumnWidths(1, 9, 130);
  }
  return sheet;
}

/* Legt (einmalig) das Blatt "Auswertung" mit live berechneten
   QUERY-Zusammenfassungen an: Aufrufe / In den Warenkorb / Käufe,
   jeweils gruppiert nach Produkt + Variante. Läuft automatisch mit,
   sobald neue Zeilen in "Events" dazukommen – nichts manuell nötig. */
function getOrCreateSummarySheet(ss) {
  var sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (sheet) return sheet;

  sheet = ss.insertSheet(SUMMARY_SHEET_NAME);
  sheet.getRange('A1').setValue('👁️ Seitenaufrufe je Produkt & Variante').setFontWeight('bold');
  sheet.getRange('A2').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:I, ' +
    '"select D, E, count(A) where C = \'view_product\' and D <> \'\' group by D, E ' +
    'label D \'Produkt\', E \'Variante\', count(A) \'Aufrufe\'", 0), "Noch keine Daten")'
  );

  sheet.getRange('E1').setValue('🛒 In den Warenkorb je Produkt & Variante').setFontWeight('bold');
  sheet.getRange('E2').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:I, ' +
    '"select D, E, count(A) where C = \'add_to_cart\' and D <> \'\' group by D, E ' +
    'label D \'Produkt\', E \'Variante\', count(A) \'Warenkorb\'", 0), "Noch keine Daten")'
  );

  sheet.getRange('I1').setValue('✅ Käufe je Produkt & Variante').setFontWeight('bold');
  sheet.getRange('I2').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:I, ' +
    '"select D, E, count(A) where C = \'purchase\' and D <> \'\' group by D, E ' +
    'label D \'Produkt\', E \'Variante\', count(A) \'Käufe\'", 0), "Noch keine Daten")'
  );

  sheet.getRange('A4').setValue('📊 Aktivität je Studien-Gruppe (Geburtsmonat)').setFontWeight('bold');
  sheet.getRange('A5').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:I, ' +
    '"select B, count(A) where B <> \'\' group by B ' +
    'label B \'Kennung\', count(A) \'Anzahl Events\'", 0), "Noch keine Daten")'
  );

  sheet.setColumnWidths(1, 12, 130);
  return sheet;
}
