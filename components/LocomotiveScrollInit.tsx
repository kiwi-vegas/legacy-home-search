'use client'
import { useEffect } from 'react'

export default function LocomotiveScrollInit() {
  useEffect(() => {
    let scroll: { destroy: () => void } | null = null

    import('locomotive-scroll').then(({ default: LocomotiveScroll }) => {
      scroll = new LocomotiveScroll({
        lenisOptions: {
          lerp: 0.08,       // Smoothness — lower = more inertia, silkier feel
          duration: 1.4,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        },
      })
    })

    return () => {
      scroll?.destroy()
    }
  }, [])

  return null
}
