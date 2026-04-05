# PROJ-5: Comments

## Status: Deployed
**Created:** 2026-04-01
**Last Updated:** 2026-04-04

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

### What Gets Built

Two things are needed: a new **Idea Detail Page** (where comments live) and the **Comments feature** itself. Additionally, BUG-4 from PROJ-3 is resolved here by adding a "Mehr lesen" link to the idea card that navigates to this new detail page.

### Component Structure

```
/ideas/[id]  (New Page)
+-- Back Link  (→ /ideas)
+-- Idea Detail Card
|   +-- Full title + description (no truncation)
|   +-- Author name, created date, category badge
|   +-- Vote Button  (reuse existing vote-button.tsx)
+-- Comments Section
    +-- Comment Count Header  (e.g. "3 Kommentare")
    +-- Comment List
    |   +-- Comment Item  (avatar, author name, date, text)
    |   +-- Comment Skeleton  (loading state, reuse skeleton.tsx)
    |   +-- Empty State  ("Noch keine Kommentare")
    |   +-- "Mehr laden" Button  (if more than 20 comments)
    +-- Comment Form  (logged-in users only)
    |   +-- Textarea  (reuse textarea.tsx, max 500 chars)
    |   +-- Character Counter  ("123 / 500")
    |   +-- Submit Button
    +-- Login Prompt  (logged-out users: "Einloggen um zu kommentieren")

src/components/ideas/idea-card.tsx  (updated)
    +-- "Mehr lesen →" link added below truncated description  (BUG-4 fix)
```

### Data Model

**New database table: `comments`**

Each comment stores:
- Unique ID
- Which idea it belongs to (link to ideas table — auto-deleted when idea is deleted)
- Who wrote it (link to the user account)
- The comment text (up to 500 characters)
- When it was created

**Access rules (RLS):**
- Anyone (including logged-out visitors) can read comments
- Only logged-in users can post a comment, and only as themselves
- No editing or deleting by users (admin moderation handled in PROJ-6)

### API Endpoints

Two new endpoints are added under the existing `/api/ideas/[id]/` route:

| Endpoint | Who can use it | What it does |
|---|---|---|
| `GET /api/ideas/[id]/comments` | Everyone | Returns comments for an idea, newest first, 20 per page |
| `POST /api/ideas/[id]/comments` | Logged-in users only | Creates a new comment |

The existing `GET /api/ideas/[id]` endpoint (already built) is reused to load the idea detail.

### Tech Decisions

- **No new packages needed.** All required UI components already exist: `Textarea`, `Card`, `Button`, `Avatar`, `Skeleton`, `Pagination`.
- **Pagination strategy: "Mehr laden" button (20 per page).** Ideas per topic are typically few — a simple load-more pattern is less complex than infinite scroll and consistent with the existing pagination style.
- **Initial page load is server-rendered** (first 20 comments fetched on the server) for fast display and SEO. Additional pages load client-side when the user clicks "Mehr laden".
- **Avatar initials** (first letter of author name/email) are shown — no image upload needed for comments.
- **Spam filter:** empty comments are blocked by validation; no external spam service needed at this stage (spec says "simple").

### Dependencies

No new packages required — all existing shadcn/ui components cover the UI needs.

## Backend Implementation Notes (2026-04-04)

- **Migration:** `supabase/migrations/20260404_proj5_create_comments_table.sql` -- creates `comments` table with RLS (SELECT open, INSERT authenticated-only), indexes on `idea_id` and `created_at`, ON DELETE CASCADE for both `ideas` and `auth.users`.
- **Zod schema:** `src/lib/validations/comments.ts` -- validates `text` field (1-500 chars, trimmed).
- **GET /api/ideas/[id]/comments:** Paginated (20/page), ordered `created_at DESC`. Returns `total_count`, `page`, `total_pages`. Author names resolved via `profiles` table (same pattern as `get_ideas_paginated`). No auth required.
- **POST /api/ideas/[id]/comments:** Auth required (401 if not logged in). Zod validation on body. Rate limit: 10 comments/user/hour (429 on exceed). Returns created comment with `author_name`.
- **Design decision:** Used two-query approach (comments + profiles) instead of embedded join, since `comments.user_id` FK points to `auth.users`, not `profiles`. Consistent with existing RPC pattern.

## QA Test Results

Acceptance Criteria 6/7 passed, Build: PASS

Acceptance Criteria 6/7 passed, Build: PASS

Security Audit: keine Critical/High Findings. Production-ready: YES

Offene Bugs → siehe `features/BUGS.md`

## Deployment

- **Deployed:** 2026-04-04
- **Production URL:** https://test-6l41wr9j2-andreas-kirmses-projects.vercel.app/
- **Commit:** ae71d3b
- **Tag:** v1.5.0-PROJ-5