"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface CarouselImage {
  src: string
  alt: string
}

interface ImageCarouselProps {
  images: CarouselImage[]
  className?: string
  showThumbnails?: boolean
  autoPlayMs?: number | null
}

export function ImageCarousel({ images, className, showThumbnails = false, autoPlayMs = null }: ImageCarouselProps) {
  const items = useMemo(() => images.filter(Boolean), [images])
  const [index, setIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (!autoPlayMs || items.length <= 1) return
    if (isHovering) return
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), autoPlayMs)
    return () => clearInterval(id)
  }, [autoPlayMs, items.length, isHovering])

  if (items.length === 0) return null

  function prev() { setIndex((i) => (i - 1 + items.length) % items.length) }
  function next() { setIndex((i) => (i + 1) % items.length) }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current
    if (Math.abs(dx) > 30) {
      if (dx < 0) next()
      else prev()
    }
    touchStartX.current = null
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className="relative w-full pt-[66%] overflow-hidden rounded-lg border bg-white"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {items.map((img, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              i === index ? "opacity-100" : "opacity-0"
            )}
          >
            <Image src={img.src} alt={img.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
        ))}

        {items.length > 1 && (
          <>
            <button
              type="button"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full px-3 py-2"
              aria-label="Previous"
              onClick={prev}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full px-3 py-2"
              aria-label="Next"
              onClick={next}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  className={cn(
                    "h-2 w-2 rounded-full border border-white/80",
                    i === index ? "bg-white" : "bg-white/40 hover:bg-white/70"
                  )}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showThumbnails && items.length > 1 && (
        <div className="mt-3 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {items.map((img, i) => (
            <button
              key={i}
              className={cn(
                "relative w-full pt-[100%] rounded-md overflow-hidden border",
                i === index ? "ring-2 ring-black" : "opacity-90 hover:opacity-100"
              )}
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
            >
              <Image src={img.src} alt={img.alt} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

