"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, X } from "lucide-react"
import type { Engine } from "@/types"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const CATEGORIES = [
  { value: "2d", label: "2D" },
  { value: "3d", label: "3D" },
  { value: "audio", label: "Audio" },
  { value: "fonts-ui", label: "Fonts/UI" },
  { value: "mods", label: "Mods" },
] as const

const ENGINES: { value: Engine; label: string }[] = [
  { value: "Unity", label: "Unity" },
  { value: "Unreal", label: "Unreal" },
  { value: "Godot", label: "Godot" },
  { value: "Other", label: "Other" },
]

const LICENSE_OPTIONS = [
  { value: "", label: "All" },
  { value: "personal", label: "Personal" },
  { value: "commercial", label: "Commercial" },
] as const

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "top_rated", label: "Top Rated" },
] as const

const PRICE_MAX = 500
const PRICE_MIN = 0

function getSearchParamsState(searchParams: URLSearchParams) {
  const categories = searchParams.getAll("category").filter(Boolean)
  const engines = searchParams.getAll("engine").filter(Boolean) as Engine[]
  const minPrice = Math.min(
    PRICE_MAX,
    Math.max(PRICE_MIN, Number(searchParams.get("minPrice")) || PRICE_MIN)
  )
  const maxPrice = Math.min(
    PRICE_MAX,
    Math.max(PRICE_MIN, Number(searchParams.get("maxPrice")) || PRICE_MAX)
  )
  const license = searchParams.get("license") ?? ""
  const sort = searchParams.get("sort") ?? "newest"
  const search = searchParams.get("search") ?? ""
  return {
    categories,
    engines,
    minPrice,
    maxPrice,
    license,
    sort,
    search,
  }
}

function countActiveFilters(state: ReturnType<typeof getSearchParamsState>) {
  let count = 0
  if (state.categories.length > 0) count += state.categories.length
  if (state.engines.length > 0) count += state.engines.length
  if (state.minPrice > PRICE_MIN || state.maxPrice < PRICE_MAX) count += 1
  if (state.license) count += 1
  if (state.sort !== "newest") count += 1
  return count
}

function buildSearchParams(state: ReturnType<typeof getSearchParamsState>) {
  const params = new URLSearchParams()
  state.categories.forEach((c) => params.append("category", c))
  state.engines.forEach((e) => params.append("engine", e))
  if (state.minPrice > PRICE_MIN) params.set("minPrice", String(state.minPrice))
  if (state.maxPrice < PRICE_MAX) params.set("maxPrice", String(state.maxPrice))
  if (state.license) params.set("license", state.license)
  if (state.sort !== "newest") params.set("sort", state.sort)
  if (state.search.trim()) params.set("search", state.search.trim())
  return params
}

