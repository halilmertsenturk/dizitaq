'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GENRES } from '@dizitaq/shared'

interface FiltersProps {
  genre: string
  year: string
  type: string
  onGenreChange: (value: string) => void
  onYearChange: (value: string) => void
  onTypeChange: (value: string) => void
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 50 }, (_, i) => String(CURRENT_YEAR - i))

export function Filters({ genre, year, type, onGenreChange, onYearChange, onTypeChange }: FiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={genre} onValueChange={onGenreChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Genre" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Genres</SelectItem>
          {GENRES.map((g) => (
            <SelectItem key={g} value={g}>{g}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={year} onValueChange={onYearChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {YEARS.map((y) => (
            <SelectItem key={y} value={y}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={type} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="movie">Movies</SelectItem>
          <SelectItem value="series">TV Shows</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
