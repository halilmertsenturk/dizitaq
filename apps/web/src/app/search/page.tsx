'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/search/search-bar'
import { Filters } from '@/components/search/filters'
import { TitleGrid } from '@/components/title/title-grid'
import { Pagination } from '@/components/ui/pagination'
import { useSearch, useTrending } from '@/hooks/use-titles'
import { useDebounce } from '@/hooks/use-debounce'
import { Search } from 'lucide-react'
import type { TitleFilters } from '@dizitaq/shared'

function SearchContent() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('query') ?? '')
  const [genre, setGenre] = useState(searchParams.get('genre') ?? '')
  const [year, setYear] = useState(searchParams.get('year') ?? '')
  const [type, setType] = useState<string>(searchParams.get('type') ?? '')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const g = searchParams.get('genre')
    const y = searchParams.get('year')
    const t = searchParams.get('type')
    if (g) setGenre(g)
    if (y) setYear(y)
    if (t) setType(t)
    setPage(1)
  }, [searchParams])

  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    setPage(1)
  }, [genre, year, type, debouncedQuery])

  const resolvedFilters: TitleFilters = {
    query: debouncedQuery || undefined,
    genre: genre && genre !== 'all' ? genre : undefined,
    year: year && year !== 'all' ? year : undefined,
    type: type && type !== 'all' ? type as TitleFilters['type'] : undefined,
    page,
  }

  const hasFilters = !!(resolvedFilters.query || resolvedFilters.genre || resolvedFilters.year || resolvedFilters.type)
  const searchFilters: TitleFilters | undefined = hasFilters ? resolvedFilters : undefined

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

      {searchFilters && searchData && searchData.total_pages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={page}
            totalPages={searchData.total_pages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
