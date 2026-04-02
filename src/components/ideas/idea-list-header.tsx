"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SortOption = "votes" | "date"

interface IdeaListHeaderProps {
  sort: SortOption
  onSortChange: (value: SortOption) => void
}

export function IdeaListHeader({ sort, onSortChange }: IdeaListHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">Ideenboard</h1>
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="w-full sm:w-[200px]" aria-label="Sortierung">
          <SelectValue placeholder="Sortieren nach" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="votes">Meiste Votes</SelectItem>
          <SelectItem value="date">Neueste zuerst</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
