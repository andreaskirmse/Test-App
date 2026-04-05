import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { createCommentSchema } from "@/lib/validations/comments"

type RouteContext = {
  params: Promise<{ id: string }>
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const COMMENTS_PER_PAGE = 20
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_HOURS = 1

/**
 * GET /api/ideas/[id]/comments
 * Returns paginated comments for an idea, newest first.
 * No auth required — anyone can read comments.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createServerSupabaseClient()

  // Validate UUID format
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: "Ungültige Idee-ID" },
      { status: 400 }
    )
  }

  // Parse page from query params
  const { searchParams } = new URL(request.url)
  const pageParam = searchParams.get("page")
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

  // Verify the idea exists
  const { data: idea, error: ideaError } = await supabase
    .from("ideas")
    .select("id")
    .eq("id", id)
    .single()

  if (ideaError || !idea) {
    return NextResponse.json(
      { error: "Idee nicht gefunden" },
      { status: 404 }
    )
  }

  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("idea_id", id)

  if (countError) {
    return NextResponse.json(
      { error: "Fehler beim Laden der Kommentare" },
      { status: 500 }
    )
  }

  const total = totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(total / COMMENTS_PER_PAGE))
  const clampedPage = Math.min(page, totalPages)
  const offset = (clampedPage - 1) * COMMENTS_PER_PAGE

  // Fetch comments for this page
  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select("id, idea_id, user_id, text, created_at")
    .eq("idea_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + COMMENTS_PER_PAGE - 1)

  if (commentsError) {
    return NextResponse.json(
      { error: "Fehler beim Laden der Kommentare" },
      { status: 500 }
    )
  }

  // Resolve author names via profiles table (same table used in get_ideas_paginated RPC)
  const userIds = [...new Set(comments.map((c) => c.user_id))]
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

  const commentsWithAuthors = comments.map((comment) => ({
    id: comment.id,
    idea_id: comment.idea_id,
    user_id: comment.user_id,
    text: comment.text,
    created_at: comment.created_at,
    author_name: authorMap[comment.user_id] ?? "Anonym",
  }))

  return NextResponse.json({
    comments: commentsWithAuthors,
    total_count: total,
    page: clampedPage,
    total_pages: totalPages,
  })
}

/**
 * POST /api/ideas/[id]/comments
 * Creates a new comment on an idea.
 * Requires authentication. Rate limited to 10 comments per user per hour.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
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

  // Validate UUID format
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: "Ungültige Idee-ID" },
      { status: 400 }
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

  const validation = createCommentSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validierungsfehler",
        details: validation.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  // Verify the idea exists
  const { data: idea, error: ideaError } = await supabase
    .from("ideas")
    .select("id")
    .eq("id", id)
    .single()

  if (ideaError || !idea) {
    return NextResponse.json(
      { error: "Idee nicht gefunden" },
      { status: 404 }
    )
  }

  // Rate limit: check comments in the last hour
  const oneHourAgo = new Date(
    Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString()

  const { count: recentCount, error: rateError } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneHourAgo)

  if (rateError) {
    return NextResponse.json(
      { error: "Fehler bei der Rate-Limit-Prüfung" },
      { status: 500 }
    )
  }

  if ((recentCount ?? 0) >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      {
        error:
          "Rate-Limit erreicht. Maximal 10 Kommentare pro Stunde erlaubt.",
      },
      { status: 429 }
    )
  }

  // Insert the comment
  const { data: comment, error: insertError } = await supabase
    .from("comments")
    .insert({
      idea_id: id,
      user_id: user.id,
      text: validation.data.text,
    })
    .select("id, idea_id, user_id, text, created_at")
    .single()

  if (insertError) {
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Kommentars" },
      { status: 500 }
    )
  }

  // Derive author_name from the authenticated user's email
  const authorName = user.email ? user.email.split("@")[0] : "Anonym"

  return NextResponse.json(
    {
      comment: {
        ...comment,
        author_name: authorName,
      },
    },
    { status: 201 }
  )
}
