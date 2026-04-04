# AI Coding Starter Kit

> A Next.js template with an AI-powered development workflow using specialized skills for Requirements, Architecture, Frontend, Backend, QA, and Deployment.

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (copy-paste components)
- **Backend:** Supabase (PostgreSQL + Auth + Storage) - optional
- **Deployment:** Vercel
- **Validation:** Zod + react-hook-form
- **State:** React useState / Context API

## Project Structure

```
src/
  app/              Pages (Next.js App Router)
  components/
    ui/             shadcn/ui components (NEVER recreate these)
  hooks/            Custom React hooks
  lib/              Utilities (supabase.ts, utils.ts)
features/           Feature specifications (PROJ-X-name.md)
  INDEX.md          Feature status overview
docs/
  PRD.md            Product Requirements Document
  production/       Production guides (Sentry, security, performance)
```

## Development Workflow

1. `/requirements` - Create feature spec from idea
2. `/architecture` - Design tech architecture (PM-friendly, no code)
3. `/frontend` and `/backend` - order depends on the feature (see below)
4. `/qa` - Test against acceptance criteria + security audit
5. `/deploy` - Deploy to Vercel + production-ready checks

### Frontend vs. Backend Order

After `/architecture`, always reason about the better build order before suggesting the next step. Do NOT default to frontend-first without thinking.

**Build frontend first when:**
- The UI is complex and UX feedback early matters (multi-step forms, drag-and-drop, etc.)
- The feature is mostly presentational with simple or no data needs
- You want to validate layout and interaction before locking in the API shape

**Build backend first when:**
- The feature is data-driven and the UI is simple (e.g. a comment list + form)
- The frontend needs real API endpoints to be meaningful — mocks add no value
- The backend has significant complexity (RLS policies, joins, cascade deletes) that defines the data contract the frontend depends on

**Always tell the user** which order you recommend and why, then ask for confirmation before proceeding.

## Feature Tracking

All features tracked in `features/INDEX.md`. Every skill reads it at start and updates it when done. Feature specs live in `features/PROJ-X-name.md`.

## Key Conventions

- **Feature IDs:** PROJ-1, PROJ-2, etc. (sequential)
- **Commits:** `feat(PROJ-X): description`, `fix(PROJ-X): description`
- **Single Responsibility:** One feature per spec file
- **shadcn/ui first:** NEVER create custom versions of installed shadcn components
- **Human-in-the-loop:** All workflows have user approval checkpoints

## Build & Test Commands

```bash
npm run dev        # Development server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
npm run start      # Production server
```

## Product Context

- **App language: German** — all UI text, labels, error messages, and copy must be written in German
- **Always use proper German umlauts:** ä, ö, ü, Ä, Ö, Ü, ß — NEVER use ASCII substitutes like ae, oe, ue, Ae, Oe, Ue, ss
- Examples: "Zurück" not "Zurueck", "Öffnen" not "Oeffnen", "Straße" not "Strasse"

## Feature Overview

@features/INDEX.md
