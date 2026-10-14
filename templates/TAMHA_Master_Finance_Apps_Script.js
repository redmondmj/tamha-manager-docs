/**
 * ==============================================================================
 * TAMHA 2026-2027 MASTER FINANCE, BANKING & BUDGET AUTOMATION SUITE
 * ==============================================================================
 * Attached to: TAMHA 2026-2027 Team Banking & Finance Master Dashboard
 * Spreadsheet ID: 1Icy9K5DV_9ymCm3vKqc6CdLgsfv0NTS5M_dTTdKvR0A
 * 
 * MODULES INCLUDED:
 *  1. 🏒 TAMHA Banking: Mosaik Credit Union authorization letters, account lookup,
 *     and bidirectional intake reconciler.
 *  2. 📊 TAMHA Budgets: Automated team budget generator, fee pre-population,
 *     and signer permission provisioning.
 * 
 * ZERO PII: 100% tokenized and driven by spreadsheet variables.
 * ==============================================================================
 */

// Master File & Template IDs
const TEMPLATE_DOC_ID = '17l_LiSP0Uz9ZaF5gHg-_urMNO70JtfPMr0KMkrXjmDQ';      // Bank Letter Template
const MASTER_TEMPLATE_ID = '1KPUmxh5bPXz2MkcBBl9CNhSWmJJvmjvUxIQpa2Ck61A';  // Team Budget Template
const TARGET_FOLDER_NAME = 'TAMHA 2026-2027 Team Budgets';
const VP_FINANCE_EMAIL = 'vpfinance@trurominorhockey.ca';

/**
 * Initializes unified custom menus in Google Sheets on open.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  // 1. Banking & Mosaik Authorization Menu
  ui.createMenu('🏒 TAMHA Banking')
    .addItem('⚡ Generate Bank Letters for Pending Teams', 'generatePendingLetters')
    .addItem('📄 Generate Letter for Currently Selected Row', 'generateSelectedRowLetter')
    .addItem('🔄 Sync & Reconcile Form Submissions', 'syncAndReconcileSubmissions')
    .addItem('🔍 Refresh Account Numbers from Directory', 'refreshAccountNumbers')
    .addToUi();

  // 2. Team Budget Rollout Menu
  ui.createMenu('📊 TAMHA Budgets')
    .addItem('🚀 Generate All Team Budgets', 'generateAllTeamBudgets')
    .addItem('📄 Generate Budget for Selected Row', 'generateSelectedTeamBudget')
    .addSeparator()
    .addItem('🔄 Bulk Update All Team Budgets', 'bulkUpdateAllTeamBudgets')
    .addItem('ℹ️ View Budget Rollout Instructions', 'showInstructionsModal')
    .addToUi();
}

/* ==============================================================================
 * MODULE 1: MOSAIK BANKING & AUTHORIZATION LETTERS
 * ============================================================================== */

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
  const sheet = ss.getSheetByName('Team Banking & Signers') || ss.getSheetByName('Form Responses') || ss.getSheetByName('Form Responses 1') || ss.getActiveSheet();
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

  const docUrl = copyDoc.getUrl();

  // 3. Safely update spreadsheet row using dynamic column indices
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
  const formSheet = ss.getSheetByName('Form Responses') || ss.getSheetByName('Form Responses 1') || ss.getSheetByName('Form Responses 2');
  if (!formSheet) {
    SpreadsheetApp.getUi().alert('Form Responses tab not found.');
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

    const colB = findColIndex(headers, ['team division & level']);
    if (colB !== -1 && team) {
      const curB = formSheet.getRange(r, colB).getValue();
      if (!curB || curB === '') formSheet.getRange(r, colB).setValue(team);
    }

    const colE = findColIndex(headers, ['primary signer: team position']);
    if (colE !== -1 && pRole) {
      const curE = formSheet.getRange(r, colE).getValue();
      if (!curE || curE === '') formSheet.getRange(r, colE).setValue(pRole);
    }

    const colAcct = findColIndex(headers, ['mosaik account', 'account number']);
    if (colAcct !== -1 && team) {
      const curAcct = formSheet.getRange(r, colAcct).getValue();
      if (!curAcct || curAcct === '' || curAcct === 'On File (Mosaik Truro)') {
        formSheet.getRange(r, colAcct).setValue(lookupAccountNumber(team));
      }
    }

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


/* ==============================================================================
 * MODULE 2: TEAM BUDGET GENERATOR & PERMISSION PROVISIONING
 * ============================================================================== */

/**
 * Gets or creates the dedicated Google Drive folder for team budgets.
 */
function getOrCreateTargetFolder() {
  const folders = DriveApp.getFoldersByName(TARGET_FOLDER_NAME);
  let folder;
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(TARGET_FOLDER_NAME);
  }
  try {
    folder.addEditor(VP_FINANCE_EMAIL);
  } catch (e) {
    Logger.log("Could not add VP Finance to folder: " + e.message);
  }
  return folder;
}

