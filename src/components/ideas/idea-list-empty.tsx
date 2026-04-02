import Link from "next/link"
import { Button } from "@/components/ui/button"

export function IdeaListEmpty() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center"
      role="status"
      aria-label="Keine Ideen vorhanden"
    >
      <div className="text-4xl mb-4" aria-hidden="true">
        💡
      </div>
      <h2 className="text-lg font-semibold mb-2">Noch keine Ideen vorhanden</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Sei der Erste und reiche eine Idee ein, um die Diskussion zu starten.
      </p>
      <Button asChild>
        <Link href="/submit">Idee einreichen</Link>
      </Button>
    </div>
  )
}
