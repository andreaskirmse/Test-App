import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { requireAdmin } from "@/lib/admin-auth"

const PAGE_SIZE = 20

/**
 * GET /api/admin/comments
 * Returns all comments across all ideas, newest first, with pagination.
 * Includes the idea title for context.
 * Admin only.
 *
 * Query params:
 *   ?page=1  — 1-based page number
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const supabase = await createServerSupabaseClient()

  const { searchParams } = new URL(request.url)
  const pageParam = searchParams.get("page")
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const { data: comments, count, error } = await supabase
    .from("comments")
    .select("id, idea_id, user_id, text, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Laden der Kommentare" },
      { status: 500 }
    )
  }

  // Resolve idea titles and author names in parallel
  const ideaIds = [...new Set(comments.map((c) => c.idea_id))]
  const userIds = [...new Set(comments.map((c) => c.user_id))]

  const [ideasResult, profilesResult] = await Promise.all([
    ideaIds.length > 0
      ? supabase.from("ideas").select("id, title").in("id", ideaIds)
      : { data: [], error: null },
    userIds.length > 0
      ? supabase.from("profiles").select("id, email").in("id", userIds)
      : { data: [], error: null },
  ])

  const ideaMap: Record<string, string> = {}
  for (const idea of ideasResult.data ?? []) {
    ideaMap[idea.id] = idea.title
  }

  const authorMap: Record<string, string> = {}
  for (const p of profilesResult.data ?? []) {
    authorMap[p.id] = p.email ? p.email.split("@")[0] : "Anonym"
  }

  const total = count ?? 0

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      idea_id: c.idea_id,
      idea_title: ideaMap[c.idea_id] ?? "Unbekannte Idee",
      user_id: c.user_id,
      author_name: authorMap[c.user_id] ?? "Anonym",
      text: c.text,
      created_at: c.created_at,
    })),
    total,
    page,
    page_size: PAGE_SIZE,
    total_pages: Math.ceil(total / PAGE_SIZE),
  })
}
