import { Suspense } from "react"
import { AdminCommentsList } from "@/components/admin/admin-comments-list"

export const metadata = {
  title: "Kommentar-Moderation - Admin",
  description: "Kommentare moderieren und löschen",
}

export default function AdminCommentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kommentar-Moderation</h1>
        <p className="text-muted-foreground">
          Alle Kommentare einsehen und bei Bedarf löschen.
        </p>
      </div>
      <Suspense>
        <AdminCommentsList />
      </Suspense>
    </div>
  )
}
