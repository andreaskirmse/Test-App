import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { requireAdmin } from "@/lib/admin-auth"

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const updateStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "implemented"]),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/admin/ideas/[id]/status
 * Changes the status of an idea and writes an audit log entry.
 * Admin only.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const { id } = await context.params

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Ungültige Idee-ID" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON" }, { status: 400 })
  }

  const validation = updateStatusSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: "Ungültiger Status", details: validation.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const supabase = await createServerSupabaseClient()

  // Fetch current status for audit log
  const { data: existing, error: fetchError } = await supabase
    .from("ideas")
    .select("id, status")
    .eq("id", id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Idee nicht gefunden" }, { status: 404 })
  }

  const oldStatus = existing.status
  const newStatus = validation.data.status

  if (oldStatus === newStatus) {
    return NextResponse.json({ error: "Status ist bereits gesetzt" }, { status: 409 })
  }

  // Update the idea status
  const { data: updatedIdea, error: updateError } = await supabase
    .from("ideas")
    .update({ status: newStatus })
    .eq("id", id)
    .select("id, title, status")
    .single()

  if (updateError) {
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Status" },
      { status: 500 }
    )
  }

  // Write audit log entry
  const { error: auditError } = await supabase.from("admin_audit_log").insert({
    admin_id: auth.user.id,
    action: "status_changed",
    target_type: "idea",
    target_id: id,
    details: { old_status: oldStatus, new_status: newStatus },
  })

  if (auditError) {
    console.error("Audit log insert failed:", auditError)
  }

  return NextResponse.json({ idea: updatedIdea })
}