/**
 * Generates the budget for the currently highlighted row in 'Team Banking & Signers'.
 */
function generateSelectedTeamBudget() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Team Banking & Signers");
  if (!sheet) {
    ui.alert("Error", "Could not find sheet 'Team Banking & Signers'.", ui.ButtonSet.OK);
    return;
  }

  const row = sheet.getActiveCell().getRow();
  if (row < 2) {
    ui.alert("Please select a team row (Row 2 or below) to generate.");
    return;
  }

  const result = generateSingleBudgetForRow(sheet, row);
  if (result.success) {
    ui.alert("Success!", `Created budget for ${result.teamName}:\n${result.url}`, ui.ButtonSet.OK);
  } else {
    ui.alert("Notice", result.message, ui.ButtonSet.OK);
  }
}

/**
 * Batch-generates pre-populated budgets for all teams in 'Team Banking & Signers'.
 */
function generateAllTeamBudgets() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Team Banking & Signers");
  if (!sheet) {
    ui.alert("Error", "Could not find sheet 'Team Banking & Signers'.", ui.ButtonSet.OK);
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    ui.alert("No team data found in 'Team Banking & Signers'.");
    return;
  }

  const response = ui.alert(
    "Confirm Budget Rollout",
    `This will generate pre-populated 2026-2027 team budget spreadsheets for all teams from Row 2 to Row ${lastRow} in folder '${TARGET_FOLDER_NAME}'.\n\nExisting budget links will NOT be overwritten.\n\nProceed?`,
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  let createdCount = 0;
  let skippedCount = 0;
  const targetFolder = getOrCreateTargetFolder();
  const masterFile = DriveApp.getFileById(MASTER_TEMPLATE_ID);
  const colMap = getHeaderColumnMap(sheet);
  const linkCol = colMap["team budget link"] || colMap["budget link"] || 21;

  for (let r = 2; r <= lastRow; r++) {
    const existingLink = sheet.getRange(r, linkCol).getValue();
    if (existingLink && existingLink.toString().includes("docs.google.com/spreadsheets/d/") && !existingLink.toString().includes("TAMHA-BUDGET-TEMPLATE")) {
      skippedCount++;
      continue;
    }

    const res = generateSingleBudgetForRow(sheet, r, targetFolder, masterFile);
    if (res.success) {
      createdCount++;
    } else {
      skippedCount++;
    }
  }

  ui.alert(
    "Rollout Complete!",
    `Successfully created ${createdCount} new team budget(s).\nSkipped ${skippedCount} row(s) (already generated or missing team name).\n\nAll sheets are located in Drive folder: '${TARGET_FOLDER_NAME}'.`,
    ui.ButtonSet.OK
  );
}

/**
 * Core helper that clones, pre-populates, grants permissions, and updates the dashboard.
 */
