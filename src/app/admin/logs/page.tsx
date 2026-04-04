import { Suspense } from "react"
import { AdminAuditLog } from "@/components/admin/admin-audit-log"

export const metadata = {
  title: "Audit-Log - Admin",
  description: "Protokoll aller Admin-Aktionen",
}

export default function AdminLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit-Log</h1>
        <p className="text-muted-foreground">
          Protokoll aller Admin-Aktionen für Nachverfolgbarkeit.
        </p>
      </div>
      <Suspense>
        <AdminAuditLog />
      </Suspense>
    </div>
  )
}
