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

**Re-tested:** 2026-04-02 | Acceptance Criteria 7/8 passed, Build: PASS

### Open Bugs
- BUG-2 (Medium): GET /api/ideas/[id] missing vote_count and user_has_voted -- uses select("*") without votes join. No detail page UI exists yet. Fix before building detail view.
- BUG-4 (Low): No rate limiting or debounce on vote toggle -- rapid clicks each send a request. DB constraint prevents data corruption but generates unnecessary load.
- BUG-5 (Low): get_ideas_paginated RPC uses SECURITY DEFINER, bypassing RLS. Visibility logic duplicated in function WHERE clause. Currently consistent with RLS but may drift.

### Resolved Since Last QA
- BUG-6 (was Medium): GET /api/ideas/[id] no longer requires auth -- fixed in PROJ-2 fix commit 914975f.

## Deployment

- **Deployed:** 2026-04-02
- **Last Redeployed:** 2026-04-02
- **Production URL:** https://test-dd4915a3i-andreas-kirmses-projects.vercel.app
- **Commit:** 3515cc3
- **Method:** Push to main → Vercel auto-deploy
- **Changes in this deploy:** Responsive sort dropdown (w-full sm:w-[200px]), compact QA results in specs
- **Open Bugs at Deploy:** BUG-2 (Medium, detail API missing vote data — no UI uses it yet), BUG-4 (Low, no rate limiting), BUG-5 (Low, SECURITY DEFINER note)