"use client"

import Link from "next/link"
import { Toaster } from "sonner"
import { LayoutDashboard, Lightbulb, MessageSquare, ScrollText } from "lucide-react"
import { AdminNavLink } from "@/components/admin/admin-nav-link"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/ideen", label: "Ideen", icon: Lightbulb },
  { href: "/admin/kommentare", label: "Kommentare", icon: MessageSquare },
  { href: "/admin/logs", label: "Audit-Log", icon: ScrollText },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-muted/40 md:block">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/admin" className="text-lg font-semibold">
            Admin Panel
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-4" aria-label="Admin-Navigation">
          {navItems.map((item) => (
            <AdminNavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </nav>
        <div className="mt-auto border-t p-4">
          <Link
            href="/board"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Zurück zum Board
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 md:hidden">
          <Link href="/admin" className="text-lg font-semibold">
            Admin
          </Link>
          <nav className="flex items-center gap-2 overflow-x-auto" aria-label="Admin-Navigation mobil">
            {navItems.map((item) => (
              <AdminNavLink key={item.href} href={item.href} label={item.label} icon={item.icon} compact />
            ))}
          </nav>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
