import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { updateIdeaSchema } from "@/lib/validations/ideas"

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/ideas/[id]
 * Returns a single idea by ID (subject to RLS visibility).
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createServerSupabaseClient()

  // Auth is optional — logged-out users can see approved ideas (RLS handles visibility)

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json(
      { error: "Ungültige Idee-ID" },
      { status: 400 }
    )
  }

  const { data: idea, error } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !idea) {
    return NextResponse.json(
      { error: "Idee nicht gefunden" },
      { status: 404 }
    )
  }

  return NextResponse.json({ idea })
}

/**
 * PATCH /api/ideas/[id]
 * Updates an idea. Only the owner can update their own idea.
 * RLS enforces ownership, but we also check explicitly.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
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

  const validation = updateIdeaSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validierungsfehler",
        details: validation.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  // Ensure at least one field is being updated
  const updateData = validation.data
  if (!updateData.title && !updateData.description) {
    return NextResponse.json(
      { error: "Mindestens ein Feld muss aktualisiert werden" },
      { status: 400 }
    )
  }

  // Verify ownership before updating (defense in depth alongside RLS)
  const { data: existing, error: fetchError } = await supabase
    .from("ideas")
    .select("user_id")
    .eq("id", id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: "Idee nicht gefunden" },
      { status: 404 }
    )
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json(
      { error: "Keine Berechtigung" },
      { status: 403 }
    )
  }

  // Update the idea (RLS also enforces ownership)
  const { data: idea, error: updateError } = await supabase
    .from("ideas")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Idee" },
      { status: 500 }
    )
  }

  return NextResponse.json({ idea })
}

/**
 * DELETE /api/ideas/[id]
 * Deletes an idea. Only the owner can delete their own idea.
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
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json(
      { error: "Ungültige Idee-ID" },
      { status: 400 }
    )
  }

  // Verify ownership before deleting (defense in depth alongside RLS)
  const { data: existing, error: fetchError } = await supabase
    .from("ideas")
    .select("user_id")
    .eq("id", id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: "Idee nicht gefunden" },
      { status: 404 }
    )
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json(
      { error: "Keine Berechtigung" },
      { status: 403 }
    )
  }

  const { error: deleteError } = await supabase
    .from("ideas")
    .delete()
    .eq("id", id)

  if (deleteError) {
    return NextResponse.json(
      { error: "Fehler beim Löschen der Idee" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
