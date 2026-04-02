# PROJ-4: Voting

## Status: Deployed
**Created:** 2026-04-01
**Last Updated:** 2026-04-02

## Dependencies
- PROJ-1: User Authentication (nur eingeloggte Nutzer können voten)
- PROJ-3: Ideenliste (um Votes anzuzeigen)

## User Stories
- Als Community-Mitglied möchte ich für Ideen upvoten, die mir gefallen, um meine Unterstützung zu zeigen.
- Als Nutzer möchte ich mein Vote zurücknehmen, falls ich meine Meinung ändere.
- Als Autor einer Idee möchte ich die Anzahl der Votes sehen, um Feedback zu bekommen.
- Als Admin möchte ich, dass Votes fair und manipulationsfrei sind.

## Acceptance Criteria
- [x] Eingeloggte Nutzer können Ideen upvoten (ein Vote pro Idee pro Nutzer)
- [x] Vote-Button zeigt aktuelle Anzahl und ob bereits gevotet
- [x] Nach Vote wird die Anzahl sofort aktualisiert (ohne Seitenreload)
- [x] Nutzer können ihr Vote zurücknehmen
- [x] Nicht eingeloggte Nutzer sehen Vote-Counts, aber können nicht voten
- [x] Votes werden in der Datenbank gespeichert (Tabelle: votes mit user_id, idea_id)
- [x] Keine Downvotes (nur Upvotes, wie Reddit)
- [ ] Vote-Counts werden in der Ideenliste und Detailansicht angezeigt (Ideenliste: PASS, Detailansicht: missing vote data -- BUG-2)

## Edge Cases
- Was passiert bei doppelten Votes? → Datenbank-Constraint verhindert Duplikate
- Was passiert bei Netzwerkfehlern beim Voten? → Fehlermeldung und Retry-Option
- Was passiert wenn ein Nutzer seine Idee votet? → Erlaubt (Selbst-Votes sind ok)
- Was passiert bei gleichzeitigen Votes? → Datenbank-Transaktionen verhindern Inkonsistenzen
- Was passiert wenn eine Idee gelöscht wird? → Votes werden mitgelöscht (Foreign Key)

## Technical Requirements
- Frontend: Optimistische UI-Updates mit React State
- Backend: Supabase RPC-Funktion für Vote-Handling (Insert/Delete)
- Security: RLS-Policies verhindern Manipulation (nur eigene Votes)
- Performance: Vote-Counts werden gecached oder mit Views berechnet

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure

```
IdeaCard (existing — extended)
+-- VoteButton (NEW — replaces static Badge)
    +-- ThumbsUp icon (lucide-react)
    +-- Vote count number
    +-- Loading spinner (during API call)
    +-- Tooltip: "Anmelden zum Voten" (logged-out users)
```

### Data Model

**New table: `votes`**
- `id` — unique identifier
- `user_id` — who voted (links to auth.users)
- `idea_id` — which idea (links to ideas)
- `created_at` — when the vote was cast
- Constraint: one vote per user per idea (database-enforced unique)

**Extended ideas query returns:**
- `vote_count` — total votes (already in IdeaCard props, currently static)
- `user_has_voted` — boolean, whether the requesting user has voted (new)

### API Design

**New endpoint: `/api/ideas/[id]/vote`**
- `POST` → cast a vote (idempotent)
- `DELETE` → remove a vote
- Protected by Supabase RLS: users can only insert/delete their own votes

### Tech Decisions

| Decision | Choice | Why |
|---|---|---|
| Optimistic UI | React useState | Instant feedback — no waiting for server |
| Vote storage | Supabase votes table | Persistent, enforces one-vote-per-user at DB level |
| Vote counting | DB aggregation | Always accurate, computed server-side |
| Auth check | Supabase session | Reuses existing PROJ-1 auth |
| Error handling | Revert + Toast (sonner) | User sees what happened, can retry |

### Existing Code Changes

- `IdeaCard` — static vote Badge → interactive VoteButton; props extended with `userHasVoted`
- `/api/ideas` route — query extended to include `user_has_voted` when user is logged in
- `IdeaList` — passes new props down to IdeaCard

### Dependencies

No new packages — all already installed:
- `lucide-react` (ThumbsUp icon)
- `sonner` (error toasts)
- Supabase client (already configured)

## Implementation Notes (Backend)

### Database
- Migration: `supabase/migrations/20260402_proj4_create_votes_table.sql`
- Table: `votes` with `id`, `user_id`, `idea_id`, `created_at`
- UNIQUE constraint on `(user_id, idea_id)` prevents duplicate votes
- Index on `idea_id` for fast vote counting
- RLS enabled: SELECT for all authenticated users, INSERT/DELETE for own votes only
- No UPDATE policy (votes are immutable)
- Foreign keys CASCADE on delete for both `auth.users` and `ideas`

