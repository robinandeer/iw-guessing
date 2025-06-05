"use client"

import { useState } from "react"
import GameModeSelector, { type GameMode } from "../game-mode-selector"
import SimulationGuessingGame from "../simulation-game"
import ReverseGame from "../reverse-game"

export default function Page() {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null)

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode)
  }

  const handleBackToMenu = () => {
    setSelectedMode(null)
  }

  if (!selectedMode) {
    return <GameModeSelector onModeSelect={handleModeSelect} />
  }

  if (selectedMode === "transform") {
    return <SimulationGuessingGame onBackToMenu={handleBackToMenu} />
  }

  if (selectedMode === "reverse") {
    return <ReverseGame onBackToMenu={handleBackToMenu} />
  }

  return null
}
