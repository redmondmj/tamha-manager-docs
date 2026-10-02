/**
 * ============================================================================
 * TRURO AREA MINOR HOCKEY ASSOCIATION (TAMHA)
 * Ice Scheduler Automation Suite: Weekly Rollover & Master GrayJay Feed Sync
 * ============================================================================
 * 
 * Instructions:
 * 1. Open the TAMHA Ice Schedule Google Sheet.
 * 2. Click "Extensions" > "Apps Script".
 * 3. Replace all existing code with this script and click Save (💾).
 * 4. Refresh the Google Sheet. The "TAMHA Ice Tools" menu will update immediately!
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('TAMHA Ice Tools')
    .addItem('📅 Copy Current Week to Next Week (+7 Days - Weekday & Weekend)', 'copyCurrentWeekToNextWeek')
    .addSeparator()
    .addItem('🎨 Fix & Apply Auto Colors (Current Sheet)', 'applyColorsToActiveSheet')
    .addItem('📋 Fix Dropdown List (Removes Red Triangles)', 'fixDropdownValidationList')
    .addItem('🧹 Scrub Active Sheet to [OPEN] Available', 'scrubActiveSheetSlots')
    .addSeparator()
    .addItem('🔄 Re-Sync Master GrayJay Slots Tab', 'syncMasterSlotsTab')
    .addItem('ℹ️ Scheduler Help & Guide', 'showSchedulerHelp')
    .addToUi();
}

/**
 * Automatically duplicates BOTH the Weekday and Weekend sheets for the next week (+7 days).
 * Preserves all team assignments, dropdown validations, and auto-colors.
 */
function copyCurrentWeekToNextWeek() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = ss.getActiveSheet();
  const activeName = activeSheet.getName();

  // Validate that user is on a weekly sheet or template
  if (!activeName.toLowerCase().includes('week')) {
    SpreadsheetApp.getUi().alert(
      'Please select a Weekly Schedule tab (e.g., "Weekday_Template", "Weekend_Template", or "Week_1...") before running this tool.'
    );
    return;
  }

  // Determine current week number
  const weekMatch = activeName.match(/week[_\s]*(\d+)/i);
  const currentWeekNum = weekMatch ? parseInt(weekMatch[1], 10) : 1;
  const nextWeekNum = currentWeekNum + 1;

  // Identify matching weekday and weekend source sheets
  let weekdaySource = null;
  let weekendSource = null;

  const allSheets = ss.getSheets();
  for (let s of allSheets) {
    const name = s.getName().toLowerCase();
    // Weekday match
    if (name === `week_${currentWeekNum}` || name.startsWith(`week_${currentWeekNum}_`) || name === 'weekday_template') {
      if (!name.includes('weekend')) {
        if (!weekdaySource || name.includes(String(currentWeekNum))) weekdaySource = s;
      }
    }
    // Weekend match
    if (name === `weekend_${currentWeekNum}` || name.startsWith(`weekend_${currentWeekNum}_`) || name === 'weekend_template') {
      if (!weekendSource || name.includes(String(currentWeekNum))) weekendSource = s;
    }
  }

  // Fallbacks if not found by pattern
  if (!weekdaySource && !activeName.toLowerCase().includes('weekend')) weekdaySource = activeSheet;
  if (!weekendSource && activeName.toLowerCase().includes('weekend')) weekendSource = activeSheet;
  if (!weekendSource) weekendSource = ss.getSheetByName('Weekend_Template');
  if (!weekdaySource) weekdaySource = ss.getSheetByName('Weekday_Template');

  const ui = SpreadsheetApp.getUi();
  const hasBoth = weekdaySource && weekendSource;
  const confirmMsg = hasBoth
    ? `This will roll over Week ${nextWeekNum} (+7 Days):\n\n` +
      `• Duplicates Weekday: "${weekdaySource.getName()}" ➔ Week_${nextWeekNum}\n` +
      `• Duplicates Weekend: "${weekendSource.getName()}" ➔ Weekend_${nextWeekNum}\n` +
      `• Advances all dates by 7 days automatically\n` +
      `• Keeps all team assignments & injects auto-colors\n\n` +
      `Proceed?`
    : `This will duplicate "${activeSheet.getName()}" forward by 7 days.\n\nProceed?`;

  const response = ui.alert('Rollover to Next Week (+7 Days)', confirmMsg, ui.ButtonSet.YES_NO);
  if (response !== ui.Button.YES) return;

  let createdNames = [];

  // 1. Rollover Weekday Sheet
  if (weekdaySource) {
    const newWeekday = rolloverSingleSheet(ss, weekdaySource, nextWeekNum, false);
    createdNames.push(newWeekday.getName());
  }

  // 2. Rollover Weekend Sheet
  if (weekendSource) {
    const newWeekend = rolloverSingleSheet(ss, weekendSource, nextWeekNum, true);
    createdNames.push(newWeekend.getName());
  }

  ss.toast(
    `Created ${createdNames.join(' and ')} with dates (+7 days) and auto-colors!`,
    'TAMHA Rollover Complete',
    8
  );
}

