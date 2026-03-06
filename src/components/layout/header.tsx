"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const navItems = [
  { href: "/assets", label: "Browse" },
  { href: "/assets?tab=categories", label: "Categories" },
  { href: "/sellers", label: "Sellers" },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className="fixed left-0 right-0 top-0 z-40 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl supports-[backdrop-filter]:bg-black/30"
      role="banner"
    >
      <div className="container flex h-14 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight text-foreground transition-colors hover:text-primary"
          aria-label="GameAssets — на главную"
        >
          <span className="text-xl leading-none" aria-hidden>
            ⬡
          </span>
          <span>GameAssets</span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Основная навигация"
        >
          {navItems.map(({ href, label }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right: Login + Start Selling */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sell">Start Selling</Link>
            </Button>
          </div>

          {/* Mobile burger */}
          <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Открыть меню"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent
              showClose={true}
              className="left-0 right-0 top-0 w-full max-w-none translate-x-0 translate-y-0 rounded-none border-0 border-b border-white/10 bg-black/90 backdrop-blur-xl p-0 sm:max-w-none"
            >
              <DialogHeader className="border-b border-white/10 px-4 py-3">
                <DialogTitle className="text-left">Меню</DialogTitle>
              </DialogHeader>
              <nav
                className="flex flex-col gap-0 p-4"
                aria-label="Мобильная навигация"
              >
                {navItems.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-white/10"
                  >
                    {label}
                  </Link>
                ))}
                <div className="my-2 h-px bg-white/10" />
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground"
                >
                  Login
                </Link>
                <Link
                  href="/sell"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-primary hover:bg-white/10"
                >
                  Start Selling
                </Link>
              </nav>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  )
}
