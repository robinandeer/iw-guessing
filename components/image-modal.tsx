"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight, Eye, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageData {
  src: string
  alt: string
  title: string
  subtitle?: string
}

interface ImageModalProps {
  images: ImageData[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate?: (index: number) => void
}

export function ImageModal({ images, currentIndex, isOpen, onClose, onNavigate }: ImageModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false)
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case "Escape":
          onClose()
          break
        case "ArrowLeft":
          if (onNavigate && currentIndex > 0) {
            onNavigate(currentIndex - 1)
          }
          break
        case "ArrowRight":
          if (onNavigate && currentIndex < images.length - 1) {
            onNavigate(currentIndex + 1)
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, currentIndex, images.length, onClose, onNavigate])

  if (!isOpen || !images[currentIndex]) return null

  const currentImage = images[currentIndex]
  const hasMultipleImages = images.length > 1

  const handlePrevious = () => {
    if (onNavigate && currentIndex > 0) {
      onNavigate(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (onNavigate && currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={handleBackdropClick}
      />

      {/* Modal Content - responsive padding */}
      <div className="relative z-10 w-full h-full max-w-7xl max-h-screen mobile-modal flex flex-col">
        {/* Header - responsive sizing */}
        <div className="flex items-center justify-between mb-2 sm:mb-4 bg-slate-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 sm:gap-3">
            {currentImage.title.includes("Original") ? (
              <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
            ) : (
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
            )}
            <div>
              <h2 className="text-white text-lg sm:text-xl font-bold">{currentImage.title}</h2>
              {currentImage.subtitle && <p className="text-purple-300 text-xs sm:text-sm">{currentImage.subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {hasMultipleImages && (
              <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 border border-purple-500/20">
                <span className="text-white text-xs sm:text-sm font-medium">
                  {currentIndex + 1} / {images.length}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-purple-300 hover:text-white hover:bg-purple-500/20 rounded-xl h-8 w-8 sm:h-10 sm:w-10 touch-target"
            >
              <X className="h-4 w-4 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </div>

        {/* Image Container - responsive sizing */}
        <div className="flex-1 flex items-center justify-center relative min-h-0">
          {/* Navigation Buttons - responsive positioning */}
          {hasMultipleImages && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={cn(
                  "absolute left-2 sm:left-4 z-20 bg-slate-900/60 backdrop-blur-sm border border-purple-500/20 text-purple-300 hover:text-white hover:bg-purple-500/20 rounded-xl h-10 w-10 sm:h-12 sm:w-12 touch-target",
                  currentIndex === 0 && "opacity-50 cursor-not-allowed",
                )}
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={currentIndex === images.length - 1}
                className={cn(
                  "absolute right-2 sm:right-4 z-20 bg-slate-900/60 backdrop-blur-sm border border-purple-500/20 text-purple-300 hover:text-white hover:bg-purple-500/20 rounded-xl h-10 w-10 sm:h-12 sm:w-12 touch-target",
                  currentIndex === images.length - 1 && "opacity-50 cursor-not-allowed",
                )}
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </>
          )}

          {/* Image - responsive sizing */}
          <div className="relative w-full h-full flex items-center justify-center px-12 sm:px-16">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800/60 rounded-2xl border border-purple-500/20">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-purple-400"></div>
              </div>
            )}
            <img
              src={currentImage.src || "/placeholder.svg"}
              alt={currentImage.alt}
              className={cn(
                "max-w-full max-h-full object-contain rounded-xl sm:rounded-2xl shadow-2xl border-2 border-purple-500/30 transition-all duration-500",
                imageLoaded ? "opacity-100" : "opacity-0",
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
          </div>
        </div>

        {/* Footer with Controls - responsive layout */}
        <div className="mt-2 sm:mt-4 bg-slate-900/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-purple-500/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <div className="text-purple-300 text-xs sm:text-sm text-center sm:text-left">
              {hasMultipleImages
                ? "Use arrow keys or buttons to navigate • Press ESC to close"
                : "Press ESC or click outside to close"}
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {hasMultipleImages && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="bg-slate-800/60 border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-500/20 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 touch-target"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentIndex === images.length - 1}
                    className="bg-slate-800/60 border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-500/20 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 touch-target"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="bg-slate-800/60 border-purple-500/30 text-purple-300 hover:text-white hover:bg-purple-500/20 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 touch-target"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
