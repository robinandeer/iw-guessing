"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Eye, Sparkles, ArrowRight } from "lucide-react"
import { playClickSound } from "@/lib/sounds"

export type GameMode = "transform" | "reverse"

interface GameModeSelectorProps {
  onModeSelect: (mode: GameMode) => void
}

export default function GameModeSelector({ onModeSelect }: GameModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null)

  const handleModeSelect = (mode: GameMode) => {
    playClickSound()
    setSelectedMode(mode)
    setTimeout(() => {
      onModeSelect(mode)
    }, 200)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden font-['Inter',system-ui,sans-serif]">
      {/* Background elements - simplified on mobile */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 sm:-top-60 sm:-right-60 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-full blur-2xl sm:blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 sm:-bottom-60 sm:-left-60 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-indigo-500/20 to-blue-600/20 rounded-full blur-2xl sm:blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/2 w-48 h-48 sm:w-80 sm:h-80 bg-gradient-to-br from-violet-400/15 to-purple-500/15 rounded-full blur-xl sm:blur-2xl animate-pulse delay-500"></div>

        {/* Floating particles - hidden on very small screens */}
        <div className="hidden sm:block absolute top-20 right-20 w-2 h-2 bg-amber-400/80 rounded-full animate-bounce shadow-lg shadow-amber-400/50"></div>
        <div className="hidden sm:block absolute bottom-32 left-32 w-1.5 h-1.5 bg-violet-400/80 rounded-full animate-bounce delay-700 shadow-lg shadow-violet-400/50"></div>
        <div className="hidden sm:block absolute top-1/2 right-1/4 w-1 h-1 bg-blue-400/80 rounded-full animate-bounce delay-300 shadow-lg shadow-blue-400/50"></div>

        {/* Grid pattern - simplified on mobile */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:30px_30px] sm:bg-[length:50px_50px] opacity-20 sm:opacity-30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-5xl">
          {/* Header - responsive sizing */}
          <div className="text-center mb-6 sm:mb-12">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative p-3 sm:p-4 bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl sm:rounded-3xl shadow-lg shadow-purple-500/30">
                <Sparkles className="text-white h-8 w-8 sm:h-12 sm:w-12" />
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50"></div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-purple-200 to-violet-300 bg-clip-text text-transparent mb-2 sm:mb-4">
              Sim Spotter
            </h1>
            <p className="text-purple-300 text-lg sm:text-xl font-medium">Choose your challenge</p>
          </div>

          {/* Game Mode Cards - responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Transform Mode */}
            <Card
              className={`bg-slate-800/40 backdrop-blur-lg sm:backdrop-blur-xl border border-purple-500/20 shadow-xl sm:shadow-2xl shadow-purple-500/10 rounded-2xl sm:rounded-3xl relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-purple-500/20 touch-target ${
                selectedMode === "transform" ? "ring-2 ring-purple-400 scale-[1.02] sm:scale-105" : ""
              }`}
              onClick={() => handleModeSelect("transform")}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-indigo-500/10 rounded-2xl sm:rounded-3xl"></div>
              <CardHeader className="relative z-10 text-center pb-4 sm:pb-6 pt-6 sm:pt-12 px-4 sm:px-6">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-600/80 to-violet-700/80 rounded-xl sm:rounded-2xl">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-xl sm:text-2xl font-bold mb-2 sm:mb-3">
                  Transform & Guess
                </CardTitle>
                <CardDescription className="text-purple-300 text-base sm:text-lg leading-relaxed">
                  Upload your own image and watch as AI transforms it in mysterious ways. Then put your detective skills
                  to the test by guessing exactly what changed.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 px-4 sm:px-8 pb-6 sm:pb-12">
                <Button
                  className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-semibold py-3 sm:py-3 text-base sm:text-base rounded-xl transition-all duration-300 touch-target"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleModeSelect("transform")
                  }}
                >
                  Start Transforming
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </CardContent>
            </Card>

            {/* Reverse Mode */}
            <Card
              className={`bg-slate-800/40 backdrop-blur-lg sm:backdrop-blur-xl border border-purple-500/20 shadow-xl sm:shadow-2xl shadow-purple-500/10 rounded-2xl sm:rounded-3xl relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-purple-500/20 touch-target ${
                selectedMode === "reverse" ? "ring-2 ring-purple-400 scale-[1.02] sm:scale-105" : ""
              }`}
              onClick={() => handleModeSelect("reverse")}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-violet-500/10 rounded-2xl sm:rounded-3xl"></div>
              <CardHeader className="relative z-10 text-center pb-4 sm:pb-6 pt-6 sm:pt-12 px-4 sm:px-6">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-indigo-600/80 to-purple-700/80 rounded-xl sm:rounded-2xl">
                    <Eye className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-white text-xl sm:text-2xl font-bold mb-2 sm:mb-3">
                  Reverse Detective
                </CardTitle>
                <CardDescription className="text-purple-300 text-base sm:text-lg leading-relaxed">
                  See a transformed person and work backwards to identify who they originally were. Can you recognize
                  faces through AI's creative disguises?
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 px-4 sm:px-8 pb-6 sm:pb-12">
                <Button
                  className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-semibold py-3 sm:py-3 text-base sm:text-base rounded-xl transition-all duration-300 touch-target"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleModeSelect("reverse")
                  }}
                >
                  Start Detecting
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
