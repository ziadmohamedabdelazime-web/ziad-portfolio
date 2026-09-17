import { useEffect, useRef } from 'react'

// A lightweight canvas visual: floating data nodes connected by lines, with
// gentle depth-of-field parallax on mouse move. Deliberately not a heavy
// 3D-model library (three.js etc.) — keeps the hero fast on low-end devices
// while still reading as a dimensional, data-inspired visual per the brief.
export default function DataNetworkHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isDark = document.documentElement.classList.contains('dark')
    const dotColor = isDark ? '143, 168, 118' : '92, 122, 70' // accent rgb
    const lineColor = isDark ? '59, 78, 50' : '122, 154, 96' // accent-2 rgb

    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let parallaxX = 0
    let parallaxY = 0

    const NODE_COUNT = 26
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(), // depth: 0 (far) - 1 (near)
      vx: (Math.random() - 0.5) * 0.00025,
      vy: (Math.random() - 0.5) * 0.00025,
    }))

    function resize() {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height)
      const pts = nodes.map((n) => {
        const depthScale = 0.6 + n.z * 0.8
        const px = n.x * width + parallaxX * n.z * 18
        const py = n.y * height + parallaxY * n.z * 18
        return { px, py, z: n.z, depthScale }
      })

      // connections between near-enough nodes
      ctx!.lineWidth = 1
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].px - pts[j].px
          const dy = pts[i].py - pts[j].py
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = width * 0.14
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.35 * Math.min(pts[i].z, pts[j].z)
            ctx!.strokeStyle = `rgba(${lineColor}, ${alpha})`
            ctx!.beginPath()
            ctx!.moveTo(pts[i].px, pts[i].py)
            ctx!.lineTo(pts[j].px, pts[j].py)
            ctx!.stroke()
          }
        }
      }

      // nodes
      for (const p of pts) {
        const r = 1.6 * p.depthScale
        ctx!.fillStyle = `rgba(${dotColor}, ${0.35 + p.z * 0.55})`
        ctx!.beginPath()
        ctx!.arc(p.px, p.py, r, 0, Math.PI * 2)
        ctx!.fill()
      }
    }

    function tick() {
      if (!reduceMotion) {
        for (const n of nodes) {
          n.x += n.vx
          n.y += n.vy
          if (n.x < 0 || n.x > 1) n.vx *= -1
          if (n.y < 0 || n.y > 1) n.vy *= -1
        }
      }
      draw()
      raf = requestAnimationFrame(tick)
    }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect()
      parallaxX = (e.clientX - rect.left) / rect.width - 0.5
      parallaxY = (e.clientY - rect.top) / rect.height - 0.5
    }

    resize()
    draw()
    let raf = requestAnimationFrame(tick)
    window.addEventListener('resize', resize)
    if (!reduceMotion) canvas.addEventListener('pointermove', onPointerMove)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointermove', onPointerMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      aria-hidden="true"
    />
  )
}
