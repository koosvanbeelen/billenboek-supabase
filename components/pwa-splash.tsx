"use client"

import { useEffect, useState } from "react"

const ZICHTBAAR_MS = 1000
const FADE_MS = 300

export function PwaSplash() {
  const [zichtbaar, setZichtbaar] = useState(true)
  const [gemonteerd, setGemonteerd] = useState(true)

  useEffect(() => {
    const verbergTimer = setTimeout(() => setZichtbaar(false), ZICHTBAAR_MS)
    const verwijderTimer = setTimeout(() => setGemonteerd(false), ZICHTBAAR_MS + FADE_MS)
    return () => {
      clearTimeout(verbergTimer)
      clearTimeout(verwijderTimer)
    }
  }, [])

  if (!gemonteerd) return null

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-background transition-opacity ease-out ${
        zichtbaar ? "opacity-100 duration-0" : "pointer-events-none opacity-0 duration-300"
      }`}
      style={{ transitionDuration: zichtbaar ? "0ms" : `${FADE_MS}ms` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/splash/logo.png"
        alt=""
        width={900}
        height={839}
        className="h-auto w-48"
      />
    </div>
  )
}
