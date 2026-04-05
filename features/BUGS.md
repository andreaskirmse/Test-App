# Open Bugs

> Zentrale Bug-Übersicht. Wird nach jeder QA-Phase befüllt und nach jedem Fix bereinigt.
> Format: `BUG-X (Schwere) [PROJ-Y]: Beschreibung — Priorität / geplant für`

## Schwere-Legende
- **High** — Sicherheitslücke oder Datenverlust möglich
- **Medium** — Funktionaler Fehler, sichtbar für Nutzer
- **Low** — Kosmetisch, Edge-Case oder technische Schuld

---

## Offene Bugs

| ID | Schwere | Quelle | Beschreibung | Geplant für |
|----|---------|--------|--------------|-------------|
| BUG-2 | Medium | PROJ-4 | `GET /api/ideas/[id]` fehlen `vote_count` und `user_has_voted` — kein Votes-Join | Nächstes Feature mit Detailansicht |
| BUG-3 | Medium | PROJ-3 | Hover-Effekt auf Idea Cards ohne Click-Handler für kurze Beschreibungen (≤150 Zeichen, kein "Mehr lesen"-Link) | Nächstes Feature |
| BUG-4 | Medium | PROJ-1 | Kein server-seitiges Validieren auf Auth-Formularen (Supabase SDK validiert, aber verletzt Projekt-Security-Policy) | Nächstes Sprint |
| BUG-8 | Medium | PROJ-3 | Kein Rate Limiting auf öffentlichem `GET /api/ideas` — nur Vercel/Supabase-Infra-Ebene | Nächstes Sprint |
| BUG-1 | Low | PROJ-2 | Kein Link zur eingereichten Idee im Success-State (Idee startet als `pending` → wenig Mehrwert, Wontfix-Kandidat) | — |
| BUG-5 | Low | PROJ-4 | `get_ideas_paginated` RPC nutzt SECURITY DEFINER, umgeht RLS — Logik derzeit konsistent, kann aber driften | Nächstes Sprint |
| BUG-6 | Low | PROJ-3 | Kein Upper-Bound auf `?page=`-Parameter — große Werte übergeben ungeprüften Offset an RPC | Nächstes Sprint |
| BUG-7 | Low | PROJ-1 | Kein client-seitiges Rate Limiting beim Login — nur Supabase server-seitiges Rate Limiting | — |
| BUG-9 | Low | PROJ-1 | Login-Seite ignoriert `?error=callback` Query-Parameter — Fehler wird still verschluckt | Nächstes Sprint |
| BUG-10 | Low | PROJ-3 | `GET /api/ideas/[id]` nutzt `SELECT *` — könnte zukünftige sensible Spalten exponieren | Nächstes Sprint |
| BUG-11 | Low | PROJ-5 | Comments API gibt `user_id` (Supabase Auth UUID) in öffentlicher Response zurück — minor information disclosure | — |
| BUG-4b | Low | PROJ-4 | Kein Debounce auf Vote-Toggle — rapid clicks senden mehrere Requests (DB-Constraint verhindert Datenfehler) | — |

---

## Erledigte Bugs (Referenz)

| ID | Quelle | Beschreibung | Erledigt in |
|----|--------|--------------|-------------|
| BUG-6 | PROJ-1 | UpdatePasswordForm zeigte Weiterleitung an, leitete aber nie weiter | PROJ-1 Fix |
| BUG-4 | PROJ-3 | Kein "Mehr lesen"-Link bei gekürzten Beschreibungen | PROJ-5 |
| BUG-8 | PROJ-1 | `GITHUB_ACCESS_TOKEN` in `.env.local` ungenutzt | 2026-04-05 (manuell entfernt) |
| BUG-4 | PROJ-2 | Umlaut-Inkonsistenzen in user-facing Texten | 2026-04-05 (globaler Umlaut-Fix) |
