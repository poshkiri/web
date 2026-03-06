"use client"

import { useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import ReactMarkdown from "react-markdown"
import type { Category, Engine, LicenseType } from "@/types"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ENGINE_VALUES: Engine[] = ["Unity", "Unreal", "Godot", "Other"]

const licenseOptions: { value: LicenseType; label: string; description: string }[] = [
  {
    value: "personal",
    label: "Personal",
    description: "Use in personal or hobby projects. No direct monetization.",
  },
  {
    value: "commercial",
    label: "Commercial",
    description: "Use in commercial products, including paid games and assets.",
  },
]

export const basicInfoSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z
    .string()
    .min(20, "Description should be at least 20 characters")
    .max(5000, "Description is too long"),
  categoryId: z.string().min(1, "Please select a category"),
  engine: z.custom<Engine>().refine((value) => ENGINE_VALUES.includes(value as Engine), {
    message: "Please select an engine",
  }),
  license_type: z.custom<LicenseType>().refine(
    (value) => value === "personal" || value === "commercial",
    {
      message: "Please select a license type",
    }
  ),
  price: z
    .number({
      invalid_type_error: "Price must be a number",
    })
    .min(0, "Price cannot be negative")
    .max(9999, "Price is too high"),
  tags: z.array(z.string()).default([]),
})

export type BasicInfoFormValues = z.infer<typeof basicInfoSchema>

export interface StepBasicInfoProps {
  categories: Category[]
  /**
   * Optional list of suggested tags to choose from.
   */
  suggestedTags?: string[]
  defaultValues?: Partial<BasicInfoFormValues>
  onValidChange?: (isValid: boolean, values: BasicInfoFormValues) => void
  onSubmit: (values: BasicInfoFormValues) => void
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function StepBasicInfo({
  categories,
  suggestedTags = [],
  defaultValues,
  onValidChange,
  onSubmit,
}: StepBasicInfoProps) {
  const [tagInput, setTagInput] = useState("")

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setValue,
    trigger,
  } = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      engine: "Unity",
      license_type: "personal",
      price: 0,
      tags: [],
      ...defaultValues,
    },
  })

  const watchedTitle = watch("title")
  const watchedDescription = watch("description")
  const watchedPrice = watch("price")
  const watchedTags = watch("tags") ?? []

  const slugPreview = useMemo(() => {
    if (!watchedTitle) return ""
    return slugify(watchedTitle)
  }, [watchedTitle])

  const priceLabel = watchedPrice === 0 ? "Free" : `$${watchedPrice.toFixed(2)}`

  const allSuggestedTags = useMemo(
    () => suggestedTags.filter((tag) => !watchedTags.includes(tag)),
    [suggestedTags, watchedTags]
  )

  const handleInternalSubmit = (values: BasicInfoFormValues) => {
    onSubmit(values)
  }

  const handleTagAdd = (tag: string) => {
    const normalized = tag.trim()
    if (!normalized) return
    if (watchedTags.length >= 10) return
    if (watchedTags.includes(normalized)) return
    const nextTags = [...watchedTags, normalized]
    setValue("tags", nextTags, { shouldValidate: true, shouldDirty: true })
    setTagInput("")
    void trigger("tags")
  }

  const handleTagRemove = (tag: string) => {
    const nextTags = watchedTags.filter((t) => t !== tag)
    setValue("tags", nextTags, { shouldValidate: true, shouldDirty: true })
    void trigger("tags")
  }

  if (onValidChange) {
    const subscription = watch((values, { name }) => {
      if (!name) return
      const currentValues = values as BasicInfoFormValues
      void trigger().then((valid) => {
        onValidChange(valid, currentValues)
      })
    })
    void subscription
  }

  return (
    <form onSubmit={handleSubmit(handleInternalSubmit)} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Cinematic sci-fi environment kit"
          {...register("title")}
        />
        {slugPreview && (
          <p className="text-xs text-muted-foreground">
            Slug: <span className="font-mono text-foreground">{slugPreview}</span>
          </p>
        )}
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Label htmlFor="description">Description (Markdown)</Label>
          <Textarea
            id="description"
            rows={8}
            placeholder="Describe what is included in the asset, technical details, and how to use it..."
            className="resize-y"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Supports basic Markdown: headings, lists, links, code blocks.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Description Preview</Label>
          <div className="prose prose-sm max-w-none rounded-md border bg-card p-3 text-sm dark:prose-invert">
            {watchedDescription ? (
              <ReactMarkdown>{watchedDescription}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">
                Start typing to see a live preview of your description.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center gap-2">
                        {category.icon && (
                          <span className="text-base" aria-hidden="true">
                            {category.icon}
                          </span>
                        )}
                        <span>{category.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.categoryId && (
            <p className="text-sm text-destructive">{errors.categoryId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="engine">Engine</Label>
          <Controller
            control={control}
            name="engine"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(value as Engine)}
              >
                <SelectTrigger id="engine">
                  <SelectValue placeholder="Select engine" />
                </SelectTrigger>
                <SelectContent>
                  {ENGINE_VALUES.map((engine) => (
                    <SelectItem key={engine} value={engine}>
                      {engine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.engine && (
            <p className="text-sm text-destructive">
              {errors.engine.message ?? "Please select an engine"}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Label>License type</Label>
        <div className="grid gap-3 md:grid-cols-2">
          {licenseOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-md border bg-card p-3 hover:border-primary"
            >
              <input
                type="radio"
                className="mt-1 h-4 w-4 cursor-pointer accent-primary"
                value={option.value}
                {...register("license_type")}
              />
              <div>
                <div className="font-medium">{option.label}</div>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
        {errors.license_type && (
          <p className="text-sm text-destructive">
            {errors.license_type.message ?? "Please choose a license"}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label htmlFor="price">Price</Label>
        <div className="flex items-center gap-4">
          <Input
            id="price"
            type="number"
            min={0}
            step="0.5"
            className="w-32"
            {...register("price", { valueAsNumber: true })}
          />
          <span className="text-sm font-medium">{priceLabel}</span>
        </div>
        <Controller
          control={control}
          name="price"
          render={({ field }) => (
            <input
              type="range"
              min={0}
              max={200}
              step={1}
              value={Number.isFinite(field.value) ? field.value : 0}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className="block w-full cursor-pointer"
            />
          )}
        />
        <p className="text-xs text-muted-foreground">
          Set to 0 to make the asset free.
        </p>
        {errors.price && (
          <p className="text-sm text-destructive">{errors.price.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>Tags</Label>
          <p className="text-xs text-muted-foreground">
            {watchedTags.length}/10 tags used
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {watchedTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagRemove(tag)}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80"
            >
              <span>{tag}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
          {watchedTags.length === 0 && (
            <span className="text-xs text-muted-foreground">
              No tags yet. Add a few keywords.
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Add a tag and press Enter"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                handleTagAdd(tagInput)
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => handleTagAdd(tagInput)}
            disabled={!tagInput.trim() || watchedTags.length >= 10}
          >
            Add tag
          </Button>
        </div>

        {allSuggestedTags.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Suggested tags:</p>
            <div className="flex flex-wrap gap-1.5">
              {allSuggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagAdd(tag)}
                  className="rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {errors.tags && (
          <p className="text-sm text-destructive">
            {errors.tags.message ?? "Please adjust your tags"}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={!isValid}>
          Next Step →
        </Button>
      </div>
    </form>
  )
}
