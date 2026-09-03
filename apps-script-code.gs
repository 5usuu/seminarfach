/* ============================================================
   Georgianum Shop Studie – Google Apps Script Backend
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

   ⚠️ WICHTIG BEI DIESEM UPDATE: Es gibt zwei neue Auswertungs-Zeilen für
   den Session-Timer (erzwungene Käufe durch Zeitablauf + Anzahl Personen,
   die das Zeitlimit erreicht haben). Diese werden NUR beim allerersten
   Event neu angelegt, nicht bei jedem Redeploy. Bitte VOR dem nächsten
   Test das Tabellenblatt "Auswertung" komplett löschen (Rechtsklick auf
   den Reiter unten -> Löschen) – es wird beim nächsten Event automatisch
   neu und mit den zusätzlichen Zeilen angelegt. Das Blatt "Events" kann
   unangetastet bleiben, die Spalten haben sich nicht geändert. Alte
   Auswertungs-Formeln gehen beim Löschen nicht verloren, sie berechnen
   sich ja live aus "Events" neu.

   ERGEBNIS: Es entstehen automatisch ZWEI Tabellenblätter:
   - "Events"      -> jede einzelne Aktion als eigene Zeile
                      (Rohdaten, für Nachvollziehbarkeit). Die
                      "Kennung" ist pro Browser eindeutig
                      (z.B. "monat-5-K7F2"), damit sich einzelne
                      Käufe/Besuche auch bei vielen Personen aus
                      derselben Monatsgruppe unterscheiden lassen.
                      Enthält auch die Cookie-Banner-Entscheidungen
                      (cookie_accept_all / cookie_open_settings /
                      cookie_save_settings), inkl. wie viele der 5
                      optionalen Kategorien am Ende akzeptiert wurden.
   - "Auswertung"  -> fertige Zusammenfassungen (Aufrufe, Warenkorb,
                      Käufe je Produkt + Variante, Aktivität je
                      Monatsgruppe, sowie Cookie-Entscheidungen),
                      aktualisiert sich automatisch mit den Events –
                      nichts manuell nötig.
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
    extra.acceptedCount != null ? extra.acceptedCount : '',
    (extra.accepted && extra.accepted.length) ? extra.accepted.join(', ') : '',
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
    .createTextOutput('Georgianum Shop Studie: Web-App ist erreichbar ✔')
    .setMimeType(ContentService.MimeType.TEXT);
}

function getOrCreateEventsSheet(ss) {
  var sheet = ss.getSheetByName(EVENTS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(EVENTS_SHEET_NAME);
    sheet.appendRow(['Zeitstempel', 'Kennung', 'Monatsgruppe', 'Event', 'Produkt', 'Variante', 'Preis', 'Farbe', 'Cookie-Anzahl', 'Cookie-Kategorien', 'Seite', 'Zusatzinfo (roh)']);
    sheet.setFrozenRows(1);
    sheet.getRange('A1:L1').setFontWeight('bold');
    sheet.setColumnWidths(1, 12, 130);
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
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:L, ' +
    '"select E, F, count(A) where D = \'view_product\' and E <> \'\' group by E, F ' +
    'label E \'Produkt\', F \'Variante\', count(A) \'Aufrufe\'", 0), "Noch keine Daten")'
  );

  sheet.getRange('E1').setValue('🛒 In den Warenkorb je Produkt & Variante').setFontWeight('bold');
  sheet.getRange('E2').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:L, ' +
    '"select E, F, count(A) where D = \'add_to_cart\' and E <> \'\' group by E, F ' +
    'label E \'Produkt\', F \'Variante\', count(A) \'Warenkorb\'", 0), "Noch keine Daten")'
  );

  sheet.getRange('I1').setValue('✅ Käufe je Produkt & Variante').setFontWeight('bold');
  sheet.getRange('I2').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:L, ' +
    '"select E, F, count(A) where D = \'purchase\' and E <> \'\' group by E, F ' +
    'label E \'Produkt\', F \'Variante\', count(A) \'Käufe\'", 0), "Noch keine Daten")'
  );

  sheet.getRange('A4').setValue('📊 Aktivität je Monatsgruppe (unabhängig vom Produkt)').setFontWeight('bold');
  sheet.getRange('A5').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:L, ' +
    '"select C, count(A) where C <> \'\' group by C order by C ' +
    'label C \'Monatsgruppe\', count(A) \'Anzahl Events\'", 0), "Noch keine Daten")'
  );

  sheet.getRange('E4').setValue('👤 Aktivität je einzelner Kennung (wer war wie oft aktiv)').setFontWeight('bold');
  sheet.getRange('E5').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:L, ' +
    '"select B, count(A) where B <> \'\' group by B order by B ' +
    'label B \'Kennung\', count(A) \'Anzahl Events\'", 0), "Noch keine Daten")'
  );

  sheet.getRange('A7').setValue('🍪 Cookie-Banner: gewählter Weg (schnell vs. mühsam)').setFontWeight('bold');
  sheet.getRange('A8').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:L, ' +
    '"select D, count(A) where D matches \'cookie_.*\' group by D order by D ' +
    'label D \'Event\', count(A) \'Anzahl\'", 0), "Noch keine Daten")'
  );

  sheet.getRange('E7').setValue('🍪 Ø akzeptierte Cookie-Kategorien (von 5) bei Endentscheidung').setFontWeight('bold');
  sheet.getRange('E8').setFormula(
    '=IFERROR(ROUND(AVERAGE(QUERY(' + EVENTS_SHEET_NAME + '!A2:L, ' +
    '"select I where D = \'cookie_accept_all\' or D = \'cookie_save_settings\'", 0)), 2), "Noch keine Daten")'
  );
  sheet.getRange('E9').setValue('(5 = alle akzeptiert, 0 = alle abgelehnt)').setFontStyle('italic').setFontColor('#6B7080');

  sheet.getRange('A10').setValue('⏰ Erzwungene Käufe durch Zeitablauf je Produkt & Variante').setFontWeight('bold');
  sheet.getRange('A11').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:L, ' +
    '"select E, F, count(A) where D = \'timeout_purchase\' and E <> \'\' group by E, F ' +
    'label E \'Produkt\', F \'Variante\', count(A) \'Erzwungene Käufe\'", 0), "Noch keine Daten")'
  );

  sheet.getRange('E10').setValue('⏰ Anzahl Personen, die das 10-Minuten-Zeitlimit erreicht haben').setFontWeight('bold');
  sheet.getRange('E11').setFormula(
    '=IFERROR(QUERY(' + EVENTS_SHEET_NAME + '!A2:L, ' +
    '"select count(A) where D = \'timeout_reached\' label count(A) \'Anzahl\'", 0), "Noch keine Daten")'
  );
  sheet.getRange('E12').setValue('(1 Eintrag pro Person, unabhängig davon ob ihr Warenkorb leer war oder nicht)').setFontStyle('italic').setFontColor('#6B7080');

  sheet.setColumnWidths(1, 14, 130);
  return sheet;
}
