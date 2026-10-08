/**
 * TAMHA TEAM SPONSORSHIP & FUNDRAISING AUTOMATION ENGINE (APPS SCRIPT V3)
 * 
 * Strict Privacy & Permission Hardened:
 *  - Zero public link sharing (no anonymous visitors)
 *  - Uses explicit team permissions
 *  - Works on ANY active tab ("Form Responses 1" or "Sponsorship Tracker")
 *  - Dynamic header lookup (safe against deleted or shifted columns)
 *  - Attaches official receipt PDF directly to Gmail draft
 */

const RECEIPT_TEMPLATE_DOC_ID = '1c2M5fnxsjmiiY2RXzHKXxFJJzZaVOKevxBwM-IyXNPo';
const DEFAULT_TREASURER_NAME = 'Team Treasurer';
const DEFAULT_MANAGER_NAME = 'Team Manager';
const DEFAULT_TEAM_EMAIL = 'info@trurominorhockey.ca';

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏒 TAMHA Sponsorship')
    .addItem('⚡ Generate Receipt Doc for Selected Row', 'generateReceiptForSelectedRow')
    .addItem('✉️ Draft Receipt & Logo Email in Gmail (with PDF)', 'draftEmailForSelectedRow')
    .addItem('🔄 Sync Form Responses to Sponsorship Tracker', 'syncFormResponsesToTracker')
    .addSeparator()
    .addItem('📊 Recalculate Budget Summary (Joe\'s Template)', 'syncBudgetSummary')
    .addToUi();
}

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
 * Extracts a value from a row using matching header aliases.
 */
function getValByAliases(sheet, row, headers, aliases, defaultVal = '') {
  const colIdx = findColIndex(headers, aliases);
  if (colIdx === -1) return defaultVal;
  const val = sheet.getRange(row, colIdx).getValue();
  if (val !== null && val !== undefined && String(val).trim() !== '') {
    return String(val).trim();
  }
  return defaultVal;
}

/**
 * Generates an official Google Doc receipt for the currently selected row on ANY active tab.
 */
function generateReceiptForSelectedRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const rowIdx = sheet.getActiveCell().getRow();
  
  if (rowIdx <= 1) {
    SpreadsheetApp.getUi().alert('⚠️ Please select a sponsor data row (row 2 or below).');
    return;
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Dynamic header lookups
  const businessName = getValByAliases(sheet, rowIdx, headers, [
    'legal business', 'organization name', 'business / sponsor', 'business name', 'sponsor name', 'business'
  ]);
  
  if (!businessName) {
    SpreadsheetApp.getUi().alert('⚠️ Could not find a Business Name in the selected row. Please click on a row with sponsor data.');
    return;
  }
  
  const contactPerson = getValByAliases(sheet, rowIdx, headers, [
    'primary contact', 'contact person', 'contact name', 'attn', 'contact'
  ], 'Valued Community Partner');
  
  const email = getValByAliases(sheet, rowIdx, headers, [
    'contact email', 'email address', 'email'
  ]);
  
  const phone = getValByAliases(sheet, rowIdx, headers, [
    'contact phone', 'phone number', 'phone'
  ]);
  
  const address = getValByAliases(sheet, rowIdx, headers, [
    'civic / mailing', 'mailing address', 'civic address', 'address'
  ], 'Truro, NS');
  
  const tierRaw = getValByAliases(sheet, rowIdx, headers, [
    'sponsorship package', 'package / tier', 'tier', 'package'
  ], 'Main Sponsor ($250)');
  
  const amountRaw = getValByAliases(sheet, rowIdx, headers, [
    'total contribution', 'amount ($)', 'amount', 'contribution amount'
  ], '250');
  
  let amount = parseFloat(String(amountRaw).replace(/[^0-9.]/g, '')) || 250.00;
  
  const paymentMethod = getValByAliases(sheet, rowIdx, headers, [
    'payment method', 'method'
  ], 'Cheque / E-Transfer');
  
  const allocation = getValByAliases(sheet, rowIdx, headers, [
    'fund allocation', 'allocation directive', 'allocation preference', 'allocation'
  ], 'General Team Operating Fund');
  
  const teamName = getValByAliases(sheet, rowIdx, headers, [
    'specify team', 'team division', 'division & team', 'team'
  ], 'Truro Bearcats U13A');
  
  // Resolve or generate Receipt Number
  let colReceiptNo = findColIndex(headers, ['receipt #', 'receipt number', 'receipt no']);
  let receiptNo = '';
  if (colReceiptNo !== -1) {
    receiptNo = String(sheet.getRange(rowIdx, colReceiptNo).getValue() || '').trim();
  }
  
  if (!receiptNo) {
    const yr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy');
    receiptNo = 'TAMHA-U13A-SPON-' + yr + '-' + Utilities.formatString('%03d', rowIdx - 1);
    if (colReceiptNo !== -1) {
      sheet.getRange(rowIdx, colReceiptNo).setValue(receiptNo);
    }
  }
  
  const issueDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMMM d, yyyy');
  
  let docUrl = '';
  try {
    // 1. Access Master Template Doc
    const templateFile = DriveApp.getFileById(RECEIPT_TEMPLATE_DOC_ID);
    const copyDoc = templateFile.makeCopy('TAMHA Official Receipt - ' + receiptNo + ' - ' + businessName);
    const copyId = copyDoc.getId();
    
    // 2. Replace tokens in Document body
    const doc = DocumentApp.openById(copyId);
    const body = doc.getBody();
    
    body.replaceText('{{RECEIPT_NO}}', receiptNo);
    body.replaceText('{{ISSUE_DATE}}', issueDate);
    body.replaceText('{{TEAM_NAME}}', teamName);
    body.replaceText('{{BUSINESS_NAME}}', businessName);
    body.replaceText('{{CONTACT_PERSON}}', contactPerson);
    body.replaceText('{{ADDRESS}}', address);
    body.replaceText('{{EMAIL}}', email || '');
    body.replaceText('{{PHONE}}', phone || '');
    body.replaceText('{{WEBSITE}}', '');
    body.replaceText('{{TIER_NAME}}', tierRaw.split('—')[0].trim());
    body.replaceText('{{ALLOCATION}}', allocation.split('(')[0].trim());
    body.replaceText('{{PAYMENT_METHOD}}', paymentMethod);
    body.replaceText('{{AMOUNT}}', amount.toFixed(2));
    body.replaceText('{{TREASURER_NAME}}', DEFAULT_TREASURER_NAME);
    body.replaceText('{{MANAGER_NAME}}', DEFAULT_MANAGER_NAME);
    
    doc.saveAndClose();
    
    // 3. Privacy Preservation: DO NOT set public link sharing
    // Keeps document strictly private within authorized team staff
    docUrl = copyDoc.getUrl();
    
    // 4. Write Doc URL back to current active sheet
    let colDocLink = findColIndex(headers, ['receipt doc link', 'doc link', 'receipt link', 'receipt url']);
    if (colDocLink === -1) {
      colDocLink = sheet.getLastColumn() + 1;
      sheet.getRange(1, colDocLink).setValue('Receipt Doc Link');
    }
    sheet.getRange(rowIdx, colDocLink).setValue(docUrl);
    
    // 5. Update status column if present
    const colStatus = findColIndex(headers, ['receipt status', 'status']);
    if (colStatus !== -1) {
      sheet.getRange(rowIdx, colStatus).setValue('Receipt Generated (Ready to Email)');
    }
    
    // 6. Log into Receipts & Banner Assets tab
    const receiptsSheet = ss.getSheetByName('Receipts & Banner Assets');
    if (receiptsSheet) {
      const rData = receiptsSheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < rData.length; i++) {
        if (rData[i][0] === receiptNo) {
          receiptsSheet.getRange(i + 1, 10).setValue(docUrl);
          found = true;
          break;
        }
      }
      if (!found) {
        receiptsSheet.appendRow([
          receiptNo,
          issueDate,
          businessName,
          contactPerson,
          email,
          amount,
          paymentMethod,
          DEFAULT_TREASURER_NAME,
          DEFAULT_MANAGER_NAME,
          docUrl,
          'Pending Email',
          'Awaiting Vector',
          'Pending Review',
          'Main Grid Slot',
          'Generated from ' + sheet.getName()
        ]);
      }
    }
    
    SpreadsheetApp.getUi().alert(
      '✅ Official Receipt Created Successfully!\n\n' +
      '• Receipt #: ' + receiptNo + '\n' +
      '• Sponsor: ' + businessName + ' ($' + amount.toFixed(2) + ')\n' +
      '• Saved securely in your Google Drive (Private)\n\n' +
      'Doc URL: ' + docUrl
    );
  } catch (err) {
    SpreadsheetApp.getUi().alert(
      '⚠️ Drive Error: ' + err.message + '\n\n' +
      'Please verify that your Google account has editor access to the Master Receipt Template.'
    );
  }
}

