"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Menu } from "lucide-react"
import type { User } from "@/types"
import { Button } from "@/components/ui/button"
import { UserMenu } from "./UserMenu"
import { SearchModal } from "@/components/assets/SearchModal"
import { CartDrawer } from "./CartDrawer"
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
  { href: "/sell", label: "Sell" },
]

interface HeaderProps {
  user?: User | null
}

export function Header({ user }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          <span className="text-lg">GameAssets</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Основная навигация">
          {navItems.map(({ href, label }) => (
            <Link key={href} href={href}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right: Search + Auth */}
        <div className="flex items-center gap-2">
          <CartDrawer />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Поиск"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />

          {user ? (
            <UserMenu user={user} />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}

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
              className="left-0 right-0 top-0 w-full max-w-none translate-x-0 translate-y-0 rounded-none border-0 border-b bg-background p-0 sm:max-w-none"
            >
              <DialogHeader className="border-b border-border/80 px-4 py-3">
                <DialogTitle className="text-left">Меню</DialogTitle>
              </DialogHeader>
              <nav className="flex flex-col gap-0 p-4" aria-label="Мобильная навигация">
                {navItems.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    {label}
                  </Link>
                ))}
                {!user && (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
                    >
                      Register
                    </Link>
                  </>
                )}
              </nav>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  )
}
