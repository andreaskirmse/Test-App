import { Suspense } from "react"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { AdminDashboardSkeleton } from "@/components/admin/admin-dashboard-skeleton"

export const metadata = {
  title: "Admin Dashboard",
  description: "Übersicht und Statistiken",
}

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Übersicht aller Statistiken und Aktivitäten.
        </p>
      </div>
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminDashboard />
      </Suspense>
    </div>
  )
}
