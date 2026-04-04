"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface AdminStatusSelectProps {
  ideaId: string
  currentStatus: string
  onStatusUpdated: (ideaId: string, newStatus: string) => void
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Ausstehend" },
  { value: "approved", label: "Genehmigt" },
  { value: "rejected", label: "Abgelehnt" },
  { value: "implemented", label: "Umgesetzt" },
]

export function AdminStatusSelect({
  ideaId,
  currentStatus,
  onStatusUpdated,
}: AdminStatusSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus) return

    setIsUpdating(true)
    try {
      const res = await fetch(`/api/admin/ideas/${ideaId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Fehler beim Aktualisieren")
      }

      onStatusUpdated(ideaId, newStatus)
      toast.success("Status erfolgreich geändert")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Aktualisieren des Status")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger
        className="h-8 text-xs"
        aria-label={`Status ändern für Idee`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
