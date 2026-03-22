'use client'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

let isHardLoad = true

export default function YlopoInit() {
  const pathname = usePathname()

  useEffect(() => {
    if (isHardLoad) {
      isHardLoad = false
      return
    }
    if (pathname.startsWith('/blog')) return
    window.location.reload()
  }, [pathname])

  return null
}
