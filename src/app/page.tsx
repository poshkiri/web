import { HeroBackground } from "@/components/home/HeroBackground"
import { HeroContent } from "@/components/home/HeroContent"
import { HeroAssetCard } from "@/components/home/HeroAssetCard"
import { CategoriesSection } from "@/components/home/CategoriesSection"
import { StatsSection } from "@/components/home/StatsSection"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* 1. Hero — 100vh, background + content left + card right (card hidden on mobile) */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
        <HeroBackground />
        <div className="relative z-10 flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex-1 lg:flex lg:items-center">
            <HeroContent className="lg:mx-0 lg:max-w-xl lg:text-left" />
          </div>
          <HeroAssetCard />
        </div>
      </section>

      {/* 2. Categories */}
      <CategoriesSection />

      {/* 3. Stats */}
      <StatsSection />
    </div>
  )
}
