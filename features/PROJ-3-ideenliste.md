# PROJ-3: Ideenliste

## Status: Deployed
**Created:** 2026-04-01
**Last Updated:** 2026-04-02

## Dependencies
- PROJ-2: Ideen einreichen (damit es Ideen gibt, die angezeigt werden)

## User Stories
- Als Besucher möchte ich alle eingereichten Ideen einsehen, ohne mich einloggen zu müssen, um mich über Vorschläge zu informieren.
- Als Besucher möchte ich die Vote-Counts der Ideen sehen, um beliebte Ideen zu erkennen.
- Als eingeloggter Nutzer möchte ich Ideen nach Anzahl der Votes sortiert sehen, um beliebte Ideen zu finden.
- Als eingeloggter Nutzer möchte ich Ideen nach Erstellungsdatum sortiert sehen, um neue Ideen zu entdecken.
- Als eingeloggter Nutzer möchte ich die Ideenliste durchblättern, falls es viele Ideen gibt.

## Acceptance Criteria
- [ ] Das Ideenboard ist öffentlich einsehbar — nicht eingeloggte Besucher können Ideen, Votes und Kommentare sehen, aber nicht interagieren (voten, kommentieren)
- [ ] Jede Idee zeigt: Titel, Beschreibung (gekürzt), Anzahl Votes, Erstellungsdatum, Autor (anonym oder Name)
- [ ] Sortierung: Standard nach Votes absteigend, Option nach Datum absteigend
- [ ] Pagination: 10 Ideen pro Seite
- [ ] Suche nach Titel oder Beschreibung (optional für MVP, aber nice-to-have)
- [ ] Ideen sind klickbar und führen zur Detailansicht (wird in späterem Feature implementiert)
- [ ] Seite lädt schnell (< 2 Sekunden für 100 Ideen)

## Edge Cases
- Was passiert wenn keine Ideen vorhanden sind? → Leere Zustandsmeldung mit Call-to-Action zum Einreichen
- Was passiert bei vielen Ideen? → Pagination verhindert Performance-Probleme
- Was passiert bei gleichen Vote-Zahlen? → Sekundäre Sortierung nach Datum
- Was passiert bei langen Beschreibungen? → Text wird gekürzt mit "Mehr lesen"-Link

## Technical Requirements
- Frontend: Next.js Seite (geschützt, Redirect wenn nicht eingeloggt)
- Backend: Supabase Query für Ideen mit Joins für Vote-Counts
- Performance: Datenbank-Indizes auf votes und created_at
- UI: Responsive Design mit shadcn/ui Komponenten

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### A) Komponenten-Struktur

```
/board  (geschützte Seite, Redirect wenn nicht eingeloggt)
+-- IdeaListHeader
|   +-- Sort-Dropdown (Votes absteigend / Datum absteigend)
|   +-- Search-Input (optional, nice-to-have für MVP)
+-- IdeaList
|   +-- IdeaCard (×10 pro Seite)
|   |   +-- Titel (klickbar → /ideas/[id], kommt in späterem Feature)
|   |   +-- Beschreibung (gekürzt ~150 Zeichen + "Mehr lesen"-Hinweis)
|   |   +-- Vote-Badge (Anzahl Votes, Interaktion kommt in PROJ-4)
|   |   +-- Erstellungsdatum (formatiert, z.B. "vor 2 Tagen")
|   |   +-- Autor (anonym oder Nutzername)
|   +-- Skeleton-Cards (Ladezustand)
+-- EmptyState (wenn keine Ideen vorhanden)
|   +-- Icon + Meldung + Button "Idee einreichen"
+-- Pagination (10 Ideen/Seite, URL-basiert: ?page=2&sort=votes)
```

### B) Datenmodell

```
Bestehende Tabelle: ideas
- id            → Eindeutige ID
- user_id       → Verknüpfung zum Autor
- title         → Titel der Idee (wird vollständig angezeigt)
- description   → Beschreibung (wird auf ~150 Zeichen gekürzt)
- status        → Nur "approved"-Ideen werden angezeigt
                  (eigene "pending"-Ideen nur für den Ersteller sichtbar — via RLS)
- created_at    → Für Datumsanzeige und Sortierung

Zukünftige Tabelle: votes (wird in PROJ-4 erstellt)
- idea_id       → Welche Idee
- user_id       → Wer hat gevoted
→ Die Ideenliste wird per JOIN die Vote-Anzahl pro Idee aggregieren

Kein lokaler Speicher — alle Daten kommen aus Supabase (PostgreSQL)
```

### C) Authentifizierung & Sichtbarkeit

