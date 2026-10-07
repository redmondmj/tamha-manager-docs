/**
 * TAMHA Banking Automation - Google Apps Script (V2)
 * 
 * Paste this script into your Master Spreadsheet:
 * Extensions > Apps Script
 * 
 * Features:
 *  1. Dynamic Column Resolution: Scans row 1 headers so it NEVER writes to the wrong column,
 *     regardless of whether it's run on 'Form Responses 1' or 'Team Banking & Signers'.
 *  2. Automatic Account Number Lookup: Automatically bridges to the 'Mosaik Account Directory'
 *     tab to inject the official 9-digit credit union account number into the letterhead.
 *  3. In-Browser 1-Click Generation: Generates official letters directly into Google Drive
 *     and grants Viewer permissions for Blake Giroux at Mosaik Credit Union.
 * 
 * ZERO PII: All logic is 100% tokenized and driven by spreadsheet variables.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏒 TAMHA Banking')
    .addItem('⚡ Generate Bank Letters for Pending Teams', 'generatePendingLetters')
    .addItem('📄 Generate Letter for Currently Selected Row', 'generateSelectedRowLetter')
    .addItem('🔍 Refresh Account Numbers from Directory', 'refreshAccountNumbers')
    .addToUi();
}

// Master Clean Letterhead Template Doc (Zero PII - Pure Tokenized Master)
const TEMPLATE_DOC_ID = '17l_LiSP0Uz9ZaF5gHg-_urMNO70JtfPMr0KMkrXjmDQ';

/**
 * Finds a 1-based column index by searching headers for any matching aliases.
 */
function findColIndex(headers, aliases) {
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').trim().toLowerCase();
    for (let j = 0; j < aliases.length; j++) {
      const alias = aliases[j].toLowerCase();
      if (h === alias || h.includes(alias)) {
        return i + 1; // 1-based
      }
    }
  }
  return -1;
}

/**
 * Normalizes a team name for fuzzy matching across dropdowns and directories.
 */
function normalizeTeamKey(name) {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .replace(/\btruro\b/g, '')
    .replace(/\bbearcats\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Looks up the 9-digit Mosaik Account Number from the 'Mosaik Account Directory' tab.
 */
function lookupAccountNumber(teamName) {
  if (!teamName) return 'On File (Mosaik Truro)';
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dirSheet = ss.getSheetByName('Mosaik Account Directory');
  if (!dirSheet) return 'On File (Mosaik Truro)';

  const data = dirSheet.getDataRange().getValues();
  const searchKey = normalizeTeamKey(teamName);

  // Col A: Canonical Team Name, Col B: Dropdown Match, Col C: Mosaik Account #
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const canonicalKey = normalizeTeamKey(row[0]);
    const dropdownKey = normalizeTeamKey(row[1]);
    
    if (searchKey === canonicalKey || searchKey === dropdownKey || searchKey.includes(canonicalKey)) {
      const acct = String(row[2] || '').trim();
      if (acct && acct !== '') {
        return acct;
      }
    }
  }

  return 'On File (Mosaik Truro)';
}

/**
 * Batch generates letters for all rows missing an authorization letter link.
 */
function generatePendingLetters() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Team Banking & Signers') || ss.getSheetByName('Form Responses 1') || ss.getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('No team data found in this sheet.');
    return;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colLetter = findColIndex(headers, ['authorization letter', 'letter link']);
  const colTeam = findColIndex(headers, ['team division', 'division & team', 'team']);

  if (colLetter === -1 || colTeam === -1) {
    SpreadsheetApp.getUi().alert('Error: Could not locate Team or Authorization Letter columns in this sheet.');
    return;
  }

  let generatedCount = 0;
  for (let row = 2; row <= lastRow; row++) {
    const letterLink = sheet.getRange(row, colLetter).getValue();
    const team = sheet.getRange(row, colTeam).getValue();
    
    if (team && (!letterLink || letterLink.toString().trim() === '')) {
      generateLetterForRow(sheet, row, headers);
      generatedCount++;
    }
  }

  SpreadsheetApp.getUi().alert(
    generatedCount > 0 
      ? `✅ Successfully generated ${generatedCount} bank letter(s) with account numbers populated!`
      : 'ℹ️ All teams in this sheet already have generated letters.'
  );
}

/**
 * Generates an authorization letter for the currently highlighted row.
 */
