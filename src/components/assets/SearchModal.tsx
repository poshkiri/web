"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search, X } from "lucide-react"
import type { Asset } from "@/types"
import { useAssets } from "@/hooks/useAssets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const MAX_RESULTS = 5
const SEARCH_DEBOUNCE_MS = 150

export interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const router = useRouter()
  const { fetchAssets } = useAssets()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<Asset[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = React.useCallback(
    async (q: string) => {
      const trimmed = q.trim()
      if (!trimmed) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const list = await fetchAssets({
          search: trimmed,
          sort: "-created_at",
        })
        setResults(list.slice(0, MAX_RESULTS))
        setSelectedIndex(0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    [fetchAssets]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setQuery(next)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      runSearch(next)
      debounceRef.current = null
    }, SEARCH_DEBOUNCE_MS)

    if (!next.trim()) {
      setResults([])
      setSelectedIndex(0)
    }
  }

  // When opening: focus input and reset state
  React.useEffect(() => {
    if (open) {
      setQuery("")
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Ctrl+K to open
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onOpenChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onOpenChange(false)
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : i))
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => (i > 0 ? i - 1 : 0))
      return
    }
    if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault()
      router.push(`/assets/${results[selectedIndex].slug}`)
      onOpenChange(false)
    }
  }

  React.useEffect(() => {
    if (!open && debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
  }, [open])

  const displayResults = results.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[15%] max-w-xl gap-0 overflow-hidden p-0 sm:rounded-lg"
        showClose={false}
        onPointerDownOutside={() => onOpenChange(false)}
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <DialogTitle className="sr-only">Search assets</DialogTitle>

        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search assets..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="h-12 border-0 shadow-none focus-visible:ring-0"
            aria-label="Search assets"
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-activedescendant={
              displayResults && results[selectedIndex]
                ? `search-result-${results[selectedIndex].id}`
                : undefined
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div
          id="search-results"
          role="listbox"
          className="max-h-[min(60vh,320px)] overflow-y-auto"
          aria-label="Search results"
        >
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}
          {!loading && query.trim() && !displayResults && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results for &quot;{query.trim()}&quot;
            </div>
          )}
          {!loading &&
            displayResults &&
            results.map((asset, index) => {
              const preview = asset.preview_images?.[0]
              const isSelected = index === selectedIndex
              return (
                <a
                  key={asset.id}
                  id={`search-result-${asset.id}`}
                  role="option"
                  aria-selected={isSelected}
                  href={`/assets/${asset.slug}`}
                  className={cn(
                    "flex items-center gap-3 border-b px-4 py-3 last:border-b-0",
                    "transition-colors hover:bg-accent/50",
                    isSelected && "bg-accent"
                  )}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={(e) => {
                    e.preventDefault()
                    router.push(`/assets/${asset.slug}`)
                    onOpenChange(false)
                  }}
                >
                  <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {preview ? (
                      <Image
                        src={preview}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        —
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {asset.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {asset.price === 0 ? "Free" : `$${asset.price.toFixed(2)}`}
                      {" · "}
                      {asset.engine}
                    </p>
                  </div>
                </a>
              )
            })}
        </div>

        {!query.trim() && (
          <div className="px-4 py-3 text-center text-xs text-muted-foreground">
            Type to search. ↑↓ to move, Enter to open, Esc to close.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
