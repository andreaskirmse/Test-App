import type { Metadata } from "next";
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
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="de">
      <body className="antialiased">
        <header className="flex justify-end p-4">
          {session && <LogoutButton />}
        </header>
        {children}
      </body>
    </html>
  );
}
