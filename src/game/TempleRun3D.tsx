import React, { useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import ChestVoxel from "./ChestVoxel";
import GameUI from "./GameUI";
import { VoxelAsset } from "./VoxelAsset";
import { BeachEdge } from "./BeachEdge";
import { Sand } from "./Sand";
import { max, min } from "three/tsl";

const MAX_OFFSET = 2000;
const SPAWN_DISTANCE = 50;

// Eau sur les côtés
function Sea({ side, z }: { side: "left" | "right"; z: number }) {
  return (
    <mesh position={[side === "left" ? -5.5 : 5.5, 0.05, z]}>
      <boxGeometry args={[4, 0.1, 50]} />
      <meshStandardMaterial color="#7dd3fc" transparent opacity={0.85} />
    </mesh>
  );
}

// Route plage répétée à l'infini, segments parfaitement enchaînés
function TempleCorridor({ offset }: { offset: number }) {
  const length = 50;
  const mod = ((offset % length) + length) % length;

  const start = Math.floor((offset - 200) / length) * length;
  const end = Math.ceil((offset + MAX_OFFSET) / length) * length;

  const segments = [];
  for (let z = start; z <= end; z += length) {
    segments.push(z);
  }
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
  );
}
function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 1337.7) * 43758.5453;
  return x - Math.floor(x); // Valeur entre 0 et 1
}
// Palmiers décoratifs sur les côtés, synchronisés avec la route
function SidePalms({ offset }: { offset: number }) {
  const spacing = 7;
  const visibleStart = -200;
  const visibleEnd = 400;
  const length = 50;
  const mod = offset % length;
  const palms = [];

  for (
    let z = Math.floor(visibleStart / spacing) * spacing;
    z < visibleEnd;
    z += spacing
  ) {
    const rotationLeft = pseudoRandom(z) * Math.PI * 2;
    const rotationRight = pseudoRandom(z + 999) * Math.PI * 2;

    palms.push(
      <React.Fragment key={z}>
        <VoxelAsset
          path="/glb/Palm.glb"
          position={[-2.7, 0, z - mod]}
          scale={0.5}
          rotation={[0, rotationLeft, 0]}
        />
        <VoxelAsset
          path="/glb/Palm.glb"
          position={[2.7, 0, z - mod]}
          scale={0.5}
          rotation={[0, rotationRight, 0]}
        />
      </React.Fragment>
    );
  }
  return <>{palms}</>;
}

// Types d'obstacles
type Obstacle = {
  id: string;
  x: number;
  z: number;
  type: "palmier" | "chest" | "bird" | "frog" | "crab";
};

// Affichage d'un obstacle sur la route
function ObstacleOnRoad({ obstacle }: { obstacle: Obstacle }) {
  if (obstacle.type === "palmier") {
    const rotationY = pseudoRandom(parseInt(obstacle.id, 10)) * Math.PI * 2;
    return (
      <VoxelAsset
        path="/glb/Palm.glb"
        position={[obstacle.x, 0, obstacle.z]}
        scale={0.5}
        rotation={[0, rotationY, 0]}
      />
    );
  }
  if (obstacle.type === "bird") {
    return (
      <VoxelAsset
        path="/glb/Bird.glb"
        position={[obstacle.x, 0, obstacle.z]}
        scale={3}
        rotation={[0, 0, 0]}
      />
    );
  }
  if (obstacle.type === "frog") {
    return (
      <VoxelAsset
        path="/glb/Frog.glb"
        position={[obstacle.x, 0, obstacle.z]}
        scale={3}
        rotation={[0, 0, 0]}
      />
    );
  }
  if (obstacle.type === "crab") {
    return (
      <VoxelAsset
        path="/glb/Crab.glb"
        position={[obstacle.x, 0, obstacle.z]}
        scale={3}
        rotation={[0, 0, 0]}
      />
    );
  }

  return (
    <VoxelAsset
      path="/glb/Chest.glb"
      position={[obstacle.x, 0.2, obstacle.z]}
      scale={0.8}
      rotation={[0, 0, 0]}
    />
  );
  return <ChestVoxel x={obstacle.x} y={1.25} z={obstacle.z} />;
}

