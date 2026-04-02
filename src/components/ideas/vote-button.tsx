"use client"

import { useState, useEffect } from "react"
import { ThumbsUp, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { createClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface VoteButtonProps {
  ideaId: string
  initialVoteCount: number
  initialHasVoted: boolean
}

export function VoteButton({
  ideaId,
  initialVoteCount,
  initialHasVoted,
}: VoteButtonProps) {
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [hasVoted, setHasVoted] = useState(initialHasVoted)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  // Sync with parent props when they change (e.g., after list refetch)
  useEffect(() => {
    setVoteCount(initialVoteCount)
    setHasVoted(initialHasVoted)
  }, [initialVoteCount, initialHasVoted])

  async function handleVote() {
    if (isLoading) return

    const previousVoted = hasVoted
    const previousCount = voteCount

    // Optimistic update
    setHasVoted(!hasVoted)
    setVoteCount(hasVoted ? voteCount - 1 : voteCount + 1)
    setIsLoading(true)

    try {
      const method = hasVoted ? "DELETE" : "POST"
      const res = await fetch(`/api/ideas/${ideaId}/vote`, { method })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Fehler beim Voten")
      }

      const data: { voted: boolean; vote_count: number } = await res.json()
      // Sync with server truth
      setHasVoted(data.voted)
      setVoteCount(data.vote_count)
    } catch (err) {
      // Revert optimistic update
      setHasVoted(previousVoted)
      setVoteCount(previousCount)
      toast.error(
        err instanceof Error ? err.message : "Fehler beim Voten"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const label = `${voteCount} ${voteCount === 1 ? "Vote" : "Votes"}${hasVoted ? ", du hast gevotet" : ""}`

  // Still checking auth state
  if (isLoggedIn === null) {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm text-muted-foreground"
        aria-label={`${initialVoteCount} ${initialVoteCount === 1 ? "Vote" : "Votes"}`}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        <span>{initialVoteCount}</span>
      </div>
    )
  }

  // Logged-out: read-only with tooltip
  if (!isLoggedIn) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm text-muted-foreground cursor-default"
              aria-label={`${voteCount} ${voteCount === 1 ? "Vote" : "Votes"}`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>{voteCount}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Anmelden zum Voten</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Logged-in: interactive button
  return (
    <Button
      variant={hasVoted ? "default" : "outline"}
      size="sm"
      onClick={handleVote}
      disabled={isLoading}
      aria-label={label}
      aria-pressed={hasVoted}
      className={cn(
        "gap-1.5 px-2.5 py-1 h-auto text-sm shrink-0",
        hasVoted && "bg-primary text-primary-foreground"
      )}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ThumbsUp
          className={cn(
            "h-3.5 w-3.5",
            hasVoted && "fill-current"
          )}
        />
      )}
      <span>{voteCount}</span>
    </Button>
  )
}