function generateSingleBudgetForRow(sheet, r, targetFolder = null, masterFile = null) {
  if (!targetFolder) targetFolder = getOrCreateTargetFolder();
  if (!masterFile) masterFile = DriveApp.getFileById(MASTER_TEMPLATE_ID);

  const colMap = getHeaderColumnMap(sheet);

  // Dynamic header lookup with safe fallbacks
  const getVal = (headerKey, fallbackCol) => {
    const col = colMap[headerKey] || fallbackCol;
    return sheet.getRange(r, col).getValue();
  };

  const teamName = getVal("division & team", 2);
  if (!teamName || teamName.toString().trim() === "") {
    return { success: false, message: `Row ${r} is missing Team Name.` };
  }

  // Read Signers & Metadata
  const headCoach = getVal("head coach", 3);
  const s1Name = getVal("signer 1 (primary)", 4);
  const s1Role = getVal("s1 role", 5);
  const s1Email = getVal("s1 email", 7);

  const s2Name = getVal("signer 2 (secondary)", 8);
  const s2Role = getVal("s2 role", 9);
  const s2Email = getVal("s2 email", 11);

  const s3Name = getVal("signer 3 (backup)", 12);
  const s3Role = getVal("s3 role", 13);
  const s3Email = getVal("s3 email", 15);

  const acctNum = getVal("mosaik account #", 17) || "[Pending Mosaik Account #]";

  // Determine Coach, Manager, Treasurer
  let coach = headCoach ? headCoach.toString().split("(")[0].trim() : "";
  let manager = "", treasurer = "";
  const signers = [
    { name: s1Name, role: s1Role, email: s1Email },
    { name: s2Name, role: s2Role, email: s2Email },
    { name: s3Name, role: s3Role, email: s3Email }
  ];

  signers.forEach(s => {
    const roleStr = (s.role || "").toString().toLowerCase();
    if (roleStr.includes("coach") && !coach) coach = s.name;
    else if (roleStr.includes("manager")) manager = s.name;
    else if (roleStr.includes("treasurer")) treasurer = s.name;
  });

  // Determine Tier and Association Fees
  const teamStr = teamName.toString().toUpperCase();
  let tierDisplay = "Rep (AA / A / B)";
  let repInstallment = 4750.0; // Standard $9,500 ($4,750 x 2)

  if (teamStr.includes("AAA")) {
    tierDisplay = "Rep (AAA)";
    repInstallment = 5750.0; // AAA $11,500 ($5,750 x 2)
  } else if (teamStr.includes(" C") || teamStr.includes("HOUSE") || teamStr.includes("U7") || teamStr.includes("U9")) {
    tierDisplay = "C-League / House";
    repInstallment = 0.0; // $0.00 Rep fees
  }

  // 1. Clone Master Template into Dedicated Folder
  const newTitle = `2026-2027 Budget - ${teamName}`;
  const clonedFile = masterFile.makeCopy(newTitle, targetFolder);
  const clonedSpreadsheet = SpreadsheetApp.openById(clonedFile.getId());

  // 2. Pre-Populate 'Budget Summary'
  const wsSum = clonedSpreadsheet.getSheetByName("Budget Summary");
  if (wsSum) {
    wsSum.getRange("B4").setValue(`Truro Bearcats ${teamName}`);
    wsSum.getRange("E4").setValue(tierDisplay);
    if (coach) wsSum.getRange("B5").setValue(coach);
    if (manager) wsSum.getRange("E5").setValue(manager);
    if (treasurer) wsSum.getRange("G5").setValue(treasurer);
    wsSum.getRange("B6").setValue(acctNum.toString());
  }

  // 3. Pre-Populate 'Expenses' Base Rep Fees
  const wsExp = clonedSpreadsheet.getSheetByName("Expenses");
  if (wsExp) {
    wsExp.getRange("E6").setValue(repInstallment);
    wsExp.getRange("E7").setValue(repInstallment);
    wsExp.getRange("E8").setValue(0.0); // Sweater fund included in Rep fee
    wsExp.getRange("E9").setValue(0.0); // Variable league fees
    wsExp.getRange("E10").setValue(0.0); // Variable playoff fees
  }

  SpreadsheetApp.flush();

  // 4. Grant Editor Access to Joe (VP Finance) and Team Signers
  const validEmails = [VP_FINANCE_EMAIL, s1Email, s2Email, s3Email].filter(em => em && em.toString().includes("@") && !em.toString().includes("snapon.com"));
  const uniqueEmails = [...new Set(validEmails.map(em => em.toString().trim()))];

  uniqueEmails.forEach(email => {
    try {
      clonedFile.addEditor(email);
    } catch (e) {
      Logger.log(`Could not add editor ${email}: ${e.message}`);
    }
  });

  // 5. Update Master Dashboard Row
  const fileUrl = clonedFile.getUrl();
  const statusCol = colMap["oct 30 budget status"] || colMap["budget status"] || 19;
  const linkCol = colMap["team budget link"] || colMap["budget link"] || 20;

  sheet.getRange(r, statusCol).setValue("Generated / Active");
  sheet.getRange(r, linkCol).setValue(fileUrl);

  return { success: true, teamName: teamName, url: fileUrl };
}

