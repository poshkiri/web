'use client'

import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface StepFilesValues {
  zipFile: File | null
  previewImages: File[]
}

export interface StepFilesProps {
  defaultValues?: Partial<StepFilesValues>
  onBack: () => void
  onSubmit: (values: StepFilesValues) => void
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export function StepFiles({ defaultValues, onBack, onSubmit }: StepFilesProps) {
  const [zipFile, setZipFile] = useState<File | null>(defaultValues?.zipFile ?? null)
  const [zipProgress, setZipProgress] = useState<number>(zipFile ? 100 : 0)
  const [zipDragActive, setZipDragActive] = useState(false)

  const [previewImages, setPreviewImages] = useState<File[]>(defaultValues?.previewImages ?? [])
  const [previewDragActive, setPreviewDragActive] = useState(false)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

  const hasZipError = !zipFile
  const hasPreviewError = previewImages.length === 0
  const isValid = !hasZipError && !hasPreviewError

  const zipFileLabel = useMemo(() => {
    if (!zipFile) return "Drag & drop .zip file here, or click to browse"
    return `${zipFile.name} • ${formatFileSize(zipFile.size)}`
  }, [zipFile])

  const handleZipFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.type !== "application/zip" && !file.name.toLowerCase().endsWith(".zip")) {
      return
    }
    setZipFile(file)
    setZipProgress(0)
    // Simulate instant upload completion for now
    setTimeout(() => {
      setZipProgress(100)
    }, 200)
  }, [])

  const handlePreviewFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const remainingSlots = Math.max(0, 5 - previewImages.length)
      if (remainingSlots === 0) return

      const next: File[] = []
      for (let index = 0; index < files.length && next.length < remainingSlots; index += 1) {
        const file = files[index]
        if (file.type.startsWith("image/")) {
          next.push(file)
        }
      }

      if (next.length === 0) return
      setPreviewImages((prev) => [...prev, ...next])
    },
    [previewImages.length]
  )

  const handleZipDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setZipDragActive(false)
    handleZipFiles(event.dataTransfer?.files ?? null)
  }

  const handlePreviewDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setPreviewDragActive(false)
    handlePreviewFiles(event.dataTransfer?.files ?? null)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValid) return
    onSubmit({
      zipFile,
      previewImages,
    })
  }

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return
    setPreviewImages((prev) => {
      if (fromIndex >= prev.length || toIndex >= prev.length) return prev
      const updated = [...prev]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      return updated
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Main asset file (.zip)</Label>
          <div
            className={cn(
              "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/40 px-4 py-8 text-center transition-colors",
              zipDragActive && "border-primary bg-primary/5",
              hasZipError && "border-destructive/70"
            )}
            onDragOver={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setZipDragActive(true)
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setZipDragActive(false)
            }}
            onDrop={handleZipDrop}
          >
            <Input
              type="file"
              accept=".zip,application/zip"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={(event) => handleZipFiles(event.target.files)}
            />
            <p className="text-sm font-medium">{zipFileLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Required. Max size depends on your plan.
            </p>

            {zipFile && (
              <div className="mt-4 w-full max-w-md space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Upload progress</span>
                  <span>{zipProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${zipProgress}%` }}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      setZipFile(null)
                      setZipProgress(0)
                    }}
                  >
                    Remove file
                  </Button>
                </div>
              </div>
            )}
          </div>
          {hasZipError && (
            <p className="text-sm text-destructive">Main .zip file is required.</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Label>Preview images</Label>
          <p className="text-xs text-muted-foreground">
            {previewImages.length}/5 images • first image is used as main preview
          </p>
        </div>

        <div
          className={cn(
            "relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/40 px-4 py-6 text-center transition-colors",
            previewDragActive && "border-primary bg-primary/5",
            hasPreviewError && "border-destructive/70"
          )}
          onDragOver={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setPreviewDragActive(true)
          }}
          onDragLeave={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setPreviewDragActive(false)
          }}
          onDrop={handlePreviewDrop}
        >
          <Input
            type="file"
            accept="image/*"
            multiple
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={(event) => handlePreviewFiles(event.target.files)}
          />
          <p className="text-sm font-medium">
            Drag & drop up to 5 images here, or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Recommended: 16:9 aspect ratio, at least 1280px wide.
          </p>
        </div>

        {hasPreviewError && (
          <p className="text-sm text-destructive">
            At least one preview image is required.
          </p>
        )}

        {previewImages.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {previewImages.map((file, index) => {
              const isMain = index === 0
              return (
                <div
                  key={`${file.name}-${index}`}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-md border bg-card",
                    draggingIndex === index && "opacity-60"
                  )}
                  draggable
                  onDragStart={() => setDraggingIndex(index)}
                  onDragEnd={() => setDraggingIndex(null)}
                  onDragOver={(event) => {
                    event.preventDefault()
                    if (draggingIndex === null || draggingIndex === index) return
                    handleReorder(draggingIndex, index)
                    setDraggingIndex(index)
                  }}
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    {isMain && (
                      <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow">
                        Main preview
                      </span>
                    )}
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full bg-background/80 px-1.5 py-0.5 text-xs text-muted-foreground shadow hover:bg-background hover:text-destructive"
                      onClick={() => {
                        setPreviewImages((prev) =>
                          prev.filter((_, fileIndex) => fileIndex !== index)
                        )
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-[10px] text-muted-foreground">
                      <span className="rounded-full border px-1 py-0.5">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button type="submit" size="lg" disabled={!isValid}>
          Next Step →
        </Button>
      </div>
    </form>
  )
}