// --- 3D Logic Component (inside Canvas) ---
function Game3DLogic({
  running,
  onGameOver,
  onScore,
  resetSignal,
}: {
  running: boolean;
  onGameOver: (score: number) => void;
  onScore: (score: number) => void;
  resetSignal: number;
}) {
  // Tous les états du jeu sont internes ici, mais reset quand resetSignal change
  const [runnerX, setRunnerX] = useState(0);
  const [runnerZ, setrunnerZ] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [corridorOffset, setCorridorOffset] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [maxObsatcles, setMaxObstacles] = useState(0);
  const [minObstacleSpacing, setMinObstacleSpacing] = useState(0);

  // Reset complet quand resetSignal change
  React.useEffect(() => {
    setRunnerX(0);
    setrunnerZ(0);
    setObstacles([]);
    setScore(0);
    setCorridorOffset(0);
    setGameOver(false);
    setMaxObstacles(5);
    setMinObstacleSpacing(10);
  }, [resetSignal]);

  // Contrôles clavier
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!running || gameOver) return;
      if (e.code === "ArrowLeft" && runnerX > -1.5) setRunnerX((x) => x - 1);
      if (e.code === "ArrowRight" && runnerX < 1.5) setRunnerX((x) => x + 1);
      if (e.code === "ArrowUp" && runnerZ > -6) setrunnerZ((z) => z - 1);
      if (e.code === "ArrowDown" && runnerZ < 4) setrunnerZ((z) => z + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runnerX, runnerZ, running, gameOver]);
  //mobile
  React.useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    function handleTouchStart(e: TouchEvent) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }

    function handleTouchEnd(e: TouchEvent) {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipeGesture();
    }

    function handleSwipeGesture() {
      if (!running || gameOver) return;

      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      if (Math.abs(dx) > Math.abs(dy)) {
        // Swipe horizontal
        if (dx > 30 && runnerX < 1.5) setRunnerX((x) => x + 1); // swipe droite
        else if (dx < -30 && runnerX > -1.5) setRunnerX((x) => x - 1); // swipe gauche
      } else {
        // Swipe vertical
        if (dy > 30 && runnerZ < 4) setrunnerZ((z) => z + 1); // swipe bas
        else if (dy < -30 && runnerZ > -6) setrunnerZ((z) => z - 1); // swipe haut
      }
    }

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [runnerX, runnerZ, running, gameOver]);
  // Logique du jeu
  useFrame(() => {
    if (!running || gameOver) return;

    // Décor : offset augmente (le monde recule, le joueur avance)
    setCorridorOffset((offset) => offset - 0.18);

    // Obstacles : leur z augmente (ils viennent vers le joueur)
    // setObstacles((obs) =>
    //   obs.map((o) => ({ ...o, z: o.z + 0.18 })).filter((o) => o.z < 10)
    // );
    setObstacles((obs) =>
      obs
        .map((o) => {
          const speed = o.type === "bird" ? 0.35 : 0.18;
          const newZ = o.z + speed;

          // Mouvement latéral si c'est un crab
          const newX =
            o.type === "crab"
              ? o.x + 0.05 * Math.sin(newZ * 0.3) // variation fluide
              : o.x;

          return {
            ...o,
            z: newZ,
            x: newX,
          };
        })
        .filter((o) => o.z < 10)
    );

    // Apparition régulière : on ajoute un obstacle si le dernier est assez loin du joueur
    setObstacles((obs) => {
      if (
        corridorOffset > -MAX_OFFSET + SPAWN_DISTANCE &&
        (obs.length === 0 ||
          obs[obs.length - 1].z > -SPAWN_DISTANCE + minObstacleSpacing)
      ) {
        console.log("max_obstacles", maxObsatcles);
        console.log("min_obstacle_spacing", minObstacleSpacing);
        if (obs.length < maxObsatcles) {
          const lane = [-2, -1, 0, 1, 2][Math.floor(Math.random() * 5)];
          const type: "palmier" | "chest" | "bird" | "frog" | "crab" = (() => {
            const rand = Math.random();
            if (rand < 0.7) return "palmier";
            if (rand < 0.9) return "chest";
            if (rand < 0.95) return "bird";
            if (rand < 0.98) return "crab";
            return "frog";
          })();
          return [
            ...obs,
            {
              id:
                Date.now().toString() +
                Math.random().toString(36).substring(2, 5),
              x: lane,
              z: -SPAWN_DISTANCE,
              type,
            },
          ];
        }
      }
      return obs;
    });

    // Collision obstacles (z proche de 0)
    setObstacles((obs) => {
      let updated = obs;
      obs.forEach((o) => {
        // if (Math.abs(o.z) < 0.7 && Math.abs(o.x - runnerX) < 0.7) {
        if (Math.abs(o.z - runnerZ) < 0.7 && Math.abs(o.x - runnerX) < 0.7) {
          if (
            o.type === "palmier" ||
            o.type === "bird" ||
            o.type === "frog" ||
            o.type === "crab"
          ) {
            setGameOver(true);
            onGameOver(score);
          } else if (o.type === "chest") {
            setScore((s) => {
              const newScore = s + 10;
              onScore(newScore);
              return newScore;
            });
            setMaxObstacles((prev) => Math.min(prev + 0.2, 100)); // Augmente le max obstacles
            setMinObstacleSpacing((prev) => Math.max(prev - 0.1, 3)); // Réduit l'espacement min
            updated = updated.filter((p) => p !== o);
          }
        }
      });
      return updated;
    });
    // Pas d'incrémentation automatique du score

    if (corridorOffset < -MAX_OFFSET) {
      setCorridorOffset((prev) => prev + MAX_OFFSET); // on ramène à 0
      setObstacles([]);
    }
  });

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

      <VoxelAsset
        path="/glb/RocketDino.glb"
        position={[runnerX, 0, runnerZ]}
        scale={0.5}
        rotation={[0, 0, 0]}
        key="runner-rocket"
      />

      {obstacles.map((o, i) => (
        <ObstacleOnRoad key={i + "-" + o.z.toFixed(2)} obstacle={o} />
      ))}
    </>
  );
}

