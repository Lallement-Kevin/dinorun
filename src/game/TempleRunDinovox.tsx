import React, { useState } from "react"
import GameEngine from "./GameEngine"
import GameUI from "./GameUI"

export default function TempleRunDinovox() {
  const [running, setRunning] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("dinovox_highscore") || 0)
  )
  const [gameOver, setGameOver] = useState(false)

  function handleGameOver(finalScore: number) {
    setRunning(false)
    setGameOver(true)
    setScore(finalScore)
    if (finalScore > highScore) {
      setHighScore(finalScore)
      localStorage.setItem("dinovox_highscore", String(finalScore))
    }
  }

  function handleScore(s: number) {
    setScore(s)
  }

  function handleStart() {
    setRunning(true)
    setGameOver(false)
    setScore(0)
  }

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-black overflow-hidden">
      <GameEngine
        running={running}
        onGameOver={handleGameOver}
        onScore={handleScore}
      />
      <GameUI
        running={running}
        score={score}
        highScore={highScore}
        onStart={handleStart}
        gameOver={gameOver}
      />
      <div className="absolute inset-0 -z-10">
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
          alt="Forest path"
          className="w-full h-full object-cover opacity-60"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/90" />
      </div>
    </div>
  )
}
