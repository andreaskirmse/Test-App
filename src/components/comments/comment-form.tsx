"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Comment {
  id: string
  idea_id: string
  user_id: string
  text: string
  created_at: string
  author_name: string
}

interface CommentFormProps {
  ideaId: string
  onCommentCreated: (comment: Comment) => void
}

const MAX_LENGTH = 500

export function CommentForm({ ideaId, onCommentCreated }: CommentFormProps) {
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedText = text.trim()
  const charCount = text.length
  const isValid = trimmedText.length >= 1 && charCount <= MAX_LENGTH

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/ideas/${ideaId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmedText }),
      })

      const body = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setError(body.error || "Rate-Limit erreicht. Bitte spaeter erneut versuchen.")
          return
        }
        if (res.status === 400 && body.details?.text) {
          setError(body.details.text[0])
          return
        }
        setError(body.error || "Fehler beim Erstellen des Kommentars")
        return
      }

      setText("")
      onCommentCreated(body.comment)
      toast.success("Kommentar wurde erstellt")
    } catch {
      setError("Verbindungsfehler. Bitte erneut versuchen.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Schreibe einen Kommentar..."
          maxLength={MAX_LENGTH}
          rows={3}
          className="resize-none"
          disabled={isSubmitting}
          aria-label="Kommentar schreiben"
        />
        <div className="flex items-center justify-between">
          <span
            className={`text-xs ${
              charCount > MAX_LENGTH
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {charCount} / {MAX_LENGTH}
          </span>
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Senden...
          </>
        ) : (
          "Kommentar senden"
        )}
      </Button>
    </form>
  )
}
