"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface GalleryImage {
  src: string
  alt: string
}

interface ImageGalleryProps {
  images: GalleryImage[]
  className?: string
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [index, setIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const items = useMemo(() => images.filter(Boolean), [images])
  const hasImages = items.length > 0

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!lightbox) return
      if (e.key === "Escape") setLightbox(false)
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % items.length)
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + items.length) % items.length)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, items.length])

  if (!hasImages) return null

  return (
    <div className={cn("w-full", className)}>
      <div className="relative w-full pt-[66%] rounded-lg overflow-hidden border bg-white">
        <Image
          src={items[index].src}
          alt={items[index].alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover cursor-zoom-in"
          onClick={() => setLightbox(true)}
        />
      </div>

      {items.length > 1 && (
        <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
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

      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white text-2xl" aria-label="Close">×</button>
          <div className="relative w-[90vw] h-[80vh] max-w-6xl">
            <Image src={items[index].src} alt={items[index].alt} fill sizes="90vw" className="object-contain" />
            {items.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full px-3 py-2"
                  onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + items.length) % items.length) }}
                  aria-label="Previous"
                >
                  ‹
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full px-3 py-2"
                  onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % items.length) }}
                  aria-label="Next"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

