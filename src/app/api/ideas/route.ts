import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { createIdeaSchema } from "@/lib/validations/ideas"

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MINUTES = 60

const PAGE_SIZE = 10

/**
 * GET /api/ideas
 * Returns ideas visible to the current user:
 * - All approved ideas
 * - The user's own pending ideas
 *
 * Query params:
 *   ?sort=votes|date  — sorting mode (votes falls back to date until PROJ-4)
 *   ?page=1           — 1-based page number, 10 items per page
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

  // Parse query params
  const { searchParams } = new URL(request.url)
  const sortParam = searchParams.get("sort")
  const pageParam = searchParams.get("page")

  // Validate sort — only "votes" and "date" are accepted; default to "date"
  const sort = sortParam === "votes" || sortParam === "date" ? sortParam : "date"

  // Validate page — must be >= 1
  const page = Math.max(parseInt(pageParam || "1", 10) || 1, 1)
  const offset = (page - 1) * PAGE_SIZE

  // Sort by date descending (votes sorting falls back to date until PROJ-4)
  // Join against profiles to get author email for display name
  // RLS handles visibility: approved ideas + own ideas (any status)
  const { data: ideas, error, count } = await supabase
    .from("ideas")
    .select("id, user_id, title, description, status, created_at, profiles(email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Laden der Ideen" },
      { status: 500 }
    )
  }

  // Map ideas to include author_name, hiding raw email details
  const mappedIdeas = (ideas ?? []).map((idea) => {
    // profiles comes back as an object (single FK relation via user_id) or null
    const profileData = idea.profiles
    const profile = Array.isArray(profileData) ? profileData[0] as { email: string } | undefined : profileData as { email: string } | null
    let authorName = "Anonym"
    if (profile?.email) {
      // Use the part before @ as a display name
      authorName = profile.email.split("@")[0]
    }

    return {
      id: idea.id,
      user_id: idea.user_id,
      title: idea.title,
      description: idea.description,
      status: idea.status,
      created_at: idea.created_at,
      author_name: authorName,
      vote_count: 0, // Placeholder until PROJ-4 adds the votes table
    }
  })

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return NextResponse.json({
    ideas: mappedIdeas,
    total: count,
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
