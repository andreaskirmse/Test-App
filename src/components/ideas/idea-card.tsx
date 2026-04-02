"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { VoteButton } from "@/components/ideas/vote-button"
import { updateIdeaSchema, type UpdateIdeaFormValues } from "@/lib/validations/ideas"
import { Pencil, Trash2 } from "lucide-react"

interface IdeaCardProps {
  id: string
  user_id: string
  title: string
  description: string
  status: string
  created_at: string
  author_name: string
  vote_count: number
  user_has_voted: boolean
  currentUserId?: string
  onRefresh?: () => void
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
  id,
  user_id,
  title,
  description,
  status,
  created_at,
  author_name,
  vote_count,
  user_has_voted,
  currentUserId,
  onRefresh,
}: IdeaCardProps) {
  const isOwner = !!currentUserId && currentUserId === user_id

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<UpdateIdeaFormValues>({
    resolver: zodResolver(updateIdeaSchema),
    defaultValues: { title, description },
  })

  function handleEditOpen() {
    form.reset({ title, description })
    setEditError(null)
    setEditOpen(true)
  }

  async function onEditSubmit(values: UpdateIdeaFormValues) {
    setEditError(null)
    try {
      const res = await fetch(`/api/ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const body = await res.json()
      if (!res.ok) {
        if (res.status === 400 && body.details) {
          const fields = body.details as Record<string, string[]>
          Object.entries(fields).forEach(([field, messages]) => {
            form.setError(field as keyof UpdateIdeaFormValues, {
              message: messages[0],
            })
          })
          return
        }
        setEditError(body.error || "Fehler beim Speichern")
        return
      }
      setEditOpen(false)
      onRefresh?.()
    } catch {
      setEditError("Verbindungsfehler. Bitte erneut versuchen.")
    }
  }

  async function onDeleteConfirm() {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json()
        setDeleteError(body.error || "Fehler beim Löschen")
        setIsDeleting(false)
        return
      }
      setDeleteOpen(false)
      onRefresh?.()
    } catch {
      setDeleteError("Verbindungsfehler. Bitte erneut versuchen.")
      setIsDeleting(false)
    }
  }

  const titleValue = form.watch("title") ?? ""
  const descriptionValue = form.watch("description") ?? ""

  return (
    <>
      <Card className="transition-colors hover:border-primary/30">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg leading-snug">{title}</CardTitle>
            <VoteButton
              ideaId={id}
              initialVoteCount={vote_count}
              initialHasVoted={user_has_voted}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {truncateText(description, 150)}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{author_name}</span>
            <div className="flex items-center gap-2">
              {isOwner && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    aria-label="Idee bearbeiten"
                    onClick={handleEditOpen}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    aria-label="Idee löschen"
                    onClick={() => { setDeleteError(null); setDeleteOpen(true) }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Idee bearbeiten</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Titel
                      <span className="ml-auto text-xs text-muted-foreground font-normal">
                        {titleValue.length}/100
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input maxLength={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Beschreibung
                      <span className="ml-auto text-xs text-muted-foreground font-normal">
                        {descriptionValue.length}/500
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        maxLength={500}
                        rows={4}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editError && (
                <p className="text-sm text-destructive">{editError}</p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={form.formState.isSubmitting}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Speichern…" : "Speichern"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Idee löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Idee <strong>&ldquo;{title}&rdquo;</strong> wird unwiderruflich gelöscht.
              Alle Votes werden ebenfalls entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive px-1">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); onDeleteConfirm() }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Löschen…" : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
