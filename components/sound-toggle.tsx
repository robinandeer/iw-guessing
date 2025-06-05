"use client"

import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { soundManager } from "@/lib/sounds"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function SoundToggle() {
  const [muted, setMuted] = useState(true) // Default to muted until we check

  useEffect(() => {
    // Initialize mute state from sound manager
    setMuted(soundManager.isMuted())
  }, [])

  const toggleMute = () => {
    const newMuted = soundManager.toggleMute()
    setMuted(newMuted)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex-shrink-0"
          >
            {muted ? (
              <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
            <span className="sr-only">{muted ? "Unmute" : "Mute"} sounds</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{muted ? "Enable" : "Disable"} sound effects</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
