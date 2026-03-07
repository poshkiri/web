"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export function CTASection() {
  const router = useRouter()

  return (
    <section
      className="relative flex min-h-[380px] w-full items-center justify-center overflow-hidden px-4 py-20"
      aria-labelledby="cta-heading"
      style={{
        background:
          "var(--bg-deep)",
      }}
    >
      {/* Mesh gradient orbs */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div
          className="absolute left-1/4 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
          style={{
            background: "radial-gradient(circle, var(--purple-glow) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute right-1/4 top-1/3 h-[320px] w-[320px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(6,214,255,0.5) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-1/4 left-1/2 h-[280px] w-[280px] -translate-x-1/2 rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(247,37,133,0.4) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <h2
          id="cta-heading"
          className="font-syne text-3xl font-bold text-text-primary sm:text-4xl md:text-5xl"
        >
          Ready to Ship Faster?
        </h2>
        <p className="mt-4 text-lg text-text-muted">
          Join thousands of game creators. List your assets once, sell everywhere.
        </p>
        <motion.button
          type="button"
          onClick={() => router.push("/upload")}
          className="mt-8 rounded-[14px] px-10 py-4 text-lg font-semibold text-white transition-transform duration-200"
          style={{
            background: "linear-gradient(90deg, var(--purple), var(--cyan))",
            boxShadow: "0 0 48px var(--purple-glow)",
          }}
          whileHover={{
            y: -2,
            boxShadow: "0 0 64px var(--purple-glow)",
          }}
          whileTap={{ scale: 0.98 }}
        >
          Start Selling →
        </motion.button>
      </div>
    </section>
  )
}
