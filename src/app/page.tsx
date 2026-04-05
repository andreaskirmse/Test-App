import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Voting App für Verbesserungsvorschläge",
  description: "Teile deine Ideen und stimme für die besten Vorschläge ab.",
}

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
        Voting App für Verbesserungsvorschläge
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground sm:text-xl">
        Willkommen! Teile deine Ideen und stimme für die besten Vorschläge ab.
      </p>
      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/login">Anmelden</Link>
        </Button>
        <Link
          href="/board"
          className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          Zum Ideenboard
        </Link>
      </div>
    </main>
  )
}
