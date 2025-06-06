"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface GameErrorDisplayProps {
  title?: string
  message?: string
  onRetry?: () => void
  onBackToMenu?: () => void
  showRetry?: boolean
  showBackToMenu?: boolean
}

export function GameErrorDisplay({
  title = "Game Temporarily Unavailable",
  message = "We're experiencing technical difficulties. Please try again in a few moments.",
  onRetry,
  onBackToMenu,
  showRetry = true,
  showBackToMenu = true,
}: GameErrorDisplayProps) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-6 duration-700 h-full">
      <Card className="bg-slate-800/40 backdrop-blur-xl border border-red-500/20 shadow-2xl shadow-red-500/10 h-full flex flex-col rounded-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-yellow-500/5 rounded-3xl"></div>
        <CardContent className="relative z-10 flex-1 flex flex-col justify-center items-center space-y-6 p-8 sm:p-12 md:p-16 text-center">
          {/* Error Icon */}
          <div className="relative">
            <div className="p-4 sm:p-6 bg-red-600/20 rounded-full border border-red-500/30">
              <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-red-400" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full blur-lg animate-pulse"></div>
          </div>

          {/* Error Message */}
          <div className="space-y-4 max-w-md">
            <h2 className="text-white text-2xl sm:text-3xl font-bold">{title}</h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">{message}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-sm">
            {showRetry && onRetry && (
              <Button
                onClick={onRetry}
                className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold py-3 text-base rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/30"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            {showBackToMenu && onBackToMenu && (
              <Button
                onClick={onBackToMenu}
                className="flex-1 bg-slate-700/60 border border-slate-400/30 text-white hover:bg-slate-800/80 hover:text-white font-semibold py-3 text-base rounded-xl transition-colors duration-300 shadow-md shadow-slate-900/20 backdrop-blur-sm"
              >
                <Home className="mr-2 h-4 w-4" />
                Main Menu
              </Button>
            )}
          </div>

          {/* Additional Help Text */}
          <p className="text-slate-400 text-sm max-w-md">
            If the problem persists, please check your internet connection or try again later.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
