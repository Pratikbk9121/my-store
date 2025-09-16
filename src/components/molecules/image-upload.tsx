'use client'

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/atoms/loading-spinner"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  onImageRemove?: () => void
  preview?: string
  isLoading?: boolean
  className?: string
  accept?: string
}

export function ImageUpload({
  onImageSelect,
  onImageRemove,
  preview,
  isLoading = false,
  className,
  accept = "image/*"
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageSelect(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0])
    }
  }

  const onButtonClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className={cn("w-full", className)}>
      <Label className="text-sm font-medium">Product Image</Label>
      
      {preview ? (
        <div className="relative mt-2">
          <div className="relative w-full h-48">
            <Image
              src={preview}
              alt="Preview"
              fill
              sizes="100vw"
              className="object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
              onClick={onButtonClick}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mr-2"
              onClick={(e) => {
                e.stopPropagation()
                onButtonClick()
              }}
            >
              <Upload className="h-4 w-4 mr-1" />
              Change
            </Button>
            {onImageRemove && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onImageRemove()
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative mt-2 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100",
            dragActive && "border-blue-400 bg-blue-50",
            "transition-colors"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
        >
          {isLoading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-gray-500" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </>
          )}
        </div>
      )}
      
      <Input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleChange}
      />
    </div>
  )
}