### API
- `POST /api/ideas/[id]/vote` — idempotent vote cast (upsert with ignoreDuplicates)
- `DELETE /api/ideas/[id]/vote` — remove own vote
- Both endpoints return `{ voted: boolean, vote_count: number }`
- Auth required, UUID validation, idea existence check

### Ideas List Changes
- `GET /api/ideas` now joins `votes(user_id)` to compute `vote_count` and `user_has_voted`
- `?sort=votes` sorts by vote count DESC, tie-break by `created_at` DESC (newest first)
- Sorting done in-memory after fetch (within page) since Supabase cannot order by aggregated join count

### Frontend Props
- `IdeaCard` now accepts `user_has_voted: boolean` prop
- Badge variant changes to `default` when user has voted (visual feedback)
- `IdeaList` Idea interface updated to include `user_has_voted`

### Design Decisions
- No additional rate limiting beyond DB unique constraint (per user requirement)
- Vote sorting applied client-side within page (Supabase limitation with joined aggregates)
- Upsert with `ignoreDuplicates` for idempotent POST behavior

## QA Test Results

**Tested:** 2026-04-02 (Re-test after fix commit 45c683e)
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASS (npm run build succeeds, no TypeScript errors)

### Acceptance Criteria Status

#### AC-1: Eingeloggte Nutzer koennen Ideen upvoten (ein Vote pro Idee pro Nutzer)
- [x] POST /api/ideas/[id]/vote requires authentication (returns 401 without auth)
- [x] Upsert with ignoreDuplicates enforces one-vote-per-user-per-idea at DB level
- [x] VoteButton component sends POST request on click
- [x] UNIQUE constraint (user_id, idea_id) in migration prevents duplicates
- **Result: PASS**

#### AC-2: Vote-Button zeigt aktuelle Anzahl und ob bereits gevotet
- [x] VoteButton renders vote count number
- [x] hasVoted state controls filled ThumbsUp icon (fill-current class)
- [x] Button variant changes from "outline" to "default" when voted
- [x] aria-pressed attribute reflects voted state for accessibility
- **Result: PASS**

#### AC-3: Nach Vote wird die Anzahl sofort aktualisiert (ohne Seitenreload)
- [x] Optimistic UI update: count and state change immediately before API call
- [x] Server response syncs final truth (data.voted, data.vote_count)
- [x] On error, optimistic update is reverted to previous values
- **Result: PASS**

#### AC-4: Nutzer koennen ihr Vote zuruecknehmen
- [x] DELETE /api/ideas/[id]/vote endpoint implemented
- [x] VoteButton toggles between POST and DELETE based on hasVoted state
- [x] DELETE returns { voted: false, vote_count: N }
- **Result: PASS**

#### AC-5: Nicht eingeloggte Nutzer sehen Vote-Counts, aber koennen nicht voten
- [x] FIX VERIFIED: /board removed from protected paths in middleware (only /admin, /submit are protected now)
- [x] FIX VERIFIED: GET /api/ideas now works without auth -- uses optional auth, returns user_has_voted=false for anon
- [x] FIX VERIFIED: Anon RLS policies added for ideas (approved only) and votes tables
- [x] VoteButton renders read-only div with tooltip "Anmelden zum Voten" for logged-out users
- [x] No click handler attached to logged-out view
- **Result: PASS (BUG-1 fixed)**

#### AC-6: Votes werden in der Datenbank gespeichert (Tabelle: votes mit user_id, idea_id)
- [x] Migration creates votes table with id, user_id, idea_id, created_at
- [x] Foreign keys to auth.users and ideas with CASCADE delete
- [x] RLS enabled with SELECT, INSERT, DELETE policies
- **Result: PASS**

#### AC-7: Keine Downvotes (nur Upvotes, wie Reddit)
- [x] Only POST (upvote) and DELETE (remove upvote) endpoints exist
- [x] No downvote mechanism in UI or API
- [x] PUT and PATCH return 405 Method Not Allowed (Next.js App Router default)
- **Result: PASS**

#### AC-8: Vote-Counts werden in der Ideenliste und Detailansicht angezeigt
- [x] Ideenliste: get_ideas_paginated RPC joins votes table and computes vote_count
- [ ] BUG: Detailansicht (GET /api/ideas/[id]) does NOT include vote_count or user_has_voted (see BUG-2)
- **Result: PARTIAL FAIL (BUG-2 remains)**

### Edge Cases Status

#### EC-1: Doppelte Votes
- [x] Database UNIQUE constraint (votes_user_idea_unique) prevents duplicates
- [x] Upsert with ignoreDuplicates handles gracefully (no error thrown)

