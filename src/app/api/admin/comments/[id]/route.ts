import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { requireAdmin } from "@/lib/admin-auth"

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/admin/comments/[id]
 * Hard-deletes a comment and writes an audit log entry.
 * Admin only.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const { id } = await context.params

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Ungültige Kommentar-ID" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  // Fetch comment for audit log before deletion
  const { data: comment, error: fetchError } = await supabase
    .from("comments")
    .select("id, idea_id, user_id, text")
    .eq("id", id)
    .single()

  if (fetchError || !comment) {
    return NextResponse.json({ error: "Kommentar nicht gefunden" }, { status: 404 })
  }

  // Hard delete
  const { error: deleteError } = await supabase
    .from("comments")
    .delete()
    .eq("id", id)

  if (deleteError) {
    return NextResponse.json(
      { error: "Fehler beim Löschen des Kommentars" },
      { status: 500 }
    )
  }

  // Write audit log entry
  const { error: auditError } = await supabase.from("admin_audit_log").insert({
    admin_id: auth.user.id,
    action: "comment_deleted",
    target_type: "comment",
    target_id: id,
    details: {
      idea_id: comment.idea_id,
      author_id: comment.user_id,
      text_preview: comment.text.slice(0, 100),
    },
  })

  if (auditError) {
    console.error("Audit log insert failed:", auditError)
  }

  return NextResponse.json({ success: true })
}
