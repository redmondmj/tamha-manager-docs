# TAMHA Manager Docs — Roadmap & To-Do List

This document tracks upcoming features, architectural initiatives, and tooling ideas for the TAMHA team management ecosystem.

---

## 📌 High Priority / Active Roadmap

### 1. GrayJay Mobile Email Template Studio
- **Problem**: Pasting rich-text into GrayJay's WYSIWYG editor can carry hidden fixed-width HTML containers (e.g. `width: 600px`), causing phones (Gmail on iOS/Android) to zoom out the entire message into an unreadable thumbnail with huge side borders.
- **Solution**: Build a fluid, mobile-first HTML email template source (`templates/grayjay-weekly-email-template.html` or web tool):
  - 100% fluid widths (`width: 100%; max-width: 100%;` with zero fixed pixel constraints).
  - Responsive weekly schedule tables (Date, Event, Time, Arena, Arrival).
  - High-impact callout cards for action items (forms, jersey deposits, team fees).
  - Fluid 3-column sponsor logo showcase footer with auto-scaling images.
  - 1-click "Copy Clean HTML" button for safe pasting directly into GrayJay Bulk Email.

### 2. Dedicated GrayJay MCP Server Project
- **Concept**: A standalone Model Context Protocol (MCP) server providing an AI-driven bridge to GrayJay Central (`grayjayleagues.com` / `grayjaypay.ca`).
- **Core Capabilities & Tools**:
  - `grayjay_get_team_schedule(team_id)`: Fetch official league games, dates, times, and venues.
  - `grayjay_get_roster(team_id)`: Access player and bench staff contact records.
  - `grayjay_audit_schedule_conflicts(schedule_sheet_id)`: Automated 2-way cross-check between GrayJay league games and the master ice schedule to flag missing ice, ghost games, and away-game travel conflicts.
  - `grayjay_import_practices(team_id, file_or_data)`: Automate practice calendar uploads.
  - `grayjay_send_bulk_email(team_id, subject, html_content)`: Programmatic, reliable email broadcast with responsive templates.

### 3. GrayJay Game vs. Ice Schedule Auditor (Phase 2)
- **Status**: Shelved for Craig Cameron's immediate Phase 1 rollout to keep scheduler workflow dead simple.
- **Next Steps**:
  - Battle-test the discrepancy and conflict detection engine on Matt's own teams (**U13A Bearcats** and **U15AA**) once official league games are published.
  - Identify GrayJay calendar feed URLs (`.ics` / web endpoints) for zero-manual-input scraping.
  - Once proven and automated, package as a turnkey feature for Craig and the TAMHA Executive Admin Dashboard.
