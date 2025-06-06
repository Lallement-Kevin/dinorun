import React, { useRef, useState, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Landmark } from "lucide-react"
import DinovoxVoxel from "./DinovoxVoxel"
import PalmierVoxel from "./PalmierVoxel"
import ChestVoxel from "./ChestVoxel"

// Génère des bords irréguliers pour la plage, de façon déterministe par segment
function BeachEdge({ side, z, seed }: { side: "left" | "right"; z: number; seed: number }) {
  const edgeSegments = 8
  function pseudoRandom(i: number) {
    return Math.abs(Math.sin(seed * 100 + i * 17.3)) % 1
  }
  const edge: JSX.Element[] = []
  for (let i = 0; i < edgeSegments; i++) {
    const segZ = z - 25 + (i * 50) / edgeSegments + 50 / edgeSegments / 2
    const width = 0.3 + pseudoRandom(i) * 0.25
    const height = 0.18 + pseudoRandom(i + 10) * 0.08
    edge.push(
      <mesh
        key={i}
        position={[
          side === "left" ? -3.15 - width / 2 : 3.15 + width / 2,
          0.11,
          segZ,
        ]}
      >
        <boxGeometry args={[width, height, 50 / edgeSegments * 0.95]} />
        <meshStandardMaterial color="#f4e2b6" />
      </mesh>
    )
  }
  return <>{edge}</>
}

// Eau sur les côtés
function Sea({ side, z }: { side: "left" | "right"; z: number }) {
  return (
    <mesh
      position={[
        side === "left" ? -5.5 : 5.5,
        0.05,
        z,
      ]}
    >
      <boxGeometry args={[4, 0.1, 50]} />
      <meshStandardMaterial color="#7dd3fc" transparent opacity={0.85} />
    </mesh>
  )
}

// Sable central avec léger dégradé
function Sand({ z }: { z: number }) {
  return (
    <>
      <mesh receiveShadow position={[0, 0, z]}>
        <boxGeometry args={[6, 0.2, 50]} />
        <meshStandardMaterial color="#f4e2b6" />
      </mesh>
      <mesh receiveShadow position={[0, 0.01, z]}>
        <boxGeometry args={[4.5, 0.05, 50]} />
        <meshStandardMaterial color="#fffbe6" opacity={0.7} transparent />
      </mesh>
    </>
  )
}

// Route plage répétée à l'infini, segments parfaitement enchaînés
function TempleCorridor({ offset }: { offset: number }) {
  const length = 50
  // On génère les segments de offset-200 à offset+400 pour couvrir une très large plage
  const start = Math.floor((offset - 200) / length) * length
  const end = Math.ceil((offset + 400) / length) * length
  const segments = []
  for (let z = start; z <= end; z += length) {
    segments.push(z)
  }
  // Décalage pour continuité parfaite
  const mod = offset % length
  return (
    <>
      {segments.map((z) => (
        <React.Fragment key={z}>
          <Sea side="left" z={z - mod} />
          <Sea side="right" z={z - mod} />
          <Sand z={z - mod} />
          <BeachEdge side="left" z={z - mod} seed={z * 13 + 1} />
          <BeachEdge side="right" z={z - mod} seed={z * 13 + 2} />
        </React.Fragment>
      ))}
    </>
  )
}

// Palmiers décoratifs sur les côtés, synchronisés avec la route
function SidePalms({ offset }: { offset: number }) {
  const spacing = 7
  const visibleStart = -200
  const visibleEnd = 400
  const length = 50
  const mod = offset % length
  const palms = []

  for (
    let z = Math.floor(visibleStart / spacing) * spacing;
    z < visibleEnd;
    z += spacing
  ) {
    palms.push(
      <PalmierVoxel key={`L${z}`} x={-2.7} z={z - mod} />,
      <PalmierVoxel key={`R${z}`} x={2.7} z={z + spacing / 2 - mod} />
    )
  }
  return <>{palms}</>
}

// Types d'obstacles
type Obstacle = {
  x: number
  z: number
  type: "palmier" | "chest"
}

// Affichage d'un obstacle sur la route
function ObstacleOnRoad({ obstacle }: { obstacle: Obstacle }) {
  if (obstacle.type === "palmier") {
    return <PalmierVoxel x={obstacle.x} z={obstacle.z} />
  }
  // chest
  return <ChestVoxel x={obstacle.x} y={0.25} z={obstacle.z} />
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
}: {
  onGameOver: (score: number) => void
  onScore: (score: number) => void
  gameOver: boolean
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>
  runnerX: number
  setRunnerX: React.Dispatch<React.SetStateAction<number>>
  obstacles: Obstacle[]
  setObstacles: React.Dispatch<React.SetStateAction<Obstacle[]>>
  score: number
  setScore: React.Dispatch<React.SetStateAction<number>>
  corridorOffset: number
  setCorridorOffset: React.Dispatch<React.SetStateAction<number>>
}) {
  const speed = 0.18
  const SPAWN_DISTANCE = 40
  const MIN_OBSTACLE_SPACING = 7
  const REMOVE_DISTANCE = 10

  useFrame(() => {
    if (gameOver) return

    // Décor : offset augmente (le monde recule, le joueur avance)
    setCorridorOffset((offset) => offset - speed)

    // Obstacles : leur z augmente (ils viennent vers le joueur)
    setObstacles((obs) =>
      obs
        .map((o) => ({ ...o, z: o.z + speed }))
        .filter((o) => o.z < REMOVE_DISTANCE)
    )

    // Apparition régulière : on ajoute un obstacle si le dernier est assez loin du joueur
    setObstacles((obs) => {
      if (
        obs.length === 0 ||
        obs[obs.length - 1].z > -SPAWN_DISTANCE + MIN_OBSTACLE_SPACING
      ) {
        if (obs.length < 5) {
          const lane = [-1, 0, 1][Math.floor(Math.random() * 3)]
          const type: "palmier" | "chest" = Math.random() < 0.8 ? "palmier" : "chest"
          return [
            ...obs,
            { x: lane, z: -SPAWN_DISTANCE, type }
          ]
        }
      }
      return obs
    })

    // Collision obstacles (z proche de 0)
    setObstacles((obs) => {
      let updated = obs
      obs.forEach((o) => {
        if (
          Math.abs(o.z) < 0.7 &&
          Math.abs(o.x - runnerX) < 0.7
        ) {
          if (o.type === "palmier") {
            setGameOver(true)
            onGameOver(score)
          } else if (o.type === "chest") {
            setScore((s) => {
              const newScore = s + 10
              onScore(newScore)
              return newScore
            })
            // Supprime le coffre ramassé immédiatement
            updated = updated.filter((p) => p !== o)
          }
        }
      })
      return updated
    })
  })

  return (
    <>
      <ambientLight intensity={0.7} color="#fffbe6" />
      <directionalLight
        position={[2, 8, 5]}
        intensity={1.3}
        color="#ffe7b2"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <TempleCorridor offset={corridorOffset} />
      <SidePalms offset={corridorOffset} />
      <DinovoxVoxel x={runnerX} />
      {obstacles.map((o, i) => (
        <ObstacleOnRoad key={i + "-" + o.z.toFixed(2)} obstacle={o} />
      ))}
    </>
  )
}

function Game3D() {
  const [runnerX, setRunnerX] = useState(0)
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("dinovox_highscore") || 0)
  )
  const [corridorOffset, setCorridorOffset] = useState(0)

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
    setObstacles([])
    setScore(0)
    setGameOver(false)
    setCorridorOffset(0)
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
