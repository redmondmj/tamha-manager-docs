# 🏒 TAMHA U11 C1 Player Medical & Intake Setup Guide
**Turnkey Digital Intake & Master Team Operations for Truro Bearcats U11 C1 (Campbell)**

---

## 📋 1. Links & Assets

### **Truro Bearcats U11 C1 (Head Coach Mike Campbell)**
* **Parent Intake Form (Public Link for Families):**  
  [https://docs.google.com/forms/d/1QPuFAn1l-QEqRuWS174dQU8jz2VrJFT-SK0EScfqCUg/viewform](https://docs.google.com/forms/d/1QPuFAn1l-QEqRuWS174dQU8jz2VrJFT-SK0EScfqCUg/viewform)
* **Form Editor Link (Manager & Coaches Only):**  
  [https://docs.google.com/forms/d/1QPuFAn1l-QEqRuWS174dQU8jz2VrJFT-SK0EScfqCUg/edit](https://docs.google.com/forms/d/1QPuFAn1l-QEqRuWS174dQU8jz2VrJFT-SK0EScfqCUg/edit)
* **Master Operations & Intake Sheet:**  
  [https://docs.google.com/spreadsheets/d/19SNzINrEVGdIHJK4tYxKo2lXVkpiDatcp0FqRjelMCY/edit](https://docs.google.com/spreadsheets/d/19SNzINrEVGdIHJK4tYxKo2lXVkpiDatcp0FqRjelMCY/edit)
* **Team Staff:**  
  - Head Coach: Mike Campbell (`u11c1hc@trurominorhockey.ca`)
  - Manager / Treasurer: Catherine Campbell (`u11cmgr@trurominorhockey.ca`)
* **Gmail Ready-to-Send Draft:**  
  Created in `u13amgr@trurominorhockey.ca` addressed to `u11cmgr@trurominorhockey.ca` (Cc: `u11c1hc@trurominorhockey.ca`).
* **Form Header Banner (1600x400):**  
  - U11 C1: [`assets/headers/bearcats_u11c1_form_header.png`](file:///c:/Users/redmo/OneDrive/Documents/GitRepos/tamha-manager-docs/assets/headers/bearcats_u11c1_form_header.png)
  - U11 C (Generic): [`assets/headers/bearcats_u11c_form_header.png`](file:///c:/Users/redmo/OneDrive/Documents/GitRepos/tamha-manager-docs/assets/headers/bearcats_u11c_form_header.png)

---

## ⚙️ 2. Quick 2-Minute Setup Instructions for Managers

### Step 0: Upload the Header Banner (10 seconds)
1. Open your Form's **[Editor Link](https://docs.google.com/forms/d/1QPuFAn1l-QEqRuWS174dQU8jz2VrJFT-SK0EScfqCUg/edit)**.
2. In the top right corner, click the **Customize Theme** icon (🎨 paint palette).
3. Under **Header**, click **Choose image** > **Upload** > **Browse**.
4. Select [`assets/headers/bearcats_u11c1_form_header.png`](file:///c:/Users/redmo/OneDrive/Documents/GitRepos/tamha-manager-docs/assets/headers/bearcats_u11c1_form_header.png) and click **Done**.

### Step 1: Link the Form to the Sheet (Choose Either Method)

#### **Method 1: Direct in Google Forms (30 seconds - Recommended)**
1. Open your Form's **[Editor Link](https://docs.google.com/forms/d/1QPuFAn1l-QEqRuWS174dQU8jz2VrJFT-SK0EScfqCUg/edit)**.
2. Click the **Responses** tab at the top.
3. Click the green **Sheets icon** (or click the three dots `⋮` > **Select response destination**).
4. Choose **"Select existing spreadsheet"** > Click **Select**.
5. Pick your team's **`TAMHA U11 C1 Bearcats (Campbell) — Master Team Operations & Intake (2026-2027)`** spreadsheet.

#### **Method 2: Via Apps Script (1-Click)**
1. In your Master Google Sheet, open `🏒 TAMHA Manager Tools` > `🔗 Auto-Link Google Form to this Sheet`.
2. Paste the Form URL or Form ID (`1QPuFAn1l-QEqRuWS174dQU8jz2VrJFT-SK0EScfqCUg`). Click OK!

---

### Step 2: Install the Apps Script (Automation Engine)

1. Open your team's [Master Google Sheet](https://docs.google.com/spreadsheets/d/19SNzINrEVGdIHJK4tYxKo2lXVkpiDatcp0FqRjelMCY/edit).
2. In the top menu, click **Extensions** > **Apps Script**.
3. Clear out any sample text (`function myFunction() { ... }`).
4. Open the template file [`templates/TAMHA_Player_Intake_Apps_Script.js`](file:///c:/Users/redmo/OneDrive/Documents/GitRepos/tamha-manager-docs/templates/TAMHA_Player_Intake_Apps_Script.js), copy the entire code, and paste it into the script editor.
5. Click the **Save** icon (💾) at the top.
6. Refresh your Google Sheet in your browser. A brand new menu will appear at the top: **`🏒 TAMHA Manager Tools`**!

---

## 🚀 3. Features Included in the Master Spreadsheet

The spreadsheet contains 5 pre-configured tabs:
1. **`Master Team Tracker`**: Full roster dashboard tracking Jersey Numbers, Contact info, Digital Form completion status, Deposit status, and Apparel. (Pre-populated with all 16 U11 C1 players).
2. **`Medical & Safety Quick Reference`**: Formatted emergency cheat-sheet for the bench safety binder. Rows automatically highlight in **red** for severe allergies/EpiPens and **yellow** for asthma/inhalers.
3. **`Jersey Deposits Log`**: Tracks $150 cheque dates, cheque numbers, cash envelopes, and shred/return status.
4. **`Socks & Apparel Orders`**: Tracks game sock requirements (Dark/Grey & Light/White) and name bar embroidery text.
5. **`Form Responses 1`**: Receives raw parent form submissions in real time.

---

## 🖨️ 4. Official Automated 6-Page Season Binder Packets

![Official Stamped Hockey Canada Medical Record Sample](images/connor_p1_stamped.png)

### **The Two-Step Packet Generation & Privacy Workflow**
1. **Step 1: Online Intake & Local Machine Stamping**
   * Parents complete the digital intake form online from their phones.
   * Matt runs the responses through the vector stamping engine on his local machine, cross-referencing the team's official GrayJay roster.
   * In ~3 seconds, all 6-page stamped packets are generated.
   
2. **Step 2: Upload Packets & Local Data Purge**
   * Matt delivers/uploads the completed PDF packages to the team manager (via secure drive upload or encrypted digital binder zip).
   * Once delivered, all generated player medical files and local copies are **permanently purged** from Matt's machine so child health card numbers and medical details are never retained locally.

### **Execution Command for Matt**
```powershell
# For U11 C1:
python scripts/sync_live_and_generate.py --sheet "19SNzINrEVGdIHJK4tYxKo2lXVkpiDatcp0FqRjelMCY" --team "Truro Bearcats U11 C1" --roster "data/rosters/u11c1_roster_export_Truro_Bearcats.csv"
```