export function FiltersPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const state = React.useMemo(
    () => getSearchParamsState(searchParams),
    [searchParams]
  )

  const activeCount = React.useMemo(() => countActiveFilters(state), [state])

  const updateUrl = React.useCallback(
    (next: ReturnType<typeof getSearchParamsState>) => {
      const params = buildSearchParams(next)
      const query = params.toString()
      router.push(query ? `/assets?${query}` : "/assets", { scroll: false })
    },
    [router]
  )

  const toggleCategory = (value: string) => {
    const next = state.categories.includes(value)
      ? state.categories.filter((c) => c !== value)
      : [...state.categories, value]
    updateUrl({ ...state, categories: next })
  }

  const toggleEngine = (value: Engine) => {
    const next = state.engines.includes(value)
      ? state.engines.filter((e) => e !== value)
      : [...state.engines, value]
    updateUrl({ ...state, engines: next })
  }

  const setPrice = (min: number, max: number) => {
    updateUrl({
      ...state,
      minPrice: min,
      maxPrice: max,
    })
  }

  const setLicense = (value: string) => {
    updateUrl({ ...state, license: value })
  }

  const setSort = (value: string) => {
    updateUrl({ ...state, sort: value })
  }

  const clearFilters = () => {
    updateUrl({
      categories: [],
      engines: [],
      minPrice: PRICE_MIN,
      maxPrice: PRICE_MAX,
      license: "",
      sort: "newest",
      search: "",
    })
    setSheetOpen(false)
  }

  const filtersContent = (
    <div className="flex flex-col gap-6">
      {/* Category */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Category</Label>
        <div className="flex flex-wrap gap-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={state.categories.length === 0}
              onChange={() => updateUrl({ ...state, categories: [] })}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">All</span>
          </label>
          {CATEGORIES.map(({ value, label }) => (
            <label key={value} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={state.categories.includes(value)}
                onChange={() => toggleCategory(value)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Engine */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Engine</Label>
        <div className="flex flex-wrap gap-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={state.engines.length === 0}
              onChange={() => updateUrl({ ...state, engines: [] })}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">All</span>
          </label>
          {ENGINES.map(({ value, label }) => (
            <label key={value} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={state.engines.includes(value)}
                onChange={() => toggleEngine(value)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Price: ${state.minPrice} — ${state.maxPrice}
        </Label>
        <div className="space-y-2">
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            value={state.minPrice}
            onChange={(e) => {
              const v = Number(e.target.value)
              setPrice(v, Math.max(v, state.maxPrice))
            }}
            className="h-2 w-full accent-primary"
          />
          <input
            type="range"
            min={PRICE_MIN}
            max={PRICE_MAX}
            value={state.maxPrice}
            onChange={(e) => {
              const v = Number(e.target.value)
              setPrice(Math.min(v, state.minPrice), v)
            }}
            className="h-2 w-full accent-primary"
          />
        </div>
      </div>

      {/* License */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">License</Label>
        <div className="flex flex-wrap gap-4">
          {LICENSE_OPTIONS.map(({ value, label }) => (
            <label key={value || "all"} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="license"
                checked={state.license === value}
                onChange={() => setLicense(value)}
                className="h-4 w-4 border-input"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Sort</Label>
        <Select value={state.sort} onValueChange={setSort}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={clearFilters}
        className="w-full"
      >
        <X className="mr-2 h-4 w-4" />
        Clear Filters
      </Button>
    </div>
  )

  return (
    <>
      {/* Desktop: inline filters in grid */}
      <div className="hidden md:block">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-b pb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Filters
            </span>
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-6">
            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Category
              </Label>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={state.categories.length === 0}
                    onChange={() => updateUrl({ ...state, categories: [] })}
                    className="h-3.5 w-3.5 rounded border-input"
                  />
                  <span className="text-sm">All</span>
                </label>
                {CATEGORIES.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-1.5"
                  >
                    <input
                      type="checkbox"
                      checked={state.categories.includes(value)}
                      onChange={() => toggleCategory(value)}
                      className="h-3.5 w-3.5 rounded border-input"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Engine */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Engine
              </Label>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={state.engines.length === 0}
                    onChange={() => updateUrl({ ...state, engines: [] })}
                    className="h-3.5 w-3.5 rounded border-input"
                  />
                  <span className="text-sm">All</span>
                </label>
                {ENGINES.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-1.5"
                  >
                    <input
                      type="checkbox"
                      checked={state.engines.includes(value)}
                      onChange={() => toggleEngine(value)}
                      className="h-3.5 w-3.5 rounded border-input"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Price */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Price: ${state.minPrice} — ${state.maxPrice}
              </Label>
              <div className="flex gap-2">
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  value={state.minPrice}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setPrice(v, Math.max(v, state.maxPrice))
                  }}
                  className="h-2 w-24 accent-primary"
                />
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  value={state.maxPrice}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setPrice(Math.min(v, state.minPrice), v)
                  }}
                  className="h-2 w-24 accent-primary"
                />
              </div>
            </div>
            {/* License */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                License
              </Label>
              <div className="flex gap-3">
                {LICENSE_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value || "all"}
                    className="flex cursor-pointer items-center gap-1.5"
                  >
                    <input
                      type="radio"
                      name="license-desktop"
                      checked={state.license === value}
                      onChange={() => setLicense(value)}
                      className="h-3.5 w-3.5 border-input"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Sort */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Sort
              </Label>
              <Select value={state.sort} onValueChange={setSort}>
                <SelectTrigger className="h-8 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="self-end"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile: trigger + sheet */}
      <div className="md:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                  {activeCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">{filtersContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
