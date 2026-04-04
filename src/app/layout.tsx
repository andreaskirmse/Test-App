import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";
import "./globals.css";
import { LogoutButton } from "@/components/auth/logout-button"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export const metadata: Metadata = {
  title: "AI Coding Starter Kit",
  description: "Built with AI Agent Team System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()
    isAdmin = !!profile?.is_admin
  }

  return (
    <html lang="de">
      <body className="antialiased">
        <header className="flex items-center justify-end gap-2 p-4">
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Admin Panel öffnen"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
          {user && <LogoutButton />}
        </header>
        {children}
      </body>
    </html>
  );
}
