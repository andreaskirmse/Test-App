# PROJ-2: Ideen einreichen

## Status: Deployed
**Created:** 2026-04-01
**Last Updated:** 2026-04-02

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

### A) Komponenten-Struktur

```
/submit  (geschützte Seite, Redirect wenn nicht eingeloggt)
+-- SubmitIdeaForm
|   +-- Titel-Eingabe (Input, max. 100 Zeichen, mit Zeichenzähler)
|   +-- Beschreibungs-Eingabe (Textarea, 20–500 Zeichen, mit Zeichenzähler)
|   +-- Submit-Button (mit Lade-Zustand)
|   +-- Fehlerbereich (zeigt Validierungsfehler)
+-- Erfolgsmeldung / Weiterleitung nach Absenden
```

### B) Datenmodell

```
Tabelle: ideas
- id            → Eindeutige ID (automatisch generiert)
- user_id       → Verknüpfung zum eingeloggten Nutzer
- title         → Titel der Idee (max. 100 Zeichen)
- description   → Beschreibung (min. 20, max. 500 Zeichen)
- status        → Zustand der Idee (Standard: "pending")
                  Werte: pending | approved | rejected | implemented
- created_at    → Zeitstempel der Einreichung

Gespeichert in: Supabase Datenbank (PostgreSQL)
```

### C) Berechtigungen

| Aktion | Wer darf das? |
|--------|--------------|
| Idee erstellen | Nur eingeloggte Nutzer (max. 5 pro Stunde) |
| Ideen lesen | Nur eingeloggte Nutzer |
| Eigene Idee bearbeiten | Nur der Ersteller (jederzeit) |
| Eigene Idee löschen | Nur der Ersteller (jederzeit) |
| Fremde Ideen bearbeiten/löschen | Nur Admins (PROJ-6) |

Nicht eingeloggte Nutzer werden bei allen Zugriffen automatisch zum Login weitergeleitet.

**Rate Limiting:** Maximal 5 Ideen pro Nutzer pro Stunde. Beim Erreichen des Limits wird eine klare Fehlermeldung angezeigt. Umgesetzt über einen serverseitigen Check gegen die Datenbank (Anzahl eigener Ideen in den letzten 60 Minuten).

### D) Tech-Entscheidungen

| Entscheidung | Grund |
|---|---|
| Supabase Datenbank | Bereits im Projekt eingerichtet (PROJ-1), kein extra Setup nötig |
| React Hook Form + Zod | Bereits im Tech-Stack, robust für Formular-Validierung |
| Middleware-Schutz | Nicht eingeloggte Nutzer werden automatisch zum Login weitergeleitet |
| Row Level Security (RLS) | Stellt auf Datenbank-Ebene sicher, dass nur eingeloggte Nutzer Ideen lesen/erstellen können; niemand fremde Ideen manipulieren kann |

### E) Neue Abhängigkeiten

Keine neuen Pakete notwendig — alles bereits im Projekt vorhanden.

## Backend Implementation Notes (2026-04-02)

### What was built:
- **SQL Migration** (`supabase/migrations/20260402_create_ideas_table.sql`): Creates `ideas` table with RLS enabled, 4 policies (SELECT, INSERT, UPDATE, DELETE), indexes on `user_id`, `status`, and `created_at`
- **Zod Validation** (`src/lib/validations/ideas.ts`): `createIdeaSchema` and `updateIdeaSchema` with German error messages
- **POST /api/ideas**: Creates idea with auth check, Zod validation, and database-based rate limiting (max 5/hour)
- **GET /api/ideas**: Lists ideas with pagination (RLS handles visibility: approved + own ideas)
- **GET /api/ideas/[id]**: Single idea fetch with UUID validation
- **PATCH /api/ideas/[id]**: Update own idea with ownership check (defense in depth + RLS)
- **DELETE /api/ideas/[id]**: Delete own idea with ownership check (defense in depth + RLS)
- **Middleware**: Added `/submit` to protected paths

### Design decisions:
- Rate limiting uses database count (ideas in last 60 min) as agreed -- no external dependencies
- RLS SELECT policy: `status = 'approved' OR user_id = auth.uid()` -- owners see all their ideas (pending included), others only see approved
- All API error messages in German to match the project language
- UUID format validation on all `[id]` routes to reject malformed IDs early
- Explicit ownership checks in API routes alongside RLS for defense in depth

