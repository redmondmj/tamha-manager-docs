/**
 * ============================================================================
 * TRURO AREA MINOR HOCKEY ASSOCIATION (TAMHA)
 * Player Medical Intake & Safety Binder Automation Engine (2026–2027)
 * ============================================================================
 * 
 * Purpose:
 * 1. Automatically syncs Google Form parent registrations into the Master Tracker.
 * 2. Formats and populates the bench-side "Medical & Safety Quick Reference" binder.
 * 3. Highlights critical safety alerts (EpiPen, Severe Allergies, Asthma Inhalers, Concussions) in soft red/yellow.
 * 4. Tracks Digital Form completion status, dates, and parent contacts in real time.
 * 
 * Note on PDF Season Packets:
 * Official 6-page stamped packets (Hockey Canada Medical Form, TAMHA Code of Conduct,
 * and Jersey Signout Agreement) are generated via our high-precision TAMHA vector
 * stamping engine.
 * 
 * QUICK SETUP (60 Seconds):
 * 1. Open your team's Master Google Sheet.
 * 2. Click "Extensions" > "Apps Script".
 * 3. Delete any boilerplate code and paste this ENTIRE script.
 * 4. Click Save (💾), then refresh your Google Sheet in your browser.
 * 5. A new menu "🏒 TAMHA Manager Tools" will appear at the top!
 */

// Optional: Paste your Google Form ID here for 1-click linking, or use the menu
const FORM_ID = '';

/**
 * Creates custom manager tools menu when spreadsheet opens.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏒 TAMHA Manager Tools')
    .addItem('🔄 Sync Form Responses to Master Tracker', 'syncResponsesToMasterTracker')
    .addItem('🚨 Audit Medical Alerts & Safety Binder', 'auditMedicalAlerts')
    .addSeparator()
    .addItem('🔗 Auto-Link Google Form to this Sheet', 'linkFormToThisSheet')
    .addItem('⚡ Install Auto-Sync Trigger (onFormSubmit)', 'installFormSubmitTrigger')
    .addToUi();
}

/**
 * Finds the active responses sheet regardless of naming variations.
 */
function findResponsesSheet(ss) {
  return ss.getSheetByName('Form_Responses') || 
         ss.getSheetByName('Form Responses 2') || 
         ss.getSheetByName('Form Responses 1') || 
         ss.getSheetByName('Form Responses') || 
         ss.getSheets().find(s => s.getName().toLowerCase().replace(/[^a-z]/g, '').includes('formresponse'));
}

/**
 * Connects the Google Form directly to this spreadsheet.
 */
function linkFormToThisSheet() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let targetFormId = FORM_ID;
  if (!targetFormId || targetFormId.trim() === '') {
    const response = ui.prompt(
      'Connect Google Form',
      'Please paste your Google Form ID (or full Form edit URL):',
      ui.ButtonSet.OK_CANCEL
    );
    if (response.getSelectedButton() !== ui.Button.OK) return;
    let input = response.getResponseText().trim();
    const match = input.match(/\/forms\/d\/([a-zA-Z0-9_-]+)/);
    targetFormId = match ? match[1] : input;
  }

  try {
    const form = FormApp.openById(targetFormId);
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    ui.alert(`✅ Success!\n\nGoogle Form "${form.getTitle()}" is now linked to this spreadsheet.`);
  } catch (err) {
    ui.alert(`⚠️ Error linking form: ${err.message}`);
  }
}

/**
 * Reads form responses, matches against the Master Tracker & Safety Reference,
 * and updates Digital Form Status and Medical Alerts.
 */