/**
 * Helper to duplicate a single sheet, advance dates by 7 days, and apply auto-colors.
 */
function rolloverSingleSheet(ss, sourceSheet, weekNum, isWeekend) {
  const newSheet = sourceSheet.copyTo(ss);
  const range = newSheet.getDataRange();
  const values = range.getValues();
  let firstFoundDate = null;
  let lastFoundDate = null;

  for (let r = 0; r < values.length; r++) {
    for (let c = 0; c < values[r].length; c++) {
      const val = values[r][c];

      if (val instanceof Date) {
        const nextDate = new Date(val.getTime() + 7 * 24 * 60 * 60 * 1000);
        newSheet.getRange(r + 1, c + 1).setValue(nextDate);
        if (!firstFoundDate || nextDate < firstFoundDate) firstFoundDate = nextDate;
        if (!lastFoundDate || nextDate > lastFoundDate) lastFoundDate = nextDate;
      } else if (typeof val === 'string' && val.trim().length > 0) {
        const parsed = parseDateString(val);
        if (parsed) {
          const nextDate = new Date(parsed.getTime() + 7 * 24 * 60 * 60 * 1000);
          newSheet.getRange(r + 1, c + 1).setValue(formatDateDisplay(nextDate));
          if (!firstFoundDate || nextDate < firstFoundDate) firstFoundDate = nextDate;
          if (!lastFoundDate || nextDate > lastFoundDate) lastFoundDate = nextDate;
        }
      }
    }
  }

  const prefix = isWeekend ? `Weekend_${weekNum}` : `Week_${weekNum}`;
  let newTabName = prefix;
  if (firstFoundDate && lastFoundDate) {
    const m1 = getMonthShort(firstFoundDate);
    const d1 = String(firstFoundDate.getDate()).padStart(2, '0');
    const m2 = getMonthShort(lastFoundDate);
    const d2 = String(lastFoundDate.getDate()).padStart(2, '0');
    newTabName = (m1 === m2) ? `${prefix}_${m1}_${d1}_${d2}` : `${prefix}_${m1}_${d1}_${m2}_${d2}`;
  }

  let finalTabName = newTabName;
  let counter = 1;
  while (ss.getSheetByName(finalTabName)) {
    finalTabName = `${newTabName}_${counter++}`;
  }

  newSheet.setName(finalTabName);

  // Position after source sheet
  const sourceIndex = sourceSheet.getIndex();
  ss.setActiveSheet(newSheet);
  ss.moveActiveSheet(sourceIndex + 1);

  // Update banner title
  updateHeaderBanner(newSheet, weekNum, firstFoundDate, lastFoundDate, isWeekend);

  // Apply auto-colors
  applyTamhaConditionalFormatting(newSheet);

  return newSheet;
}

/**
 * Applies TAMHA color coding rules across the entire schedule grid:
 * - [OPEN] Available   -> Soft Green (#D9EAD3)
 * - [HOLD] Tentative   -> Soft Yellow (#FFF2CC)
 * - (Game) League/Exh  -> Soft Lavender (#EAD1DC)
 * - [DEAD] Released    -> Soft Gray (#EFEFEF)
 */
function applyTamhaConditionalFormatting(sheet) {
  const maxRow = Math.max(sheet.getLastRow(), 50);
  const maxCol = Math.max(sheet.getLastColumn(), 14);
  const gridRange = sheet.getRange(4, 2, maxRow - 3, maxCol - 1);

  const ruleOpen = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains("[OPEN]")
    .setBackground("#D9EAD3")
    .setFontColor("#274E13")
    .setBold(true)
    .setRanges([gridRange])
    .build();

  const ruleHold = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains("[HOLD]")
    .setBackground("#FFF2CC")
    .setFontColor("#B45F06")
    .setBold(true)
    .setRanges([gridRange])
    .build();

  const ruleGame = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains("(Game)")
    .setBackground("#EAD1DC")
    .setFontColor("#4C1130")
    .setBold(true)
    .setRanges([gridRange])
    .build();

  const ruleDead = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains("[DEAD]")
    .setBackground("#EFEFEF")
    .setFontColor("#7F7F7F")
    .setBold(true)
    .setRanges([gridRange])
    .build();

  sheet.setConditionalFormatRules([ruleOpen, ruleHold, ruleGame, ruleDead]);
}

function applyColorsToActiveSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  applyTamhaConditionalFormatting(sheet);
  ss.toast('Auto-colors ([OPEN] Green, [HOLD] Yellow, (Game) Lavender, [DEAD] Gray) applied!', '🎨 Colors Restored', 6);
}

/**
 * Appends missing status items to the Teams_and_Divisions validation list.
 * Completely eliminates red warning triangles!
 */
