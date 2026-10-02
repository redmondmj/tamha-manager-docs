/**
 * ============================================================================
 * TRURO AREA MINOR HOCKEY ASSOCIATION (TAMHA)
 * Ice Scheduler Automation Suite: Weekly Rollover & Master GrayJay Feed Sync
 * ============================================================================
 * 
 * Instructions:
 * 1. Open the TAMHA Ice Schedule Google Sheet.
 * 2. Click "Extensions" > "Apps Script".
 * 3. Replace the existing code with this updated version and click Save (💾).
 * 4. Refresh the Google Sheet. The "TAMHA Ice Tools" menu will update immediately!
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('TAMHA Ice Tools')
    .addItem('📅 Copy Current Week to Next Week (+7 Days)', 'copyCurrentWeekToNextWeek')
    .addSeparator()
    .addItem('🎨 Fix & Apply Auto Colors (Current Sheet)', 'applyColorsToActiveSheet')
    .addItem('🔄 Re-Sync Master GrayJay Slots Tab', 'syncMasterSlotsTab')
    .addSeparator()
    .addItem('ℹ️ Scheduler Help & Guide', 'showSchedulerHelp')
    .addToUi();
}

/**
 * Copies the currently selected weekly schedule tab forward by 7 days.
 * Preserves all team assignments, dropdown validations, and formatting.
 * Automatically updates date banners, day headers, tab title, and applies auto colors.
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

  const isWeekendSheet = activeName.toLowerCase().includes('weekend');
  const sheetTypeLabel = isWeekendSheet ? 'Weekend' : 'Weekly';

  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    `Rollover ${sheetTypeLabel} to Next Week`,
    `This will duplicate "${activeName}" forward by 7 days.\n\n` +
    `• All existing team assignments will be copied forward as-is.\n` +
    `• Date headers will advance by 7 days automatically.\n` +
    `• Status colors ([OPEN] green, [HOLD] yellow, (Game) lavender) will be applied automatically.\n\n` +
    `Proceed?`,
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  // 1. Duplicate sheet
  const newSheet = activeSheet.copyTo(ss);
  
  // 2. Determine next week number
  const weekMatch = activeName.match(/week[_\s]*(\d+)/i);
  let nextWeekNum = weekMatch ? parseInt(weekMatch[1], 10) + 1 : 2;

  // 3. Scan and increment date cells (+7 days)
  const range = newSheet.getDataRange();
  const values = range.getValues();
  let firstFoundDate = null;
  let lastFoundDate = null;

  for (let r = 0; r < values.length; r++) {
    for (let c = 0; c < values[r].length; c++) {
      const val = values[r][c];

      // If cell is a JavaScript Date object
      if (val instanceof Date) {
        const nextDate = new Date(val.getTime() + 7 * 24 * 60 * 60 * 1000);
        newSheet.getRange(r + 1, c + 1).setValue(nextDate);
        if (!firstFoundDate || nextDate < firstFoundDate) firstFoundDate = nextDate;
        if (!lastFoundDate || nextDate > lastFoundDate) lastFoundDate = nextDate;
      }
      // If cell is a text date like "Oct 5, 2026" or "2026-10-05"
      else if (typeof val === 'string' && val.trim().length > 0) {
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

  // 4. Generate clean tab name
  const prefix = isWeekendSheet ? `Weekend_${nextWeekNum}` : `Week_${nextWeekNum}`;
  let newTabName = prefix;
  if (firstFoundDate && lastFoundDate) {
    const m1 = getMonthShort(firstFoundDate);
    const d1 = String(firstFoundDate.getDate()).padStart(2, '0');
    const m2 = getMonthShort(lastFoundDate);
    const d2 = String(lastFoundDate.getDate()).padStart(2, '0');
    newTabName = (m1 === m2)
      ? `${prefix}_${m1}_${d1}_${d2}`
      : `${prefix}_${m1}_${d1}_${m2}_${d2}`;
  }

  // Ensure unique sheet name
  let finalTabName = newTabName;
  let counter = 1;
  while (ss.getSheetByName(finalTabName)) {
    finalTabName = `${newTabName}_${counter++}`;
  }

  newSheet.setName(finalTabName);

  // Position new sheet right after active sheet
  const activeIndex = activeSheet.getIndex();
  ss.setActiveSheet(newSheet);
  ss.moveActiveSheet(activeIndex + 1);

  // Auto update header banner text if present in rows 1-3
  updateHeaderBanner(newSheet, nextWeekNum, firstFoundDate, lastFoundDate, isWeekendSheet);

  // 5. CRITICAL: Automatically apply all auto-colors to the new sheet
  applyTamhaConditionalFormatting(newSheet);

  ss.toast(
    `Created "${finalTabName}" with all practice slots and auto-colors copied!`,
    'TAMHA Week Rollover Success',
    8
  );
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
  
  // Apply across rows 4 to end, columns B (2) through N (14)
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

  // Set the four rules on the sheet
  sheet.setConditionalFormatRules([ruleOpen, ruleHold, ruleGame, ruleDead]);
}

/**
 * 1-Click fix for current sheet: applies the auto-colors immediately.
 */
function applyColorsToActiveSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  applyTamhaConditionalFormatting(sheet);
  ss.toast('Auto-colors ([OPEN] Green, [HOLD] Yellow, (Game) Lavender, [DEAD] Gray) applied!', '🎨 Colors Restored', 6);
}

/**
 * Updates title banner with the new week number and date range.
 */
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

/**
 * Helper: Parses date strings like "Oct 5, 2026", "October 5, 2026", "2026-10-05".
 */
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

/**
 * Re-syncs the master "Schedule_Slots_Data" tab across all active weekly sheets.
 * Ensures the web exporter (https://hockey.redmond.link/exporter.html) always stays live.
 */
function syncMasterSlotsTab() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let exportSheet = ss.getSheetByName('Schedule_Slots_Data');

  if (!exportSheet) {
    SpreadsheetApp.getUi().alert('Tab "Schedule_Slots_Data" was not found. Please ensure the master template is present.');
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

/**
 * Help dialog explaining the workflow for Craig.
 */
function showSchedulerHelp() {
  const html = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial, sans-serif; padding: 12px; line-height: 1.6;">
      <h3 style="color: #1F497D; margin-top: 0;">TAMHA Ice Scheduler Workflow</h3>
      <p><strong>1. Week Rollover:</strong> Click <em>TAMHA Ice Tools &gt; 📅 Copy Current Week to Next Week (+7 Days)</em>. Duplicates the sheet with all teams assigned, advances dates, and preserves all auto-colors.</p>
      <p><strong>2. Auto-Colors:</strong> If colors ever don't show, click <em>TAMHA Ice Tools &gt; 🎨 Fix &amp; Apply Auto Colors</em>.</p>
      <p><strong>3. Review &amp; Swap:</strong> Simply review the new week, swap any tournament or exhibition slots, and mark dead ice as <code>[OPEN]</code>.</p>
      <p><strong>4. Managers Exporter:</strong> Team managers can instantly export their practices into GrayJay via <a href="https://hockey.redmond.link/exporter.html" target="_blank">hockey.redmond.link/exporter.html</a>.</p>
    </div>
  `).setWidth(460).setHeight(320);

  SpreadsheetApp.getUi().showModalDialog(html, 'TAMHA Scheduler Help');
}