/**
 * Drafts a thank-you email with the PDF receipt attached directly in Gmail.
 */
function draftEmailForSelectedRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const rowIdx = sheet.getActiveCell().getRow();
  
  if (rowIdx <= 1) {
    SpreadsheetApp.getUi().alert('⚠️ Please select a sponsor row (row 2 or below).');
    return;
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const businessName = getValByAliases(sheet, rowIdx, headers, [
    'legal business', 'organization name', 'business / sponsor', 'business name', 'sponsor name', 'business'
  ]);
  const contactPerson = getValByAliases(sheet, rowIdx, headers, [
    'primary contact', 'contact person', 'contact name', 'attn', 'contact'
  ], 'Valued Community Partner');
  const email = getValByAliases(sheet, rowIdx, headers, [
    'contact email', 'email address', 'email'
  ]);
  const amountRaw = getValByAliases(sheet, rowIdx, headers, [
    'total contribution', 'amount ($)', 'amount', 'contribution amount'
  ], '250');
  const amount = parseFloat(String(amountRaw).replace(/[^0-9.]/g, '')) || 250.00;
  
  let receiptNo = getValByAliases(sheet, rowIdx, headers, [
    'receipt #', 'receipt number', 'receipt no'
  ]);
  let receiptUrl = getValByAliases(sheet, rowIdx, headers, [
    'receipt doc link', 'doc link', 'receipt link', 'receipt url'
  ]);
  
  if (!email || !email.includes('@')) {
    SpreadsheetApp.getUi().alert('⚠️ No valid email address found for ' + businessName);
    return;
  }
  
  // Try to attach the PDF receipt directly so no public Drive permissions are needed!
  const attachments = [];
  if (receiptUrl) {
    try {
      const match = receiptUrl.match(/[-\w]{25,}/);
      if (match) {
        const fileId = match[0];
        const pdfBlob = DriveApp.getFileById(fileId).getAs('application/pdf').setName('Official_Receipt_' + (receiptNo || 'TAMHA') + '.pdf');
        attachments.push(pdfBlob);
      }
    } catch (e) {
      Logger.log('Could not generate PDF attachment: ' + e);
    }
  }
  
  const subject = 'Sponsorship Receipt #' + (receiptNo || '') + ' & Welcome to the Truro Bearcats! 🏒';
  
  const htmlBody = 
    '<div style="font-family: Arial, sans-serif; font-size: 15px; color: #222; line-height: 1.5;">' +
      '<p>Hi ' + contactPerson + ',</p>' +
      '<p>On behalf of the <strong>Truro Bearcats</strong> players, coaching staff, and families, thank you so much for your generous support of youth hockey in our community through <strong>' + businessName + '</strong>!</p>' +
      '<p>Your contribution of <strong>$' + amount.toFixed(2) + ' CAD</strong> directly supports our team operating budget, helping keep competitive minor hockey accessible and affordable for all players on our roster.</p>' +
      '<hr style="border: none; border-top: 1px solid #e1e4e8; margin: 20px 0;">' +
      '<h3 style="color: #8B0000; margin-bottom: 8px;">📄 Official Sponsorship Receipt</h3>' +
      '<p>Our Team Treasurer has issued your official association sponsorship receipt for corporate bookkeeping and advertising expense records (attached as a PDF to this email):</p>' +
      '<ul>' +
        '<li><strong>Receipt Number:</strong> ' + (receiptNo || 'On File') + '</li>' +
        '<li><strong>Sponsor Entity:</strong> ' + businessName + '</li>' +
        '<li><strong>Amount Received:</strong> $' + amount.toFixed(2) + ' CAD</li>' +
      '</ul>' +
      '<hr style="border: none; border-top: 1px solid #e1e4e8; margin: 20px 0;">' +
      '<h3 style="color: #8B0000; margin-bottom: 8px;">🎨 Logo Artwork for Arena Banner & Email Footers</h3>' +
      '<p>To ensure your business looks sharp across all team promotions, we are now collecting high-resolution artwork for our graphics production:</p>' +
      '<ol>' +
        '<li><strong>Arena Game Banner:</strong> Our physical banner travels to all home and away arenas. To ensure razor-sharp printing, <strong>Vector format (.AI, .EPS, .PDF, or .SVG) is ideal</strong>.</li>' +
        '<li><strong>High-Res Raster Alternative:</strong> If vector artwork is unavailable, please reply with your highest-resolution file (transparent .PNG or 300+ DPI .JPG) and our graphics team will upscale it.</li>' +
        '<li><strong>Weekly Email Footers:</strong> Your logo will also appear in weekly manager emails sent to all team families and on the GrayJay team portal.</li>' +
      '</ol>' +
      '<p><strong>Next Step:</strong> Simply reply directly to this email with your vector or high-resolution logo file attached.</p>' +
      '<hr style="border: none; border-top: 1px solid #e1e4e8; margin: 20px 0;">' +
      '<p>Thank you again for backing our Bearcats this season!</p>' +
      '<p>Warmest regards,<br>' +
      '<strong>' + DEFAULT_TREASURER_NAME + '</strong> (Treasurer) & <strong>' + DEFAULT_MANAGER_NAME + '</strong> (Manager)<br>' +
      'Truro Area Minor Hockey Association (TAMHA)<br>' +
      '✉️ ' + DEFAULT_TEAM_EMAIL + '</p>' +
    '</div>';
    
  GmailApp.createDraft(email, subject, '', {
    htmlBody: htmlBody,
    attachments: attachments
  });
  
  const colStatus = findColIndex(headers, ['receipt status', 'status']);
  if (colStatus !== -1) {
    sheet.getRange(rowIdx, colStatus).setValue('Email Drafted in Gmail (with PDF)');
  }
  
  SpreadsheetApp.getUi().alert('✅ Draft email created in Gmail for ' + email + ' with official PDF receipt attached!\n\nReview and send from your Gmail Drafts folder.');
}