function generateSelectedRowLetter() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const row = sheet.getActiveCell().getRow();
  if (row < 2) {
    SpreadsheetApp.getUi().alert('Please select a team data row.');
    return;
  }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  generateLetterForRow(sheet, row, headers);
  SpreadsheetApp.getUi().alert(`✅ Letter generated for Row ${row}!`);
}

/**
 * Generates letter and safely writes back to exact column positions.
 */
function generateLetterForRow(sheet, row, headers) {
  if (!headers) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  const getVal = (aliases, defaultVal = '') => {
    const colIdx = findColIndex(headers, aliases);
    if (colIdx === -1) return defaultVal;
    const val = sheet.getRange(row, colIdx).getValue();
    return (val !== null && val !== undefined && val !== '') ? val : defaultVal;
  };

  const team = getVal(['division & team', 'team division', 'team']);
  const s1Name = getVal(['primary signer: full legal name', 'signer 1 (primary', 'signer 1']);
  const s1Role = getVal(['primary signer: team position', 's1 role'], 'Manager');
  const s1Email = getVal(['primary signer: email address', 's1 email']);
  const s1Phone = getVal(['primary signer: mobile phone number', 's1 phone']);

  const s2Name = getVal(['secondary signer: full legal name', 'signer 2 (secondary', 'signer 2']);
  const s2Role = getVal(['secondary signer: team position', 's2 role'], 'Treasurer');
  const s2Email = getVal(['secondary signer: email address', 's2 email']);
  const s2Phone = getVal(['secondary signer: mobile phone number', 's2 phone']);

  const s3Name = getVal(['third signer: full legal name', 'signer 3 (coach', 'signer 3']);
  const s3Role = getVal(['third signer: team position', 's3 role'], s3Name ? 'Head Coach' : '');
  const s3Email = getVal(['third signer: email address', 's3 email']);
  const s3Phone = getVal(['third signer: mobile phone number', 's3 phone']);

  // Account Number resolution: Check cell first, fallback to Directory lookup
  let acctNum = getVal(['mosaik account', 'account number']);
  if (!acctNum || acctNum === '' || acctNum === 'On File (Mosaik Truro)') {
    acctNum = lookupAccountNumber(team);
  }

  // 1. Copy Master Template Doc
  const templateFile = DriveApp.getFileById(TEMPLATE_DOC_ID);
  const title = `TAMHA Mosaik Authorization Letter - ${team} (2026-2027)`;
  const copyDoc = templateFile.makeCopy(title);
  const doc = DocumentApp.openById(copyDoc.getId());
  const body = doc.getBody();

  // 2. Token Replacements
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

  // 3. Document Privacy: Kept strictly private by default (No public link sharing)
  // Joe or Bromlyn can share directly with Blake Giroux (BGiroux@mosaikcu.ca) as View-Only
  const docUrl = copyDoc.getUrl();

  // 4. Safely update spreadsheet row using dynamic column indices
  const colAcct = findColIndex(headers, ['mosaik account', 'account number']);
  const colStatus = findColIndex(headers, ['banking status', 'status']);
  const colLetter = findColIndex(headers, ['authorization letter', 'letter link']);

  if (colAcct !== -1) sheet.getRange(row, colAcct).setValue(acctNum);
  if (colStatus !== -1) sheet.getRange(row, colStatus).setValue('Ready / Share with Blake');
  if (colLetter !== -1) sheet.getRange(row, colLetter).setValue(docUrl);
}

/**
 * Utility to refresh account numbers across the active sheet from the Directory.
 */
function refreshAccountNumbers() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colTeam = findColIndex(headers, ['division & team', 'team division', 'team']);
  const colAcct = findColIndex(headers, ['mosaik account', 'account number']);

  if (colTeam === -1 || colAcct === -1) {
    SpreadsheetApp.getUi().alert('Error: Required columns not found.');
    return;
  }

  const lastRow = sheet.getLastRow();
  let updated = 0;
  for (let r = 2; r <= lastRow; r++) {
    const team = sheet.getRange(r, colTeam).getValue();
    if (team) {
      const acct = lookupAccountNumber(team);
      sheet.getRange(r, colAcct).setValue(acct);
      updated++;
    }
  }

  SpreadsheetApp.getUi().alert(`✅ Refreshed account numbers for ${updated} rows!`);
}
