"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, Brain, Eye, RotateCcw, Star, Sparkles, Moon, Wand2 } from "lucide-react"
import type RunwayML from "@runwayml/sdk"
import { generateTransformPrompt, scorePromptGuess } from "./lib/gradio"
import { UploadDropzone } from "@/lib/uploadthing"
import { toast } from "sonner"
import { SoundToggle } from "@/components/sound-toggle"
import { ScoreCelebration } from "@/components/score-celebration"
import {
  soundManager,
  playClickSound,
  playUploadSound,
  playProcessSound,
  playCompleteSound,
  playSuccessSound,
  playRevealSound,
} from "@/lib/sounds"

interface GameState {
  phase: "upload" | "processing" | "guessing" | "result"
  originalImage: string | null
  transformedImage: string | null
  currentTransformation: string | null
  guess: string
  score: number
  round: number
  totalRounds: number
  totalScore: number
}

export default function SimulationGuessingGame() {
  const [gameState, setGameState] = useState<GameState>({
    phase: "upload",
    originalImage: null,
    transformedImage: null,
    currentTransformation: null,
    guess: "",
    score: 0,
    round: 1,
    totalRounds: 5,
    totalScore: 0,
  })

  const [processingProgress, setProcessingProgress] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)

  // Preload sounds when component mounts
  useEffect(() => {
    soundManager.preloadSounds()
  }, [])

  // Simulate progress bar during processing
  useEffect(() => {
    if (gameState.phase === "processing") {
      setProcessingProgress(0)
      const duration = 20516 // 20516ms as requested
      const intervalTime = 100 // Update every 100ms for smooth animation
      const increment = 100 / (duration / intervalTime)

      // Play processing sound
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

  // Play sound when processing completes
  useEffect(() => {
    if (processingProgress === 100 && gameState.phase === "processing") {
      playCompleteSound()
    }
  }, [processingProgress, gameState.phase])

  // Show celebration for high scores
  useEffect(() => {
    if (gameState.phase === "result" && gameState.score >= 70) {
      setShowCelebration(true)
    }
  }, [gameState.phase, gameState.score])

  const handleImageUpload = async (imageUrl: string) => {
    playUploadSound()

    const transformation = await generateTransformPrompt(imageUrl)
    // const transformation = 'transform the image to a 3D model that replaces the parts of the image that are not human';

    setGameState((prev) => ({
      ...prev,
      originalImage: imageUrl,
      currentTransformation: transformation,
      phase: "processing",
    }))

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          promptText: transformation,
          referenceImage: imageUrl,
        }),
      })
      if (!response.ok) throw new Error("Failed to generate image")
      const data = (await response.json()) as RunwayML.TaskRetrieveResponse
      const transformedImage = data.output?.[0]
      if (!transformedImage) throw new Error("Failed to generate image")
      playCompleteSound()
      setGameState((prev) => ({
        ...prev,
        transformedImage,
        phase: "guessing",
      }))
    } catch (error) {
      console.error("Error generating image:", error)
      setGameState((prev) => ({
        ...prev,
        phase: "upload",
        originalImage: null,
        currentTransformation: null,
      }))
    }
  }

  const submitGuess = async () => {
    if (!gameState.currentTransformation || !gameState.guess.trim()) return

    playClickSound()

    const result = await scorePromptGuess({
      prompt: gameState.currentTransformation,
      guess: gameState.guess,
    })

    const score = result.score
    if (score === null) {
      console.error("Failed to score guess")
      return
    }

    // Play reveal sound
    playRevealSound()

    // If score is high (above 70), play success sound
    if (score > 70) {
      setTimeout(() => {
        playSuccessSound()
      }, 500) // Delay to avoid sound overlap
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
    setShowCelebration(false) // Hide celebration when moving to next round

    if (gameState.round >= gameState.totalRounds) {
      // Game over
      setGameState((prev) => ({
        ...prev,
        phase: "upload",
        round: 1,
        score: 0,
        totalScore: 0,
        originalImage: null,
        transformedImage: null,
        currentTransformation: null,
        guess: "",
      }))
    } else {
      setGameState((prev) => ({
        ...prev,
        phase: "upload",
        round: prev.round + 1,
        originalImage: null,
        transformedImage: null,
        currentTransformation: null,
        guess: "",
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden font-['Inter',system-ui,sans-serif]">
      {/* Confetti Celebration */}
      <ScoreCelebration
        score={gameState.score}
        isVisible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Mysterious animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large ambient orbs */}
        <div className="absolute -top-60 -right-60 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-60 -left-60 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/2 w-80 h-80 bg-gradient-to-br from-violet-400/15 to-purple-500/15 rounded-full blur-2xl animate-pulse delay-500"></div>

        {/* Floating magical particles */}
        <div className="absolute top-20 right-20 w-2 h-2 bg-amber-400/80 rounded-full animate-bounce shadow-lg shadow-amber-400/50"></div>
        <div className="absolute bottom-32 left-32 w-1.5 h-1.5 bg-violet-400/80 rounded-full animate-bounce delay-700 shadow-lg shadow-violet-400/50"></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-blue-400/80 rounded-full animate-bounce delay-300 shadow-lg shadow-blue-400/50"></div>
        <div className="absolute top-1/4 left-1/4 w-2.5 h-2.5 bg-purple-400/60 rounded-full animate-bounce delay-1200 shadow-lg shadow-purple-400/50"></div>
        <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-indigo-400/70 rounded-full animate-bounce delay-900 shadow-lg shadow-indigo-400/50"></div>

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:50px_50px] opacity-30"></div>
      </div>

      {/* Elegant Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative p-3 bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl shadow-lg shadow-purple-500/30">
                <Wand2 className="text-white h-6 w-6" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Sim Spotter
                </h1>
                <p className="text-xs text-purple-300/80 font-medium">Uncover the mystery</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <SoundToggle />
              <div className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-sm px-4 py-2.5 rounded-full border border-purple-500/20">
                <Star className="text-amber-400 h-5 w-5 animate-pulse" />
                <span className="text-white font-bold text-lg">{gameState.totalScore}</span>
                <span className="text-purple-300 text-sm">pts</span>
              </div>
              <Badge
                variant="outline"
                className="text-purple-200 border-purple-400/40 bg-purple-900/40 backdrop-blur-sm px-4 py-2 text-sm font-medium"
              >
                Round {gameState.round}/{gameState.totalRounds}
              </Badge>
            </div>
          </div>
          <div className="mt-3 relative">
            <Progress
              value={((gameState.round - 1) / gameState.totalRounds) * 100}
              className="w-full h-2 bg-slate-800/60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-full blur-sm"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-28 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-6xl h-[calc(100vh-10rem)]">
          {/* Upload Phase */}
          {gameState.phase === "upload" && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-6 duration-700 h-full">
              <Card className="bg-slate-800/40 backdrop-blur-xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 h-full flex flex-col rounded-3xl relative overflow-hidden">
                {/* Subtle animated border */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-violet-500/20 to-indigo-500/20 rounded-3xl blur-sm animate-pulse"></div>
                <div className="relative z-10 h-full flex flex-col">
                  <CardHeader className="text-center pb-8 pt-16">
                    <div className="flex justify-center mb-6">
                      <Moon className="h-12 w-12 text-purple-400 animate-pulse" />
                    </div>
                    <CardTitle className="text-white text-4xl font-bold mb-4 tracking-tight bg-gradient-to-r from-white via-purple-200 to-violet-300 bg-clip-text text-transparent">
                      Begin the Transformation
                    </CardTitle>
                    <CardDescription className="text-purple-300 text-xl font-medium">
                      Upload your image and witness the magic unfold
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-center justify-center px-12 pb-16">
                    <div className="w-full max-w-4xl">
                      <UploadDropzone
                        endpoint="imageUploader"
                        config={{ mode: "auto" }}
                        onClientUploadComplete={(res) => {
                          console.log("Upload complete:", res)
                          if (res && res[0]) {
                            handleImageUpload(res[0].ufsUrl)
                          }
                        }}
                        onUploadError={(error: Error) => {
                          console.error("Upload error:", error)
                          toast.error("Upload failed", {
                            description: error.message,
                            duration: 5000,
                          })
                        }}
                        appearance={{
                          container: ({ isDragActive }) =>
                            `border-2 border-dashed transition-all duration-500 rounded-3xl min-h-[400px] relative ${
                              isDragActive
                                ? "border-purple-400 bg-purple-900/30 border-solid shadow-2xl shadow-purple-500/30 scale-[1.02]"
                                : "border-purple-500/40 bg-slate-800/20 hover:bg-slate-800/30 hover:border-purple-400/60 hover:shadow-xl hover:shadow-purple-500/20"
                            }`,
                          uploadIcon: ({ isDragActive }) =>
                            `transition-all duration-500 ${isDragActive ? "text-purple-400 scale-125 animate-bounce" : "text-purple-500"}`,
                          label: ({ isDragActive }) =>
                            `font-semibold text-xl transition-all duration-500 ${
                              isDragActive ? "text-purple-300 scale-110" : "text-white"
                            }`,
                          allowedContent: ({ isDragActive }) =>
                            `text-base mt-3 transition-colors duration-500 ${
                              isDragActive ? "text-purple-400" : "text-purple-300/80"
                            }`,
                          button:
                            "w-52 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-semibold py-3.5 px-6 rounded-xl text-base transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 ut-ready:bg-gradient-to-r ut-ready:from-purple-600 ut-ready:to-violet-700 ut-uploading:cursor-not-allowed ut-uploading:from-slate-600 ut-uploading:to-slate-700",
                        }}
                        content={{
                          uploadIcon({ ready, isUploading }) {
                            if (isUploading) return <Upload className="h-16 w-16 text-purple-400 animate-spin" />
                            if (ready) return <Upload className="h-16 w-16 text-purple-500" />
                            return <Upload className="h-16 w-16 text-purple-500 animate-pulse" />
                          },
                          label({ ready, isUploading }) {
                            if (isUploading) return "Channeling energy..."
                            if (ready) return "Drop your image into the void"
                            return "Preparing the ritual..."
                          },
                          allowedContent({ isUploading }) {
                            if (isUploading) return "The transformation begins..."
                            return "Up to 4MB • PNG, JPG, WEBP"
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>
          )}

          {/* Processing Phase */}
          {gameState.phase === "processing" && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-6 duration-700 h-full">
              <Card className="bg-slate-800/40 backdrop-blur-xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 h-full flex flex-col rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-indigo-500/10 rounded-3xl animate-pulse"></div>
                <CardContent className="relative z-10 flex-1 flex flex-col justify-center items-center space-y-12 p-16">
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/30 to-violet-500/30 rounded-3xl blur-xl animate-pulse"></div>
                    <img
                      src={gameState.originalImage! || "/placeholder.svg"}
                      alt="Original"
                      className="relative w-80 h-80 object-cover rounded-3xl shadow-2xl shadow-slate-900/50 transition-transform duration-700 group-hover:scale-105 border border-purple-500/20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-3xl animate-pulse"></div>
                    {/* Magical sparkles */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 rounded-full animate-ping shadow-lg shadow-amber-400/50"></div>
                    <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-violet-400 rounded-full animate-ping delay-500 shadow-lg shadow-violet-400/50"></div>
                  </div>

                  <div className="bg-slate-800/60 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 w-full max-w-2xl shadow-lg relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 rounded-2xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-6">
                        <Sparkles className="text-purple-400 h-7 w-7 animate-pulse" />
                        <span className="text-white font-semibold text-xl">
                          Weaving the spell... {Math.round(processingProgress)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700/60 rounded-full h-3 overflow-hidden relative">
                        <div
                          className="bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 h-3 rounded-full transition-all duration-100 ease-out shadow-lg relative"
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
                  {/* Image Comparison */}
                  <div className="grid grid-cols-2 gap-8 flex-1">
                    <div className="text-center flex flex-col items-center justify-center space-y-4">
                      <Label className="text-purple-300 font-semibold text-lg flex items-center gap-2">
                        <Moon className="h-5 w-5" />
                        Before
                      </Label>
                      <div className="relative group cursor-pointer">
                        <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                        <img
                          src={gameState.originalImage! || "/placeholder.svg"}
                          alt="Original"
                          className="relative max-w-full max-h-full object-contain rounded-2xl shadow-xl shadow-slate-900/50 transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl border border-purple-500/20"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-purple-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </div>
                    </div>
                    <div className="text-center flex flex-col items-center justify-center space-y-4">
                      <Label className="text-purple-300 font-semibold text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        After
                      </Label>
                      <div className="relative group cursor-pointer">
                        <div className="absolute -inset-2 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                        <img
                          src={gameState.transformedImage || "/placeholder.svg"}
                          alt="Transformed"
                          className="relative max-w-full max-h-full object-contain rounded-2xl shadow-xl shadow-slate-900/50 transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl border border-purple-500/20"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-violet-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </div>
                    </div>
                  </div>

                  {/* Guess Section */}
                  <div className="space-y-6 bg-slate-800/40 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 rounded-2xl"></div>
                    <div className="relative z-10">
                      <h3 className="text-white text-2xl font-bold flex items-center justify-center gap-3 mb-6">
                        <Eye className="text-purple-400 h-7 w-7" />
                        Unravel the Mystery
                      </h3>
                      <Textarea
                        id="guess"
                        placeholder="What sorcery has been cast upon this image?"
                        value={gameState.guess}
                        onChange={(e) => setGameState((prev) => ({ ...prev, guess: e.target.value }))}
                        className="bg-slate-900/60 border-2 border-purple-500/30 text-white placeholder:text-purple-300/60 focus:border-purple-400 focus:ring-purple-400/20 rounded-xl transition-all duration-300 text-base resize-none backdrop-blur-sm"
                        rows={3}
                        required={true}
                      />
                      <Button
                        onClick={submitGuess}
                        className="w-full bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-4 text-lg rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/30 disabled:scale-100 disabled:shadow-none mt-4"
                      >
                        <Wand2 className="mr-2 h-5 w-5" />
                        Reveal the Truth
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Result Phase */}
          {gameState.phase === "result" && gameState.currentTransformation && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-6 duration-700 h-full">
              <Card className="bg-slate-800/40 backdrop-blur-xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 h-full flex flex-col rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-violet-500/5 to-indigo-500/5 rounded-3xl"></div>
                <CardContent className="relative z-10 flex-1 flex flex-col justify-center p-12 gap-8">
                  {/* Score Display */}
                  <div className="flex flex-col items-center justify-center mb-6">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Brain className="text-purple-400 h-10 w-10" />
                      <h2 className="text-white text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-violet-300 bg-clip-text text-transparent">
                        The Revelation
                      </h2>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-4 relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
                      <Star className="relative text-amber-400 h-12 w-12 animate-pulse" />
                      <span className="relative text-white text-6xl font-bold">{gameState.score}</span>
                      <span className="relative text-purple-300 text-3xl font-medium">/100</span>
                    </div>
                  </div>

                  {/* Comparison Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-800/40 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-violet-500/5 rounded-2xl"></div>
                    <div className="relative z-10">
                      {/* Actual Transformation */}
                      <div className="space-y-3">
                        <h3 className="text-purple-300 font-bold text-lg flex items-center gap-2">
                          <Sparkles className="h-5 w-5" />
                          The True Magic:
                        </h3>
                        <p className="text-white text-lg leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-purple-500/20 shadow-sm backdrop-blur-sm">
                          {gameState.currentTransformation}
                        </p>
                      </div>
                    </div>

                    <div className="relative z-10">
                      {/* User's Guess */}
                      <div className="space-y-3">
                        <h3 className="text-purple-300 font-bold text-lg flex items-center gap-2">
                          <Eye className="h-5 w-5" />
                          Your Vision:
                        </h3>
                        <p className="text-purple-100 text-lg leading-relaxed italic bg-slate-900/40 p-4 rounded-xl border border-purple-500/20 shadow-sm backdrop-blur-sm">
                          "{gameState.guess}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Next Round Button */}
                  <Button
                    onClick={nextRound}
                    className="w-full bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 text-white font-semibold py-5 text-xl rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/30 mt-6"
                  >
                    {gameState.round >= gameState.totalRounds ? (
                      <>
                        <RotateCcw className="mr-2 h-6 w-6" />
                        Begin Anew
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-6 w-6" />
                        Continue the Journey
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
