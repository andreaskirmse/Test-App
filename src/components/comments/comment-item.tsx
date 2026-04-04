"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface CommentItemProps {
  id: string
  text: string
  author_name: string
  created_at: string
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return "gerade eben"
  if (diffMinutes < 60) return `vor ${diffMinutes} Min.`
  if (diffHours < 24) return `vor ${diffHours} Std.`
  if (diffDays === 1) return "gestern"
  if (diffDays < 30) return `vor ${diffDays} Tagen`
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase()
}

export function CommentItem({ text, author_name, created_at }: CommentItemProps) {
  return (
    <article className="flex gap-3" aria-label={`Kommentar von ${author_name}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs">{getInitials(author_name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{author_name}</span>
          <time
            dateTime={created_at}
            className="text-xs text-muted-foreground"
          >
            {formatRelativeDate(created_at)}
          </time>
        </div>
        <p className="mt-1 text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
          {text}
        </p>
      </div>
    </article>
  )
}