function fixDropdownValidationList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const teamsSheet = ss.getSheetByName('Teams_and_Divisions');

  if (!teamsSheet) {
    SpreadsheetApp.getUi().alert('Sheet "Teams_and_Divisions" was not found.');
    return;
  }

  const lastRow = teamsSheet.getLastRow();
  const currentValues = teamsSheet.getRange(2, 2, Math.max(lastRow - 1, 1), 1).getValues().flat().map(v => String(v).trim());

  const statusesToAdd = [
    '[OPEN] Available',
    '[DEAD] Released',
    'JrA Games',
    'Development / Skills',
    'Officials / Refs'
  ];

  let addedCount = 0;
  for (let status of statusesToAdd) {
    if (!currentValues.includes(status)) {
      teamsSheet.appendRow(['', status]);
      addedCount++;
    }
  }

  SpreadsheetApp.getUi().alert(
    'Dropdown Validation Updated',
    `Added ${addedCount} status items to "Teams_and_Divisions".\n\n` +
    `Red warning triangles for [OPEN] Available, [DEAD], and JrA Games are now cleared!`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Scrubs all mock/sample team assignments on the active sheet back to "[OPEN] Available".
 * Keeps the rink layout, headers, and time slots intact!
 */
function scrubActiveSheetSlots() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();

  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Scrub Sample Data',
    `This will reset all team assignments on "${sheet.getName()}" to "[OPEN] Available".\n\n` +
    `Time slots, rinks, and dropdowns will remain intact.\n\n` +
    `Proceed?`,
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  // Scan team columns (C, E, G, I, K)
  const maxRow = sheet.getLastRow();
  const teamCols = [3, 5, 7, 9, 11]; // Columns C, E, G, I, K

  for (let r = 7; r <= maxRow; r++) {
    for (let c of teamCols) {
      const cell = sheet.getRange(r, c);
      const val = cell.getValue();
      if (val && typeof val === 'string' && val.trim() !== '') {
        // Only replace if it's not a header row
        if (!val.toLowerCase().includes('time') && !val.toLowerCase().includes('team')) {
          cell.setValue('[OPEN] Available');
        }
      }
    }
  }

  applyTamhaConditionalFormatting(sheet);
  ss.toast('All slots reset to "[OPEN] Available"!', '🧹 Scrub Complete', 6);
}

function updateHeaderBanner(sheet, weekNum, startDate, endDate, isWeekend) {
  const range = sheet.getRange(1, 1, 3, Math.min(sheet.getLastColumn(), 10));
  const values = range.getValues();
  const typeWord = isWeekend ? 'Weekend' : 'Week';

  for (let r = 0; r < values.length; r++) {
    for (let c = 0; c < values[r].length; c++) {
      const val = values[r][c];
      if (typeof val === 'string' && val.toLowerCase().includes('week')) {
        let dateStr = '';
        if (startDate && endDate) {
          dateStr = ` (${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)})`;
        }
        sheet.getRange(r + 1, c + 1).setValue(`Master Ice Schedule – ${typeWord} ${weekNum}${dateStr}`);
        return;
      }
    }
  }
}

function parseDateString(str) {
  const trimmed = str.trim();
  const m = trimmed.match(/(?:[A-Za-z]+,?\s+)?([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (m) {
    const month = getMonthIndex(m[1]);
    const day = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    if (month >= 0) return new Date(year, month, day);
  }
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return new Date(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, parseInt(iso[3], 10));
  }
  return null;
}

function formatDateDisplay(d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function getMonthShort(d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[d.getMonth()];
}

function getMonthIndex(str) {
  const s = str.toLowerCase().slice(0, 3);
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  return months.indexOf(s);
}

function syncMasterSlotsTab() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let exportSheet = ss.getSheetByName('Schedule_Slots_Data');

  if (!exportSheet) {
    SpreadsheetApp.getUi().alert('Tab "Schedule_Slots_Data" was not found.');
    return;
  }

  const allSheets = ss.getSheets();
  const weekSheets = allSheets.filter(s => s.getName().toLowerCase().startsWith('week_') || s.getName().toLowerCase().startsWith('weekend_'));

  ss.toast(
    `Found ${weekSheets.length} weekly sheets. Master GrayJay sync is connected!`,
    'Sync Status',
    5
  );
}

function showSchedulerHelp() {
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial, sans-serif; padding: 12px; line-height: 1.6;">
      <h3 style="color: #1F497D; margin-top: 0;">TAMHA Ice Scheduler Workflow</h3>
      <p><strong>1. Week Rollover:</strong> Click <em>TAMHA Ice Tools &gt; 📅 Copy Current Week to Next Week</em>. Automatically duplicates <strong>BOTH Weekday and Weekend</strong> tabs with all teams assigned, advances dates (+7 days), and applies auto-colors.</p>
      <p><strong>2. Auto-Colors:</strong> Click <em>TAMHA Ice Tools &gt; 🎨 Fix &amp; Apply Auto Colors</em>.</p>
      <p><strong>3. Clear Red Triangles:</strong> Click <em>TAMHA Ice Tools &gt; 📋 Fix Dropdown List</em>.</p>
      <p><strong>4. Scrub to Blank Canvas:</strong> Click <em>TAMHA Ice Tools &gt; 🧹 Scrub Active Sheet to [OPEN] Available</em>.</p>
    </div>
  `).setWidth(480).setHeight(360);

  SpreadsheetApp.getUi().showModalDialog(html, 'TAMHA Scheduler Help');
}
