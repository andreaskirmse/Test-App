import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { createIdeaSchema } from "@/lib/validations/ideas"

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MINUTES = 60

const PAGE_SIZE = 10

interface RawIdea {
  id: string
  user_id: string
  title: string
  description: string
  status: string
  created_at: string
  author_email: string | null
  vote_count: number
  user_has_voted: boolean
}

/**
 * GET /api/ideas
 * Returns ideas visible to the current user (auth optional):
 * - Logged-out: all approved ideas, vote counts, user_has_voted = false
 * - Logged-in: approved ideas + own pending ideas, with user_has_voted
 *
 * Query params:
 *   ?sort=votes|date  — sorting mode (server-side via RPC)
 *   ?page=1           — 1-based page number, 10 items per page
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  // Auth is optional — logged-out users can still browse
  const { data: { user } } = await supabase.auth.getUser()

  // Parse query params
  const { searchParams } = new URL(request.url)
  const sortParam = searchParams.get("sort")
  const pageParam = searchParams.get("page")

  const sort = sortParam === "votes" || sortParam === "date" ? sortParam : "date"
  const page = Math.max(parseInt(pageParam || "1", 10) || 1, 1)

  // RPC handles server-side sorting by vote count across all pages
  const { data, error } = await supabase.rpc("get_ideas_paginated", {
    p_sort: sort,
    p_page: page,
    p_page_size: PAGE_SIZE,
    p_user_id: user?.id ?? null,
  })

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Laden der Ideen" },
      { status: 500 }
    )
  }

  const raw = data as { ideas: RawIdea[]; total: number }

  const ideas = (raw.ideas ?? []).map((idea) => ({
    id: idea.id,
    user_id: idea.user_id,
    title: idea.title,
    description: idea.description,
    status: idea.status,
    created_at: idea.created_at,
    author_name: idea.author_email ? idea.author_email.split("@")[0] : "Anonym",
    vote_count: idea.vote_count,
    user_has_voted: idea.user_has_voted,
  }))

  const total = raw.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return NextResponse.json({
    ideas,
    total,
    page,
    page_size: PAGE_SIZE,
    total_pages: totalPages,
    sort,
  })
}

/**
 * POST /api/ideas
 * Creates a new idea for the authenticated user.
 * Includes rate limiting: max 5 ideas per user per hour.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: "Nicht authentifiziert" },
      { status: 401 }
    )
  }

  // Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Ungültiges JSON" },
      { status: 400 }
    )
  }

  const validation = createIdeaSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validierungsfehler",
        details: validation.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  // Rate limiting: count ideas created by this user in the last 60 minutes
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  ).toISOString()

  const { count: recentCount, error: countError } = await supabase
    .from("ideas")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", windowStart)

  if (countError) {
    return NextResponse.json(
      { error: "Fehler bei der Rate-Limit-Prüfung" },
      { status: 500 }
    )
  }

  if ((recentCount ?? 0) >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      {
        error: `Du kannst maximal ${RATE_LIMIT_MAX} Ideen pro Stunde einreichen. Bitte versuche es später erneut.`,
      },
      { status: 429 }
    )
  }

  // Insert the idea
  const { data: idea, error: insertError } = await supabase
    .from("ideas")
    .insert({
      user_id: user.id,
      title: validation.data.title,
      description: validation.data.description,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json(
      { error: "Fehler beim Speichern der Idee" },
      { status: 500 }
    )
  }

  return NextResponse.json({ idea }, { status: 201 })
}
