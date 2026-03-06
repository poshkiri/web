"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/useUser"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { User, Link2, Loader2, CreditCard } from "lucide-react"

const STEP_COUNT = 2

const step1Schema = z.object({
  displayName: z.string().min(2, "Минимум 2 символа"),
  bio: z.string().min(1, "Добавьте краткое описание"),
  website: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.trim() === "" || z.string().url().safeParse(v).success,
      { message: "Некорректный URL" }
    ),
})

type Step1FormValues = z.infer<typeof step1Schema>

const AVATAR_BUCKET = "avatars"
const AVATAR_MAX_SIZE_MB = 2
const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp"

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [step, setStep] = useState(1)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [connectLoading, setConnectLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      displayName: "",
      bio: "",
      website: "",
    },
  })

  useEffect(() => {
    if (!user) return
    reset({
      displayName: user.name ?? "",
      bio: user.bio ?? "",
      website: user.website ?? "",
    })
  }, [user, reset])

  if (userLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > AVATAR_MAX_SIZE_MB * 1024 * 1024) {
      toast({
        title: "Файл слишком большой",
        description: `Максимум ${AVATAR_MAX_SIZE_MB} МБ`,
        variant: "destructive",
      })
      return
    }
    setAvatarFile(file)
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  async function onStep1Submit(values: Step1FormValues) {
    const supabase = createClient()
    const updates: { name: string; bio: string; website?: string; avatar_url?: string } = {
      name: values.displayName.trim(),
      bio: values.bio.trim(),
      website: values.website?.trim() || null,
    }

    if (avatarFile && user?.id) {
      const ext = avatarFile.name.split(".").pop() || "jpg"
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        })
      if (uploadError) {
        toast({
          title: "Ошибка загрузки аватара",
          description: uploadError.message,
          variant: "destructive",
        })
        return
      }
      const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
      updates.avatar_url = urlData.publicUrl
    }

    const { error } = await supabase.from("users").update(updates).eq("id", user.id)

    if (error) {
      toast({
        title: "Ошибка сохранения",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    toast({ title: "Профиль сохранён" })
    setStep(2)
  }

  async function handleConnectStripe() {
    setConnectLoading(true)
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: "Ошибка",
          description: data.error ?? "Не удалось подключить Stripe",
          variant: "destructive",
        })
        setConnectLoading(false)
        return
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
    } catch {
      toast({
        title: "Ошибка",
        description: "Не удалось подключить Stripe",
        variant: "destructive",
      })
    }
    setConnectLoading(false)
  }

  return (
    <div className="container max-w-lg py-8 px-4">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Шаг {step} из {STEP_COUNT}
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / STEP_COUNT) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Профиль продавца</CardTitle>
            <CardDescription>
              Заполните данные для отображения в каталоге
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onStep1Submit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Аватар</Label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/50 hover:bg-muted"
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-muted-foreground" />
                    )}
                  </button>
                  <div className="text-sm text-muted-foreground">
                    <p>Нажмите для загрузки</p>
                    <p>JPG, PNG или WebP, до {AVATAR_MAX_SIZE_MB} МБ</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={AVATAR_ACCEPT}
                    className="hidden"
                    onChange={onAvatarChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Отображаемое имя</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="displayName"
                    placeholder="Как вас показывать покупателям"
                    className="pl-9"
                    {...register("displayName")}
                  />
                </div>
                {errors.displayName && (
                  <p className="text-sm text-destructive">
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">О себе</Label>
                <Textarea
                  id="bio"
                  placeholder="Краткое описание для профиля продавца"
                  rows={4}
                  className="resize-none"
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Сайт (необязательно)</Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://..."
                    className="pl-9"
                    {...register("website")}
                  />
                </div>
                {errors.website && (
                  <p className="text-sm text-destructive">
                    {errors.website.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Сохранение…" : "Далее — подключить Stripe"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Подключить Stripe</CardTitle>
            <CardDescription>
              Чтобы получать выплаты за продажи, подключите аккаунт Stripe. Вы
              перейдёте на страницу Stripe для заполнения данных.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              className="w-full"
              onClick={handleConnectStripe}
              disabled={connectLoading}
            >
              {connectLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
              Connect Stripe Account
            </Button>
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(1)}
              disabled={connectLoading}
            >
              Назад
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