#### EC-2: Netzwerkfehler beim Voten
- [x] Optimistic update is reverted on error
- [x] Toast error message shown via sonner
- [x] User can click vote button again to retry (acceptable UX)

#### EC-3: Nutzer votet eigene Idee
- [x] No restriction in API or UI -- self-votes are allowed as documented

#### EC-4: Gleichzeitige Votes
- [x] Database UNIQUE constraint and upsert handle concurrent inserts safely
- [x] Vote count is re-fetched from DB after each operation (not incremented in application)

#### EC-5: Idee wird geloescht
- [x] Foreign key ON DELETE CASCADE in migration ensures votes are deleted with the idea

#### EC-6: Vote sort across pages (previously BUG-3)
- [x] FIX VERIFIED: get_ideas_paginated RPC performs ORDER BY COUNT(v.id) DESC server-side before LIMIT/OFFSET
- [x] Vote sorting now correctly orders across all pages globally

#### EC-7: VoteButton auth state check
- [x] Auth state is checked via useEffect on mount -- brief loading state shown
- [x] Props sync via useEffect when parent re-fetches data

### Additional Edge Cases Found (New)

#### EC-8: RPC SECURITY DEFINER implications
- [ ] NOTE: The get_ideas_paginated function uses SECURITY DEFINER, meaning it runs with the privileges of the function owner (typically the database admin). This bypasses RLS on the tables it queries. The function contains its own WHERE clause for visibility (status = 'approved' OR own ideas), but if this logic drifts from RLS policies it could create inconsistencies. This is an accepted pattern but should be noted. (see BUG-5)

#### EC-9: Anon users see approved ideas only
- [x] The RPC WHERE clause filters to status = 'approved' OR (logged in AND own ideas) -- anon users cannot see pending ideas

#### EC-10: Default sort order in IdeaList
- [x] IdeaList defaults to sort="votes" when no sort param specified (line 42: sortParam === "date" ? "date" : "votes")
- [x] This means the board opens with vote-sorted view by default -- good UX

### Security Audit Results

- [x] Authentication: POST and DELETE /api/ideas/[id]/vote return 401 without valid session
- [x] Authorization: RLS policies restrict INSERT/DELETE to own votes only (user_id = auth.uid())
- [x] No UPDATE policy on votes table -- votes cannot be modified, only created or deleted
- [x] UUID validation: Invalid idea IDs rejected with 400 before any DB query
- [x] Input injection: No user-supplied body content in vote requests (POST/DELETE only use URL param)
- [x] XSS: Vote count is rendered as a number, no user-supplied HTML
- [x] Data leakage: Raw votes array (with user_ids) is NOT exposed in API responses -- only aggregated count
- [x] Method restriction: PUT/PATCH return 405 on vote endpoint (Next.js default)
- [x] CSRF: Supabase auth uses cookie-based sessions; Next.js API routes are same-origin by default
- [x] Idea existence verified before inserting vote (prevents orphan vote attempts)
- [x] Anon RLS allows SELECT only -- anon cannot insert or delete votes
- [ ] BUG: No rate limiting on vote toggle -- an attacker could rapidly POST/DELETE to create server load (see BUG-4)
- [ ] BUG: SECURITY DEFINER RPC bypasses RLS -- visibility logic duplicated in function (see BUG-5)
- [ ] BUG: GET /api/ideas/[id] still requires auth -- inconsistent with public board (see BUG-6)

### Cross-Browser Testing

Testing is code-review based (no live browser session available). Assessment based on code analysis:

- [x] Chrome: Standard React/Next.js -- no browser-specific APIs used
- [x] Firefox: No Chrome-only features detected
- [x] Safari: fetch API and standard DOM APIs used -- compatible

### Responsive Testing

Assessment based on code/Tailwind class analysis:

- [x] 375px (Mobile): VoteButton uses compact sizing (px-2.5 py-1 text-sm), IdeaCard uses flex-wrap-friendly layout
- [x] 768px (Tablet): max-w-3xl container with md:px-8 padding
- [x] 1440px (Desktop): max-w-3xl container centers content

### Regression Testing

#### PROJ-1: User Authentication
- [x] Login redirect still works for protected paths (/admin, /submit)
- [x] /board no longer requires auth -- intentional change, not a regression
- [x] Auth check in vote API routes unchanged and functional

#### PROJ-2: Ideen einreichen
- [x] POST /api/ideas route unchanged -- still validates with Zod and rate-limits
- [x] /submit still requires authentication (protected path)
- [x] Submit page link still present in IdeaList component

#### PROJ-3: Ideenliste
- [x] IdeaList component loads and renders idea cards
- [x] Pagination now uses server-side RPC -- no regression
- [x] Sort dropdown includes "Meiste Votes" and "Neueste zuerst" options
- [x] IdeaCard now uses VoteButton instead of static Badge -- visual enhancement, no regression

