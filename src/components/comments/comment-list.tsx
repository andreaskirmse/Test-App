"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { CommentItem } from "@/components/comments/comment-item"
import { CommentForm } from "@/components/comments/comment-form"
import { CommentListSkeleton } from "@/components/comments/comment-skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MessageCircle, Loader2 } from "lucide-react"
import Link from "next/link"

interface Comment {
  id: string
  idea_id: string
  user_id: string
  text: string
  created_at: string
  author_name: string
}

interface CommentsResponse {
  comments: Comment[]
  total_count: number
  page: number
  total_pages: number
}

interface CommentListProps {
  ideaId: string
}

export function CommentList({ ideaId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
    })
  }, [])

  const fetchComments = useCallback(async (page: number, append: boolean) => {
    if (page === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    setError(null)

    try {
      const res = await fetch(`/api/ideas/${ideaId}/comments?page=${page}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Fehler beim Laden der Kommentare")
      }
      const data: CommentsResponse = await res.json()

      if (append) {
        setComments((prev) => [...prev, ...data.comments])
      } else {
        setComments(data.comments)
      }
      setTotalCount(data.total_count)
      setCurrentPage(data.page)
      setTotalPages(data.total_pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [ideaId])

  useEffect(() => {
    fetchComments(1, false)
  }, [fetchComments])

  function handleLoadMore() {
    if (currentPage < totalPages) {
      fetchComments(currentPage + 1, true)
    }
  }

  function handleCommentCreated(comment: Comment) {
    // Prepend new comment (newest first)
    setComments((prev) => [comment, ...prev])
    setTotalCount((prev) => prev + 1)
  }

  if (loading) {
    return <CommentListSkeleton />
  }

  return (
    <section aria-label="Kommentare" className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <MessageCircle className="h-5 w-5" />
        {totalCount} {totalCount === 1 ? "Kommentar" : "Kommentare"}
      </h2>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Comment form or login prompt */}
      {isLoggedIn === true && (
        <CommentForm ideaId={ideaId} onCommentCreated={handleCommentCreated} />
      )}

      {isLoggedIn === false && (
        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Einloggen
          </Link>
          {" "}um zu kommentieren
        </div>
      )}

      {/* Comments */}
      {!error && comments.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Noch keine Kommentare. Sei der Erste!
        </p>
      )}

      {comments.length > 0 && (
        <div className="space-y-5">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              id={comment.id}
              text={comment.text}
              author_name={comment.author_name}
              created_at={comment.created_at}
            />
          ))}
        </div>
      )}

      {/* Load more button */}
      {currentPage < totalPages && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Laden...
              </>
            ) : (
              "Mehr laden"
            )}
          </Button>
        </div>
      )}
    </section>
  )
}
