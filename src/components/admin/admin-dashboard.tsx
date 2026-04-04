"use client"

import { useEffect, useState } from "react"
import { Lightbulb, ThumbsUp, MessageSquare, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AdminDashboardSkeleton } from "./admin-dashboard-skeleton"

interface Stats {
  total_ideas: number
  total_votes: number
  total_comments: number
  total_users: number
}

const statCards = [
  { key: "total_ideas" as const, label: "Ideen", icon: Lightbulb },
  { key: "total_votes" as const, label: "Votes", icon: ThumbsUp },
  { key: "total_comments" as const, label: "Kommentare", icon: MessageSquare },
  { key: "total_users" as const, label: "Benutzer", icon: Users },
]

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats")
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || "Fehler beim Laden der Statistiken")
        }
        const data: Stats = await res.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) return <AdminDashboardSkeleton />

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!stats) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map(({ key, label, icon: Icon }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[key]}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
