import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { requireAdmin } from "@/lib/admin-auth"

/**
 * GET /api/admin/stats
 * Returns dashboard metrics: total ideas, votes, comments, and active users.
 * Admin only.
 */
export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const supabase = await createServerSupabaseClient()

  const [ideasResult, votesResult, commentsResult, usersResult] =
    await Promise.all([
      supabase.from("ideas").select("id", { count: "exact", head: true }),
      supabase.from("votes").select("id", { count: "exact", head: true }),
      supabase.from("comments").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ])

  if (
    ideasResult.error ||
    votesResult.error ||
    commentsResult.error ||
    usersResult.error
  ) {
    return NextResponse.json(
      { error: "Fehler beim Laden der Statistiken" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    total_ideas: ideasResult.count ?? 0,
    total_votes: votesResult.count ?? 0,
    total_comments: commentsResult.count ?? 0,
    total_users: usersResult.count ?? 0,
  })
}
