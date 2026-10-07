/**
 * TAMHA Banking Automation - Google Apps Script
 * 
 * Paste this script into your Master Spreadsheet:
 * Extensions > Apps Script
 * 
 * Adds a custom "TAMHA Banking" menu with a 1-click button to generate
 * branded authorization letters for Blake Giroux at Mosaik Credit Union.
 * 
 * ZERO PII: All replacements use generic tokens ({{TEAM_NAME}}, {{SIGNER_1_NAME}}, etc.)
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏒 TAMHA Banking')
    .addItem('⚡ Generate Bank Letters for Pending Teams', 'generatePendingLetters')
    .addItem('📄 Generate Letter for Currently Selected Row', 'generateSelectedRowLetter')
    .addToUi();
}

// Master Clean Letterhead Template Doc (Zero PII - Pure Tokenized Master)
const TEMPLATE_DOC_ID = '17l_LiSP0Uz9ZaF5gHg-_urMNO70JtfPMr0KMkrXjmDQ';

function generatePendingLetters() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Form Responses 1') || SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('No submissions found in this sheet.');
    return;
  }

  let generatedCount = 0;
  for (let row = 2; row <= lastRow; row++) {
    const letterLink = sheet.getRange(row, 24).getValue(); // Col X
    const team = sheet.getRange(row, 2).getValue();       // Col B
    
    // Only generate if team exists and letter link is blank
    if (team && (!letterLink || letterLink.toString().trim() === '')) {
      generateLetterForRow(sheet, row);
      generatedCount++;
    }
  }

  SpreadsheetApp.getUi().alert(
    generatedCount > 0 
      ? `✅ Successfully generated ${generatedCount} bank letter(s) and populated links!`
      : 'ℹ️ All teams already have generated letters.'
  );
}

function generateSelectedRowLetter() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const row = sheet.getActiveCell().getRow();
  if (row < 2) {
    SpreadsheetApp.getUi().alert('Please select a team data row.');
    return;
  }
  generateLetterForRow(sheet, row);
  SpreadsheetApp.getUi().alert(`✅ Letter generated for Row ${row}!`);
}

function generateLetterForRow(sheet, row) {
  const team = sheet.getRange(row, 2).getValue();
  const s1Name = sheet.getRange(row, 4).getValue();
  const s1Role = sheet.getRange(row, 19).getValue() || sheet.getRange(row, 5).getValue() || 'Manager';
  const s1Email = sheet.getRange(row, 6).getValue();
  const s1Phone = sheet.getRange(row, 7).getValue();

  const s2Name = sheet.getRange(row, 8).getValue();
  const s2Role = sheet.getRange(row, 20).getValue() || sheet.getRange(row, 9).getValue() || 'Treasurer';
  const s2Email = sheet.getRange(row, 10).getValue();
  const s2Phone = sheet.getRange(row, 11).getValue();

  const s3Name = sheet.getRange(row, 12).getValue();
  const s3Role = sheet.getRange(row, 21).getValue() || sheet.getRange(row, 13).getValue() || (s3Name ? 'Coach' : '');
  const s3Email = sheet.getRange(row, 14).getValue();
  const s3Phone = sheet.getRange(row, 15).getValue();

  const acctNum = sheet.getRange(row, 22).getValue() || 'On File (Mosaik Truro)';

  // 1. Copy Master Template Doc
  const templateFile = DriveApp.getFileById(TEMPLATE_DOC_ID);
  const title = `TAMHA Mosaik Authorization Letter - ${team} (2026-2027)`;
  const copyDoc = templateFile.makeCopy(title);
  const doc = DocumentApp.openById(copyDoc.getId());
  const body = doc.getBody();

  // 2. Token Replacements (Pure Variable Driven — Zero Hardcoded PII)
  body.replaceText('{{DATE}}', Utilities.formatDate(new Date(), 'America/Halifax', 'MMMM d, yyyy'));
  body.replaceText('{{TEAM_NAME}}', team || '');
  body.replaceText('{{ACCOUNT_NUMBER}}', acctNum);

  body.replaceText('{{SIGNER_1_NAME}}', s1Name || '');
  body.replaceText('{{SIGNER_1_ROLE}}', s1Role || '');
  body.replaceText('{{SIGNER_1_EMAIL}}', s1Email || '');
  body.replaceText('{{SIGNER_1_PHONE}}', s1Phone || '');

  body.replaceText('{{SIGNER_2_NAME}}', s2Name || '');
  body.replaceText('{{SIGNER_2_ROLE}}', s2Role || '');
  body.replaceText('{{SIGNER_2_EMAIL}}', s2Email || '');
  body.replaceText('{{SIGNER_2_PHONE}}', s2Phone || '');

  body.replaceText('{{SIGNER_3_NAME}}', s3Name || '');
  body.replaceText('{{SIGNER_3_ROLE}}', s3Role || '');
  body.replaceText('{{SIGNER_3_EMAIL}}', s3Email || '');
  body.replaceText('{{SIGNER_3_PHONE}}', s3Phone || '');

  doc.saveAndClose();

  // 3. Set Permissions (Share as viewer with anyone with link or Blake)
  copyDoc.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const docUrl = copyDoc.getUrl();

  // 4. Update Spreadsheet Row
  sheet.getRange(row, 22).setValue(acctNum);
  sheet.getRange(row, 23).setValue('Ready / Share with Blake');
  sheet.getRange(row, 24).setValue(docUrl);
}
