                # PROJ-2: Ideen einreichen

## Status: In Review
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

**Tested:** 2026-04-02
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Method:** Code review + build verification (production build passes successfully)

### Acceptance Criteria Status

#### AC-1: Eingeloggte Nutzer koennen auf eine "Idee einreichen"-Seite zugreifen
- [x] `/submit` is listed in `protectedPaths` in middleware -- authenticated users can access
- [x] Board page has "Idee einreichen" button linking to `/submit`
- **Status: PASS**

#### AC-2: Formular mit Feldern: Titel (erforderlich, max. 100 Zeichen), Beschreibung (erforderlich, min. 20 Zeichen, max. 500 Zeichen)
- [x] Title field present with `maxLength={100}` on Input
- [x] Description field present with `maxLength={500}` on Textarea
- [x] Zod schema enforces: title min 1, max 100; description min 20, max 500
- [x] Character counters displayed for both fields
- [x] Orange warning color when approaching limits
- **Status: PASS**

#### AC-3: Nach erfolgreicher Einreichung wird die Idee in der Datenbank gespeichert
- [x] POST /api/ideas inserts into `ideas` table with `user_id`, `title`, `description`
- [x] Database constraints enforce field lengths and valid status values
- [x] RLS INSERT policy ensures `user_id = auth.uid()`
- **Status: PASS**

#### AC-4: Nutzer wird zu einer Bestaetigungsseite weitergeleitet mit Link zur eingereichten Idee
- [x] Success state displays confirmation message with green checkmark
- [x] Success state shows the submitted idea title
- [ ] BUG: No link to the individual submitted idea (see BUG-1)
- [ ] BUG: Not a separate confirmation page/redirect -- inline state change in same component (minor deviation from spec wording, acceptable UX pattern)
- **Status: PARTIAL PASS**

#### AC-5: Nicht eingeloggte Nutzer werden zum Login weitergeleitet
- [x] Middleware redirects unauthenticated users from `/submit` to `/login`
- [x] Client-side session check in `onSubmit` redirects to `/login` if session expired mid-form
- **Status: PASS**

#### AC-6: Titel und Beschreibung werden validiert (nicht leer, Laengenbegrenzungen)
- [x] Client-side: Zod schema validates before submission
- [x] Server-side: Zod schema validates in POST handler
- [x] Database: CHECK constraints as final defense layer
- [ ] BUG: No `.trim()` in validation -- whitespace-only input passes (see BUG-2)
- **Status: PARTIAL PASS**

#### AC-7: Fehlerhafte Eingaben werden mit klaren Fehlermeldungen angezeigt
- [x] Field-level validation errors displayed via FormMessage
- [x] Server-side validation errors (400 with details) mapped back to individual form fields
- [x] Rate limit error (429) displayed as general error banner
- [x] Network/connection errors caught and displayed
- [x] German error messages throughout
- **Status: PASS**

### Edge Cases Status

#### EC-1: Netzwerkfehler waehrend der Einreichung
- [x] Try-catch around fetch, displays "Verbindungsfehler" message with retry guidance
- **Status: PASS**

#### EC-2: Doppelte Einreichung derselben Idee
- [x] No duplicate detection -- allowed as per spec ("Ideen koennen aehnlich sein")
- [x] Rate limiting (5/hour) prevents rapid spam
- **Status: PASS**

#### EC-3: Zu lange Eingaben
- [x] HTML `maxLength` attribute prevents typing beyond limit on client
- [x] Zod enforces max length on server
- [x] Database CHECK constraint as final defense
- **Status: PASS**

#### EC-4: Server nicht erreichbar
- [x] Catch block handles fetch failures with offline error message
- **Status: PASS**

#### EC-5 (Additional): Double-submit prevention
- [x] Submit button disabled during loading (`disabled={isLoading}`)
- [x] Loading spinner shown during submission
- **Status: PASS**

#### EC-6 (Additional): Session expiry mid-form
- [x] Client checks session before API call, redirects to login if expired
- [x] Server returns 401 if auth fails, client handles gracefully
- **Status: PASS**

### Cross-Browser Testing
- Note: Code review only -- no runtime browser testing performed. The implementation uses standard React/HTML patterns and shadcn/ui components which are cross-browser compatible. Manual testing in Chrome, Firefox, and Safari is recommended before deployment.

### Responsive Testing
- Note: Code review only. The layout uses `max-w-lg` centered with `px-4` padding, `min-h-screen` centering. The success state uses `flex-col gap-2 sm:flex-row` for responsive button layout. These patterns should work correctly at 375px, 768px, and 1440px but should be verified manually.

### Security Audit Results

#### Authentication
- [x] Middleware protects `/submit` route -- unauthenticated users redirected
- [x] All API routes (GET, POST, PATCH, DELETE) verify authentication via `supabase.auth.getUser()`
- [x] Client-side session check catches expired sessions before API call
- **Status: PASS**

#### Authorization
- [x] RLS INSERT policy: `user_id = auth.uid()` -- users can only create ideas for themselves
- [x] RLS SELECT policy: approved ideas OR own ideas only
- [x] RLS UPDATE/DELETE: own ideas only
- [x] API-level ownership check (defense in depth) on PATCH and DELETE routes
- [x] POST route explicitly sets `user_id: user.id` from server-side auth -- client cannot spoof user_id
- **Status: PASS**

