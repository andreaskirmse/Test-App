import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { requireAdmin } from "@/lib/admin-auth"

const PAGE_SIZE = 20

const VALID_STATUSES = ["pending", "approved", "rejected", "implemented"] as const

/**
 * GET /api/admin/ideas
 * Returns all ideas (all statuses) with optional filtering and pagination.
 * Admin only.
 *
 * Query params:
 *   ?status=pending|approved|rejected|implemented  — filter by status
 *   ?search=text                                   — search in title/description
 *   ?page=1                                        — 1-based page number
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const supabase = await createServerSupabaseClient()

  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get("status")
  const searchParam = searchParams.get("search")?.trim()
  const pageParam = searchParams.get("page")
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  const validStatus =
    statusParam && VALID_STATUSES.includes(statusParam as (typeof VALID_STATUSES)[number])
      ? statusParam
      : null

  // Build query
  let query = supabase
    .from("ideas")
    .select("id, user_id, title, description, status, created_at", {
      count: "exact",
    })

  if (validStatus) {
    query = query.eq("status", validStatus)
  }
  if (searchParam) {
    query = query.or(`title.ilike.%${searchParam}%,description.ilike.%${searchParam}%`)
  }

  const offset = (page - 1) * PAGE_SIZE

  const { data: ideas, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Laden der Ideen" },
      { status: 500 }
    )
  }

  // Resolve author emails
  const userIds = [...new Set(ideas.map((i) => i.user_id))]
  const authorMap: Record<string, string> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds)

    if (profiles) {
      for (const p of profiles) {
        authorMap[p.id] = p.email ? p.email.split("@")[0] : "Anonym"
      }
    }
  }

  const total = count ?? 0

  return NextResponse.json({
    ideas: ideas.map((idea) => ({
      ...idea,
      author_name: authorMap[idea.user_id] ?? "Anonym",
    })),
    total,
    page,
    page_size: PAGE_SIZE,
    total_pages: Math.ceil(total / PAGE_SIZE),
  })
}
