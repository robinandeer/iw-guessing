"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Eye, RotateCcw, Star, Sparkles, Wand2, ArrowLeft } from "lucide-react"
import type RunwayML from "@runwayml/sdk"
import { generateTransformPrompt, scorePromptGuess } from "./lib/gradio"
import { SoundToggle } from "@/components/sound-toggle"
import { ScoreCelebration } from "@/components/score-celebration"
import { ImageModal } from "@/components/image-modal"
import {
  soundManager,
  playClickSound,
  playProcessSound,
  playCompleteSound,
  playSuccessSound,
  playRevealSound,
} from "@/lib/sounds"
import { getRandomRunwayer } from "./lib/runwayers"

interface ReverseGameState {
  phase: "loading" | "guessing" | "result"
  original: {
    name: string
    url: string
  } | null
  transformedImage: string | null
  transformation: string | null
  guess: string
  score: number
  round: number
  totalRounds: number
  totalScore: number
}

interface ReverseGameProps {
  onBackToMenu: () => void
}

export default function ReverseGame({ onBackToMenu }: ReverseGameProps) {
  const [gameState, setGameState] = useState<ReverseGameState>({
    phase: "loading",
    original: null,
    transformedImage: null,
    transformation: null,
    guess: "",
    score: 0,
    round: 1,
    totalRounds: 3,
    totalScore: 0,
  })

  const [processingProgress, setProcessingProgress] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [modalState, setModalState] = useState({
    isOpen: false,
    currentIndex: 0,
  })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const contentContainerRef = useRef<HTMLDivElement>(null)
  const previousPhaseRef = useRef<string>("")

  // Preload sounds when component mounts
  useEffect(() => {
    soundManager.preloadSounds()
  }, [])

  // Start the game by generating the first image
  useEffect(() => {
    startNewRound()
  }, [])

  // Handle phase transitions and scrollbar management
  useEffect(() => {
    const currentPhase = gameState.phase
    const previousPhase = previousPhaseRef.current

    if (currentPhase !== previousPhase && previousPhase !== "") {
      setIsTransitioning(true)

      // Hide scrollbar during transition
      if (contentContainerRef.current) {
        contentContainerRef.current.classList.add("phase-transitioning")
      }

      // Restore scrollbar after animation completes
      const timer = setTimeout(() => {
        setIsTransitioning(false)
        if (contentContainerRef.current) {
          contentContainerRef.current.classList.remove("phase-transitioning")
        }
      }, 700) // Match animation duration

      return () => clearTimeout(timer)
    }

    previousPhaseRef.current = currentPhase
  }, [gameState.phase])

  // Simulate progress bar during processing
  useEffect(() => {
    if (gameState.phase === "loading") {
      setProcessingProgress(0)
      const duration = 15000 // Shorter duration for reverse mode
      const intervalTime = 100
      const increment = 100 / (duration / intervalTime)

      playProcessSound()

      const interval = setInterval(() => {
        setProcessingProgress((prev) => {
          const newProgress = prev + increment
          if (newProgress >= 100) {
            clearInterval(interval)
            return 100
          }
          return newProgress
        })
      }, intervalTime)

      return () => clearInterval(interval)
    }
  }, [gameState.phase])

  // Show celebration for high scores
  useEffect(() => {
    if (gameState.phase === "result" && gameState.score >= 70) {
      setShowCelebration(true)
    }
  }, [gameState.phase, gameState.score])

  const startNewRound = async () => {
    const runwayer = getRandomRunwayer()

    setGameState((prev) => ({
      ...prev,
      phase: "loading",
      original: runwayer,
      transformedImage: null,
      guess: "",
    }))

    try {
      const promptText = await generateTransformPrompt(runwayer.url)

      const response = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          promptText,
          referenceImage: runwayer.url,
        }),
      })

      if (!response.ok) throw new Error("Runway failed to generate image")

      const data = (await response.json()) as RunwayML.TaskRetrieveResponse
      const transformedImage = data.output?.[0]

      if (!transformedImage) throw new Error("No output from Runway")

      playCompleteSound()
      setGameState((prev) => ({
        ...prev,
        transformedImage,
        transformation: promptText,
        phase: "guessing",
      }))
    } catch (error) {
      console.error("Error generating image:", error)
      // Fallback to next round if generation fails
      nextRound()
    }
  }

  const submitGuess = async () => {
    if (!gameState.original || !gameState.guess.trim()) return

    playClickSound()

    const originalName = `The person's name is ${gameState.original.name}.`

    const result = await scorePromptGuess({
      prompt: originalName,
      guess: gameState.guess,
    })

    const score = result.score
    if (score === null) {
      console.error("Failed to score guess")
      return
    }

    playRevealSound()

    if (score > 70) {
      setTimeout(() => {
        playSuccessSound()
      }, 500)
    }

    setGameState((prev) => ({
      ...prev,
      phase: "result",
      score: score,
      totalScore: prev.totalScore + score,
    }))
  }

  const nextRound = () => {
    playClickSound()
    setShowCelebration(false)

    if (gameState.round >= gameState.totalRounds) {
      // Game over - reset
      setGameState((prev) => ({
        ...prev,
        phase: "loading",
        round: 1,
        score: 0,
        totalScore: 0,
        original: null,
        transformedImage: null,
        transformation: null,
        guess: "",
      }))
      startNewRound()
    } else {
      setGameState((prev) => ({
        ...prev,
        round: prev.round + 1,
        original: null,
        transformedImage: null,
        transformation: null,
        guess: "",
      }))
      startNewRound()
    }
  }

  const openImageModal = (imageIndex: number) => {
    setModalState({
      isOpen: true,
      currentIndex: imageIndex,
    })
  }

  const closeImageModal = () => {
    setModalState({
      isOpen: false,
      currentIndex: 0,
    })
  }

  const navigateModal = (index: number) => {
    setModalState((prev) => ({
      ...prev,
      currentIndex: index,
    }))
  }

  // Prepare modal images for result phase
  const getModalImages = () => {
    if (gameState.phase !== "result" || !gameState.original || !gameState.transformedImage) {
      return []
    }

    return [
      {
        src: gameState.original.url,
        alt: "Original Person",
        title: "Original Person",
        subtitle: gameState.original.name,
      },
      {
        src: gameState.transformedImage,
        alt: "Transformed Person",
        title: "Transformed Version",
        subtitle: "AI Generated Transformation",
      },
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden font-['Inter',system-ui,sans-serif]">
      {/* Confetti Celebration */}
      <ScoreCelebration
        score={gameState.score}
        isVisible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Image Modal */}
      <ImageModal
        images={getModalImages()}
        currentIndex={modalState.currentIndex}
        isOpen={modalState.isOpen}
        onClose={closeImageModal}
        onNavigate={navigateModal}
      />

      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-60 -right-60 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-60 -left-60 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/2 w-80 h-80 bg-gradient-to-br from-violet-400/15 to-purple-500/15 rounded-full blur-2xl animate-pulse delay-500"></div>

        {/* Floating particles */}
        <div className="absolute top-20 right-20 w-2 h-2 bg-amber-400/80 rounded-full animate-bounce shadow-lg shadow-amber-400/50"></div>
        <div className="absolute bottom-32 left-32 w-1.5 h-1.5 bg-violet-400/80 rounded-full animate-bounce delay-700 shadow-lg shadow-violet-400/50"></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-blue-400/80 rounded-full animate-bounce delay-300 shadow-lg shadow-blue-400/50"></div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:50px_50px] opacity-30"></div>
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-purple-500/20 header-compact">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBackToMenu}
                className="text-purple-300 hover:text-white hover:bg-purple-500/20"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="relative p-2 sm:p-3 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl sm:rounded-2xl shadow-lg shadow-purple-500/30">
                <Eye className="text-white h-4 w-4 sm:h-6 sm:w-6" />
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50"></div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Reverse Detective
                </h1>
                <p className="text-xs text-purple-300/80 font-medium">Identify the person</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-6">
              <SoundToggle />
              <div className="flex items-center gap-2 sm:gap-3 bg-slate-800/60 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-full border border-purple-500/20">
                <Star className="text-amber-400 h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
                <span className="text-white font-bold text-base sm:text-lg">{gameState.totalScore}</span>
                <span className="text-purple-300 text-xs sm:text-sm">pts</span>
              </div>
              <Badge
                variant="outline"
                className="text-purple-200 border-purple-400/40 bg-purple-900/40 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium"
              >
                Round {gameState.round}/{gameState.totalRounds}
              </Badge>
            </div>
          </div>
          <div className="mt-2 sm:mt-3 relative">
            <Progress
              value={((gameState.round - 1) / gameState.totalRounds) * 100}
              className="w-full h-1.5 sm:h-2 bg-slate-800/60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-full blur-sm"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 min-h-[calc(100vh-6rem)] flex items-center justify-center p-4 sm:p-6">
        <div
          ref={contentContainerRef}
          className={`w-full max-w-6xl content-container ${isTransitioning ? "phase-transitioning" : ""}`}
        >
          {/* Loading Phase */}
          {gameState.phase === "loading" && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-6 duration-700 h-full">
              <Card className="bg-slate-800/40 backdrop-blur-lg sm:backdrop-blur-xl border border-purple-500/20 shadow-xl sm:shadow-2xl shadow-purple-500/10 flex flex-col rounded-2xl sm:rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-indigo-500/10 rounded-2xl sm:rounded-3xl animate-pulse"></div>
                <CardContent className="relative z-10 flex-1 flex flex-col justify-center items-center space-y-6 sm:space-y-8 md:space-y-12 p-8 sm:p-12 md:p-16">
                  <div className="relative">
                    <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-slate-700/60 rounded-2xl sm:rounded-3xl animate-pulse border border-purple-500/20 flex items-center justify-center">
                      <Sparkles className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-purple-400 animate-pulse" />
                    </div>
                    <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-purple-500/30 to-violet-500/30 rounded-2xl sm:rounded-3xl blur-lg sm:blur-xl animate-pulse"></div>
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-3 h-3 sm:w-4 sm:h-4 bg-amber-400 rounded-full animate-ping shadow-lg shadow-amber-400/50"></div>
                    <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 w-2 h-2 sm:w-3 sm:h-3 bg-violet-400 rounded-full animate-ping delay-500 shadow-lg shadow-violet-400/50"></div>
                  </div>

                  <div className="bg-slate-800/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-purple-500/20 w-full max-w-2xl shadow-lg relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 rounded-xl sm:rounded-2xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <Sparkles className="text-purple-400 h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 animate-pulse" />
                        <span className="text-white font-semibold text-base sm:text-lg md:text-xl">
                          Preparing your mystery... {Math.round(processingProgress)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/60 rounded-full h-2 sm:h-3 overflow-hidden relative">
                        <div
                          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 h-2 sm:h-3 rounded-full transition-all duration-100 ease-out shadow-lg relative"
                          style={{ width: `${processingProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Guessing Phase */}
          {gameState.phase === "guessing" && gameState.transformedImage && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-6 duration-700 h-full">
              <Card className="bg-slate-800/40 backdrop-blur-xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 h-full flex flex-col rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-violet-500/5 to-indigo-500/5 rounded-3xl"></div>
                <CardContent className="relative z-10 flex-1 flex flex-col space-y-8 px-12 pb-12 pt-8">
                  {/* Transformed Image Display */}
                  <div className="flex-1 flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                    <Label className="text-purple-300 font-semibold text-lg sm:text-xl flex items-center gap-2">
                      <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                      The Transformed Person
                    </Label>
                    <div className="relative group cursor-pointer responsive-image-container flex items-center justify-center">
                      <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 rounded-2xl sm:rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                      <img
                        src={gameState.transformedImage || "/placeholder.svg"}
                        alt="Transformed"
                        className="relative max-w-full max-h-full object-contain rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl shadow-slate-900/50 transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl border border-purple-500/20"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-violet-900/10 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                  </div>

                  {/* Guess Section */}
                  <div className="space-y-3 sm:space-y-4 bg-slate-800/40 backdrop-blur-sm p-3 sm:p-4 md:p-8 rounded-xl sm:rounded-2xl border border-purple-500/20 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 rounded-xl sm:rounded-2xl"></div>
                    <div className="relative z-10">
                      <h3 className="text-white text-lg sm:text-xl md:text-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
                        <Eye className="text-purple-400 h-5 w-5 sm:h-6 sm:w-6" />
                        Who Is This Person?
                      </h3>
                      <Textarea
                        id="guess"
                        placeholder="Can you identify who this person is? Enter their name or describe them..."
                        value={gameState.guess}
                        onChange={(e) => setGameState((prev) => ({ ...prev, guess: e.target.value }))}
                        className="bg-slate-900/60 border-2 border-purple-500/30 text-white placeholder:text-purple-300/60 focus:border-purple-400 focus:ring-purple-400/20 rounded-lg sm:rounded-xl transition-all duration-300 text-sm sm:text-base resize-none backdrop-blur-sm"
                        rows={2}
                        required={true}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            submitGuess()
                          }
                        }}
                      />
                      <Button
                        onClick={submitGuess}
                        className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:via-purple-700 hover:to-violet-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 sm:py-4 text-base sm:text-lg rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/30 disabled:scale-100 disabled:shadow-none mt-3 sm:mt-4 touch-target"
                      >
                        <Eye className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Reveal the Identity
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Result Phase */}
          {gameState.phase === "result" && gameState.transformation && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-6 duration-700 h-full">
              <Card className="bg-slate-800/40 backdrop-blur-xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 h-full flex flex-col rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-violet-500/5 to-indigo-500/5 rounded-3xl"></div>
                <CardContent className="relative z-10 flex-1 flex flex-col justify-center p-12 gap-8">
                  {/* Score Display */}
                  <div className="flex flex-col items-center justify-center mb-6">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Brain className="text-purple-400 h-10 w-10" />
                      <h2 className="text-white text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-violet-300 bg-clip-text text-transparent">
                        Identity Revealed
                      </h2>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-4 relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
                      <Star className="relative text-amber-400 h-12 w-12 animate-pulse" />
                      <span className="relative text-white text-6xl font-bold">{gameState.score}</span>
                      <span className="relative text-purple-300 text-3xl font-medium">/100</span>
                    </div>
                  </div>

                  {/* Reveal Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 bg-slate-800/40 backdrop-blur-sm p-4 sm:p-8 rounded-2xl border border-purple-500/20 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 rounded-2xl"></div>

                    {/* Images Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 relative z-10">
                      {/* Original Image */}
                      <div className="text-center">
                        <h3 className="text-purple-300 font-bold text-base sm:text-lg md:text-xl flex items-center justify-center gap-2 mb-3 sm:mb-4">
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                          Original
                        </h3>
                        <div className="space-y-3 sm:space-y-4">
                          <div className="relative group cursor-pointer min-h-[150px] sm:min-h-[200px] flex items-center justify-center">
                            <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-xl sm:rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                            <img
                              src={gameState.original?.url || "/placeholder.svg"}
                              alt="Original"
                              className="relative w-full max-h-[25vh] sm:max-h-[30vh] md:max-h-[35vh] object-contain rounded-xl sm:rounded-2xl border-2 border-purple-500/30 shadow-lg sm:shadow-xl shadow-slate-900/50 transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl group-hover:border-purple-400/50"
                              onClick={() => openImageModal(0)}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 rounded-xl sm:rounded-2xl">
                              <div className="bg-white/90 text-slate-900 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium">
                                Click to enlarge
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <span className="text-white text-base sm:text-lg md:text-xl font-bold bg-slate-900/60 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-purple-500/30 shadow-lg backdrop-blur-sm">
                              {gameState.original?.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Transformed Image */}
                      <div className="text-center">
                        <h3 className="text-purple-300 font-bold text-base sm:text-lg md:text-xl flex items-center justify-center gap-2 mb-3 sm:mb-4">
                          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                          Transformed
                        </h3>
                        <div className="space-y-3 sm:space-y-4">
                          <div className="relative group cursor-pointer min-h-[150px] sm:min-h-[200px] flex items-center justify-center">
                            <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 rounded-xl sm:rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                            <img
                              src={gameState.transformedImage || "/placeholder.svg"}
                              alt="Transformed"
                              className="relative w-full max-h-[25vh] sm:max-h-[30vh] md:max-h-[35vh] object-contain rounded-xl sm:rounded-2xl border-2 border-purple-500/30 shadow-lg sm:shadow-xl shadow-slate-900/50 transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl group-hover:border-purple-400/50"
                              onClick={() => openImageModal(1)}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 rounded-xl sm:rounded-2xl">
                              <div className="bg-white/90 text-slate-900 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium">
                                Click to enlarge
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comparison */}
                    <div className="relative z-10 space-y-4">
                      <div>
                        <h3 className="text-purple-300 font-bold text-lg flex items-center gap-2 mb-2">
                          <Sparkles className="h-5 w-5" />
                          Transformation Applied:
                        </h3>
                        <p className="text-white text-base leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-purple-500/20 shadow-sm backdrop-blur-sm">
                          {gameState.transformation}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-purple-300 font-bold text-lg flex items-center gap-2 mb-2">
                          <Eye className="h-5 w-5" />
                          Your Guess:
                        </h3>
                        <p className="text-purple-100 text-base leading-relaxed italic bg-slate-900/40 p-3 rounded-xl border border-purple-500/20 shadow-sm backdrop-blur-sm">
                          "{gameState.guess}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Next Round Button */}
                  <Button
                    onClick={nextRound}
                    className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 hover:from-indigo-700 hover:via-purple-700 hover:to-violet-700 text-white font-semibold py-5 text-xl rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/30 mt-6"
                  >
                    {gameState.round >= gameState.totalRounds ? (
                      <>
                        <RotateCcw className="mr-2 h-6 w-6" />
                        New Investigation
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-6 w-6" />
                        Next Case
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