#### Input Validation / Injection
- [x] Zod validates all inputs server-side before database operations
- [x] Supabase client uses parameterized queries -- SQL injection not possible
- [x] React JSX auto-escapes output -- XSS via stored idea content not possible
- [x] Invalid JSON request body returns 400 error
- [x] UUID format validation on all `[id]` routes prevents malformed ID injection
- [ ] BUG: No input trimming -- whitespace strings pass validation (see BUG-2)
- **Status: PASS (with minor concern)**

#### Rate Limiting
- [x] Server-side rate limiting: max 5 ideas per user per hour
- [x] Database-based counting (no client-side bypass possible)
- [x] Rate limit query filters by `user_id` and `created_at >= windowStart`
- [x] Clear error message with 429 status code
- **Status: PASS**

#### Data Exposure
- [x] API responses return idea objects but no sensitive user data beyond user_id
- [x] No secrets in client-side code -- only NEXT_PUBLIC_ env vars used in browser
- [x] Security headers configured (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS)
- [ ] Note: No Content-Security-Policy header configured (documented in production guide as optional)
- **Status: PASS**

#### CSRF
- [x] Supabase auth uses cookies with appropriate settings
- [x] API routes validate auth token from cookie -- standard Next.js CSRF protection via same-origin
- **Status: PASS**

### Regression Testing (PROJ-1: User Authentication)
- [x] Login/register pages still compile (build succeeds)
- [x] Auth middleware still protects `/board` and `/admin`
- [x] Auth page redirect (logged-in users to /board) still in middleware
- [x] Logout route still present at `/api/auth/logout`
- [x] No changes to auth components -- zero regression risk
- **Status: PASS**

### Bugs Found

#### BUG-1: Success state has no link to the individual submitted idea
- **Severity:** Low
- **Steps to Reproduce:**
  1. Go to /submit (logged in)
  2. Fill in title and description with valid data
  3. Submit the form
  4. Expected: Success state includes a link to view the submitted idea (e.g., `/ideas/{id}`)
  5. Actual: Success state only shows "Zum Board" link and "Weitere Idee einreichen" button. No link to the specific idea.
- **Note:** AC-4 says "Nutzer wird zu einer Bestaetigungsseite weitergeleitet mit Link zur eingereichten Idee." The idea ID is available in `submittedIdea.id` but no link is rendered. This is partly because there is no idea detail page yet (PROJ-3 Ideenliste is still Planned), so this may be intentional for now.
- **Priority:** Fix in next sprint (when PROJ-3 idea detail pages are built)

#### BUG-2: Whitespace-only input bypasses validation
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Go to /submit (logged in)
  2. Enter a title consisting of only spaces (e.g., "     ")
  3. Enter a description of 20+ spaces
  4. Submit the form
  5. Expected: Validation rejects whitespace-only input
  6. Actual: Zod schema uses `.min(1)` / `.min(20)` which count whitespace characters. No `.trim()` is applied. Whitespace-only strings pass validation on both client and server. The database CHECK constraint also counts whitespace.
- **Impact:** Ideas with blank-looking titles/descriptions could be created, polluting the idea list.
- **Priority:** Fix before deployment

#### BUG-3: Missing `updated_at` column on ideas table
- **Severity:** Low
- **Steps to Reproduce:**
  1. Review the SQL migration for the ideas table
  2. Note that PATCH /api/ideas/[id] allows updating title and description
  3. Expected: An `updated_at` timestamp column that auto-updates on modification
  4. Actual: No `updated_at` column exists. There is no way to know when an idea was last edited.
- **Impact:** Future features (sorting by recent activity, showing "edited" badges) will require a migration.
- **Priority:** Fix in next sprint

#### BUG-4: German umlauts missing in user-facing text
- **Severity:** Low
- **Steps to Reproduce:**
  1. Open the submit form component (`src/components/ideas/submit-idea-form.tsx`)
  2. Read placeholder text and messages
  3. Expected: Proper German umlauts (ae/oe/ue should be rendered as actual umlauts in displayed text)
  4. Actual: Text uses ASCII approximations: "moeglich" instead of "moeglich", "aussagekraeftiger" instead of proper characters, "pruefe" instead of proper form, "spaeter" instead of proper form. Note: The Zod error messages in `ideas.ts` DO use proper umlauts ("Laengenbegrenzungen"), so this is inconsistent.
- **Note:** This appears to be a deliberate encoding-safety choice (commit 7c59ec8 mentions "Fix umlaut encoding"), but the result is user-facing text that looks incorrect in German. The Zod validation messages DO contain proper German text, creating inconsistency.
- **Priority:** Nice to have (cosmetic, but affects perceived quality for German users)

### Summary
- **Acceptance Criteria:** 5/7 fully passed, 2/7 partial pass (AC-4 missing idea link, AC-6 whitespace bypass)
- **Bugs Found:** 4 total (0 critical, 0 high, 1 medium, 3 low)
- **Security:** PASS -- authentication, authorization, RLS, rate limiting, input validation, and security headers all properly implemented. Defense-in-depth pattern used correctly.
- **Production Ready:** YES (conditional)
- **Recommendation:** Fix BUG-2 (whitespace validation) before deployment. BUG-1 and BUG-3 can wait for PROJ-3. BUG-4 is cosmetic.

## Deployment
_To be added by /deploy_