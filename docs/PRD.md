# Product Requirements Document

## Vision
Ein öffentliches Feature Voting Board, auf dem Community-Mitglieder Produktideen einreichen und per Upvote priorisieren können. Admins verwalten den Status der Ideen und moderieren die Community. Das Board nutzt ein eigenständiges Supabase-Backend, unabhängig von anderen Apps.

## Target Users

**Community-Mitglieder (User)**
- Produktnutzer oder Interessierte, die Feedback zu einem Produkt geben wollen
- Möchten Ideen einreichen und sehen, welche Ideen beliebt sind
- Wollen über den Status ihrer eingereichten Ideen informiert bleiben

**Administratoren (Admin)**
- Produktteam oder Produktmanager
- Wollen eingehende Ideen priorisieren und moderieren
- Benötigen Überblick über Votes und Community-Feedback

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | PROJ-1 User Authentication | Planned |
| P0 (MVP) | PROJ-2 Ideen einreichen | Planned |
| P0 (MVP) | PROJ-3 Ideenliste | Planned |
| P0 (MVP) | PROJ-4 Voting | Planned |
| P1 | PROJ-5 Comments | Planned |
| P1 | PROJ-6 Admin Panel | Planned |
| P1 | PROJ-7 Landing Page | Planned |

## Success Metrics
- Anzahl registrierter Nutzer (Ziel: 50 in den ersten 30 Tagen)
- Anzahl eingereichter Ideen (Ziel: 20+ in den ersten 30 Tagen)
- Ø Votes pro Idee (Ziel: 5+)
- Kommentare pro Idee (Ziel: 2+)
- Wiederkehrende Nutzer (Ziel: 30% kehren innerhalb von 7 Tagen zurück)

## Constraints
- MVP: Zeitrahmen so kurz wie möglich
- Separates Supabase-Backend (eigenes Projekt, nicht mit anderen Apps geteilt)
- Tech Stack: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Supabase
- Kein Budget für externe Dienste außer Supabase Free Tier und Vercel

## Non-Goals
- Social Login (Google/GitHub) — nicht im MVP
- Budget/Point-based Voting — nur Upvote
- Threaded Comments — nur einfache Kommentare
- Kategorien oder Tags — kein Kategorisierungssystem
- E-Mail-Benachrichtigungen — kein Notification-System im MVP
- Mobile App — nur Web

---

Use `/requirements` to create detailed feature specifications for each item in the roadmap above.
