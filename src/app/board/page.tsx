import { Suspense } from "react"
import { IdeaList } from "@/components/ideas/idea-list"
import { IdeaListSkeleton } from "@/components/ideas/idea-list-skeleton"

export const metadata = {
  title: "Ideenboard",
  description: "Alle eingereichten Ideen im Ueberblick",
}

export default function BoardPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Suspense fallback={<IdeaListSkeleton />}>
          <IdeaList />
        </Suspense>
      </div>
    </main>
  )
}
