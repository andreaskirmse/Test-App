"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface AdminPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Vorherige Seite"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm tabular-nums">
        {currentPage} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Nächste Seite"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