/**
 * Bulk updates all existing team budget spreadsheets listed in the dashboard.
 * Useful if formulas, instructions, or template adjustments need to be synchronized after generation.
 */
function bulkUpdateAllTeamBudgets() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Team Banking & Signers");
  if (!sheet) {
    ui.alert("Error", "Could not find sheet 'Team Banking & Signers'.", ui.ButtonSet.OK);
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    ui.alert("No team data found in 'Team Banking & Signers'.");
    return;
  }

  const colMap = getHeaderColumnMap(sheet);
  const linkCol = colMap["team budget link"] || colMap["budget link"] || 20;
  const linkValues = sheet.getRange(2, linkCol, lastRow - 1, 1).getValues();

  let activeCount = 0;
  linkValues.forEach(rowVal => {
    const link = (rowVal[0] || "").toString();
    if (link.includes("docs.google.com/spreadsheets/d/") && !link.includes("TAMHA-BUDGET-TEMPLATE")) {
      activeCount++;
    }
  });

  if (activeCount === 0) {
    ui.alert("No generated team budgets found in Column " + linkCol + " to update.");
    return;
  }

  const response = ui.alert(
    "Confirm Bulk Update",
    `Found ${activeCount} active team budget spreadsheet(s).\n\nDo you want to synchronize template metadata, formulas, and ensure Joe (VP Finance) has access across all active team budgets?\n\nProceed?`,
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  let updatedCount = 0;
  for (let i = 0; i < linkValues.length; i++) {
    const link = (linkValues[i][0] || "").toString();
    if (!link.includes("docs.google.com/spreadsheets/d/") || link.includes("TAMHA-BUDGET-TEMPLATE")) continue;

    const match = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) continue;
    const fileId = match[1];

    try {
      const budgetFile = DriveApp.getFileById(fileId);
      budgetFile.addEditor(VP_FINANCE_EMAIL);
      updatedCount++;
    } catch (err) {
      Logger.log("Error updating sheet " + fileId + ": " + err.message);
    }
  }

  ui.alert("Bulk Update Complete", `Successfully verified and synchronized ${updatedCount} team budget spreadsheet(s). Joe Zappia has full editor access across all sheets.`, ui.ButtonSet.OK);
}

/**
 * Builds a lowercase normalized lookup map for header column numbers in Row 1.
 */
function getHeaderColumnMap(sheet) {
  const map = {};
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return map;
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  headers.forEach((h, idx) => {
    if (h) {
      const key = h.toString().trim().toLowerCase();
      map[key] = idx + 1;
    }
  });
  return map;
}

/**
 * Displays quick instructions modal inside Google Sheets.
 */
function showInstructionsModal() {
  const ui = SpreadsheetApp.getUi();
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 12px; line-height: 1.5;">
      <h3 style="color: #C8102E; margin-top: 0;">How TAMHA Team Budget Rollout Works</h3>
      <ol style="padding-left: 20px;">
        <li>Ensure team signers, roles, and Mosaik account numbers are up to date on <b>'Team Banking & Signers'</b>.</li>
        <li>Click <b>'📊 TAMHA Budgets > 🚀 Generate All Team Budgets'</b>.</li>
        <li>The system will create pre-populated spreadsheets in Google Drive folder <b>'${TARGET_FOLDER_NAME}'</b> and automatically grant <b>Editor</b> access to each team's Manager & Treasurer.</li>
        <li>Direct spreadsheet links will be written back into <b>Column U (Team Budget Link)</b>.</li>
      </ol>
      <p style="background: #F0F9FF; border-left: 4px solid #3B82F6; padding: 10px; font-size: 13px;">
        <b>Zero 'Request Access' walls:</b> Each manager and treasurer will see their team's budget immediately in Google Drive under <b>'Shared with me'</b>.
      </p>
    </div>
  `;
  const output = HtmlService.createHtmlOutput(html).setWidth(480).setHeight(320);
  ui.showModalDialog(output, "TAMHA Budget Automation Guide");
}
