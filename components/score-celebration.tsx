"use client"

import { useEffect, useState } from "react"
import { Confetti } from "./confetti"
import { Star, Trophy, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScoreCelebrationProps {
  score: number
  isVisible: boolean
  onComplete?: () => void
}

export function ScoreCelebration({ score, isVisible, onComplete }: ScoreCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [celebrationLevel, setCelebrationLevel] = useState<"none" | "good" | "great" | "perfect">("none")

  useEffect(() => {
    if (!isVisible) {
      setShowConfetti(false)
      setCelebrationLevel("none")
      return
    }

    // Determine celebration level based on score
    let level: "none" | "good" | "great" | "perfect" = "none"
    if (score >= 95) level = "perfect"
    else if (score >= 85) level = "great"
    else if (score >= 70) level = "good"

    setCelebrationLevel(level)

    if (level !== "none") {
      // Delay confetti slightly for better effect
      setTimeout(() => {
        setShowConfetti(true)
      }, 300)
    }

    // Auto-complete after animation
    const timeout = setTimeout(
      () => {
        onComplete?.()
      },
      level === "perfect" ? 4000 : level === "great" ? 3500 : 3000,
    )

    return () => clearTimeout(timeout)
  }, [isVisible, score, onComplete])

  if (!isVisible || celebrationLevel === "none") return null

  const getCelebrationText = () => {
    switch (celebrationLevel) {
      case "perfect":
        return "PERFECT!"
      case "great":
        return "EXCELLENT!"
      case "good":
        return "GREAT JOB!"
      default:
        return ""
    }
  }

  const getCelebrationIcon = () => {
    switch (celebrationLevel) {
      case "perfect":
        return <Trophy className="h-12 w-12 text-yellow-400" />
      case "great":
        return <Zap className="h-10 w-10 text-cyan-400" />
      case "good":
        return <Star className="h-8 w-8 text-teal-400" />
      default:
        return null
    }
  }

  const getParticleCount = () => {
    switch (celebrationLevel) {
      case "perfect":
        return 80
      case "great":
        return 60
      case "good":
        return 40
      default:
        return 0
    }
  }

  return (
    <>
      {/* Confetti Animation */}
      <Confetti
        active={showConfetti}
        duration={celebrationLevel === "perfect" ? 3500 : 2500}
        particleCount={getParticleCount()}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Celebration Overlay */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none">
        <div
          className={cn(
            "text-center transform transition-all duration-1000 ease-out",
            isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-50 opacity-0 translate-y-8",
          )}
        >
          {/* Celebration Icon */}
          <div className="flex justify-center mb-4">
            <div
              className={cn(
                "p-4 rounded-full animate-bounce",
                celebrationLevel === "perfect" && "bg-yellow-500/20 animate-pulse",
                celebrationLevel === "great" && "bg-cyan-500/20",
                celebrationLevel === "good" && "bg-teal-500/20",
              )}
            >
              {getCelebrationIcon()}
            </div>
          </div>

          {/* Celebration Text */}
          <div
            className={cn(
              "text-6xl font-bold mb-4 animate-pulse",
              celebrationLevel === "perfect" && "text-yellow-400 drop-shadow-lg",
              celebrationLevel === "great" && "text-cyan-400 drop-shadow-lg",
              celebrationLevel === "good" && "text-teal-400 drop-shadow-lg",
            )}
            style={{
              textShadow: "0 0 20px currentColor",
              animation: "glow 2s ease-in-out infinite alternate",
            }}
          >
            {getCelebrationText()}
          </div>

          {/* Score Display */}
          <div className="text-3xl font-semibold text-white drop-shadow-lg">{score} Points!</div>

          {/* Animated rings for perfect score */}
          {celebrationLevel === "perfect" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-yellow-400/30 rounded-full animate-ping"></div>
              <div className="absolute w-48 h-48 border-4 border-yellow-400/50 rounded-full animate-ping animation-delay-300"></div>
              <div className="absolute w-32 h-32 border-4 border-yellow-400/70 rounded-full animate-ping animation-delay-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* Add custom CSS for glow animation */}
      <style jsx>{`
        @keyframes glow {
          from {
            text-shadow: 0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor;
          }
          to {
            text-shadow: 0 0 30px currentColor, 0 0 40px currentColor, 0 0 50px currentColor;
          }
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        .animation-delay-600 {
          animation-delay: 600ms;
        }
      `}</style>
    </>
  )
}
