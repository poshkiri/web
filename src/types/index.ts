// Shared types for Game Assets Marketplace

export type UserRole = 'buyer' | 'seller' | 'admin'

export type Engine = 'Unity' | 'Unreal' | 'Godot' | 'Other'

export type LicenseType = 'personal' | 'commercial'

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  role: UserRole
  bio: string | null
  website: string | null
  stripe_account_id: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
}

export interface Asset {
  id: string
  title: string
  slug: string
  description: string
  price: number
  category_id: string
  file_url: string
  preview_images: string[]
  tags: string[]
  engine: Engine
  is_approved: boolean
  /** Set by admin when rejecting; when present with is_approved=false, status is Rejected */
  rejection_reason?: string | null
  downloads_count: number
  rating_avg: number | null
  author_id: string
  created_at: string
  license_type?: LicenseType
}

export interface AssetWithAuthor extends Asset {
  author: User
}

export interface AssetFilters {
  category?: string
  engine?: Engine
  minPrice?: number
  maxPrice?: number
  sort?: string
  search?: string
}

export interface Purchase {
  id: string
  user_id: string
  asset_id: string
  amount: number
  stripe_id: string | null
  created_at: string
}

export interface Review {
  id: string
  user_id: string
  asset_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface ReviewWithUser extends Review {
  user: Pick<User, "id" | "name" | "avatar_url" | "email">
}

export interface Collection {
  id: string
  seller_id: string
  title: string
  asset_ids: string[]
  price: number
  created_at: string
}

export type EarningsStatus = "pending" | "paid"

export interface Earnings {
  id: string
  seller_id: string
  asset_id: string
  amount: number
  platform_fee: number
  stripe_transfer_id: string | null
  status: EarningsStatus
  created_at: string
}
