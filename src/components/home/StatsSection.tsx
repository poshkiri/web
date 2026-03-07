"use client"

import { useEffect, useState, useRef } from "react"
import { useInView, animate, useMotionValue } from "framer-motion"
import { cn } from "@/lib/utils"

const STATS: Array<{
  value: number
  suffix: string
  label: string
  prefix?: string
  scale?: number
}> = [
  { value: 10_000, suffix: "+", label: "Assets" },
  { value: 5_000, suffix: "+", label: "Developers" },
  { value: 500, suffix: "+", label: "Sellers" },
  { value: 2, suffix: "M+", label: "Paid Out", prefix: "$", scale: 1_000_000 },
]

const DURATION = 2

function AnimatedCounter({
  target,
  prefix = "",
  suffix = "",
  scale = 1,
  isInView,
}: {
  target: number
  prefix?: string
  suffix?: string
  scale?: number
  isInView: boolean
}) {
  const motionValue = useMotionValue(0)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!isInView) return
    motionValue.set(0)
    setDisplay(0)
    const controls = animate(motionValue, target, {
      duration: DURATION,
      ease: "easeOut",
    })
    const unsub = motionValue.on("change", (v) =>
      setDisplay(Math.round(v))
    )
    return () => {
      controls.stop()
      unsub()
    }
  }, [isInView, target, motionValue])

  const formatted =
    scale > 1
      ? `${prefix}${display}${suffix}`
      : `${prefix}${display.toLocaleString()}${suffix}`

  return <span>{formatted}</span>
}

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, threshold: 0.1 })

  return (
    <section className="px-4 py-24" aria-labelledby="stats-heading">
      <div className="mx-auto max-w-6xl">
        <div
          ref={ref}
          className={cn(
            "rounded-2xl border border-[var(--color-border)] p-6 sm:p-10",
            "bg-[var(--color-bg-card)] backdrop-blur-md"
          )}
        >
          <h2 id="stats-heading" className="sr-only">
            Platform statistics
          </h2>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="text-center"
              >
                <div className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
                  <AnimatedCounter
                    target={stat.value}
                    prefix={stat.prefix ?? ""}
                    suffix={stat.suffix}
                    scale={stat.scale ?? 1}
                    isInView={isInView}
                  />
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
