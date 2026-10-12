/**
 * ============================================================================
 * TRURO AREA MINOR HOCKEY ASSOCIATION (TAMHA)
 * Admin Dashboard Live Sync: 48-Tab Schedule Aggregator & Hours Calculator
 * ============================================================================
 * 
 * Instructions:
 * 1. Open the "TAMHA 2026-2027 Season Ice Hours & Admin Dashboard" Google Sheet.
 * 2. Click "Extensions" > "Apps Script".
 * 3. Replace any code with this script and click Save (💾).
 * 4. Run "syncScheduleHours()" once and grant permissions.
 * 5. Refresh your sheet. A new menu "TAMHA Admin Tools" will appear!
 */

const SCHEDULE_SPREADSHEET_ID = '1V_w5J3dOSLfNbVLkvOm-RcTSE91W_E8TMOJ9WvOreI8';

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('TAMHA Admin Tools')
    .addItem('🔄 Sync Latest Hours from Schedule', 'syncScheduleHours')
    .addSeparator()
    .addItem('⏱️ Setup Daily Auto-Sync (11 PM)', 'setupDailyTrigger')
    .addToUi();
}

/**
 * Scans all 48 weekly tabs in Craig's Floating Schedule,
 * extracts all slots, and updates the "All_Scheduled_Slots" master ledger.
 */
