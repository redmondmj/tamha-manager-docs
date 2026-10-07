# TAMHA Manager Desk: GrayJay Publishing & Handoff Manifest

This document outlines the structure, order, and deployment procedures for publishing the **TAMHA Team Manager Documentation Suite** to the GrayJay CMS.

---

## 1. Page Architecture & Menu Hierarchy

### Association-Level Placement (Recommended)
These guides are designed for all team managers (both Rep and House/C-League) across TAMHA. 
* **Target Parent Menu:** `Volunteers` &rarr; `Manager's Desk` (or create a dedicated sub-menu: `Manager's Desk`)
* **Base URL Pattern:** `https://trurominorhockey.ca/l/48/tamha/pages/<PAGE_ID>/<SLUG>/`

### Page Roster & Sequence

| # | Page Title | File Source | Live GrayJay URL & Page ID | Target Audience |
|---|---|---|---|---|
| **1** | **Manager Quick-Start Checklist** | `grayjay-html-exports/01-Quick-Start.html` | [pages/12263/Manager-Quick-Start-Checklist/](https://trurominorhockey.ca/pages/12263/Manager-Quick-Start-Checklist/) | All Managers (New & Returning) |
| **2** | **Manager Detailed Responsibilities Guide** | `grayjay-html-exports/02-Detailed-Guide.html` | [pages/12264/Manager-Detailed-Responsibilities-Guide/](https://trurominorhockey.ca/pages/12264/Manager-Detailed-Responsibilities-Guide/) | All Managers |
| **3** | **Manager Weekly Tempo Guide** | `grayjay-html-exports/03-Tempo-Guide.html` | [pages/12265/Manager-Weekly-Tempo-Guide/](https://trurominorhockey.ca/pages/12265/Manager-Weekly-Tempo-Guide/) | All Managers |
| **4** | **Manager Resources & Templates** | `grayjay-html-exports/04-Resources.html` | [pages/12266/Manager-Resources--Templates/](https://trurominorhockey.ca/pages/12266/Manager-Resources--Templates/) | Managers, Treasurers, Safety Reps |
| **5** | **Template: Parent Meeting Agenda** | `grayjay-html-exports/05-Template-Parent-Meeting.html`| `Template-Parent-Meeting-Agenda` | Team Staff |
| **6** | **Template: Sponsorship Letter** | `grayjay-html-exports/06-Template-Sponsorship.html` | `Template-Sponsorship-Letter` | Managers & Fundraising Reps |
| **7** | **Template: Emergency Action Plan (EAP)**| `grayjay-html-exports/07-Template-EAP.html` | `Template-Emergency-Action-Plan` | Safety Persons & Bench Staff |

---

## 2. Deployment Procedures

### Method A: Self-Publishing via GrayJay Admin Panel

If you have administrative access to the GrayJay CMS (`https://trurominorhockey.ca/admin/`):

1. **Log in** to GrayJay Admin.
2. In the navigation sidebar, go to **Content** / **Pages** &rarr; **Add New Page**.
3. Set the **Page Title** (from table above) and select the parent menu (e.g. `Volunteers` &rarr; `Manager's Desk`).
4. In the rich-text content editor toolbar, click the **Code View** icon (`</>` or `HTML`).
5. Open the corresponding `.html` file from `grayjay-html-exports/`, select all, copy, and paste into the Code View window.
6. Click the **Code View** icon again to toggle back to preview mode and confirm layout.
7. Click **Save / Publish**.
8. **Record the assigned Page ID**: GrayJay will assign a numeric page ID in the URL (e.g., `/pages/12345/Quick-Start-Checklist/`).
9. Once all 4 core pages are published, do one quick edit on the Next/Previous buttons at the bottom of each page to wire up the actual live IDs.

---

### Method B: Handoff to TAMHA Webmaster (`tamhaweb@trurominorhockey.ca`)

If the association webmaster will be creating the pages:

1. **Package the Files:** Zip the `grayjay-html-exports/` directory.
2. **Draft the Handoff Email:**
   * **Subject:** `TAMHA Manager Desk Suite - 2026-2027 Documentation Update`
   * **Body:**
     > Hi [Webmaster Name],
     > 
     > We have updated and modernized the TAMHA Team Manager documentation suite for the 2026–2027 season. All pages have been pre-formatted in clean, mobile-responsive HTML with TAMHA brand styling (Bearcats red `#C8102E`), tested and verified against all current HNS, GrayJay, and TAMHA policies.
     > 
     > Attached is a zip file of the 7 pre-formatted HTML pages along with `PUBLISHING_MANIFEST.md` detailing the suggested order and menu hierarchy under `Volunteers > Manager's Desk`.
     > 
     > The files are ready to paste directly into GrayJay's Code View (`</>`). Once published, let us know the generated page IDs so we can ensure inter-page pagination links are seamless.
     > 
     > Thanks!
     > [Your Name]

---

## 3. Post-Publishing Link Resolution

The bottom of each page includes convenient navigation links (e.g. `Next: Detailed Responsibilities Guide →`). Once GrayJay assigns page IDs upon initial save, update the footer button `href` attributes:

* **Page 1 (`01-Quick-Start.html`):**
  * `Next: Detailed Responsibilities Guide` &rarr; Point to Page 2's URL.
* **Page 2 (`02-Detailed-Guide.html`):**
  * `Back to Quick-Start` &rarr; Point to Page 1's URL.
  * `Next: Weekly Tempo Guide` &rarr; Point to Page 3's URL.
* **Page 3 (`03-Tempo-Guide.html`):**
  * `Back to Detailed Guide` &rarr; Point to Page 2's URL.
  * `Next: Resources & Templates` &rarr; Point to Page 4's URL.
* **Page 4 (`04-Resources.html`):**
  * `Back to Tempo Guide` &rarr; Point to Page 3's URL.
