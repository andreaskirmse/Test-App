# PROJ-1: User Authentication

## Status: Planned
**Created:** 2026-04-01
**Last Updated:** 2026-04-01

## Dependencies
- None

## User Stories
- Als Besucher möchte ich mich per E-Mail und Passwort registrieren, um Ideen einreichen und voten zu können.
- Als registrierter Nutzer möchte ich mich einloggen, um auf mein Konto zuzugreifen.
- Als eingeloggter Nutzer möchte ich mich ausloggen, um meine Sitzung zu beenden.
- Als Nutzer möchte ich mein Passwort zurücksetzen können, falls ich es vergessen habe.
- Als Admin möchte ich, dass nur Admins mit bestimmten E-Mail-Adressen Admin-Rechte haben.

## Acceptance Criteria
- [ ] Nutzer können sich mit E-Mail + Passwort registrieren
- [ ] Nach der Registrierung erhalten Nutzer eine Bestätigungs-E-Mail (Supabase Standard)
- [ ] Nutzer können sich mit korrekten Zugangsdaten einloggen
- [ ] Nutzer können sich ausloggen (Session wird beendet)
- [ ] Nutzer können Passwort-Reset per E-Mail anfordern
- [ ] Fehler bei falschen Zugangsdaten werden klar kommuniziert (kein Hinweis, ob E-Mail oder Passwort falsch ist)
- [ ] Passwort muss mindestens 8 Zeichen lang sein
- [ ] Eingeloggte Nutzer werden von Login-/Register-Seite auf das Board weitergeleitet
- [ ] Nicht eingeloggte Nutzer, die auf geschützte Seiten zugreifen, werden zum Login weitergeleitet
- [ ] Admin-Rolle wird über Supabase user_metadata oder eine `profiles`-Tabelle gesetzt

## Edge Cases
- Was passiert bei Registrierung mit einer bereits verwendeten E-Mail? → Fehlermeldung "E-Mail already in use"
- Was passiert bei zu kurzem Passwort? → Inline-Validierung vor dem Absenden
- Was passiert wenn die Bestätigungs-E-Mail nicht ankommt? → "Resend"-Option anbieten
- Was passiert wenn der Passwort-Reset-Link abgelaufen ist? → Klare Fehlermeldung mit neuem Reset-Link-Angebot
- Was passiert bei mehrfachen Login-Versuchen mit falschem Passwort? → Supabase Rate Limiting greift

## Technical Requirements
- Auth-Provider: Supabase Auth (neues, separates Supabase-Projekt)
- Session-Management: Supabase Session Cookies (SSR-kompatibel mit Next.js)
- Geschützte Routen: Middleware-basierter Schutz
- Admin-Check: `is_admin`-Flag in `profiles`-Tabelle in Supabase

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
