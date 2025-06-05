"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, Brain, Zap, Eye, RotateCcw, Star } from "lucide-react"
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
    phase: "result",
    originalImage: "https://xbswhctnjf.ufs.sh/f/8Nxl3xXvYosk5HsQgoA4MJNhBwg2TmzPeZ0CnESDX3fojFVR",
    transformedImage: "https://xbswhctnjf.ufs.sh/f/8Nxl3xXvYoskXyozhoPElaOTFIYyndjPMZuJCWARL2phKrsE",
    currentTransformation: "transform the image to a 3D model that replaces the parts of the image that are not human",
    guess: "transform the image to a 3D model",
    score: 70,
    round: 1,
    totalRounds: 5,
    totalScore: 70,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 relative overflow-hidden">
      {/* Confetti Celebration */}
      <ScoreCelebration
        score={gameState.score}
        isVisible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-60 -right-60 w-[600px] h-[600px] bg-teal-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] bg-cyan-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-400/8 rounded-full blur-3xl animate-pulse delay-500"></div>
        {/* Additional floating elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-teal-400/10 rounded-full blur-2xl animate-bounce delay-700"></div>
      </div>

      {/* Compact Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-xl border-b border-teal-500/30">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/30 rounded-xl shadow-lg">
                <Brain className="text-teal-300 h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Sim Spotter</h1>
            </div>
            <div className="flex items-center gap-6">
              <SoundToggle />
              <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full">
                <Star className="text-yellow-400 h-5 w-5" />
                <span className="text-white font-bold text-lg">{gameState.totalScore}</span>
              </div>
              <Badge
                variant="outline"
                className="text-white border-teal-400 bg-teal-500/20 px-4 py-2 text-sm font-semibold"
              >
                Round {gameState.round}/{gameState.totalRounds}
              </Badge>
            </div>
          </div>
          <Progress value={((gameState.round - 1) / gameState.totalRounds) * 100} className="w-full mt-2 h-1" />
        </div>
      </div>

      {/* Main Content - Full Screen Modal Style */}
      <div className="pt-20 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-7xl h-[calc(100vh-6rem)]">
          {/* Upload Phase */}
          {gameState.phase === "upload" && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 h-full">
              <Card className="bg-black/40 backdrop-blur-xl border-teal-500/40 shadow-2xl h-full flex flex-col">
                <CardHeader className="text-center pb-8 pt-12">
                  <CardTitle className="text-white text-4xl font-bold mb-4">Drop Your Image</CardTitle>
                  <CardDescription className="text-teal-200 text-xl">Ready to transform your image?</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center px-12 pb-12">
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
                          `border-4 border-dashed transition-all duration-300 rounded-3xl min-h-[400px] ${
                            isDragActive
                              ? "border-teal-300 bg-teal-900/40 border-solid shadow-2xl shadow-teal-500/30 scale-105"
                              : "border-teal-400/60 bg-white/5 hover:bg-white/10 hover:border-teal-400 hover:shadow-xl"
                          }`,
                        uploadIcon: ({ isDragActive }) =>
                          `transition-all duration-300 ${isDragActive ? "text-teal-300 scale-125" : "text-teal-400"}`,
                        label: ({ isDragActive }) =>
                          `font-bold text-2xl transition-all duration-300 ${
                            isDragActive ? "text-teal-100 scale-110" : "text-white"
                          }`,
                        allowedContent: ({ isDragActive }) =>
                          `text-lg mt-4 transition-colors duration-300 ${
                            isDragActive ? "text-teal-200" : "text-teal-200"
                          }`,
                        button:
                          "bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 hover:scale-110 hover:shadow-xl ut-ready:bg-teal-600 ut-uploading:cursor-not-allowed ut-uploading:bg-teal-400",
                      }}
                      content={{
                        uploadIcon({ ready, isUploading }) {
                          if (isUploading) return <Upload className="h-20 w-20 text-teal-400 animate-bounce" />
                          if (ready) return <Upload className="h-20 w-20 text-teal-400" />
                          return <Upload className="h-20 w-20 text-teal-400 animate-pulse" />
                        },
                        label({ ready, isUploading }) {
                          if (isUploading) return "Processing..."
                          if (ready) return "Drop it like it's hot"
                          return "Getting ready..."
                        },
                        allowedContent({ isUploading }) {
                          if (isUploading) return "Working our magic..."
                          return "Up to 4MB • PNG, JPG, WEBP"
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Processing Phase */}
          {gameState.phase === "processing" && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 h-full">
              <Card className="bg-black/40 backdrop-blur-xl border-teal-500/40 shadow-2xl h-full flex flex-col">
                <CardContent className="flex-1 flex flex-col justify-center items-center space-y-12 p-12">
                  <div className="relative">
                    <img
                      src={gameState.originalImage! || "/placeholder.svg"}
                      alt="Original"
                      className="w-96 h-96 object-cover rounded-3xl border-4 border-teal-400/60 shadow-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/30 to-cyan-500/30 rounded-3xl animate-pulse"></div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-3xl blur-xl animate-pulse"></div>
                  </div>

                  <div className="bg-black/30 p-8 rounded-2xl border border-teal-400/40 w-full max-w-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <Zap className="text-teal-400 h-8 w-8 animate-pulse" />
                      <span className="text-white font-bold text-2xl">
                        Cooking up some chaos... {Math.round(processingProgress)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-400 to-cyan-400 h-4 rounded-full transition-all duration-100 ease-out shadow-lg"
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Guessing Phase */}
          {gameState.phase === "guessing" && gameState.transformedImage && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 h-full">
              <Card className="bg-black/40 backdrop-blur-xl border-teal-500/40 shadow-2xl h-full flex flex-col">
                <CardContent className="flex-1 flex flex-col space-y-6 px-12 pb-12">
                  {/* Large Image Comparison */}
                  <div className="grid grid-cols-2 gap-8 flex-1">
                    <div className="text-center flex flex-col items-center justify-center">
                      <Label className="text-white mb-3 block font-bold text-lg">Original</Label>
                      <img
                        src={gameState.originalImage! || "/placeholder.svg"}
                        alt="Original"
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-transform hover:scale-105"
                      />
                    </div>
                    <div className="text-center flex flex-col items-center justify-center">
                      <Label className="text-white mb-3 block font-bold text-lg">Transformed</Label>
                      <img
                        src={gameState.transformedImage || "/placeholder.svg"}
                        alt="Transformed"
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-transform hover:scale-105"
                      />
                    </div>
                  </div>

                  {/* Consolidated Guess Section */}
                  <div className="space-y-4">
                    <h3 className="text-cyan-200 text-2xl font-bold flex items-center justify-center gap-2">
                      <Eye className="text-teal-400 h-8 w-8" />
                      Spot the Difference!
                    </h3>
                    <Textarea
                      id="guess"
                      placeholder="What did we do to your image?"
                      value={gameState.guess}
                      onChange={(e) => setGameState((prev) => ({ ...prev, guess: e.target.value }))}
                      className="bg-white/10 border-2 border-teal-400/60 text-white placeholder:text-teal-200/60 focus:border-teal-300 focus:outline-none rounded-xl transition-all duration-300 text-lg"
                      rows={3}
                      required={true}
                    />
                    <Button
                      onClick={submitGuess}
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-4 text-xl rounded-xl transition-all duration-200 hover:scale-102 hover:shadow-lg disabled:scale-100 disabled:shadow-none"
                    >
                      Take your best shot!
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Result Phase - Streamlined */}
          {gameState.phase === "result" && gameState.currentTransformation && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 h-full">
              <Card className="bg-black/40 backdrop-blur-xl border-teal-500/40 shadow-2xl h-full flex flex-col">
                <CardContent className="flex-1 flex flex-col justify-center p-12 gap-8">
                  {/* Score Display - Prominent at the top */}
                  <div className="flex flex-col items-center justify-center mb-4">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <Brain className="text-teal-400 h-10 w-10" />
                      <h2 className="text-white text-4xl font-bold">Results</h2>
                    </div>
                    <div className="flex items-center justify-center gap-3 mt-6">
                      <Star className="text-yellow-400 h-14 w-14" />
                      <span className="text-white text-6xl font-bold">{gameState.score}</span>
                      <span className="text-white/70 text-3xl">/100</span>
                    </div>
                  </div>

                  {/* Comparison Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/20 p-8 rounded-2xl">
                    {/* Actual Transformation */}
                    <div className="space-y-2">
                      <h3 className="text-teal-300 font-bold text-xl">Actual Transformation:</h3>
                      <p className="text-white text-xl font-medium bg-black/30 p-4 rounded-xl">
                        {gameState.currentTransformation}
                      </p>
                    </div>

                    {/* User's Guess */}
                    <div className="space-y-2">
                      <h3 className="text-teal-300 font-bold text-xl">Your Guess:</h3>
                      <p className="text-white/90 text-xl italic bg-black/30 p-4 rounded-xl">"{gameState.guess}"</p>
                    </div>
                  </div>

                  {/* Next Round Button */}
                  <Button
                    onClick={nextRound}
                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold py-5 text-xl rounded-xl transition-all duration-200 hover:scale-102 hover:shadow-lg mt-4"
                  >
                    {gameState.round >= gameState.totalRounds ? (
                      <>
                        <RotateCcw className="mr-2 h-6 w-6" />
                        Play Again
                      </>
                    ) : (
                      "Next Round"
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
