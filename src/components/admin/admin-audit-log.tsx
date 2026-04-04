"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminPagination } from "./admin-pagination"

interface AuditEntry {
  id: string
  admin_id: string
  admin_name: string
  action: string
  target_type: string
  target_id: string
  details: Record<string, unknown>
  created_at: string
}

interface AuditLogResponse {
  entries: AuditEntry[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

const ACTION_LABEL: Record<string, string> = {
  status_changed: "Status geändert",
  comment_deleted: "Kommentar gelöscht",
}

const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  status_changed: "secondary",
  comment_deleted: "destructive",
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

function formatDetails(action: string, details: Record<string, unknown>): string {
  if (action === "status_changed") {
    const old_status = details.old_status as string
    const new_status = details.new_status as string
    const statusLabel: Record<string, string> = {
      pending: "Ausstehend",
      approved: "Genehmigt",
      rejected: "Abgelehnt",
      implemented: "Umgesetzt",
    }
    return `${statusLabel[old_status] || old_status} → ${statusLabel[new_status] || new_status}`
  }

  if (action === "comment_deleted") {
    const preview = details.text_preview as string
    return preview ? `"${preview}"` : "Kommentar entfernt"
  }

  return JSON.stringify(details)
}

export function AdminAuditLog() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const pageParam = searchParams.get("page")
  const page = Math.max(parseInt(pageParam || "1", 10) || 1, 1)

  const [data, setData] = useState<AuditLogResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLog = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/audit-log?page=${page}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Fehler beim Laden des Audit-Logs")
      }
      const json: AuditLogResponse = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchLog()
  }, [fetchLog])

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams()
    if (newPage > 1) params.set("page", String(newPage))
    router.push(`/admin/logs?${params.toString()}`)
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
      {loading && <AuditLogSkeleton />}

      {/* Empty */}
      {!loading && !error && data && data.entries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Noch keine Admin-Aktionen protokolliert.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && data && data.entries.length > 0 && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zeitpunkt</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Aktion</TableHead>
                  <TableHead className="hidden md:table-cell">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(entry.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.admin_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANT[entry.action] || "outline"}>
                        {ACTION_LABEL[entry.action] || entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      <span className="line-clamp-1">
                        {formatDetails(entry.action, entry.details)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{data.total} Einträge insgesamt</span>
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

function AuditLogSkeleton() {
  return (
    <div className="rounded-md border" role="status" aria-label="Audit-Log wird geladen">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Zeitpunkt</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Aktion</TableHead>
            <TableHead className="hidden md:table-cell">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <span className="sr-only">Laden...</span>
    </div>
  )
}
