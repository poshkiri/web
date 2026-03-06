"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { SearchBar } from "@/components/assets/SearchBar"
import { FiltersPanel } from "@/components/assets/FiltersPanel"
import { useAssets } from "@/hooks/useAssets"

export function AssetsCatalogTools() {
  const searchParams = useSearchParams()
  const { fetchAssets } = useAssets()
  const [resultCount, setResultCount] = React.useState<number | null>(null)

  const search = searchParams.get("search")?.trim() ?? ""

  React.useEffect(() => {
    if (!search) {
      setResultCount(null)
      return
    }
    let cancelled = false
    fetchAssets({ search })
      .then((data) => {
        if (!cancelled) setResultCount(data.length)
      })
      .catch(() => {
        if (!cancelled) setResultCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [search, fetchAssets])

  return (
    <>
      <div className="mb-4">
        <SearchBar resultCount={resultCount} className="max-w-md" />
      </div>
      <FiltersPanel />
    </>
  )
}
