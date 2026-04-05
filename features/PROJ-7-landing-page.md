# PROJ-7: Landing Page

## Status: Deployed
**Created:** 2026-04-05
**Last Updated:** 2026-04-05

## Dependencies
- None (vollständig öffentlich, kein Login erforderlich)

## User Stories
- Als Besucher möchte ich beim Aufruf der App-URL eine ansprechende Startseite sehen, damit ich sofort verstehe, worum es geht.
- Als Besucher möchte ich einen direkten Link zum Login sehen, damit ich mich schnell einloggen oder registrieren kann.
- Als Besucher möchte ich einen direkten Link zum Ideenboard sehen, damit ich die Ideen auch ohne Registrierung anschauen kann.
- Als eingeloggter User möchte ich vom Board direkt zur Startseite navigieren können, damit ich jederzeit zurückfinden kann.

## Acceptance Criteria
- [ ] AC-1: Die Root-URL `/` zeigt die Landing Page (kein Redirect mehr zu `/board`)
- [ ] AC-2: Überschrift "Voting App für Verbesserungsvorschläge" ist prominent sichtbar
- [ ] AC-3: Willkommenstext mit Ausrufezeichen ist unterhalb der Überschrift sichtbar
- [ ] AC-4: Link "Anmelden" führt zu `/login`
- [ ] AC-5: Link "Zum Ideenboard" führt zu `/board`
- [ ] AC-6: Die Seite ist ohne Login zugänglich (vollständig öffentlich)
- [ ] AC-7: Die Seite ist responsiv (mobile + desktop)

## Edge Cases
- Eingeloggter User ruft `/` auf → Landing Page wird trotzdem angezeigt (kein Auto-Redirect)
- Beide Links müssen auch auf mobilen Geräten gut klickbar sein (Touch-Targets)

## Technical Requirements
- Server Component (kein `"use client"` nötig — keine Interaktivität)
- Ersetzt den bisherigen `redirect('/board')` in `src/app/page.tsx`
- Keine Auth-Abhängigkeit

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
