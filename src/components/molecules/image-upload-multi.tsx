"use client"

import { useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadMultiProps {
  files: File[]
  onChange: (files: File[]) => void
  isLoading?: boolean
  className?: string
  accept?: string
}

export function ImageUploadMulti({ files, onChange, isLoading = false, className, accept = "image/*" }: ImageUploadMultiProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const previews = useMemo(() => {
    return files.map((file) => ({ key: `${file.name}-${file.size}-${file.lastModified}`, url: URL.createObjectURL(file), name: file.name }))
  }, [files])

  const openPicker = () => inputRef.current?.click()

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const newFiles = Array.from(fileList)
    onChange([...(files || []), ...newFiles])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    if (e.type === "dragleave") setDragActive(false)
  }

  const removeAt = (idx: number) => {
    const next = [...files]
    next.splice(idx, 1)
    onChange(next)
  }

  return (
    <div className={cn("w-full", className)}>
      <Label className="text-sm font-medium">Product Images</Label>

      <div
        className={cn(
          "relative mt-2 flex flex-col items-center justify-center w-full min-h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100",
          dragActive && "border-blue-400 bg-blue-50",
          "transition-colors"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openPicker}
      >
        {isLoading ? (
          <div className="py-10 text-sm text-gray-500">Uploading...</div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-6 pb-6">
            <Upload className="w-8 h-8 mb-3 text-gray-500" />
            <p className="mb-1 text-sm text-gray-600">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB each • You can add multiple</p>
          </div>
        )}
      </div>

      <Input ref={inputRef} type="file" className="hidden" multiple accept={accept} onChange={(e) => handleFiles(e.target.files)} />

      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {previews.map((p, idx) => (
            <div key={p.key} className="relative group">
              <div className="relative w-full pt-[100%] overflow-hidden rounded-md border bg-white">
                <Image src={p.url} alt={p.name} fill sizes="120px" className="object-cover" />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeAt(idx)
                }}
                className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-black/60 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove ${p.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {previews.length > 0 && (
        <div className="mt-3">
          <Button type="button" variant="secondary" onClick={openPicker} className="inline-flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Add more images
          </Button>
        </div>
      )}
    </div>
  )
}

