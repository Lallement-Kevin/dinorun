import React from "react";
import { LOGO_ICON } from "./assets";

export default function GameUI({
  running,
  score,
  highScore,
  onStart,
  gameOver,
}: {
  running: boolean;
  score: number;
  highScore: number;
  onStart: () => void;
  gameOver: boolean;
}) {
  const Logo = LOGO_ICON;
  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Titre et logo en haut au centre */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        <Logo className="w-10 h-10 text-yellow-400 drop-shadow-lg" />
        <span className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg tracking-wide">
          Dinovox Run
        </span>
      </div>
      {/* Score en haut à gauche */}
      <div className="absolute top-6 left-6 z-20">
        <div className="bg-black/70 rounded-lg px-4 py-2 text-white text-base font-bold shadow-lg flex items-center gap-2">
          <span className="text-yellow-300">Score</span>
          <span className="font-mono">{Math.floor(score)}</span>
        </div>
      </div>
      {/* High score en haut à droite */}
      <div className="absolute top-6 right-6 z-20">
        <div className="bg-black/70 rounded-lg px-4 py-2 text-white text-base font-bold shadow-lg flex items-center gap-2">
          <span className="text-gray-300">High</span>
          <span className="font-mono">{Math.floor(highScore)}</span>
        </div>
      </div>
      {/* Menu de démarrage ou de fin de partie */}
      {!running && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-auto">
          <button
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-10 py-4 rounded-full shadow-lg text-2xl transition"
            onClick={onStart}
          >
            {gameOver ? "Rejouer" : "Démarrer"}
          </button>
          {gameOver && (
            <div className="mt-6 text-center bg-black/80 rounded-xl p-6 shadow-2xl border border-white/10 backdrop-blur-sm">
              <div className="text-white text-2xl font-bold mb-3 uppercase tracking-wider">
                Game Over
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-yellow-400 font-mono text-xl font-bold flex items-center justify-center gap-2">
                  <span>Score:</span>
                  <span>{Math.floor(score)}</span>
                </div>
                <div className="text-gray-400 font-mono text-sm">
                  Best: {Math.floor(highScore)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
