"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminNavLinkProps {
  href: string
  label: string
  icon: LucideIcon
  compact?: boolean
}

export function AdminNavLink({ href, label, icon: Icon, compact }: AdminNavLinkProps) {
  const pathname = usePathname()
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  if (compact) {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}
