import React, { useRef, useState, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Landmark } from "lucide-react"
import DinovoxVoxel from "./DinovoxVoxel"
import PalmierVoxel from "./PalmierVoxel"
import ChestVoxel from "./ChestVoxel"

// Couloir de sable, couleur plage
function TempleCorridor({ offset }: { offset: number }) {
  const length = 50
  const z1 = ((offset % length) - length)
  const z2 = (offset % length)
  return (
    <>
      <mesh receiveShadow position={[0, 0, z1]}>
        <boxGeometry args={[6, 0.2, length]} />
        <meshStandardMaterial color="#f4e2b6" />
      </mesh>
      <mesh receiveShadow position={[0, 0, z2]}>
        <boxGeometry args={[6, 0.2, length]} />
        <meshStandardMaterial color="#f4e2b6" />
      </mesh>
    </>
  )
}

// Palmiers décoratifs sur les côtés, générés de façon fluide et continue
function SidePalms({ offset }: { offset: number }) {
  const length = 50
  const spacing = 7
  const visibleStart = -10
  const visibleEnd = 30
  const palms = []

  // On veut couvrir toute la zone visible devant le joueur
  // On calcule la position réelle du couloir, puis on place des palmiers à intervalles réguliers
  // sur toute la plage visible (pas de modulo qui recale tout d'un coup)
  const corridorZ = offset - 50
  // On commence un peu avant le joueur pour couvrir l'arrière
  for (
    let z = Math.floor((corridorZ + visibleStart) / spacing) * spacing;
    z < corridorZ + visibleEnd;
    z += spacing
  ) {
    palms.push(
      <PalmierVoxel key={`L${z}`} x={-2.7} z={z} />,
      <PalmierVoxel key={`R${z}`} x={2.7} z={z + spacing / 2} />
    )
  }
  return <>{palms}</>
}

function Game3DLogic({
  onGameOver,
  onScore,
  gameOver,
  setGameOver,
  runnerX,
  setRunnerX,
  obstacles,
  setObstacles,
  score,
  setScore,
  corridorOffset,
  setCorridorOffset,
  chest,
  setChest,
}: {
  onGameOver: (score: number) => void
  onScore: (score: number) => void
  gameOver: boolean
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>
  runnerX: number
  setRunnerX: React.Dispatch<React.SetStateAction<number>>
  obstacles: { x: number; z: number }[]
  setObstacles: React.Dispatch<React.SetStateAction<{ x: number; z: number }[]>>
  score: number
  setScore: React.Dispatch<React.SetStateAction<number>>
  corridorOffset: number
  setCorridorOffset: React.Dispatch<React.SetStateAction<number>>
  chest: { x: number; z: number }
  setChest: React.Dispatch<React.SetStateAction<{ x: number; z: number }>>
}) {
  const speed = 0.18

  useFrame(() => {
    if (gameOver) return
    // Obstacles (palmiers)
    setObstacles((obs) =>
      obs
        .map((o) => ({ ...o, z: o.z + speed }))
        .filter((o) => o.z < 2)
    )
    setCorridorOffset((offset) => offset + speed)

    // Chest avance aussi
    setChest((prev) => ({ ...prev, z: prev.z + speed }))

    // Génération obstacles
    if (obstacles.length < 5 && Math.random() < 0.03) {
      const lane = [-1, 0, 1][Math.floor(Math.random() * 3)]
      setObstacles((obs) => [...obs, { x: lane, z: -40 }])
    }
    // Collision obstacles
    obstacles.forEach((o) => {
      if (
        Math.abs(o.z) < 0.7 &&
        Math.abs(o.x - runnerX) < 0.7
      ) {
        setGameOver(true)
        onGameOver(score)
      }
    })
    // Collision chest
    if (
      Math.abs(chest.z) < 0.7 &&
      Math.abs(chest.x - runnerX) < 0.7
    ) {
      setScore((s) => {
        const newScore = s + 10
        onScore(newScore)
        return newScore
      })
      const newLane = [-1, 0, 1][Math.floor(Math.random() * 3)]
      setChest({ x: newLane, z: -40 - Math.random() * 20 })
    }
    // (Plus d'incrémentation automatique du score ici)
  })

  return (
    <>
      {/* Lumière chaude pour ambiance plage */}
      <ambientLight intensity={0.7} color="#fffbe6" />
      <directionalLight
        position={[2, 8, 5]}
        intensity={1.3}
        color="#ffe7b2"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <TempleCorridor offset={corridorOffset - 50} />
      <SidePalms offset={corridorOffset - 50} />
      <DinovoxVoxel x={runnerX} />
      {obstacles.map((o, i) => (
        <PalmierVoxel key={i} x={o.x} z={o.z} />
      ))}
      {/* Chest collectible */}
      <ChestVoxel x={chest.x} y={0.25} z={chest.z} />
    </>
  )
}

