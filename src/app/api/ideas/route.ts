import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { createIdeaSchema } from "@/lib/validations/ideas"

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MINUTES = 60

/**
 * GET /api/ideas
 * Returns ideas visible to the current user:
 * - All approved ideas
 * - The user's own pending ideas
 */
export async function GET(request: NextRequest) {
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

  // Parse optional query params
  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get("limit")
  const offsetParam = searchParams.get("offset")
  const limit = Math.min(Math.max(parseInt(limitParam || "20", 10), 1), 100)
  const offset = Math.max(parseInt(offsetParam || "0", 10), 0)

  // RLS handles visibility: approved ideas + own ideas (any status)
  // We use a single query since RLS policy already enforces the correct filter
  const { data: ideas, error, count } = await supabase
    .from("ideas")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Laden der Ideen" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ideas,
    total: count,
    limit,
    offset,
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