function syncResponsesToMasterTracker() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formSheet = findResponsesSheet(ss);
  const trackerSheet = ss.getSheetByName('Master Team Tracker');
  const medicalSheet = ss.getSheetByName('Medical & Safety Quick Reference');

  if (!formSheet) {
    SpreadsheetApp.getUi().alert('Could not find Form Responses sheet.');
    return;
  }
  if (!trackerSheet) {
    SpreadsheetApp.getUi().alert('Could not find "Master Team Tracker" tab.');
    return;
  }

  const fData = formSheet.getDataRange().getValues();
  if (fData.length <= 1) return;

  const fHeaders = fData[0].map(h => String(h).trim().toLowerCase());
  const colTimestamp = fHeaders.findIndex(h => h.includes('timestamp'));
  const colPlayer = fHeaders.findIndex(h => h.includes('player') && h.includes('name'));
  const colMsi = fHeaders.findIndex(h => h.includes('msi') || h.includes('health card'));
  const colDoctor = fHeaders.findIndex(h => h.includes('doctor'));
  const colDentist = fHeaders.findIndex(h => h.includes('dentist'));
  const colEmergency = fHeaders.findIndex(h => h.includes('emergency') || h.includes('secondary'));
  const colAllergies = fHeaders.findIndex(h => h.includes('allerg'));
  const colConditions = fHeaders.findIndex(h => h.includes('condition') || h.includes('asthma') || h.includes('medication'));
  const colConcussion = fHeaders.findIndex(h => h.includes('concussion') || h.includes('injur'));
  const colSignature = fHeaders.findIndex(h => h.includes('signature'));

  const tData = trackerSheet.getDataRange().getValues();
  const tHeaders = tData[0].map(h => String(h).trim().toLowerCase());
  const tColPlayer = tHeaders.findIndex(h => h.includes('player name') || h.includes('player'));
  const tColStatus = tHeaders.findIndex(h => h.includes('form status') || h.includes('digital form'));
  const tColDate = tHeaders.findIndex(h => h.includes('form date'));
  const tColNotes = tHeaders.findIndex(h => h.includes('medical') || h.includes('safety') || h.includes('notes'));

  let updatedCount = 0;

  for (let r = 1; r < fData.length; r++) {
    const rawName = String(fData[r][colPlayer] || '').trim();
    if (!rawName) continue;

    const normName = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const timestampStr = fData[r][colTimestamp] ? Utilities.formatDate(new Date(fData[r][colTimestamp]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    const allergies = String(fData[r][colAllergies] || '');
    const conditions = String(fData[r][colConditions] || '');
    const concussions = String(fData[r][colConcussion] || '');

    const alertFlags = [];
    if (/epipen|anaphylax|peanut|nut|bee|wasp|severe/i.test(allergies)) alertFlags.push('⚠️ ALLERGY / EPIPEN');
    if (/asthma|inhaler|ventolin|puffer|breathing/i.test(conditions)) alertFlags.push('⚠️ ASTHMA / INHALER');
    if (/concussion|head injury/i.test(concussions) && !/none|no\b/i.test(concussions)) alertFlags.push('⚠️ CONCUSSION HISTORY');

    const alertSummary = alertFlags.length > 0 ? alertFlags.join(' | ') : 'None Flagged';

    // Update in Master Team Tracker
    let matchedTrackerRow = -1;
    for (let tr = 1; tr < tData.length; tr++) {
      const curTName = String(tData[tr][tColPlayer] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (curTName && (curTName === normName || curTName.includes(normName) || normName.includes(curTName))) {
        matchedTrackerRow = tr + 1;
        break;
      }
    }

    if (matchedTrackerRow !== -1) {
      if (tColStatus !== -1) trackerSheet.getRange(matchedTrackerRow, tColStatus + 1).setValue('Complete');
      if (tColDate !== -1) trackerSheet.getRange(matchedTrackerRow, tColDate + 1).setValue(timestampStr);
      if (tColNotes !== -1 && alertFlags.length > 0) {
        const existingNote = String(trackerSheet.getRange(matchedTrackerRow, tColNotes + 1).getValue() || '');
        if (!existingNote.includes(alertFlags[0])) {
          trackerSheet.getRange(matchedTrackerRow, tColNotes + 1).setValue(existingNote ? `${existingNote}; ${alertSummary}` : alertSummary);
        }
      }
      updatedCount++;
    }

    // Update Medical & Safety Quick Reference tab
    if (medicalSheet) {
      const mData = medicalSheet.getDataRange().getValues();
      let matchedMRow = -1;
      for (let mr = 1; mr < mData.length; mr++) {
        const curMName = String(mData[mr][0] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (curMName === normName || curMName.includes(normName) || normName.includes(curMName)) {
          matchedMRow = mr + 1;
          break;
        }
      }

      const rowValues = [
        rawName,
        fData[r][colMsi] || '',
        fData[r][colDoctor] || '',
        fData[r][colDentist] || '',
        fData[r][colEmergency] || '',
        allergies || 'None',
        conditions || 'None',
        `${fData[r][colSignature] || rawName} (${timestampStr})`
      ];

      if (matchedMRow !== -1) {
        medicalSheet.getRange(matchedMRow, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        medicalSheet.appendRow(rowValues);
      }
    }
  }

  auditMedicalAlerts();
  SpreadsheetApp.getUi().alert(`✅ Sync Complete!\n\nReconciled ${updatedCount} player form submission(s) into Master Team Tracker & Safety Reference.`);
}

/**
 * Highlights rows in Medical Quick Reference in soft red/yellow.
 */
function auditMedicalAlerts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const medicalSheet = ss.getSheetByName('Medical & Safety Quick Reference');
  if (!medicalSheet) return;

  const data = medicalSheet.getDataRange().getValues();
  if (data.length <= 1) return;

  for (let r = 1; r < data.length; r++) {
    const allergies = String(data[r][5] || '');
    const conditions = String(data[r][6] || '');

    const hasEpi = /epipen|anaphylax|peanut|nut|severe/i.test(allergies);
    const hasAsthma = /asthma|inhaler|ventolin|puffer/i.test(conditions);

    const range = medicalSheet.getRange(r + 1, 1, 1, data[0].length);
    if (hasEpi) {
      range.setBackground('#FCE8E6'); // Soft light red
    } else if (hasAsthma) {
      range.setBackground('#FEF7E0'); // Soft light yellow
    }
  }
}

/**
 * Installs automatic onFormSubmit trigger so new submissions are processed immediately.
 */
function installFormSubmitTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const triggers = ScriptApp.getProjectTriggers();
  for (let t of triggers) {
    if (t.getHandlerFunction() === 'onFormSubmitTriggerHandler') {
      ScriptApp.deleteTrigger(t);
    }
  }

  ScriptApp.newTrigger('onFormSubmitTriggerHandler')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  SpreadsheetApp.getUi().alert('⚡ Auto-Sync Trigger Installed!\n\nWhenever a parent submits the Google Form, their registration and safety notes will sync to the Master Tracker automatically.');
}

/**
 * Trigger handler called immediately upon form submission.
 */
function onFormSubmitTriggerHandler(e) {
  syncResponsesToMasterTracker();
}