function Game3D() {
  const [runnerX, setRunnerX] = useState(0)
  const [obstacles, setObstacles] = useState([
    { x: -1, z: -10 },
    { x: 1, z: -20 },
    { x: 0, z: -30 },
  ])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("dinovox_highscore") || 0)
  )
  const [corridorOffset, setCorridorOffset] = useState(-50)
  // Chest sur la route, lane aléatoire, loin devant au départ
  const [chest, setChest] = useState<{ x: number; z: number }>(
    () => {
      const lane = [-1, 0, 1][Math.floor(Math.random() * 3)]
      return { x: lane, z: -25 }
    }
  )

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (gameOver) return
      if (e.code === "ArrowLeft" && runnerX > -1.5) setRunnerX((x) => x - 1)
      if (e.code === "ArrowRight" && runnerX < 1.5) setRunnerX((x) => x + 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [runnerX, gameOver])

  const handleRestart = useCallback(() => {
    setRunnerX(0)
    setObstacles([
      { x: -1, z: -10 },
      { x: 1, z: -20 },
      { x: 0, z: -30 },
    ])
    setScore(0)
    setGameOver(false)
    setCorridorOffset(-50)
    const lane = [-1, 0, 1][Math.floor(Math.random() * 3)]
    setChest({ x: lane, z: -25 })
  }, [])

  const handleGameOver = useCallback(
    (finalScore: number) => {
      setGameOver(true)
      if (finalScore > highScore) {
        setHighScore(finalScore)
        localStorage.setItem("dinovox_highscore", String(finalScore))
      }
    },
    [highScore]
  )

  const handleScore = useCallback((s: number) => {
    setScore(s)
  }, [])

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 3, 6], fov: 60 }}
        style={{ width: "100vw", height: "100vh", background: "#fef6e4" }}
      >
        <Game3DLogic
          onGameOver={handleGameOver}
          onScore={handleScore}
          gameOver={gameOver}
          setGameOver={setGameOver}
          runnerX={runnerX}
          setRunnerX={setRunnerX}
          obstacles={obstacles}
          setObstacles={setObstacles}
          score={score}
          setScore={setScore}
          corridorOffset={corridorOffset}
          setCorridorOffset={setCorridorOffset}
          chest={chest}
          setChest={setChest}
        />
      </Canvas>
      <div className="absolute top-0 left-0 w-full flex flex-col items-center mt-8 pointer-events-none z-10">
        <div className="flex items-center gap-3 mb-4">
          <Landmark className="w-10 h-10 text-yellow-400 drop-shadow-lg" />
          <span className="text-3xl font-extrabold text-white drop-shadow-lg tracking-wide">
            Dinovox Run 3D
          </span>
        </div>
        <div className="bg-black/60 rounded-xl px-6 py-2 text-white text-lg font-bold shadow-lg">
          Score: {score}
        </div>
        <div className="bg-black/60 rounded-xl px-6 py-2 text-white text-lg font-bold shadow-lg mt-2">
          High Score: {highScore}
        </div>
      </div>
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
          <div className="flex items-center gap-3 mb-6">
            <Landmark className="w-12 h-12 text-yellow-400 drop-shadow-lg" />
            <span className="text-4xl font-extrabold text-white drop-shadow-lg tracking-wide">
              Game Over
            </span>
          </div>
          <div className="text-white text-2xl mb-4">Score: {score}</div>
          <button
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8 py-3 rounded-full shadow-lg text-2xl transition pointer-events-auto"
            onClick={handleRestart}
          >
            Restart
          </button>
        </div>
      )}
      <div className="absolute bottom-0 left-0 w-full flex justify-center mb-6 z-10">
        <div className="bg-black/50 rounded-lg px-4 py-2 text-white text-base flex gap-4 items-center">
          <kbd className="bg-gray-800 px-2 py-1 rounded">←</kbd>
          <kbd className="bg-gray-800 px-2 py-1 rounded">→</kbd>
          pour bouger
        </div>
      </div>
    </div>
  )
}

export default function TempleRun3D() {
  return <Game3D />
}
