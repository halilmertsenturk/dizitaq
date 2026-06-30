'use client'

import { useState, useEffect } from 'react'
import { SearchBar } from '@/components/search/search-bar'
import { Filters } from '@/components/search/filters'
import { TitleGrid } from '@/components/title/title-grid'
import { useSearch, useTrending } from '@/hooks/use-titles'
import { useDebounce } from '@/hooks/use-debounce'
import { Search } from 'lucide-react'
import type { TitleFilters } from '@dizitaq/shared'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('')
  const [year, setYear] = useState('')
  const [type, setType] = useState<string>('')

  const debouncedQuery = useDebounce(query, 400)

  const hasFilters = debouncedQuery || genre || year || type

  const searchFilters: TitleFilters | undefined = hasFilters ? {
    query: debouncedQuery || undefined,
    genre: genre || undefined,
    year: year || undefined,
    type: (type || undefined) as TitleFilters['type'],
    page: 1,
  } : undefined

  const { data: searchData, loading: searchLoading, error: searchError } = useSearch(
    searchFilters ?? { query: debouncedQuery || undefined }
  )
  const { data: trendingData, loading: trendingLoading } = useTrending({})

  const titles = searchFilters ? searchData?.titles : trendingData?.titles
  const loading = searchFilters ? searchLoading : trendingLoading
  const error = searchFilters ? searchError : null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Search</h1>
        <SearchBar value={query} onChange={setQuery} />

        <div className="mt-4 flex justify-center">
          <Filters
            genre={genre}
            year={year}
            type={type}
            onGenreChange={setGenre}
            onYearChange={setYear}
            onTypeChange={setType}
          />
        </div>
      </div>

      {/* Results info */}
      <div className="mb-6">
        {searchFilters && searchData && (
          <p className="text-muted-foreground text-sm">
            Found {searchData.total} results
            {debouncedQuery && <> for &ldquo;{debouncedQuery}&rdquo;</>}
          </p>
        )}
        {!searchFilters && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Search className="h-4 w-4" />
            <span className="text-sm">Browse trending titles or start typing to search</span>
          </div>
        )}
      </div>

      <TitleGrid titles={titles ?? []} loading={loading} error={error} />
    </div>
  )
}
