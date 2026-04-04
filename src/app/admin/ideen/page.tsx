import { Suspense } from "react"
import { AdminIdeasList } from "@/components/admin/admin-ideas-list"

export const metadata = {
  title: "Ideenverwaltung - Admin",
  description: "Ideen verwalten und Status ändern",
}

export default function AdminIdeasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ideenverwaltung</h1>
        <p className="text-muted-foreground">
          Alle Ideen einsehen, filtern und den Status ändern.
        </p>
      </div>
      <Suspense>
        <AdminIdeasList />
      </Suspense>
    </div>
  )
}