/**
 * Syncs any new submissions from the Form Responses tab to the Sponsorship Tracker tab.
 */
function syncFormResponsesToTracker() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formSheet = ss.getSheetByName('Form Responses 1') || ss.getSheetByName('Form_Responses');
  const trackerSheet = ss.getSheetByName('Sponsorship Tracker');
  
  if (!formSheet || !trackerSheet) {
    SpreadsheetApp.getUi().alert('⚠️ Could not locate Form Responses tab or Sponsorship Tracker tab.');
    return;
  }
  
  const fData = formSheet.getDataRange().getValues();
  if (fData.length <= 1) {
    SpreadsheetApp.getUi().alert('No form responses found to sync.');
    return;
  }
  
  const fHeaders = fData[0];
  const tData = trackerSheet.getDataRange().getValues();
  const existingBusinesses = new Set();
  for (let i = 1; i < tData.length; i++) {
    const b = String(tData[i][1] || '').trim().toLowerCase();
    if (b) existingBusinesses.add(b);
  }
  
  let syncedCount = 0;
  for (let r = 1; r < fData.length; r++) {
    const bName = getValByAliases(formSheet, r + 1, fHeaders, ['legal business', 'organization name', 'business']);
    if (!bName || existingBusinesses.has(bName.toLowerCase())) continue;
    
    const timestamp = fData[r][0] ? Utilities.formatDate(new Date(fData[r][0]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '';
    const displayName = getValByAliases(formSheet, r + 1, fHeaders, ['display / banner name', 'display name']);
    const contact = getValByAliases(formSheet, r + 1, fHeaders, ['primary contact', 'contact person']);
    const email = getValByAliases(formSheet, r + 1, fHeaders, ['contact email', 'email']);
    const phone = getValByAliases(formSheet, r + 1, fHeaders, ['contact phone', 'phone']);
    const address = getValByAliases(formSheet, r + 1, fHeaders, ['civic / mailing', 'address']);
    const tier = getValByAliases(formSheet, r + 1, fHeaders, ['sponsorship package', 'tier']);
    const amt = parseFloat(String(getValByAliases(formSheet, r + 1, fHeaders, ['total contribution', 'amount'])).replace(/[^0-9.]/g, '')) || 250.0;
    const method = getValByAliases(formSheet, r + 1, fHeaders, ['payment method']);
    const holding = getValByAliases(formSheet, r + 1, fHeaders, ['payment status', 'holding']);
    const alloc = getValByAliases(formSheet, r + 1, fHeaders, ['fund allocation']);
    const notes = getValByAliases(formSheet, r + 1, fHeaders, ['special instructions', 'notes']);
    const player = getValByAliases(formSheet, r + 1, fHeaders, ['connected player', 'referral']);
    const logoStatus = getValByAliases(formSheet, r + 1, fHeaders, ['logo artwork delivery status', 'logo status']);
    
    const receiptNo = 'TAMHA-U13A-SPON-2026-' + Utilities.formatString('%03d', trackerSheet.getLastRow());
    
    trackerSheet.appendRow([
      timestamp,
      bName,
      displayName,
      contact,
      email,
      phone,
      address,
      tier,
      amt,
      method,
      holding,
      alloc,
      notes,
      player,
      logoStatus,
      receiptNo,
      'Receipt Required (Drafting)',
      amt >= 1000 ? 'Major Corporate Sponsor' : (amt >= 500 ? '$500 Banner ads (Gold)' : '$250 Banner ads (Silver)'),
      ''
    ]);
    
    existingBusinesses.add(bName.toLowerCase());
    syncedCount++;
  }
  
  SpreadsheetApp.getUi().alert('✅ Synced ' + syncedCount + ' new sponsor submission(s) to Sponsorship Tracker!');
}

/**
 * Calculates and updates the Budget Sync tab matching Joe Zappia's template.
 */
function syncBudgetSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const trackerSheet = ss.getSheetByName('Sponsorship Tracker');
  const budgetSheet = ss.getSheetByName("Budget Sync (Joe's Template)");
  
  if (!trackerSheet || !budgetSheet) {
    SpreadsheetApp.getUi().alert('⚠️ Required sheets not found.');
    return;
  }
  
  const trackerData = trackerSheet.getDataRange().getValues();
  if (trackerData.length <= 1) {
    SpreadsheetApp.getUi().alert('No sponsor records found to summarize.');
    return;
  }
  
  const headers = trackerData[0];
  const colTier = findColIndex(headers, ['tier', 'package']);
  const colAmt = findColIndex(headers, ['amount ($)', 'amount']);
  const colHolding = findColIndex(headers, ['holding', 'deposit status', 'status']);
  const colAlloc = findColIndex(headers, ['allocation', 'fund allocation']);
  
  const counts = { title: 0, gold: 0, silver: 0, bronze: 0, other: 0 };
  const totals = { title: 0.0, gold: 0.0, silver: 0.0, bronze: 0.0, other: 0.0 };
  let generalFundTotal = 0.0, repFeeTotal = 0.0, apparelTotal = 0.0;
  let depositedMosaik = 0.0;
  
  for (let r = 1; r < trackerData.length; r++) {
    const row = trackerData[r];
    const tier = String(row[colTier - 1] || '').toLowerCase();
    const amt = parseFloat(row[colAmt - 1]) || 0.0;
    const depositStatus = String(row[colHolding - 1] || '').toLowerCase();
    const alloc = String(row[colAlloc - 1] || '').toLowerCase();
    
    if (tier.includes('title') || tier.includes('1000') || tier.includes('1,000') || amt >= 1000) {
      counts.title++; totals.title += amt;
    } else if (tier.includes('premium') || tier.includes('gold') || tier.includes('500') || amt >= 500) {
      counts.gold++; totals.gold += amt;
    } else if (tier.includes('main') || tier.includes('silver') || tier.includes('250') || amt >= 250) {
      counts.silver++; totals.silver += amt;
    } else if (tier.includes('community') || tier.includes('bronze') || tier.includes('100') || amt >= 100) {
      counts.bronze++; totals.bronze += amt;
    } else {
      counts.other++; totals.other += amt;
    }
    
    if (alloc.includes('rep fee')) repFeeTotal += amt;
    else if (alloc.includes('apparel')) apparelTotal += amt;
    else generalFundTotal += amt;
    
    if (depositStatus.includes('mosaik') || depositStatus.includes('deposited')) {
      depositedMosaik += amt;
    }
  }
  
  budgetSheet.getRange('C3').setValue(counts.title);
  budgetSheet.getRange('D3').setValue(totals.title);
  budgetSheet.getRange('C4').setValue(counts.gold);
  budgetSheet.getRange('D4').setValue(totals.gold);
  budgetSheet.getRange('C5').setValue(counts.silver);
  budgetSheet.getRange('D5').setValue(totals.silver);
  budgetSheet.getRange('C6').setValue(counts.bronze);
  budgetSheet.getRange('D6').setValue(totals.bronze);
  budgetSheet.getRange('C7').setValue(counts.other);
  budgetSheet.getRange('D7').setValue(totals.other);
  
  budgetSheet.getRange('D17').setValue(depositedMosaik);
  budgetSheet.getRange('D21').setValue(generalFundTotal);
  budgetSheet.getRange('D22').setValue(repFeeTotal);
  budgetSheet.getRange('D23').setValue(apparelTotal);
  
  SpreadsheetApp.getUi().alert('✅ Budget Sync Summary Successfully Updated!\n\nTotal Committed: $' + (totals.title + totals.gold + totals.silver + totals.bronze + totals.other).toFixed(2));
}