function syncScheduleHours() {
  const ssAdmin = SpreadsheetApp.getActiveSpreadsheet();
  const slotsSheet = ssAdmin.getSheetByName('All_Scheduled_Slots');
  
  if (!slotsSheet) {
    SpreadsheetApp.getUi().alert('Tab "All_Scheduled_Slots" not found.');
    return;
  }

  const ssSched = SpreadsheetApp.openById(SCHEDULE_SPREADSHEET_ID);
  const sheets = ssSched.getSheets();
  
  const allSlots = [];
  let slotId = 1;

  for (let s of sheets) {
    const sName = s.getName();
    const rows = s.getDataRange().getValues();
    if (!rows || rows.length < 5) continue;

    const isWeekend = /oct\s*10-11|oct\s*17-18|oct\s*24-25|oct\s*31|nov\s*7-8|nov\s*14-15|nov\s*21-22|nov\s*28-29|dec\s*5-6|dec\s*12-13|dec\s*19-20|dec\s*26-27|jan\s*2-3|jan\s*9-10|jan\s*16-17|jan\s*23-24|jan\s*30-31|feb\s*6-7|feb\s*13-14|feb\s*20-21|feb\s*27-28|mar\s*6-7|mar\s*13-14|mar\s*20-21/i.test(sName);

    if (!isWeekend) {
      const facilitySections = [
        { fac: 'Deuvilles', startR: 5, endR: 10 },
        { fac: 'Stadium', startR: 14, endR: 20 },
        { fac: 'RECC', startR: 23, endR: 31 },
        { fac: 'Debert', startR: 34, endR: 40 }
      ];
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

      for (let sec of facilitySections) {
        for (let rIdx = sec.startR; rIdx < Math.min(sec.endR, rows.length); rIdx++) {
          const r = rows[rIdx];
          const colPairs = [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]];
          for (let dIdx = 0; dIdx < colPairs.length; dIdx++) {
            const [tCol, tmCol] = colPairs[dIdx];
            const tVal = (r[tCol] || '').toString().trim();
            const tmVal = (r[tmCol] || '').toString().trim();
            if (tmVal && !['TIME', 'TEAM'].includes(tmVal.toUpperCase())) {
              const hours = parseHours(tVal);
              allSlots.push([slotId++, sName, 'Weekday', days[dIdx], sec.fac, tVal, tmVal, hours]);
            }
          }
        }
      }
    } else {
      // Weekend Rows 5 to 16
      for (let rIdx = 5; rIdx < Math.min(17, rows.length); rIdx++) {
        const r = rows[rIdx];
        if (r[2] && r[2].toString().trim() && r[2].toString().trim().toUpperCase() !== 'TEAM') {
          allSlots.push([slotId++, sName, 'Weekend', 'Saturday', 'Deuvilles', (r[1]||'').toString().trim(), r[2].toString().trim(), parseHours(r[1])]);
        }
        if (r[4] && r[4].toString().trim() && r[4].toString().trim().toUpperCase() !== 'TEAM') {
          allSlots.push([slotId++, sName, 'Weekend', 'Sunday', 'Deuvilles', (r[3]||'').toString().trim(), r[4].toString().trim(), parseHours(r[3])]);
        }
        if (r[7] && r[7].toString().trim() && r[7].toString().trim().toUpperCase() !== 'TEAM') {
          allSlots.push([slotId++, sName, 'Weekend', 'Saturday', 'Stadium', (r[6]||'').toString().trim(), r[7].toString().trim(), parseHours(r[6])]);
        }
        if (r[9] && r[9].toString().trim() && r[9].toString().trim().toUpperCase() !== 'TEAM') {
          allSlots.push([slotId++, sName, 'Weekend', 'Sunday', 'Stadium', (r[8]||'').toString().trim(), r[9].toString().trim(), parseHours(r[8])]);
        }
      }
      // Weekend Rows 20 to 30
      for (let rIdx = 20; rIdx < Math.min(30, rows.length); rIdx++) {
        const r = rows[rIdx];
        if (r[2] && r[2].toString().trim() && r[2].toString().trim().toUpperCase() !== 'TEAM') {
          allSlots.push([slotId++, sName, 'Weekend', 'Saturday', 'RECC', (r[1]||'').toString().trim(), r[2].toString().trim(), parseHours(r[1])]);
        }
        if (r[4] && r[4].toString().trim() && r[4].toString().trim().toUpperCase() !== 'TEAM') {
          allSlots.push([slotId++, sName, 'Weekend', 'Sunday', 'RECC', (r[3]||'').toString().trim(), r[4].toString().trim(), parseHours(r[3])]);
        }
        if (r[7] && r[7].toString().trim() && r[7].toString().trim().toUpperCase() !== 'TEAM') {
          allSlots.push([slotId++, sName, 'Weekend', 'Saturday', 'Debert', (r[6]||'').toString().trim(), r[7].toString().trim(), parseHours(r[6])]);
        }
        if (r[9] && r[9].toString().trim() && r[9].toString().trim().toUpperCase() !== 'TEAM') {
          allSlots.push([slotId++, sName, 'Weekend', 'Sunday', 'Debert', (r[8]||'').toString().trim(), r[9].toString().trim(), parseHours(r[8])]);
        }
      }
    }
  }

  // Clear existing slots data and overwrite with fresh data
  const lastRow = slotsSheet.getLastRow();
  if (lastRow > 1) {
    slotsSheet.getRange(2, 1, lastRow - 1, 8).clearContent();
  }

  if (allSlots.length > 0) {
    slotsSheet.getRange(2, 1, allSlots.length, 8).setValues(allSlots);
  }

  ssAdmin.toast(`Successfully synced ${allSlots.length} slots from schedule!`, '✅ Hours Updated', 6);
}

function parseHours(timeStr) {
  if (!timeStr) return 1.0;
  const s = timeStr.toString().trim();
  const m = s.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (m) {
    const h1 = parseInt(m[1], 10);
    const m1 = parseInt(m[2], 10);
    let h2 = parseInt(m[3], 10);
    const m2 = parseInt(m[4], 10);
    let t1 = h1 * 60 + m1;
    let t2 = h2 * 60 + m2;
    if (t2 < t1) t2 += 12 * 60;
    const diff = t2 - t1;
    if (diff === 50) return 1.0;
    if (diff === 80) return 1.333;
    if (diff === 90) return 1.5;
    if (diff === 110) return 1.833;
    if (diff === 120) return 2.0;
    return Math.round((diff / 60) * 100) / 100;
  }
  return 1.0;
}

function setupDailyTrigger() {
  ScriptApp.newTrigger('syncScheduleHours')
    .timeBased()
    .atHour(23)
    .everyDays(1)
    .create();
  SpreadsheetApp.getUi().alert('Daily 11:00 PM auto-sync trigger installed successfully!');
}
