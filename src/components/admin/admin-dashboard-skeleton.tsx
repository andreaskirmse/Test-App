import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AdminDashboardSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      role="status"
      aria-label="Dashboard wird geladen"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
      <span className="sr-only">Laden...</span>
    </div>
  )
}