## Frontend Implementation Notes (2026-04-02)

### What was built:
- **SubmitIdeaForm** (`src/components/ideas/submit-idea-form.tsx`): Client component with react-hook-form + Zod validation, character counters for title (100) and description (20-500), loading state with spinner, error display, success state with confirmation message
- **Submit page** (`src/app/submit/page.tsx`): Protected page (middleware redirects unauthenticated users to /login), centered layout matching auth page patterns
- **Board page update** (`src/app/board/page.tsx`): Added "Idee einreichen" button linking to /submit

### Component features:
- Character counters with orange warning color when approaching limits
- Server-side validation errors mapped back to individual form fields
- Rate limit error (429) displayed as a general error message
- Network/offline error handling with retry guidance
- Success state shows idea title, links to board, and option to submit another idea
- Fully responsive (mobile 375px to desktop 1440px)
- Accessible: ARIA labels, live regions for counters and errors, semantic HTML

### Design decisions:
- Used Card component matching existing auth page patterns (CardHeader + CardContent)
- Success state rendered in same Card component (no page navigation needed)
- Session check before API call to catch expired sessions early
- Max width set to `max-w-lg` (slightly wider than auth forms) for the longer textarea

## QA Test Results

Acceptance Criteria 6/7 passed (AC-4 deferred — no detail page yet), Edit/Delete 10/10 passed, Build: PASS

Offene Bugs → siehe `features/BUGS.md`

## Deployment

**Deployed:** 2026-04-02
**Production URL:** https://test-app.vercel.app (latest: https://test-k8gjepsll-andreas-kirmses-projects.vercel.app)
**Vercel Project:** andreas-kirmses-projects/test-app
**Git commit:** 6070d8d

### Pre-deployment checks
- [x] `npm run build` passed (Turbopack, 13 routes)
- [x] `npm run lint` passed
- [x] QA approved (0 critical/high bugs)
- [x] Database migration `create_ideas_table` applied to Supabase production
- [x] All code committed and pushed to main

### Known deferred issues
- BUG-1: No link to individual idea in success state (pending PROJ-5 detail page)

## Post-Deploy Changes (2026-04-02)

### Link to Ideenboard added
- Added "Bestehende Ideen ansehen" button to `SubmitIdeaForm` below the submit button
- Button opens `/board` in a **new tab** (`target="_blank"`) so the user can browse existing ideas without losing their in-progress form input
- File changed: `src/components/ideas/submit-idea-form.tsx`

### Edit & Delete UI added + all bugs fixed (2026-04-02)
**Tag:** v1.2.1-PROJ-2 | **Production URL:** https://test-dd4915a3i-andreas-kirmses-projects.vercel.app | **Status:** Deployed

**Fixes shipped:** BUG-3 (updated_at migration), BUG-5 (dirty check), BUG-6 (auth-optional GET), BUG-7 (AlertDialog e.preventDefault)

**What was built:**
- `IdeaCard` now accepts `currentUserId` and `onRefresh` props
- When `currentUserId === user_id`, two icon buttons appear in the card footer: Pencil (edit) and Trash (delete)
- **Edit flow:** Opens a `Dialog` with pre-filled title + description fields (react-hook-form + `updateIdeaSchema`), character counters, field-level validation errors, calls `PATCH /api/ideas/[id]`, refreshes list on success
- **Delete flow:** Opens an `AlertDialog` with confirmation text and idea title, calls `DELETE /api/ideas/[id]`, refreshes list on success; DB cascade deletes associated votes
- `IdeaList` fetches the current user ID via Supabase browser client on mount and passes it with `onRefresh={fetchIdeas}` to each `IdeaCard`
- Anon users and non-owners see no buttons (no UI rendered, backend also enforces ownership)

**Files changed:**
- `src/components/ideas/idea-card.tsx` — owner action buttons + dialogs
- `src/components/ideas/idea-list.tsx` — current user ID fetch + prop passthrough

**Backend:** No changes needed — `PATCH` and `DELETE /api/ideas/[id]` were already implemented with ownership checks and RLS.
