import React from "react"
import { LOGO_ICON } from "./assets"

export default function GameUI({
  running,
  score,
  highScore,
  onStart,
  gameOver,
}: {
  running: boolean
  score: number
  highScore: number
  onStart: () => void
  gameOver: boolean
}) {
  const Logo = LOGO_ICON
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <div className="flex items-center gap-3 mb-8 pointer-events-auto">
        <Logo className="w-12 h-12 text-yellow-400 drop-shadow-lg" />
        <span className="text-4xl font-extrabold text-white drop-shadow-lg tracking-wide">
          Dinovox Run
        </span>
      </div>
      {!running && (
        <div className="flex flex-col items-center gap-6 pointer-events-auto">
          <button
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8 py-3 rounded-full shadow-lg text-2xl transition"
            onClick={onStart}
          >
            {gameOver ? "Restart" : "Start"}
          </button>
          {gameOver && (
            <div className="text-white text-xl font-semibold">
              Game Over!<br />
              <span className="text-yellow-300">Score: {score}</span>
              <br />
              <span className="text-gray-300">High Score: {highScore}</span>
            </div>
          )}
          <div className="text-gray-200 text-lg mt-2">
            Press <kbd className="bg-gray-800 px-2 py-1 rounded">Space</kbd> or{" "}
            <kbd className="bg-gray-800 px-2 py-1 rounded">↑</kbd> to jump
          </div>
        </div>
      )}
    </div>
  )
}
