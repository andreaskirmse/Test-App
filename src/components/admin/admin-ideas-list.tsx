"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminPagination } from "./admin-pagination"
import { AdminStatusSelect } from "./admin-status-select"

interface AdminIdea {
  id: string
  user_id: string
  title: string
  description: string
  status: string
  created_at: string
  author_name: string
}

interface IdeasResponse {
  ideas: AdminIdea[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

const STATUS_OPTIONS = [
  { value: "all", label: "Alle Status" },
  { value: "pending", label: "Ausstehend" },
  { value: "approved", label: "Genehmigt" },
  { value: "rejected", label: "Abgelehnt" },
  { value: "implemented", label: "Umgesetzt" },
]

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  implemented: "secondary",
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Ausstehend",
  approved: "Genehmigt",
  rejected: "Abgelehnt",
  implemented: "Umgesetzt",
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function AdminIdeasList() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const statusParam = searchParams.get("status") || "all"
  const searchParam = searchParams.get("search") || ""
  const pageParam = searchParams.get("page")
  const page = Math.max(parseInt(pageParam || "1", 10) || 1, 1)

  const [data, setData] = useState<IdeasResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(searchParam)

  const fetchIdeas = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      if (statusParam !== "all") params.set("status", statusParam)
      if (searchParam) params.set("search", searchParam)

      const res = await fetch(`/api/admin/ideas?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Fehler beim Laden der Ideen")
      }
      const json: IdeasResponse = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten")
    } finally {
      setLoading(false)
    }
  }, [statusParam, searchParam, page])

  useEffect(() => {
    fetchIdeas()
  }, [fetchIdeas])

  function updateParams(newStatus: string, newSearch: string, newPage: number) {
    const params = new URLSearchParams()
    if (newStatus !== "all") params.set("status", newStatus)
    if (newSearch) params.set("search", newSearch)
    if (newPage > 1) params.set("page", String(newPage))
    router.push(`/admin/ideen?${params.toString()}`)
  }

  function handleStatusFilterChange(value: string) {
    updateParams(value, searchParam, 1)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    updateParams(statusParam, searchInput, 1)
  }

  function handlePageChange(newPage: number) {
    updateParams(statusParam, searchParam, newPage)
  }

  function handleStatusUpdated(ideaId: string, newStatus: string) {
    if (data) {
      setData({
        ...data,
        ideas: data.ideas.map((idea) =>
          idea.id === ideaId ? { ...idea, status: newStatus } : idea
        ),
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={statusParam} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Status filtern">
            <SelectValue placeholder="Status filtern" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ideen durchsuchen..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8"
              aria-label="Ideen durchsuchen"
            />
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {loading && <AdminIdeasSkeleton />}

      {/* Empty */}
      {!loading && !error && data && data.ideas.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Keine Ideen gefunden.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && data && data.ideas.length > 0 && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Titel</TableHead>
                  <TableHead className="hidden md:table-cell">Autor</TableHead>
                  <TableHead className="hidden sm:table-cell">Datum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[160px]">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.ideas.map((idea) => (
                  <TableRow key={idea.id}>
                    <TableCell className="font-medium">
                      <span className="line-clamp-2">{idea.title}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {idea.author_name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatDate(idea.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[idea.status] || "outline"}>
                        {STATUS_LABEL[idea.status] || idea.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AdminStatusSelect
                        ideaId={idea.id}
                        currentStatus={idea.status}
                        onStatusUpdated={handleStatusUpdated}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{data.total} Ideen insgesamt</span>
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

function AdminIdeasSkeleton() {
  return (
    <div className="rounded-md border" role="status" aria-label="Ideen werden geladen">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Titel</TableHead>
            <TableHead className="hidden md:table-cell">Autor</TableHead>
            <TableHead className="hidden sm:table-cell">Datum</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[160px]">Aktion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-full" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-8 w-full" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <span className="sr-only">Laden...</span>
    </div>
  )
}
