# TAMHA Manager's Desk — Deployment & Integration Guide

This guide provides step-by-step instructions for integrating the modernized **TAMHA Manager's Desk** documentation suite onto the main Truro Area Minor Hockey Association website (`trurominorhockey.ca`).

The documentation is hosted with automatic SSL and live GitHub synchronization at:
👉 **[https://hockey.redmond.link/](https://hockey.redmond.link/)**

---

## 🌟 Method 1: Hosted Embed via iFrame (Recommended)

This method gives managers an automatic, self-updating experience inside `trurominorhockey.ca` without requiring the association webmaster to manually update HTML snippets whenever dates, fees, or forms change.

### How to Deploy:
1. In GrayJay Admin, go to **Content > Pages** and click **"Add Page"** (or edit the legacy `Team Season Checklist` page).
2. Title the page: **Manager's Desk** (or **Team Season Checklist**).
3. In the text editor toolbar, click the **`< >` (Source Code / HTML)** button.
4. Paste the following embed code:

```html
<div style="width: 100%; max-width: 1000px; margin: 0 auto; padding: 10px 0;">
    <iframe 
        src="https://hockey.redmond.link/" 
        style="width: 100%; height: 1600px; min-height: 100vh; border: none; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);" 
        loading="lazy"
        title="TAMHA Manager's Desk">
    </iframe>
</div>
```

5. Click **Ok / Save** and **Publish**.
6. In **Menus / Navigation**, add this page as an item or sub-menu named **"Manager's Desk"**.

*Result: The site immediately renders the full interactive portal—including top tabbed navigation across all 4 guides, mobile-responsive tables, and clean relative links.*

---

## 🔗 Method 2: Direct Menu External Link (Fastest & Best for Mobile)

GrayJay menus natively support external links. This gives managers a full-screen, mobile-optimized web app experience.

1. Go to **Admin > Menus** (or **Navigation**).
2. Add a new menu item titled **"Manager's Desk"**.
3. Choose **Menu Type:** `External Link`.
4. URL: `https://hockey.redmond.link/`
5. Save the menu.

---

## 📋 Method 3: Native GrayJay 4-Page Deployment (Alternative)

If the association strictly prefers hosting raw HTML snippets within GrayJay's database rather than embedding the hosted portal:

### 1. Create the 4 Page Shells
1. Go to **Content > Pages > Add Page**.
2. Create 4 pages:
   - `Quick-Start Checklist`
   - `Detailed Responsibilities Guide`
   - `Weekly Tempo Guide`
   - `Resources and Templates`
3. Hit Save on each to generate GrayJay's public URLs (`/pages/<ID>/...`).

### 2. Paste Matching HTML Files
Open the corresponding file in `grayjay-html-exports/` and paste into the `< >` Source Code editor for each page:
- Part 1: `grayjay-html-exports/01-Quick-Start.html`
- Part 2: `grayjay-html-exports/02-Detailed-Guide.html`
- Part 3: `grayjay-html-exports/03-Tempo-Guide.html`
- Part 4: `grayjay-html-exports/04-Resources.html`

---

## 🛡️ Privacy & Compliance Notice

* **PII Cleanliness:** All guides and templates in this repository have been audited to ensure zero personally identifiable information (personal cell numbers or personal emails) is present.
* **Official Contacts:** All inquiries point to official TAMHA organizational aliases:
  - `info@trurominorhockey.ca`
  - `vpfinance@trurominorhockey.ca`
  - `tamhaweb@trurominorhockey.ca`
* **External Systems:** Links to Spordle, Hockey Nova Scotia certifications, and GrayJay Central are verified and configured to open safely in new tabs (`target="_blank"`).
