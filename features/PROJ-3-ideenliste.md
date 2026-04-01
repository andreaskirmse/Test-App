# PROJ-3: Ideenliste

## Status: Planned
**Created:** 2026-04-01
**Last Updated:** 2026-04-01

## Dependencies
- PROJ-2: Ideen einreichen (damit es Ideen gibt, die angezeigt werden)

## User Stories
- Als Besucher möchte ich alle eingereichten Ideen einsehen, um mich über Vorschläge zu informieren.
- Als Community-Mitglied möchte ich Ideen nach Anzahl der Votes sortiert sehen, um beliebte Ideen zu finden.
- Als Nutzer möchte ich Ideen nach Erstellungsdatum sortiert sehen, um neue Ideen zu entdecken.
- Als Nutzer möchte ich die Ideenliste durchblättern, falls es viele Ideen gibt.

## Acceptance Criteria
- [ ] Öffentliche Seite zeigt alle eingereichten Ideen
- [ ] Jede Idee zeigt: Titel, Beschreibung (gekürzt), Anzahl Votes, Erstellungsdatum, Autor (anonym oder Name)
- [ ] Sortierung: Standard nach Votes absteigend, Option nach Datum absteigend
- [ ] Pagination: 10 Ideen pro Seite
- [ ] Suche nach Titel oder Beschreibung (optional für MVP, aber nice-to-have)
- [ ] Ideen sind klickbar und führen zur Detailansicht (wird in späterem Feature implementiert)
- [ ] Seite lädt schnell (< 2 Sekunden für 100 Ideen)

## Edge Cases
- Was passiert wenn keine Ideen vorhanden sind? → Leere Zustandsmeldung mit Call-to-Action zum Einreichen
- Was passiert bei vielen Ideen? → Pagination verhindert Performance-Probleme
- Was passiert bei gleichen Vote-Zahlen? → Sekundäre Sortierung nach Datum
- Was passiert bei langen Beschreibungen? → Text wird gekürzt mit "Mehr lesen"-Link

## Technical Requirements
- Frontend: Next.js Seite mit Server-Side Rendering für SEO
- Backend: Supabase Query für Ideen mit Joins für Vote-Counts
- Performance: Datenbank-Indizes auf votes und created_at
- UI: Responsive Design mit shadcn/ui Komponenten

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_