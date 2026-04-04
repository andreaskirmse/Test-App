import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export type AdminAuthResult =
  | { user: { id: string; email?: string }; isAdmin: true }
  | { error: NextResponse }

/**
 * Verifies that the current request comes from an authenticated admin.
 * Returns the user + isAdmin flag on success, or an error NextResponse to return immediately.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      ),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (profileError || !profile?.is_admin) {
    return {
      error: NextResponse.json(
        { error: "Zugriff verweigert" },
        { status: 403 }
      ),
    }
  }

  return { user, isAdmin: true }
}
