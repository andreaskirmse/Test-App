# PROJ-6: Admin Panel

## Status: In Review
**Created:** 2026-04-01
**Last Updated:** 2026-04-04

## Dependencies
- PROJ-1: User Authentication (Admin-Rolle erforderlich)
- PROJ-2: Ideen einreichen (um Ideen zu moderieren)
- PROJ-3: Ideenliste (um Übersicht zu haben)
- PROJ-4: Voting (um Vote-Stats zu sehen)
- PROJ-5: Comments (um Kommentare zu moderieren)

## User Stories
- Als Admin möchte ich alle eingereichten Ideen einsehen und ihren Status ändern (z.B. Approved, Rejected, In Progress).
- Als Admin möchte ich Kommentare moderieren (löschen bei Verstößen).
- Als Admin möchte ich Statistiken sehen (Anzahl Ideen, Votes, Kommentare).
- Als Admin möchte ich Benutzer verwalten (falls nötig, aber minimal für MVP).

## Acceptance Criteria
- [ ] Geschützte Admin-Seite, nur für Nutzer mit is_admin=true zugänglich
- [ ] Ideen-Übersicht mit Filtern nach Status
- [ ] Möglichkeit, Status von Ideen zu ändern (Dropdown: Pending, Approved, Rejected, Implemented)
- [ ] Kommentare moderieren: Löschen-Button für jeden Kommentar
- [ ] Dashboard mit Metriken: Gesamt-Ideen, Votes, Kommentare, aktive Nutzer
- [ ] Admin-Aktionen werden geloggt (für Audit)
- [ ] Responsive Design für Admin-Interface

## Edge Cases
- Was passiert wenn ein Nicht-Admin die Seite aufruft? → 403 Forbidden
- Was passiert bei gleichzeitigen Änderungen? → Letzte Änderung gewinnt, mit Warnung
- Was passiert bei Löschung von Kommentaren? → Soft Delete oder Hard Delete
- Was passiert wenn viele Ideen vorhanden sind? → Pagination und Suche
- Was passiert bei Fehlern beim Speichern? → Rollback und Fehlermeldung

## Technical Requirements
- Frontend: Separate Admin-Routen mit Layout
- Backend: Supabase RLS für Admin-only Zugriff, zusätzliche Tabellen für Status und Logs
- Security: Zusätzliche Auth-Checks in Middleware
- UI: Data Tables mit shadcn/ui für Listen

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Route Structure
- `/admin` — Dashboard (Metriken)
- `/admin/ideen` — Ideenverwaltung (Filter, Status-Änderung)
- `/admin/kommentare` — Kommentar-Moderation (Löschen)
- `/admin/logs` — Audit-Log

### New Database Objects
- `admin_audit_log` table: logs every admin action (status_changed, comment_deleted) with admin_id, target, and details (JSONB)
- `is_admin()` Postgres helper function used in RLS policies

### New API Endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/admin/stats` | GET | Dashboard metrics |
| `/api/admin/ideas` | GET | All ideas (all statuses), filterable + paginated |
| `/api/admin/ideas/[id]/status` | PATCH | Change idea status + write audit log |
| `/api/admin/comments` | GET | All comments, paginated |
| `/api/admin/comments/[id]` | DELETE | Hard delete + write audit log |
| `/api/admin/audit-log` | GET | Paginated audit trail |

### Security (3 layers)
1. **Next.js Middleware** — checks `is_admin` on every `/admin/*` request; redirects non-admins to `/board`
2. **API helper** — `src/lib/admin-auth.ts` checks `is_admin` in every admin API route
3. **Supabase RLS** — `is_admin()` function used in all admin policies; direct DB access blocked

### Comment Deletion
Hard delete (no soft delete). Text preview stored in audit log for traceability.

### Ideas Status Values
`pending | approved | rejected | implemented` (existing CHECK constraint, no migration change needed)

## Implementation Notes (Frontend)
- Admin layout with sidebar (desktop) and horizontal nav (mobile) at `/admin`
- Dashboard page with 4 metric cards (Ideen, Votes, Kommentare, Benutzer)
- Ideas management at `/admin/ideen`: table with status filter, search, status change via select dropdown, pagination
- Comment moderation at `/admin/kommentare`: table with delete confirmation dialog, pagination
- Audit log at `/admin/logs`: table with formatted action details, pagination
- Admin link (Shield icon) added to root layout header for admin users
- Toaster (sonner) added to admin layout for status change/delete feedback
- Middleware already handles auth protection (redirect non-admins to /board)
- All components use shadcn/ui primitives, Tailwind CSS, loading/error/empty states

## QA Test Results
Acceptance Criteria 7/7 passed, Build: PASS, Lint: PASS

All bugs fixed. Build: PASS

## Deployment
_To be added by /deploy_