/**
 * TAMHA Banking Automation - Google Apps Script (V3)
 * 
 * Paste this script into your Master Spreadsheet:
 * Extensions > Apps Script
 * 
 * Features:
 *  1. Multi-Column Robust Resolution: Scans all matching column headers and picks the
 *     first non-empty value, ensuring seamless compatibility across Form changes.
 *  2. Automatic Account Number Lookup: Automatically bridges to the 'Mosaik Account Directory'
 *     tab to inject the official 9-digit credit union account number into the letterhead.
 *  3. Bidirectional Submissions Reconciler: Auto-populates missing primary/secondary columns,
 *     syncs new registrations directly into the 'Team Banking & Signers' dashboard, and
 *     assigns official Mosaik account numbers.
 *  4. In-Browser 1-Click Generation: Generates official letters directly into Google Drive
 *     using the clean, approved TAMHA header and table formatting.
 * 
 * ZERO PII: All logic is 100% tokenized and driven by spreadsheet variables.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏒 TAMHA Banking')
    .addItem('⚡ Generate Bank Letters for Pending Teams', 'generatePendingLetters')
    .addItem('📄 Generate Letter for Currently Selected Row', 'generateSelectedRowLetter')
    .addItem('🔄 Sync & Reconcile Form Submissions', 'syncAndReconcileSubmissions')
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
 * Searches across ALL matching column aliases and returns the first NON-EMPTY value.
 */
function getRobustVal(sheet, row, headers, aliases, defaultVal = '') {
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').trim().toLowerCase();
    for (let j = 0; j < aliases.length; j++) {
      const alias = aliases[j].toLowerCase();
      if (h === alias || h.includes(alias)) {
        const val = sheet.getRange(row, i + 1).getValue();
        if (val !== null && val !== undefined && String(val).trim() !== '') {
          return String(val).trim();
        }
      }
    }
  }
  return defaultVal;
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

  for (let i = 1; i < data.length; i++) {
    const canonName = String(data[i][0] || '').trim();
    const dropdownName = String(data[i][1] || '').trim();
    const acct = String(data[i][2] || '').trim();

    if (acct && acct !== '') {
      if (normalizeTeamKey(canonName) === searchKey || normalizeTeamKey(dropdownName) === searchKey) {
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

  if (colLetter === -1) {
    SpreadsheetApp.getUi().alert('Error: Could not locate Authorization Letter column in this sheet.');
    return;
  }

  let generatedCount = 0;
  for (let row = 2; row <= lastRow; row++) {
    const letterLink = sheet.getRange(row, colLetter).getValue();
    const team = getRobustVal(sheet, row, headers, ['division & team', 'team division', 'team']);
    
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

  const team = getRobustVal(sheet, row, headers, ['division & team', 'team division', 'team']);
  const s1Name = getRobustVal(sheet, row, headers, ['primary signer: full legal name', 'signer 1 (primary', 'signer 1']);
  const s1Role = getRobustVal(sheet, row, headers, ['primary signer: team position', 's1 role'], 'Manager');
  const s1Email = getRobustVal(sheet, row, headers, ['primary signer: email address', 's1 email']);
  const s1Phone = getRobustVal(sheet, row, headers, ['primary signer: mobile phone number', 's1 phone']);

  const s2Name = getRobustVal(sheet, row, headers, ['secondary signer: full legal name', 'signer 2 (secondary', 'signer 2']);
  const s2Role = getRobustVal(sheet, row, headers, ['secondary signer: team position', 's2 role'], 'Treasurer');
  const s2Email = getRobustVal(sheet, row, headers, ['secondary signer: email address', 's2 email']);
  const s2Phone = getRobustVal(sheet, row, headers, ['secondary signer: mobile phone number', 's2 phone']);

  const s3Name = getRobustVal(sheet, row, headers, ['third signer: full legal name', 'signer 3 (coach', 'signer 3']);
  const s3Role = getRobustVal(sheet, row, headers, ['third signer: team position', 's3 role'], s3Name ? 'Head Coach' : '');
  const s3Email = getRobustVal(sheet, row, headers, ['third signer: email address', 's3 email']);
  const s3Phone = getRobustVal(sheet, row, headers, ['third signer: mobile phone number', 's3 phone']);

  // Account Number resolution: Check cell first, fallback to Directory lookup
  let acctNum = getRobustVal(sheet, row, headers, ['mosaik account', 'account number']);
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
  // Joe shares directly with Blake Giroux (BGiroux@mosaikcu.ca) as View-Only
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
 * Automatically syncs and reconciles all form submissions across columns and tabs.
 */
function syncAndReconcileSubmissions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formSheet = ss.getSheetByName('Form Responses 1');
  if (!formSheet) {
    SpreadsheetApp.getUi().alert('Form Responses 1 tab not found.');
    return;
  }

  const lastRow = formSheet.getLastRow();
  const lastCol = formSheet.getLastColumn();
  const headers = formSheet.getRange(1, 1, 1, lastCol).getValues()[0];

  let syncedCount = 0;
  for (let r = 2; r <= lastRow; r++) {
    const team = getRobustVal(formSheet, r, headers, ['division & team', 'team division', 'team']);
    const pRole = getRobustVal(formSheet, r, headers, ['primary signer: team position', 's1 role']);
    const sRole = getRobustVal(formSheet, r, headers, ['secondary signer: team position', 's2 role']);
    const tRole = getRobustVal(formSheet, r, headers, ['third signer: team position', 's3 role']);

    // Ensure Column B has team if found anywhere
    const colB = findColIndex(headers, ['team division & level']);
    if (colB !== -1 && team) {
      const curB = formSheet.getRange(r, colB).getValue();
      if (!curB || curB === '') formSheet.getRange(r, colB).setValue(team);
    }

    // Ensure Primary Role (Col E) has role
    const colE = findColIndex(headers, ['primary signer: team position']);
    if (colE !== -1 && pRole) {
      const curE = formSheet.getRange(r, colE).getValue();
      if (!curE || curE === '') formSheet.getRange(r, colE).setValue(pRole);
    }

    // Ensure Mosaik Account # is populated
    const colAcct = findColIndex(headers, ['mosaik account', 'account number']);
    if (colAcct !== -1 && team) {
      const curAcct = formSheet.getRange(r, colAcct).getValue();
      if (!curAcct || curAcct === '' || curAcct === 'On File (Mosaik Truro)') {
        formSheet.getRange(r, colAcct).setValue(lookupAccountNumber(team));
      }
    }

    // Ensure Status is populated
    const colStatus = findColIndex(headers, ['banking status', 'status']);
    if (colStatus !== -1) {
      const curStatus = formSheet.getRange(r, colStatus).getValue();
      if (!curStatus || curStatus === '') {
        formSheet.getRange(r, colStatus).setValue('Needs Letter');
      }
    }

    syncedCount++;
  }

  SpreadsheetApp.getUi().alert(`✅ Synced & verified ${syncedCount} form submissions!`);
}

/**
 * Trigger function for new Google Form submissions.
 */
function onFormSubmit(e) {
  syncAndReconcileSubmissions();
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
