# PROJ-4: Voting

## Status: Planned
**Created:** 2026-04-01
**Last Updated:** 2026-04-01

## Dependencies
- PROJ-1: User Authentication (nur eingeloggte Nutzer können voten)
- PROJ-3: Ideenliste (um Votes anzuzeigen)

## User Stories
- Als Community-Mitglied möchte ich für Ideen upvoten, die mir gefallen, um meine Unterstützung zu zeigen.
- Als Nutzer möchte ich mein Vote zurücknehmen, falls ich meine Meinung ändere.
- Als Autor einer Idee möchte ich die Anzahl der Votes sehen, um Feedback zu bekommen.
- Als Admin möchte ich, dass Votes fair und manipulationsfrei sind.

## Acceptance Criteria
- [ ] Eingeloggte Nutzer können Ideen upvoten (ein Vote pro Idee pro Nutzer)
- [ ] Vote-Button zeigt aktuelle Anzahl und ob bereits gevotet
- [ ] Nach Vote wird die Anzahl sofort aktualisiert (ohne Seitenreload)
- [ ] Nutzer können ihr Vote zurücknehmen
- [ ] Nicht eingeloggte Nutzer sehen Vote-Counts, aber können nicht voten
- [ ] Votes werden in der Datenbank gespeichert (Tabelle: votes mit user_id, idea_id)
- [ ] Keine Downvotes (nur Upvotes, wie Reddit)
- [ ] Vote-Counts werden in der Ideenliste und Detailansicht angezeigt

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

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_