// --- Main Game3D Component ---
export default function TempleRun3D() {
  // Etats globaux
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("dinovox_highscore") || 0)
  );
  // Pour forcer le reset du composant 3D
  const [resetSignal, setResetSignal] = useState(0);

  // Callback appelé par le composant 3D quand game over
  const handleGameOver = useCallback(
    (finalScore: number) => {
      setRunning(false);
      setGameOver(true);
      setScore(finalScore);
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem("dinovox_highscore", String(finalScore));
      }
    },
    [highScore]
  );

  // Callback appelé par le composant 3D quand score change (coffre ramassé)
  const handleScore = useCallback((s: number) => {
    setScore(s);
  }, []);

  // Démarrer ou rejouer
  const handleStart = useCallback(() => {
    setRunning(true);
    setGameOver(false);
    setScore(0);
    setResetSignal((n) => n + 1); // force le reset du composant 3D
  }, []);

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 3, 6], fov: 60 }}
        style={{ width: "100vw", height: "100vh", background: "#fef6e4" }}
      >
        <Game3DLogic
          running={running}
          onGameOver={handleGameOver}
          onScore={handleScore}
          resetSignal={resetSignal}
        />
      </Canvas>
      {/* UI Overlay */}
      <GameUI
        running={running && !gameOver}
        score={score}
        highScore={highScore}
        onStart={handleStart}
        gameOver={gameOver}
      />
      <div className="absolute bottom-0 left-0 w-full flex justify-center mb-6 z-10">
        <div className="bg-black/50 rounded-lg px-4 py-2 text-white text-base flex gap-4 items-center">
          <kbd className="bg-gray-800 px-2 py-1 rounded">←</kbd>
          <kbd className="bg-gray-800 px-2 py-1 rounded">→</kbd>
          pour bouger
        </div>
      </div>
    </div>
  );
}
