"use client"

import { useCallback, useEffect, useRef } from "react"

const PARTICLE_COUNT = 80
const PARTICLE_SPEED = 0.15
const PARTICLE_RADIUS = 1.5
const MOUSE_REPEL_RADIUS = 120
const MOUSE_REPEL_STRENGTH = 0.08

interface Particle {
  x: number
  y: number
  vy: number
  radius: number
}

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>(0)

  const initParticles = useCallback((width: number, height: number) => {
    return Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: -PARTICLE_SPEED * (0.7 + Math.random() * 0.6),
      radius: PARTICLE_RADIUS * (0.6 + Math.random() * 0.8),
    }))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (particlesRef.current.length === 0) {
        particlesRef.current = initParticles(w, h)
      }
    }

    setSize()
    window.addEventListener("resize", setSize)

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener("mousemove", handleMouseMove)

    let animationRunning = true
    const width = () => canvas.getBoundingClientRect().width
    const height = () => canvas.getBoundingClientRect().height

    const tick = () => {
      if (!animationRunning || !ctx) return
      const w = width()
      const h = height()
      const mouse = mouseRef.current

      ctx.clearRect(0, 0, w, h)

      for (const p of particlesRef.current) {
        let vx = 0
        let vy = p.vy

        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.hypot(dx, dy)
        if (dist < MOUSE_REPEL_RADIUS && dist > 0) {
          const force = (1 - dist / MOUSE_REPEL_RADIUS) * MOUSE_REPEL_STRENGTH
          vx += (dx / dist) * force * 100
          vy += (dy / dist) * force * 100
        }

        p.x += vx
        p.y += vy

        if (p.y < -p.radius * 2) p.y = h + p.radius * 2
        if (p.y > h + p.radius * 2) p.y = -p.radius * 2
        if (p.x < -p.radius * 2) p.x = w + p.radius * 2
        if (p.x > w + p.radius * 2) p.x = -p.radius * 2

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)"
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      animationRunning = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", setSize)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [initParticles])

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      {/* Gradient orbs */}
      <div className="absolute -left-[300px] top-1/2 -translate-y-1/2 w-[800px] h-[800px]">
        <div
          className="absolute inset-0 rounded-full opacity-70"
          style={{
            background: "var(--color-purple)",
            filter: "blur(600px)",
            animation: "hero-orb 18s ease-in-out infinite",
          }}
        />
      </div>
      <div className="absolute -right-[200px] top-1/2 -translate-y-1/2 w-[600px] h-[600px]">
        <div
          className="absolute inset-0 rounded-full opacity-70"
          style={{
            background: "var(--color-cyan)",
            filter: "blur(400px)",
            animation: "hero-orb 22s ease-in-out infinite 1s",
          }}
        />
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[-150px] w-[500px] h-[500px]">
        <div
          className="absolute inset-0 rounded-full opacity-60"
          style={{
            background: "var(--color-pink)",
            filter: "blur(300px)",
            animation: "hero-orb 20s ease-in-out infinite 0.5s",
          }}
        />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  )
}
