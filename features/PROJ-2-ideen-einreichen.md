# PROJ-2: Ideen einreichen

## Status: Planned
**Created:** 2026-04-01
**Last Updated:** 2026-04-01

## Dependencies
- PROJ-1: User Authentication (Nutzer müssen eingeloggt sein, um Ideen einzureichen)

## User Stories
- Als Community-Mitglied möchte ich eine neue Idee einreichen, um meine Vorschläge mit dem Produktteam zu teilen.
- Als eingeloggter Nutzer möchte ich einen Titel und eine Beschreibung für meine Idee angeben.
- Als Nutzer möchte ich nach der Einreichung eine Bestätigung sehen, dass meine Idee erfolgreich eingereicht wurde.

## Acceptance Criteria
- [ ] Eingeloggte Nutzer können auf eine "Idee einreichen"-Seite zugreifen
- [ ] Formular mit Feldern: Titel (erforderlich, max. 100 Zeichen), Beschreibung (erforderlich, min. 20 Zeichen, max. 500 Zeichen)
- [ ] Nach erfolgreicher Einreichung wird die Idee in der Datenbank gespeichert
- [ ] Nutzer wird zu einer Bestätigungsseite weitergeleitet mit Link zur eingereichten Idee
- [ ] Nicht eingeloggte Nutzer werden zum Login weitergeleitet
- [ ] Titel und Beschreibung werden validiert (nicht leer, Längenbegrenzungen)
- [ ] Fehlerhafte Eingaben werden mit klaren Fehlermeldungen angezeigt

## Edge Cases
- Was passiert bei Netzwerkfehlern während der Einreichung? → Fehlermeldung und Möglichkeit, erneut zu versuchen
- Was passiert bei doppelter Einreichung derselben Idee? → Erlaubt, da Ideen ähnlich sein können
- Was passiert bei zu langen Eingaben? → Client-seitige Validierung verhindert Absenden
- Was passiert wenn der Server nicht erreichbar ist? → Offline-Fehlermeldung

## Technical Requirements
- Frontend: Formular mit React Hook Form und Zod-Validierung
- Backend: Supabase API für das Speichern der Idee (Tabelle: ideas mit user_id, title, description, created_at)
- Auth: Middleware prüft eingeloggten Status

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_