# PROJ-5: Comments

## Status: Planned
**Created:** 2026-04-01
**Last Updated:** 2026-04-01

## Dependencies
- PROJ-1: User Authentication (Kommentare erfordern Login)
- PROJ-3: Ideenliste (um zu Ideen zu navigieren und Kommentare zu sehen)

## User Stories
- Als Community-Mitglied möchte ich Kommentare zu Ideen schreiben, um meine Gedanken zu teilen.
- Als Nutzer möchte ich Kommentare anderer lesen, um Diskussionen zu verfolgen.
- Als Autor einer Idee möchte ich Feedback durch Kommentare erhalten.
- Als Admin möchte ich Kommentare moderieren können (wird in PROJ-6 erweitert).

## Acceptance Criteria
- [ ] Eingeloggte Nutzer können Kommentare zu Ideen schreiben
- [ ] Kommentar-Formular mit Textfeld (max. 500 Zeichen)
- [ ] Kommentare werden unter der Idee angezeigt, sortiert nach Datum
- [ ] Jeder Kommentar zeigt: Text, Autor, Datum
- [ ] Nicht eingeloggte Nutzer können Kommentare lesen, aber nicht schreiben
- [ ] Kommentare werden in der Datenbank gespeichert (Tabelle: comments mit user_id, idea_id, text, created_at)
- [ ] Grundlegende Moderation: Keine leeren Kommentare, Spam-Filter (einfach)

## Edge Cases
- Was passiert bei leeren Kommentaren? → Validierung verhindert Absenden
- Was passiert bei sehr langen Kommentaren? → Client-seitige Begrenzung
- Was passiert wenn eine Idee gelöscht wird? → Kommentare werden mitgelöscht
- Was passiert bei gleichzeitigen Kommentaren? → Sortierung nach created_at
- Was passiert bei Netzwerkfehlern? → Fehlermeldung und Retry

## Technical Requirements
- Frontend: Kommentar-Liste mit Infinite Scroll oder Pagination
- Backend: Supabase API für CRUD-Operationen auf comments
- UI: Einfache Textarea mit shadcn/ui
- Performance: Lazy Loading für viele Kommentare

## Notes
- **BUG-4 (PROJ-3):** Idea cards truncate descriptions at 150 chars with `…` but have no "Mehr lesen" link. When the detail page is built here, add a "Mehr lesen" link to `idea-card.tsx` that navigates to the idea detail page.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_