# TAMHA Manager's Desk — GrayJay Admin Deployment Guide

This guide provides step-by-step instructions for the **TAMHA Webmaster / Association Admin** to deploy the modernized **Manager's Desk** documentation suite onto the main Truro Area Minor Hockey Association GrayJay website (`trurominorhockey.ca`).

---

## 📋 Overview of Pages

The Manager's Desk is designed as a linked 4-part sequential guide:

| Part | Document / Page Title | HTML Source File | Description |
| :--- | :--- | :--- | :--- |
| **1** | **Quick-Start Checklist** | `grayjay-html-exports/01-Quick-Start.html` | Chronological, high-priority manager onboarding checklist with mobile-responsive tables. |
| **2** | **Detailed Responsibilities Guide** | `grayjay-html-exports/02-Detailed-Guide.html` | In-depth manual covering Safety, Banking, Roster/Game Management, and Team Culture. |
| **3** | **Weekly Tempo Guide** | `grayjay-html-exports/03-Tempo-Guide.html` | Rhythm of the week (Monday through Sunday) + ready-to-use weekly email templates. |
| **4** | **Resources and Templates** | `grayjay-html-exports/04-Resources.html` | Central hub for TAMHA PDFs, HNS forms, Spordle links, and parent meeting assets. |

---

## 🚀 Step 1: Create the 4 Page "Shells" in GrayJay

Because GrayJay embeds database page IDs into public URLs (`/pages/[ID]/[Page-Title]/`), create the empty page containers first to generate the permanent URLs.

1. Log in to the **GrayJay Admin Panel** at the Association level.
2. In the left-hand navigation, expand **Content** and click **Pages**.
3. In the top right corner, click the blue **"Add Page"** button.
4. Create the 4 pages one by one using these exact titles:
   - `Quick-Start Checklist`
   - `Detailed Responsibilities Guide`
   - `Weekly Tempo Guide`
   - `Resources and Templates`
5. Click **Save** on each page.
6. Note the 4 **Public URLs** displayed in the *Public URL* field (or in the page listing table). They will look like:
   - `https://trurominorhockey.ca/pages/<ID_1>/Quick-Start-Checklist/`
   - `https://trurominorhockey.ca/pages/<ID_2>/Detailed-Resource-Guide/`
   - `https://trurominorhockey.ca/pages/<ID_3>/Weekly-Tempo-Guide/`
   - `https://trurominorhockey.ca/pages/<ID_4>/Resources-and-Templates/`

---

## 🔗 Step 2: Update the Internal Cross-Links (If IDs Change)

Each page features bottom navigation buttons (`Back` and `Next`) and internal links between the Quick-Start checklist and the Detailed Guide sections.

Before pasting into GrayJay:
1. Open the `.html` files in `grayjay-html-exports/`.
2. Perform a Find & Replace to swap the placeholder/test page IDs with the newly generated Association page IDs:
   - Replace the `Quick-Start Checklist` URL with `<ID_1>`
   - Replace the `Detailed Resource Guide` URL with `<ID_2>`
   - Replace the `Weekly Tempo Guide` URL with `<ID_3>`
   - Replace the `Resources and Templates` URL with `<ID_4>`

*(Note: If you provide the 4 generated URLs to the documentation maintainer, these can be updated across the repository automatically in seconds).*

---

## 💻 Step 3: Paste the HTML Content into GrayJay

For each of the 4 pages in GrayJay:

1. In **Content > Pages**, click the blue **Edit** button next to the page.
2. Locate the main WYSIWYG text editor toolbar.
3. Click the **`< >` (Source Code / HTML)** button on the toolbar:
   - *If using TinyMCE, this is typically under `Tools > Source code` or an icon displaying `< >`.*
4. Clear out any default content or empty `<p></p>` tags.
5. Open the corresponding `.html` file from `grayjay-html-exports/`, copy the entire raw code block, and paste it into the code window.
6. Click **Ok** or **Save** in the code modal.
7. Ensure the **Publish Date & Time** is set (leave blank or select current date to publish immediately).
8. Click the blue **Save** button at the top of the page.

---

## 🧭 Step 4: Configure the Website Navigation Menu

To make the new documentation easily accessible to all managers and coaches across the association:

1. In the GrayJay Admin sidebar, navigate to **Menus** (or **Navigation**).
2. Select your main website menu header.
3. You have two recommended placement options:

### Option A: Dedicated "Manager's Desk" Dropdown (Recommended)
* Create a top-level menu item titled **"Manager's Desk"**.
* Set Menu Type to **Sub-Menu**.
* Add the 4 pages as Sub-Menu items (using **Internal Page** and selecting each page from the dropdown):
  1. Quick-Start Checklist
  2. Detailed Responsibilities Guide
  3. Weekly Tempo Guide
  4. Resources & Templates

### Option B: Single Entry Point
* Add a single menu item titled **"Manager's Desk"** pointing directly to `Quick-Start Checklist` (Page 1).
* Managers can navigate through the entire suite using the **"Next"** and **"Back"** buttons built into the bottom of every page.

---

## 🛡️ Privacy & Compliance Notice

* **PII Cleanliness:** All templates and guide text in this repository have been audited to ensure zero personally identifiable information (personal cell numbers or personal emails) is present.
* **Official Contacts:** All inquiries point to official TAMHA organizational aliases:
  - `info@trurominorhockey.ca`
  - `vpfinance@trurominorhockey.ca`
  - `tamhaweb@trurominorhockey.ca`
* **External Systems:** Links to Spordle, Hockey Nova Scotia certifications, and GrayJay Central are verified and configured to open safely in new tabs (`target="_blank"`).
