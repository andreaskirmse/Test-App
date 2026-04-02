"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { IdeaCard } from "@/components/ideas/idea-card"
import { IdeaListHeader } from "@/components/ideas/idea-list-header"
import { IdeaListEmpty } from "@/components/ideas/idea-list-empty"
import { IdeaListSkeleton } from "@/components/ideas/idea-list-skeleton"
import { IdeaListPagination } from "@/components/ideas/idea-list-pagination"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Idea {
  id: string
  user_id: string
  title: string
  description: string
  status: string
  created_at: string
  author_name: string
  vote_count: number
  user_has_voted: boolean
}

interface IdeasResponse {
  ideas: Idea[]
  total: number
  page: number
  page_size: number
  total_pages: number
  sort: string
}

export function IdeaList() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const sortParam = searchParams.get("sort")
  const pageParam = searchParams.get("page")

  const sort: "votes" | "date" = sortParam === "date" ? "date" : "votes"
  const page = Math.max(parseInt(pageParam || "1", 10) || 1, 1)

  const [data, setData] = useState<IdeasResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIdeas = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/ideas?sort=${sort}&page=${page}`)
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
  }, [sort, page])

  useEffect(() => {
    fetchIdeas()
  }, [fetchIdeas])

  function updateParams(newSort: string, newPage: number) {
    const params = new URLSearchParams()
    params.set("sort", newSort)
    if (newPage > 1) params.set("page", String(newPage))
    router.push(`/board?${params.toString()}`)
  }

  function handleSortChange(newSort: "votes" | "date") {
    updateParams(newSort, 1)
  }

  function handlePageChange(newPage: number) {
    updateParams(sort, newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="space-y-6">
      <IdeaListHeader sort={sort} onSortChange={handleSortChange} />

      {loading && <IdeaListSkeleton />}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && data && data.ideas.length === 0 && (
        <IdeaListEmpty />
      )}

      {!loading && !error && data && data.ideas.length > 0 && (
        <>
          <div className="space-y-4">
            {data.ideas.map((idea) => (
              <IdeaCard key={idea.id} {...idea} />
            ))}
          </div>

          <IdeaListPagination
            currentPage={data.page}
            totalPages={data.total_pages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <div className="flex justify-center pt-2">
        <Button asChild variant="outline">
          <Link href="/submit">Neue Idee einreichen</Link>
        </Button>
      </div>
    </div>
  )
}
