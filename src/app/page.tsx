import { HeroBackground } from "@/components/home/HeroBackground"
import { HeroContent } from "@/components/home/HeroContent"
import { HeroCard } from "@/components/home/HeroCard"
import { MarqueeSection } from "@/components/home/MarqueeSection"
import { CategoriesSection } from "@/components/home/CategoriesSection"
import { StatsSection } from "@/components/home/StatsSection"
import { CTASection } from "@/components/home/CTASection"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero — 100vh, background absolute + content + card */}
      <section className="relative min-h-screen overflow-hidden">
        <HeroBackground />
        <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-4 py-16 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-[60px]">
          <div className="flex-1 lg:flex lg:items-center lg:justify-center">
            <HeroContent className="lg:mx-0 lg:max-w-xl lg:text-left" />
          </div>
          <div className="mt-10 flex justify-center lg:mt-0 lg:justify-end">
            <HeroCard />
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="px-4 pt-16 lg:px-[60px] lg:pt-[100px]">
        <MarqueeSection />
      </div>

      {/* Categories */}
      <div className="px-4 py-16 lg:px-[60px] lg:py-[100px]">
        <CategoriesSection />
      </div>

      {/* Stats — fullwidth */}
      <div className="py-16 lg:py-[100px]">
        <StatsSection />
      </div>

      {/* CTA — fullwidth */}
      <div className="py-16 lg:py-[100px]">
        <CTASection />
      </div>
    </div>
  )
}
