# TAMHA Manager Docs — Roadmap & To-Do List

This document tracks upcoming features, architectural initiatives, and tooling ideas for the TAMHA team management ecosystem.

---

## 📌 High Priority / Active Roadmap

### 1. Official Google Workspace Email Template Workflow (Skipping GrayJay Bulk Emailer)
- **Decision & Rationale**: Skip the GrayJay bulk emailer completely in favor of the official association Google Workspace account (`u13amgr@trurominorhockey.ca`). 
  - GrayJay's bulk emailer suffers from poor deliverability (frequently routed to spam/promotions), broken WYSIWYG mobile responsiveness (microscopic fixed-width containers), and an inability to cleanly manage parent reply threads.
  - Using official Google Workspace with native Gmail Templates and Google Contacts BCC distribution provides 100% deliverability, automatic mobile rendering, clean two-way reply threads, and robust PII protection.
- **Implemented Artifacts**:
  - `04-Forms-and-Templates/Weekly-Email-Update-Template.md`: Master Tuesday weekly dispatch template and Gmail Templates setup guide.
- **GrayJay Scope Boundary**:
  - Restrict GrayJay strictly to its strengths: schedule calendar RSVP / sync, electronic game sheet (EGS) roster sign-offs, and live chat for urgent day-of rink updates.

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
