# PROJ-1: User Authentication

## Status: Deployed
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

### Seitenstruktur

```
/login                    → Login-Seite
  +-- LoginForm
      +-- E-Mail-Feld
      +-- Passwort-Feld
      +-- Submit-Button ("Einloggen")
      +-- Link → Registrierung
      +-- Link → Passwort vergessen

/register                 → Registrierungs-Seite
  +-- RegisterForm
      +-- E-Mail-Feld
      +-- Passwort-Feld (min. 8 Zeichen, Inline-Validierung)
      +-- Submit-Button ("Registrieren")
      +-- Link → Login

/passwort-vergessen       → Passwort vergessen-Seite
  +-- ForgotPasswordForm
      +-- E-Mail-Feld
      +-- Submit-Button ("Reset-Link senden")
      +-- Bestätigungshinweis nach Absenden

/auth/update-password     → Neues Passwort setzen (nach Klick auf Reset-Link)
  +-- UpdatePasswordForm
      +-- Neues-Passwort-Feld
      +-- Submit-Button

/auth/callback            → Unsichtbare Zwischenseite (verarbeitet E-Mail-Links)
```

Geschützte Seiten (z.B. `/board`, `/admin`) werden durch eine Middleware abgesichert — nicht eingeloggte Nutzer werden automatisch zu `/login` weitergeleitet.

### Datenspeicherung

**Supabase Auth** verwaltet automatisch:
- E-Mail + verschlüsseltes Passwort
- Session-Token (als Cookie gespeichert)
- E-Mail-Bestätigung + Passwort-Reset-Links

**Eigene `profiles`-Tabelle** (eine Zeile pro Nutzer):
- ID (verknüpft mit Supabase Auth)
- E-Mail-Adresse
- `is_admin`: true/false (Standard: false)
- Erstellungsdatum

Admins werden manuell in der Datenbank gesetzt (kein Self-Service).

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| **Supabase Auth** | Liefert E-Mail/Passwort, Bestätigungs-E-Mails, Rate Limiting und Passwort-Reset out-of-the-box |
| **Session Cookies (SSR)** | Next.js rendert Seiten serverseitig — Cookies funktionieren dabei, localStorage nicht |
| **Next.js Middleware** | Schützt Routen bevor die Seite überhaupt lädt — kein Flackern |
| **`profiles`-Tabelle** | Admin-Flag sauber in eigener Tabelle, leicht abfragbar und erweiterbar |

### Abhängigkeiten

| Paket | Zweck |
|---|---|
| `@supabase/supabase-js` | Supabase Client (Auth, Datenbank) |
| `@supabase/ssr` | SSR-kompatible Session-Verwaltung für Next.js |

Verwendete shadcn/ui-Komponenten (bereits installiert): `Input`, `Button`, `Form`, `Label`, `Card`

## Frontend Implementation Notes

### What was built
- **Supabase client setup**: Browser client (`src/lib/supabase.ts`), Server client (`src/lib/supabase-server.ts`), Middleware client (`src/lib/supabase-middleware.ts`)
- **Zod validation schemas**: `src/lib/validations/auth.ts` (login, register, forgot-password, update-password)
- **Form components** (all in `src/components/auth/`):
  - `LoginForm` - Email/password login with error handling
  - `RegisterForm` - Registration with success state (confirmation email hint)
  - `ForgotPasswordForm` - Password reset request with success state
  - `UpdatePasswordForm` - Set new password after reset link click
- **Pages** (auth layout with centered card):
  - `/login` - Login page
  - `/register` - Registration page
  - `/passwort-vergessen` - Forgot password page
  - `/auth/update-password` - New password page (after reset link)
  - `/auth/callback` - Server route handling Supabase email link exchange
- **Middleware** (`middleware.ts`): Protects `/board` and `/admin` routes; redirects authenticated users away from auth pages

### Design decisions
- Used `(auth)` route group for shared centered layout on login/register/forgot-password
- `/auth/update-password` uses its own layout (not in route group) since it's accessed via email link
- All text in German as requested
- Modern/minimal style with shadcn/ui Card components
- Generic error message on login failure (no hint whether email or password is wrong)
- Success states shown inline (confirmation email, reset link sent)
- `window.location.href` used for post-login redirect (not `router.push`) per frontend rules

### shadcn/ui components used
Card, Input, Button, Form, Label (all pre-installed)

### Dependencies added
- `@supabase/ssr` for SSR-compatible session management

## Backend Implementation Notes

### What was built
- **Database migration** (`create_profiles_table`): `profiles` table with `id`, `email`, `is_admin`, `created_at`
- **RLS policies**: Users can only SELECT their own profile row; INSERT/UPDATE/DELETE blocked from client
- **DB trigger** (`on_auth_user_created`): Auto-creates a profile row for every new `auth.users` insert via `handle_new_user()` SECURITY DEFINER function
- **API routes**:
  - `GET /api/auth/profile` — returns current user's profile (id, email, is_admin, created_at); 401 if unauthenticated
  - `POST /api/auth/logout` — signs out server-side and clears session cookie

### Design decisions
- `is_admin` set manually via Supabase dashboard only (no self-service)
- Profile visibility: own-profile-only (RLS enforces this)
- Trigger function uses `SECURITY DEFINER` so it can write to `profiles` bypassing RLS during signup

## QA Test Results

Acceptance Criteria 10/10 passed, Edge Cases 4/5 passed, Build: PASS

### Open Bugs
- BUG-4 (Medium): No server-side validation on auth forms — Supabase SDK validates, but violates project security policy. Fix in next sprint.
- BUG-6 (Medium): UpdatePasswordForm shows "Du wirst gleich weitergeleitet" but never redirects — user stuck on success screen. Fix in next sprint.
- BUG-7 (Low): No client-side rate limiting on login — only Supabase server-side rate limiting applies.
- BUG-8 (Low): `GITHUB_ACCESS_TOKEN` in `.env.local` is unused and not documented in `.env.local.example` — remove it.
- BUG-9 (Low): Login page ignores `?error=callback` query param from failed auth callback — error silently swallowed.

## Deployment

**Deployed:** 2026-04-01
**Production URL:** https://test-app-jade-eta.vercel.app/
**Platform:** Vercel (auto-deploy from GitHub main branch)

### Notes
- Homepage (`/`) still shows Next.js default page — redirect to `/login` pending
- `/board` shows placeholder until PROJ-3 (Ideenliste) is implemented