### Bugs Found

#### ~~BUG-1: Logged-out users cannot see vote counts (AC-5 violation)~~ FIXED
- **Status:** FIXED in commit 45c683e
- **Verification:** /board removed from protected paths; GET /api/ideas now works without auth; anon RLS policies added

#### BUG-2: Detail view API does not include vote data (AC-8 partial failure)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Call GET /api/ideas/[id] for any idea
  2. Expected: Response includes vote_count and user_has_voted fields
  3. Actual: Response returns raw idea fields without vote data (uses select("*") without votes join)
- **Root Cause:** GET /api/ideas/[id]/route.ts line 41 uses `.select("*")` without joining the votes table
- **Impact:** If a detail view page is built later, it will not show vote data. Currently there is no detail page in the UI, so impact is limited.
- **Priority:** Fix in next sprint (no detail page exists yet)

#### ~~BUG-3: Vote sorting only works within current page~~ FIXED
- **Status:** FIXED in commit 45c683e
- **Verification:** get_ideas_paginated RPC performs ORDER BY COUNT(v.id) DESC server-side before LIMIT/OFFSET

#### BUG-4: No rate limiting on vote toggle
- **Severity:** Low
- **Steps to Reproduce:**
  1. As a logged-in user, rapidly click the vote button repeatedly
  2. Expected: Some form of throttling or debounce
  3. Actual: Each click sends a network request (POST or DELETE)
- **Root Cause:** No rate limiting in the vote API endpoint; no debounce/throttle on the frontend button
- **Impact:** An attacker could script rapid vote toggles to generate server load. The DB unique constraint prevents data corruption, but the load is unnecessary.
- **Priority:** Nice to have -- consider adding frontend debounce

#### BUG-5: SECURITY DEFINER RPC bypasses RLS (new finding)
- **Severity:** Low
- **Steps to Reproduce:**
  1. Review get_ideas_paginated function in migration 20260402_proj4_public_board_and_vote_sort.sql
  2. Function uses SECURITY DEFINER, executing with owner privileges
  3. The WHERE clause (status = 'approved' OR own ideas) duplicates RLS logic
- **Root Cause:** SECURITY DEFINER is used to allow the function to aggregate data across tables with different RLS policies
- **Impact:** If RLS policies on ideas are updated later, the RPC function must also be updated to match. Drift between the two could expose non-approved ideas. Currently consistent.
- **Priority:** Nice to have -- consider using SECURITY INVOKER if possible, or add a code comment cross-referencing the RLS policies

#### BUG-6: GET /api/ideas/[id] still requires authentication (inconsistency)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. As a logged-out user, call GET /api/ideas/[id] with a valid idea UUID
  2. Expected: Returns the idea (since the board is now public)
  3. Actual: Returns 401 "Nicht authentifiziert"
- **Root Cause:** The GET handler in /api/ideas/[id]/route.ts (lines 18-28) still requires auth, unlike the updated /api/ideas list endpoint which is now auth-optional
- **Impact:** Inconsistent behavior -- the idea list is public but individual idea details are not. If a detail page is added for logged-out users, this will block it.
- **Priority:** Fix in next sprint -- align with the public board decision from BUG-1 fix

### Summary
- **Acceptance Criteria:** 7/8 passed, 1 partial fail (AC-8: detail view missing vote data)
- **Previously failed:** AC-5 and EC-6 (BUG-1 and BUG-3) now FIXED and verified
- **Open Bugs:** 4 total (0 critical, 0 high, 2 medium, 2 low)
  - BUG-2 (Medium): Detail API missing vote data -- no UI uses it yet
  - BUG-4 (Low): No rate limiting on vote toggle
  - BUG-5 (Low): SECURITY DEFINER RPC pattern note
  - BUG-6 (Medium): Detail API still requires auth despite public board
- **Security:** Pass -- no critical vulnerabilities. Auth, authorization, RLS policies are solid.
- **Production Ready:** YES (conditional)
- **Recommendation:** The voting feature is production-ready for the current UI. The 2 medium bugs (BUG-2, BUG-6) only affect the single-idea detail API which has no corresponding UI page yet. They should be fixed before a detail page is built. BUG-4 and BUG-5 are low priority improvements.

## Deployment

- **Deployed:** 2026-04-02
- **Commit:** a453880
- **Method:** Push to main → Vercel auto-deploy
- **Open Bugs at Deploy:** BUG-2 (Medium, detail API missing vote data — no UI uses it yet), BUG-4 (Low, no rate limiting), BUG-5 (Low, SECURITY DEFINER note), BUG-6 (Medium, detail API requires auth — no detail page UI yet)