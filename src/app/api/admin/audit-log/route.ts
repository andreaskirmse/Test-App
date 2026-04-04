import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { requireAdmin } from "@/lib/admin-auth"

const PAGE_SIZE = 50

/**
 * GET /api/admin/audit-log
 * Returns admin audit log entries, newest first, with pagination.
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

  const { data: entries, count, error } = await supabase
    .from("admin_audit_log")
    .select("id, admin_id, action, target_type, target_id, details, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Laden des Audit-Logs" },
      { status: 500 }
    )
  }

  // Resolve admin names
  const adminIds = [...new Set(entries.map((e) => e.admin_id))]
  const adminMap: Record<string, string> = {}

  if (adminIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", adminIds)

    if (profiles) {
      for (const p of profiles) {
        adminMap[p.id] = p.email ? p.email.split("@")[0] : "Admin"
      }
    }
  }

  const total = count ?? 0

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
      admin_id: e.admin_id,
      admin_name: adminMap[e.admin_id] ?? "Admin",
      action: e.action,
      target_type: e.target_type,
      target_id: e.target_id,
      details: e.details,
      created_at: e.created_at,
    })),
    total,
    page,
    page_size: PAGE_SIZE,
    total_pages: Math.ceil(total / PAGE_SIZE),
  })
}
