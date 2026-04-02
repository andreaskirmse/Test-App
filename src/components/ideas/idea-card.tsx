"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface IdeaCardProps {
  id: string
  title: string
  description: string
  status: string
  created_at: string
  author_name: string
  vote_count: number
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

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + "\u2026"
}

export function IdeaCard({
  title,
  description,
  status,
  created_at,
  author_name,
  vote_count,
}: IdeaCardProps) {
  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg leading-snug">{title}</CardTitle>
          <Badge variant="secondary" className="shrink-0" aria-label={`${vote_count} Votes`}>
            {vote_count} {vote_count === 1 ? "Vote" : "Votes"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {truncateText(description, 150)}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{author_name}</span>
          <div className="flex items-center gap-2">
            {status === "pending" && (
              <Badge variant="outline" className="text-xs">
                Ausstehend
              </Badge>
            )}
            <time dateTime={created_at}>{formatRelativeDate(created_at)}</time>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