- `/board` ist öffentlich zugänglich — keine Middleware-Absicherung
- `GET /api/ideas` akzeptiert Anfragen ohne Auth (auth optional)
- RLS zeigt: `approved`-Ideen für alle + eigene `pending`-Ideen nur dem Ersteller
- Nicht eingeloggte Nutzer sehen Votes (read-only), können aber nicht voten oder kommentieren

### D) Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Client Component mit `useSearchParams` | URL-basierte Sort & Pagination — direkt verlinkbar, Browser-Back funktioniert |
| Vote-Count als JOIN-Query | PROJ-4-ready: kein Umbau nötig, wenn die Votes-Tabelle hinzukommt |
| shadcn/ui: Card, Badge, Pagination, Skeleton, Select | Alle bereits installiert — kein Extra-Setup nötig |
| Autor als E-Mail-Prefix | Datenschutz; User-Profile kommen ggf. in späterem Feature |

### E) API-Änderungen

| Route | Änderung |
|---|---|
| `GET /api/ideas` | Sort-Parameter `?sort=votes\|date` + page-basierte Pagination (10/Seite) |
| Supabase Index | Composite index auf `(status, created_at DESC)` |

### F) Neue Abhängigkeiten

Keine neuen Pakete notwendig — alles bereits im Projekt vorhanden.

## Implementation Notes (Backend)

### API Changes (`GET /api/ideas`)
- **Pagination:** Page-based (`?page=1`, 10 items per page). Response includes `page`, `page_size`, `total_pages`, and `total`.
- **Sorting:** `?sort=votes|date` parameter. Sort value echoed in response.
- **Author display:** Joins against `profiles` table, extracts part before `@` as display name. Falls back to "Anonym".
- **Vote count:** Each idea includes `vote_count` from the votes table (PROJ-4).
- **Search:** Not implemented (deferred, not needed for MVP).

### Database Migration
- Added composite index `idx_ideas_status_created_at` on `(status, created_at DESC)`.
- Migration file: `supabase/migrations/20260402_proj3_ideas_status_created_at_index.sql`

### Response Shape
```json
{
  "ideas": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "...",
      "description": "...",
      "status": "approved",
      "created_at": "2026-04-01T...",
      "author_name": "username",
      "vote_count": 0
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 10,
  "total_pages": 5,
  "sort": "date"
}
```

## Implementation Notes (Frontend)

### Components Created
- `src/components/ideas/idea-card.tsx` - Individual idea card with title, truncated description (150 chars), vote badge, author name, relative date
- `src/components/ideas/idea-list.tsx` - Main client component: fetches from `/api/ideas`, manages sort/page via URL params
- `src/components/ideas/idea-list-header.tsx` - Page title + sort dropdown (Meiste Votes / Neueste zuerst)
- `src/components/ideas/idea-list-empty.tsx` - Empty state with call-to-action to submit an idea
- `src/components/ideas/idea-list-skeleton.tsx` - Loading skeleton (3 placeholder cards)
- `src/components/ideas/idea-list-pagination.tsx` - Pagination with ellipsis for many pages

### Page Updated
- `src/app/board/page.tsx` - Replaced placeholder with `IdeaList` wrapped in `Suspense`

### Tech Decisions
- Client component with `useSearchParams` for URL-based sort and pagination (`?sort=votes&page=2`)
- Default sort is "votes" (descending) as per spec
- Relative date formatting in German (e.g. "vor 2 Tagen", "gestern")
- Pending ideas show an "Ausstehend" badge (only visible to the idea owner via RLS)
- All shadcn/ui components used from existing installation
- No new dependencies added
- Responsive layout: max-w-3xl centered, padding adjusts for mobile/tablet/desktop

## Additional Notes (2026-04-02)

### Database fixes applied
- Created missing `profiles` entry for user `kirmsea@hotmail.com` (ideas were submitted under this account but no profile row existed, causing the `profiles(email)` join to fail with HTTP 400)
- Added FK constraint `ideas_user_id_profiles_fkey` (`ideas.user_id → profiles.id`) so PostgREST can resolve the embedded `profiles` join
- Set all 3 existing ideas from `pending` → `approved` via admin SQL so they appear on the board

### Cross-feature link
- A "Bestehende Ideen ansehen" button was added to the Submit form (PROJ-2) that opens `/board` in a new tab, linking the two features for the user

## QA Test Results

Acceptance Criteria 6/7 passed (AC-6 deferred — no detail view yet), Edge Cases 3/4 passed, Build: PASS

Offene Bugs → siehe `features/BUGS.md`

## Deployment

- **Deployed:** 2026-04-02
- **Commit:** feat(PROJ-3): Implement Ideenliste feature
- **Database Migration:** `proj3_ideas_status_created_at_index` applied to production Supabase
- **Git Tag:** v1.3.0-PROJ-3
