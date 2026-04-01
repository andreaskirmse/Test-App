# PROJ-6: Admin Panel

## Status: Planned
**Created:** 2026-04-01
**Last Updated:** 2026-04-01

## Dependencies
- PROJ-1: User Authentication (Admin-Rolle erforderlich)
- PROJ-2: Ideen einreichen (um Ideen zu moderieren)
- PROJ-3: Ideenliste (um Übersicht zu haben)
- PROJ-4: Voting (um Vote-Stats zu sehen)
- PROJ-5: Comments (um Kommentare zu moderieren)

## User Stories
- Als Admin möchte ich alle eingereichten Ideen einsehen und ihren Status ändern (z.B. Approved, Rejected, In Progress).
- Als Admin möchte ich Kommentare moderieren (löschen bei Verstößen).
- Als Admin möchte ich Statistiken sehen (Anzahl Ideen, Votes, Kommentare).
- Als Admin möchte ich Benutzer verwalten (falls nötig, aber minimal für MVP).

## Acceptance Criteria
- [ ] Geschützte Admin-Seite, nur für Nutzer mit is_admin=true zugänglich
- [ ] Ideen-Übersicht mit Filtern nach Status
- [ ] Möglichkeit, Status von Ideen zu ändern (Dropdown: Pending, Approved, Rejected, Implemented)
- [ ] Kommentare moderieren: Löschen-Button für jeden Kommentar
- [ ] Dashboard mit Metriken: Gesamt-Ideen, Votes, Kommentare, aktive Nutzer
- [ ] Admin-Aktionen werden geloggt (für Audit)
- [ ] Responsive Design für Admin-Interface

## Edge Cases
- Was passiert wenn ein Nicht-Admin die Seite aufruft? → 403 Forbidden
- Was passiert bei gleichzeitigen Änderungen? → Letzte Änderung gewinnt, mit Warnung
- Was passiert bei Löschung von Kommentaren? → Soft Delete oder Hard Delete
- Was passiert wenn viele Ideen vorhanden sind? → Pagination und Suche
- Was passiert bei Fehlern beim Speichern? → Rollback und Fehlermeldung

## Technical Requirements
- Frontend: Separate Admin-Routen mit Layout
- Backend: Supabase RLS für Admin-only Zugriff, zusätzliche Tabellen für Status und Logs
- Security: Zusätzliche Auth-Checks in Middleware
- UI: Data Tables mit shadcn/ui für Listen

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_