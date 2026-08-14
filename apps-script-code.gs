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
   ============================================================ */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Events');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Events');
    sheet.appendRow(['Zeitstempel (Server)', 'Schüler-ID', 'Event', 'Produkt', 'Variante', 'Seite', 'Zusatzinfo']);
    sheet.setFrozenRows(1);
  }

  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    data = {};
  }

  sheet.appendRow([
    new Date(),
    data.studentId || '',
    data.eventType || '',
    data.productId || '',
    data.variant || '',
    data.page || '',
    JSON.stringify(data.extra || {})
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Optional: einfacher Test-Endpunkt, um zu prüfen, ob die Web-App
   erreichbar ist (einfach die Web-App-URL im Browser öffnen) */
function doGet(e) {
  return ContentService
    .createTextOutput('SHOPLY-Studie: Web-App ist erreichbar ✔')
    .setMimeType(ContentService.MimeType.TEXT);
}
