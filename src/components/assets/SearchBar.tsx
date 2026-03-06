"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const DEBOUNCE_MS = 300

export interface SearchBarProps {
  resultCount?: number | null
  className?: string
  inputClassName?: string
}

export function SearchBar({
  resultCount,
  className,
  inputClassName,
}: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchFromUrl = searchParams.get("search") ?? ""

  const [value, setValue] = React.useState(searchFromUrl)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local value when URL search param changes (e.g. browser back)
  React.useEffect(() => {
    setValue(searchFromUrl)
  }, [searchFromUrl])

  const updateUrl = React.useCallback(
    (search: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const trimmed = search.trim()
      if (trimmed) {
        params.set("search", trimmed)
      } else {
        params.delete("search")
      }
      const query = params.toString()
      router.push(query ? `/assets?${query}` : "/assets", { scroll: false })
    },
    [router, searchParams]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setValue(next)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateUrl(next)
      debounceRef.current = null
    }, DEBOUNCE_MS)
  }

  const handleClear = () => {
    setValue("")
    updateUrl("")
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
  }

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const hasText = value.length > 0
  const hasSearchParam = searchFromUrl.length > 0

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 shrink-0 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search assets..."
          value={value}
          onChange={handleChange}
          className={cn("pl-9 pr-9", inputClassName)}
          aria-label="Search assets"
        />
        {hasText && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {hasSearchParam && resultCount !== undefined && resultCount !== null && (
        <p className="text-sm text-muted-foreground">
          {resultCount === 0
            ? "No results"
            : `${resultCount} ${resultCount === 1 ? "result" : "results"}`}
        </p>
      )}
    </div>
  )
}
