"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { AdminPagination } from "./admin-pagination"

interface AdminComment {
  id: string
  idea_id: string
  idea_title: string
  user_id: string
  author_name: string
  text: string
  created_at: string
}

interface CommentsResponse {
  comments: AdminComment[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function AdminCommentsList() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const pageParam = searchParams.get("page")
  const page = Math.max(parseInt(pageParam || "1", 10) || 1, 1)

  const [data, setData] = useState<CommentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/comments?page=${page}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Fehler beim Laden der Kommentare")
      }
      const json: CommentsResponse = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams()
    if (newPage > 1) params.set("page", String(newPage))
    router.push(`/admin/kommentare?${params.toString()}`)
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId)
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Fehler beim Löschen")
      }

      toast.success("Kommentar gelöscht")

      // Remove from local state
      if (data) {
        const updatedComments = data.comments.filter((c) => c.id !== commentId)
        const newTotal = data.total - 1
        setData({
          ...data,
          comments: updatedComments,
          total: newTotal,
          total_pages: Math.ceil(newTotal / data.page_size),
        })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Löschen des Kommentars")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {loading && <AdminCommentsSkeleton />}

      {/* Empty */}
      {!loading && !error && data && data.comments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Keine Kommentare vorhanden.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && data && data.comments.length > 0 && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%]">Kommentar</TableHead>
                  <TableHead className="hidden md:table-cell">Idee</TableHead>
                  <TableHead className="hidden sm:table-cell">Autor</TableHead>
                  <TableHead className="hidden sm:table-cell">Datum</TableHead>
                  <TableHead className="w-[80px]">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.comments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell>
                      <span className="line-clamp-2 text-sm">{comment.text}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      <span className="line-clamp-1">{comment.idea_title}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {comment.author_name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(comment.created_at)}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            disabled={deletingId === comment.id}
                            aria-label="Kommentar löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Kommentar löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Dieser Kommentar wird unwiderruflich gelöscht. Die Aktion wird im
                              Audit-Log protokolliert.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(comment.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{data.total} Kommentare insgesamt</span>
            <AdminPagination
              currentPage={data.page}
              totalPages={data.total_pages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </div>
  )
}

function AdminCommentsSkeleton() {
  return (
    <div className="rounded-md border" role="status" aria-label="Kommentare werden geladen">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Kommentar</TableHead>
            <TableHead className="hidden md:table-cell">Idee</TableHead>
            <TableHead className="hidden sm:table-cell">Autor</TableHead>
            <TableHead className="hidden sm:table-cell">Datum</TableHead>
            <TableHead className="w-[80px]">Aktion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-full" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <span className="sr-only">Laden...</span>
    </div>
  )
}
