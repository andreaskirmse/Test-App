import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function BoardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Board kommt bald.</p>
      <Button asChild>
        <Link href="/submit">Idee einreichen</Link>
      </Button>
    </main>
  )
}
