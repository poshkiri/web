"use client"

import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Wallet,
  Settings,
  LogOut,
} from "lucide-react"
import type { User } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserMenuProps {
  user: User
}

export function UserMenu({ user }: UserMenuProps) {
  const displayName = user.name ?? user.email
  const isSeller = user.role === "seller" || user.role === "admin"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full border border-border/50 bg-muted/50 hover:bg-accent"
          aria-label="Меню пользователя"
        >
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={displayName}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 border-border/80 bg-card"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
            {isSeller && (
              <Badge
                variant="secondary"
                className="mt-1 w-fit text-[10px] font-medium"
              >
                Seller
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/80" />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/assets" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            My Assets
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/purchases" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Purchases
          </Link>
        </DropdownMenuItem>
        {isSeller && (
          <DropdownMenuItem asChild>
            <Link href="/earnings" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Earnings
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-border/80" />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-2 text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
