---
paths:
  - "src/components/**"
  - "src/app/**/page.tsx"
  - "src/app/**/layout.tsx"
  - "src/hooks/**"
---

# Frontend Development Rules

## shadcn/ui First (MANDATORY)
- Before creating ANY UI component, check if shadcn/ui has it: `ls src/components/ui/`
- NEVER create custom implementations of: Button, Input, Select, Checkbox, Switch, Dialog, Modal, Alert, Toast, Table, Tabs, Card, Badge, Dropdown, Popover, Tooltip, Navigation, Sidebar, Breadcrumb
- If a shadcn component is missing, install it: `npx shadcn@latest add <name> --yes`
- Custom components are ONLY for business-specific compositions that internally use shadcn primitives

## Import Pattern
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
```

## Component Standards
- Use Tailwind CSS exclusively (no inline styles, no CSS modules)
- All components must be responsive (mobile 375px, tablet 768px, desktop 1440px)
- Implement loading states, error states, and empty states
- Use semantic HTML and ARIA labels for accessibility
- Keep components small and focused
- Use TypeScript interfaces for all props

## Server vs. Client Components (MANDATORY)

Pages are Server Components by default in Next.js App Router. Only add `"use client"` when strictly necessary.

**NEVER use `"use client"` on a page just because:**
- You need to fetch data → use `async` server component and fetch directly
- You need URL params → use the `params` prop (server) not `useParams()` (client hook)
- It's "easier" or a familiar pattern from older Next.js

**`"use client"` is ONLY justified when the component uses:**
- React hooks (`useState`, `useEffect`, `useReducer`, `useCallback`)
- Browser APIs (`window`, `localStorage`, `document`)
- Event handlers that require interactivity

**Correct pattern: server shell + client islands**
```tsx
// page.tsx — Server Component (no "use client")
export default async function IdeaDetailPage({ params }: { params: { id: string } }) {
  const data = await fetchIdea(params.id) // fetch on server
  return <IdeaDetailClient idea={data} /> // pass as props
}

// idea-detail-client.tsx — Client Component (interactive parts only)
"use client"
export function IdeaDetailClient({ idea }: { idea: Idea }) { ... }
```

## Auth Best Practices (Supabase)
- Use `window.location.href` for post-login redirect (not `router.push`)
- Always verify `data.session` exists before redirecting
- Always reset loading state in all code paths (success, error, finally)
