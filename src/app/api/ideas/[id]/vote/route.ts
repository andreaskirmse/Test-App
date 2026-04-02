import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

type RouteContext = {
  params: Promise<{ id: string }>
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * POST /api/ideas/[id]/vote
 * Cast a vote for an idea. Idempotent — if already voted, returns success.
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
      { error: "Ungueltige Idee-ID" },
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

  // Insert vote — ON CONFLICT makes this idempotent
  const { error: insertError } = await supabase
    .from("votes")
    .upsert(
      { user_id: user.id, idea_id: id },
      { onConflict: "user_id,idea_id", ignoreDuplicates: true }
    )

  if (insertError) {
    return NextResponse.json(
      { error: "Fehler beim Speichern des Votes" },
      { status: 500 }
    )
  }

  // Return updated vote count
  const { count } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("idea_id", id)

  return NextResponse.json({
    voted: true,
    vote_count: count ?? 0,
  })
}

/**
 * DELETE /api/ideas/[id]/vote
 * Remove the current user's vote from an idea.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
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
      { error: "Ungueltige Idee-ID" },
      { status: 400 }
    )
  }

  // Delete the vote (RLS ensures only own votes can be deleted)
  const { error: deleteError } = await supabase
    .from("votes")
    .delete()
    .eq("user_id", user.id)
    .eq("idea_id", id)

  if (deleteError) {
    return NextResponse.json(
      { error: "Fehler beim Entfernen des Votes" },
      { status: 500 }
    )
  }

  // Return updated vote count
  const { count } = await supabase
    .from("votes")
    .select("id", { count: "exact", head: true })
    .eq("idea_id", id)

  return NextResponse.json({
    voted: false,
    vote_count: count ?? 0,
  })
}
