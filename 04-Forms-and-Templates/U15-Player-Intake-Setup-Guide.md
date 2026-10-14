# 🏒 TAMHA U15 Player Medical & Intake Setup Guide
**Turnkey Digital Intake & Master Team Operations for U15 C1 and U15 A**

---

## 📋 1. Links & Assets

### **A. Truro Bearcats U15 C1**
* **Parent Intake Form (Public Link):**  
  [https://docs.google.com/forms/d/1DzLHIDh4HmkC-4vQwAWoF4rLmD3ZT19uPQkCtz4WRo4/viewform](https://docs.google.com/forms/d/1DzLHIDh4HmkC-4vQwAWoF4rLmD3ZT19uPQkCtz4WRo4/viewform)
* **Form Editor Link (Manager Only):**  
  [https://docs.google.com/forms/d/1DzLHIDh4HmkC-4vQwAWoF4rLmD3ZT19uPQkCtz4WRo4/edit](https://docs.google.com/forms/d/1DzLHIDh4HmkC-4vQwAWoF4rLmD3ZT19uPQkCtz4WRo4/edit)
* **Master Operations & Intake Sheet:**  
  [https://docs.google.com/spreadsheets/d/1K1wRbbpOOShiJMBMqUP6-Rr3dRjr8DeJQBDlH2kSA4g/edit](https://docs.google.com/spreadsheets/d/1K1wRbbpOOShiJMBMqUP6-Rr3dRjr8DeJQBDlH2kSA4g/edit)

---

### **B. Truro Bearcats U15 A**
* **Parent Intake Form (Public Link):**  
  [https://docs.google.com/forms/d/1BRpwcGG74TnZ4HAWBiVNJKiUHo8crGbf7Kj_ny-tMI8/viewform](https://docs.google.com/forms/d/1BRpwcGG74TnZ4HAWBiVNJKiUHo8crGbf7Kj_ny-tMI8/viewform)
* **Form Editor Link (Manager Only):**  
  [https://docs.google.com/forms/d/1BRpwcGG74TnZ4HAWBiVNJKiUHo8crGbf7Kj_ny-tMI8/edit](https://docs.google.com/forms/d/1BRpwcGG74TnZ4HAWBiVNJKiUHo8crGbf7Kj_ny-tMI8/edit)
* **Master Operations & Intake Sheet:**  
  [https://docs.google.com/spreadsheets/d/1tLp6ja23YTj-ursnl1_EKhp0YCvnc2vni1J-6ErvnxM/edit](https://docs.google.com/spreadsheets/d/1tLp6ja23YTj-ursnl1_EKhp0YCvnc2vni1J-6ErvnxM/edit)

---

## ⚙️ 2. Quick 2-Minute Setup Instructions for Managers

### Step 1: Link the Form to the Sheet (Choose Either Method)

#### **Method 1: Direct in Google Forms (30 seconds)**
1. Open your Form's **Editor Link**.
2. Click the **Responses** tab at the top.
3. Click the green **Sheets icon** (or click the three dots `⋮` > **Select response destination**).
4. Choose **"Select existing spreadsheet"** > Click **Select**.
5. Pick your team's **Master Team Operations & Intake** spreadsheet.

#### **Method 2: Via Apps Script (1-Click)**
1. In your Master Google Sheet, open `🏒 TAMHA Manager Tools` > `🔗 Auto-Link Google Form to this Sheet`.
2. Paste your Form URL or Form ID. Click OK!

---

### Step 2: Install the Apps Script (Automation Engine)

1. Open your team's Master Google Sheet.
2. In the top menu, click **Extensions** > **Apps Script**.
3. Clear out any sample text (`function myFunction() { ... }`).
4. Open the template file [`templates/TAMHA_Player_Intake_Apps_Script.js`](file:///c:/Users/redmo/OneDrive/Documents/GitRepos/tamha-manager-docs/templates/TAMHA_Player_Intake_Apps_Script.js), copy the entire code, and paste it into the script editor.
5. Click the **Save** icon (💾) at the top.
6. Refresh your Google Sheet in your browser. A brand new menu will appear at the top: **`🏒 TAMHA Manager Tools`**!

---

## 🚀 3. Features Included in the Master Spreadsheet

Each spreadsheet contains 5 operational tabs ready to use:
1. **`Master Team Tracker`**: Full roster dashboard tracking Jersey Numbers, Contact info, Digital Form completion status, Deposit status, and Apparel.
2. **`Medical & Safety Quick Reference`**: Formatted emergency cheat-sheet for the bench safety binder. Rows automatically highlight in **red** for severe allergies/EpiPens and **yellow** for asthma/inhalers.
3. **`Jersey Deposits Log`**: Tracks $150 cheque dates, cheque numbers, cash envelopes, and shred/return status.
4. **`Socks & Apparel Orders`**: Tracks game sock requirements (Dark/Grey & Light/White) and name bar embroidery text.
5. **`Form Responses 1`**: Receives raw parent form submissions in real time.

---

## 🖨️ 4. Official Automated 6-Page Season Binder Packets

![Official Stamped Hockey Canada Medical Record Sample](images/connor_p1_stamped.png)

### **How the Stamped PDF Engine Works**
Rather than wrestling with third-party Google Marketplace add-ons or Google Docs layout quirks, our custom Python engine stamps parents' digital form submissions directly onto the **official TAMHA & Hockey Canada PDF templates** with vector mathematical precision:

1. **Stamping Engine:** [`generate_all_player_packets.py`](file:///c:/Users/redmo/OneDrive/Documents/GitRepos/tamha-manager-docs/generate_all_player_packets.py)
2. **Cloud Synchronization Runner:** [`scripts/sync_live_and_generate.py`](file:///c:/Users/redmo/OneDrive/Documents/GitRepos/tamha-manager-docs/scripts/sync_live_and_generate.py)
3. **Official Blank Source PDFs:** Located in [`original-pdfs/`](file:///c:/Users/redmo/OneDrive/Documents/GitRepos/tamha-manager-docs/original-pdfs/)

---

### **What is Produced for Every Player (Official 6-Page Packet)**
* **Pages 1–2: Hockey Canada Player Medical Information Sheet** (11 rows of calibrated checkboxes, emergency contact, family doctor, dentist, formatted MSI health card with expiry, and cursive parent signature).
* **Pages 3–4: TAMHA Parent & Player Code of Conduct** (Stamped with parent signature and date on line).
* **Pages 5–6: TAMHA Jersey Signout Form & Guidelines** (Home & Away jerseys checked, player name, assigned jersey number, team name, and cursive parent signature).

---

### **The Two-Step Packet Generation & Privacy Workflow**

To ensure 100% compliance with Hockey Canada / TAMHA child health privacy standards (and because Google Forms cannot natively stamp vector checkboxes onto official forms), the packet workflow operates in **two distinct steps**:

1. **Step 1: Online Intake & Local Machine Stamping**
   * Parents complete the digital intake form online from their phones.
   * Matt downloads the live spreadsheet responses (or syncs directly) and processes them through the vector stamping engine on his local machine, cross-referencing the team's official GrayJay roster export.
   * In ~3 seconds, all 6-page stamped packets are generated.
   
2. **Step 2: Upload Packets & Local Data Purge**
   * Matt delivers/uploads the completed PDF packages to the team manager (via secure drive upload or encrypted digital binder zip).
   * Once delivered, all generated player medical files and local copies are **permanently purged** from Matt's machine so child health card numbers and medical details are never retained locally.

---

### **Execution Commands for Matt (3 Seconds per Team)**
```powershell
# For U15 A:
python scripts/sync_live_and_generate.py --sheet "1tLp6ja23YTj-ursnl1_EKhp0YCvnc2vni1J-6ErvnxM" --team "Truro Bearcats U15 A" --roster "data/rosters/u15a_roster_export_Truro_Bearcats_20261014-004955.csv"

# For U15 C1:
python scripts/sync_live_and_generate.py --sheet "1K1wRbbpOOShiJMBMqUP6-Rr3dRjr8DeJQBDlH2kSA4g" --team "Truro Bearcats U15 C1"
```




