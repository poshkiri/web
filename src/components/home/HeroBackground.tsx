"use client"

import { useCallback, useEffect, useRef } from "react"

const PARTICLE_COUNT = 120
const PARTICLE_SPEED = 0.12
const PARTICLE_RADIUS = 1.2
const MOUSE_REPEL_RADIUS = 140
const MOUSE_REPEL_STRENGTH = 0.1

interface Particle {
  x: number
  y: number
  vy: number
  radius: number
  opacity: number
}

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -1e4, y: -1e4 })
  const rafRef = useRef<number>(0)

  const initParticles = useCallback((width: number, height: number) => {
    return Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: -PARTICLE_SPEED * (0.7 + Math.random() * 0.6),
      radius: PARTICLE_RADIUS * (0.6 + Math.random() * 0.8),
      opacity: 0.3 + Math.random() * 0.3,
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
          vx += (dx / dist) * force * 120
          vy += (dy / dist) * force * 120
        }

        p.x += vx
        p.y += vy

        if (p.y < -p.radius * 2) p.y = h + p.radius * 2
        if (p.y > h + p.radius * 2) p.y = -p.radius * 2
        if (p.x < -p.radius * 2) p.x = w + p.radius * 2
        if (p.x > w + p.radius * 2) p.x = -p.radius * 2

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
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
      {/* Orb: Purple — top-left */}
      <div
        className="absolute w-[800px] h-[800px] min-w-[800px] min-h-[800px]"
        style={{
          top: -200,
          left: -200,
          background: "radial-gradient(circle, rgba(120,87,255,0.5), transparent 70%)",
          filter: "blur(120px)",
          animation: "drift1 18s ease-in-out infinite",
        }}
      />

      {/* Orb: Cyan — top-right */}
      <div
        className="absolute w-[800px] h-[800px] min-w-[800px] min-h-[800px]"
        style={{
          top: 100,
          right: -150,
          background: "radial-gradient(circle, rgba(6,214,255,0.35), transparent 70%)",
          filter: "blur(120px)",
          animation: "drift2 22s ease-in-out infinite",
        }}
      />

      {/* Orb: Pink — bottom center */}
      <div
        className="absolute w-[800px] h-[800px] min-w-[800px] min-h-[800px]"
        style={{
          bottom: -100,
          left: "40%",
          transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(247,37,133,0.3), transparent 70%)",
          filter: "blur(120px)",
          animation: "drift3 15s ease-in-out infinite",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
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
