import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Добро пожаловать, {user.name ?? user.email}!
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/dashboard/purchases"
           className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
          <h2 className="font-semibold text-lg mb-1">🛍️ Мои покупки</h2>
          <p className="text-sm text-muted-foreground">Скачать купленные ассеты</p>
        </a>
        <a href="/dashboard/upload"
           className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
          <h2 className="font-semibold text-lg mb-1">📦 Загрузить ассет</h2>
          <p className="text-sm text-muted-foreground">Продавай свои работы</p>
        </a>
        <a href="/dashboard/earnings"
           className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
          <h2 className="font-semibold text-lg mb-1">💰 Заработок</h2>
          <p className="text-sm text-muted-foreground">Статистика продаж</p>
        </a>
      </div>
    </div>
  )
}
