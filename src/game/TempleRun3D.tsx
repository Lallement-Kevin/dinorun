import React, { useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import ChestVoxel from "./ChestVoxel";
import GameUI from "./GameUI";
import {
  VoxelRocketDino,
  VoxelBird,
  VoxelPalm,
  VoxelCrab,
  VoxelChest,
  VoxelFrog,
} from "./VoxelAsset";
import { BeachEdge } from "./BeachEdge";
import { Sand } from "./Sand";
import { Vector3 } from "three";
import { max, min } from "three/tsl";

const MAX_OFFSET = 1400; // LCM(50, 7) * 4 to ensure smooth looping
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
function TempleCorridor({
  offset,
  activeBirdLanes,
}: {
  offset: number;
  activeBirdLanes: number[];
}) {
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
          <Sand z={z - mod} activeBirdLanes={activeBirdLanes} />
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
  // Calculate visible world range
  // We want to see from -200 (behind) to +400 (ahead) relative to current offset
  const startWorldZ = Math.floor((offset - 200) / spacing) * spacing;
  const endWorldZ = offset + 400;

  const palms = [];

  for (let z = startWorldZ; z <= endWorldZ; z += spacing) {
    // Relative position on screen
    const screenZ = z - offset;

    // Stable random seed based on absolute world position
    // We Wrap it by MAX_OFFSET to consistency with the loop
    const seed = z % MAX_OFFSET;

    // Important: Handle negative modulo correctly if z is negative
    const normalizedSeed = ((seed % MAX_OFFSET) + MAX_OFFSET) % MAX_OFFSET;

    const rotationLeft = pseudoRandom(normalizedSeed) * Math.PI * 2;
    const rotationRight = pseudoRandom(normalizedSeed + 999) * Math.PI * 2;

    palms.push(
      <React.Fragment key={z}>
        <VoxelPalm
          position={[-2.7, 0, screenZ]}
          scale={0.5}
          rotation={[0, rotationLeft, 0]}
        />
        <VoxelPalm
          position={[2.7, 0, screenZ]}
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
  scored?: boolean;
  variant?: "high" | "low";
};

// Affichage d'un obstacle sur la route
function ObstacleOnRoad({ obstacle }: { obstacle: Obstacle }) {
  if (obstacle.type === "palmier") {
    const rotationY = pseudoRandom(parseInt(obstacle.id, 10)) * Math.PI * 2;
    return (
      <VoxelPalm
        position={[obstacle.x, 0, obstacle.z]}
        scale={0.5}
        rotation={[0, rotationY, 0]}
      />
    );
  }
  if (obstacle.type === "bird") {
    const yPos = obstacle.variant === "low" ? 0.6 : 2.0;
    return (
      <VoxelBird
        position={[obstacle.x, yPos, obstacle.z]}
        scale={3}
        rotation={[0, 0, 0]}
      />
    );
  }
  if (obstacle.type === "frog") {
    return (
      <VoxelFrog
        position={[obstacle.x, 0, obstacle.z]}
        scale={3}
        rotation={[0, 0, 0]}
      />
    );
  }
  if (obstacle.type === "crab") {
    return (
      <VoxelCrab
        position={[obstacle.x, 0, obstacle.z]}
        scale={3}
        rotation={[0, 0, 0]}
      />
    );
  }

  return (
    <VoxelChest
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
  const [speed, setSpeed] = useState(0);
  const [runnerX, setRunnerX] = useState(0);
  const [runnerZ, setrunnerZ] = useState(0);
  // --- Physics State ---
  const [runnerY, setRunnerY] = useState(0);
  const [velocityY, setVelocityY] = useState(0);
  const [isDucking, setIsDucking] = useState(false);

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [corridorOffset, setCorridorOffset] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [maxObsatcles, setMaxObstacles] = useState(0);
  const [minObstacleSpacing, setMinObstacleSpacing] = useState(0);

  // --- Dynamic Camera State ---
  const [viewMode, setViewMode] = useState<"BEHIND" | "SIDE">("SIDE"); // Start in SIDE Mode
  const lastSwitchRef = React.useRef(0);
  const nextSwitchTimeRef = React.useRef(30 + Math.random() * 30); // Longer phases
  const baseSpeedRef = React.useRef(1);

  // Reset complet quand resetSignal change
  React.useEffect(() => {
    setRunnerX(0);
    setrunnerZ(0);
    setRunnerY(0);
    setVelocityY(0);
    setIsDucking(false);
    setObstacles([]);
    setScore(0);
    setCorridorOffset(0);
    setGameOver(false);
    setMaxObstacles(5);
    setMinObstacleSpacing(10);
    setSpeed(1);
    setViewMode("SIDE");
    lastSwitchRef.current = 0;
    nextSwitchTimeRef.current = 30 + Math.random() * 30;
    baseSpeedRef.current = 1;
  }, [resetSignal]);

  // Contrôles clavier
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!running || gameOver) return;
      if (viewMode === "BEHIND") {
        // --- Mode 3è personne (classique) ---
        if (e.code === "ArrowLeft" && runnerX > -1.5) setRunnerX((x) => x - 1);
        if (e.code === "ArrowRight" && runnerX < 1.5) setRunnerX((x) => x + 1);
        if (e.code === "ArrowUp" && runnerZ > -4) {
          setrunnerZ((z) => z - 1);
          setSpeed(speed * 2);
        }
        if (e.code === "ArrowDown" && runnerZ < 4) {
          setrunnerZ((z) => z + 1);
          setSpeed(speed / 2);
        }
      } else {
        // --- Mode Side Scroller (Left to Right) ---
        // Side Cam is at +X, looking at 0.
        // Screen Left is +Z, Screen Right is -Z.
        // Screen Top is -X (Left Lane), Screen Bottom is +X (Right Lane).

        // Up/Down changes Lane -> Now Jump/Duck
        if (e.code === "ArrowUp" || e.code === "Space") {
          if (runnerY <= 0.01) {
            setVelocityY(0.15); // JUMP
            setIsDucking(false);
          }
        }
        if (e.code === "ArrowDown") {
          setIsDucking(true);
        }

        // NO Speed/Z control in side mode by user
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown") setIsDucking(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [runnerX, runnerZ, running, gameOver, viewMode, runnerY, speed]);
  //mobile
  React.useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    function handleTouchStart(e: TouchEvent) {
      if (e.cancelable) e.preventDefault(); // ← bloque pull-to-refresh

      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }

    function handleTouchEnd(e: TouchEvent) {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipeGesture();
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.cancelable) e.preventDefault(); // ← bloque scroll vertical
    }

    function handleSwipeGesture() {
      if (!running || gameOver) return;

      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      if (viewMode === "BEHIND") {
        if (Math.abs(dx) > Math.abs(dy)) {
          // Swipe horizontal -> Lane
          if (dx > 30 && runnerX < 1.5) setRunnerX((x) => x + 1);
          else if (dx < -30 && runnerX > -1.5) setRunnerX((x) => x - 1);
        } else {
          // Swipe vertical -> Speed/Z
          if (dy > 30 && runnerZ < 4) {
            setrunnerZ((z) => z + 1);
            setSpeed(speed / 2);
          } else if (dy < -30 && runnerZ > -4) {
            setrunnerZ((z) => z - 1);
            setSpeed(speed * 2);
          }
        }
      } else {
        // SIDE MODE
        // Swipe Vertical -> Jump / Duck
        // Swipe Up (dy < 0) -> Jump
        if (dy < -30 && runnerY <= 0.01) {
          setVelocityY(0.15);
          setIsDucking(false);
        } else if (dy > 30) {
          // Swipe Down -> Duck
          setIsDucking(true);
          setTimeout(() => setIsDucking(false), 800);
        }
        // No Horizontal Swipe
      }
    }

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [runnerX, runnerZ, running, gameOver, viewMode, runnerY, speed]);
  // Logique du jeu
  useFrame((state) => {
    if (!running || gameOver) return;

    // --- Dynamic Camera ---
    const now = state.clock.elapsedTime;

    // Switch if time reached
    if (now > nextSwitchTimeRef.current) {
      const nextMode = viewMode === "BEHIND" ? "SIDE" : "BEHIND";

      // If entering SIDE mode, RESET SPEED to base difficulty
      if (nextMode === "SIDE") {
        setSpeed(baseSpeedRef.current);
      }

      // If entering BEHIND mode, reset Z pos
      if (nextMode === "BEHIND") {
        setrunnerZ(0);
      }

      // SAFE TRANSITION: Clear obstacles
      setObstacles([]);

      setViewMode(nextMode);
      lastSwitchRef.current = now;
      nextSwitchTimeRef.current = now + 30 + Math.random() * 30; // Next switch
    }

    // Lerp Camera
    const targetPos =
      viewMode === "BEHIND" ? new Vector3(0, 3, 6) : new Vector3(10, 4, 0); // Side view (+X looking at origin)

    // Physics & Logic
    setRunnerY((y) => {
      let nextY = y + velocityY;
      if (nextY <= 0) {
        nextY = 0;
        if (velocityY < 0) setVelocityY(0);
      } else {
        setVelocityY((v) => v - 0.008); // Gravity
      }
      return nextY;
    });

    // Auto-center X and fix Z in Side Mode
    if (viewMode === "SIDE") {
      const targetX = 0;
      const targetZ = 6; // Left side of screen

      if (Math.abs(runnerX - targetX) > 0.1) {
        setRunnerX((x) => x + (targetX - x) * 0.1);
      }
      if (Math.abs(runnerZ - targetZ) > 0.1) {
        setrunnerZ((z) => z + (targetZ - z) * 0.1);
      }
    }

    state.camera.position.lerp(targetPos, 0.02);
    state.camera.lookAt(0, 1, 0);

    // Décor : offset augmente (le monde recule, le joueur avance)
    setCorridorOffset((offset) => offset - 0.18 * speed);

    // Obstacles : leur z augmente (ils viennent vers le joueur)
    // setObstacles((obs) =>
    //   obs.map((o) => ({ ...o, z: o.z + 0.18 })).filter((o) => o.z < 10)
    // );
    setObstacles((obs) =>
      obs
        .map((o) => {
          // In Side Mode, EVERYTHING must move at same speed to preserve spacing logic
          // In Behind Mode, birds can fly faster (2x)
          const speedMult = viewMode === "SIDE" ? 1 : o.type === "bird" ? 2 : 1;
          const newZ = o.z + 0.18 * speed * speedMult;

          // Mouvement latéral si c'est un crab
          const newX =
            o.type === "crab"
              ? o.x + 0.05 * Math.sin(newZ * 0.3) // variation fluide
              : o.x;

          // Scoring: Jump over palm OR pass bird (Side Mode only)
          let isScored = o.scored;
          if (
            viewMode === "SIDE" &&
            (o.type === "palmier" || o.type === "bird") &&
            !isScored &&
            newZ > runnerZ + 1
          ) {
            isScored = true;
            setScore((s) => {
              const ns = s + 20; // Reduced points (balanced with chest)
              onScore(ns);
              return ns;
            });
            // Small speed increase for successful dodge
            setSpeed((prev) => prev + 0.005);
            baseSpeedRef.current += 0.005;
          }

          return {
            ...o,
            z: newZ,
            x: newX,
            scored: isScored,
          };
        })
        .filter((o) => o.z < 10)
    );

    // Apparition régulière : on ajoute un obstacle si le dernier est assez loin du joueur
    setObstacles((obs) => {
      // PREVENT UNFAIR SPAWNS
      const timeUntilSwitch =
        nextSwitchTimeRef.current - state.clock.elapsedTime;
      const timeSinceSwitch = state.clock.elapsedTime - lastSwitchRef.current; // Approx

      // Don't spawn if switching soon (3s) or just switched (2s)
      if (timeUntilSwitch < 3 || timeSinceSwitch < 2) {
        return obs;
      }

      const effectiveSpacing =
        viewMode === "SIDE" ? minObstacleSpacing * 2 : minObstacleSpacing;

      if (
        obs.length === 0 ||
        obs[obs.length - 1].z > -SPAWN_DISTANCE + effectiveSpacing
      ) {
        if (obs.length < maxObsatcles) {
          const lane =
            viewMode === "SIDE"
              ? 0
              : [-2, -1, 0, 1, 2][Math.floor(Math.random() * 5)];

          const type: "palmier" | "chest" | "bird" | "frog" | "crab" = (() => {
            if (viewMode === "SIDE") {
              // Mix of Birds and Palms (balanced)
              return Math.random() < 0.4 ? "bird" : "palmier";
            }

            const rand = Math.random();
            if (rand < 0.7) return "palmier";
            if (rand < 0.9) return "chest";
            if (rand < 0.95) return "bird";
            if (rand < 0.98) return "crab";
            return "frog";
          })();

          // Add random gap for side mode to break regularity
          const randomOffset = viewMode === "SIDE" ? Math.random() * 20 : 0;

          const variant =
            type === "bird"
              ? Math.random() < 0.5
                ? "high"
                : "low"
              : undefined;

          return [
            ...obs,
            {
              id:
                Date.now().toString() +
                Math.random().toString(36).substring(2, 5),
              x: lane,
              z: -SPAWN_DISTANCE - randomOffset,
              type,
              variant,
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
          // Collision logic with Y (Jump/Duck)
          let collision = true;
          if (viewMode === "SIDE") {
            if (o.type === "bird") {
              if (o.variant === "low") {
                // LOW Bird (0.6): Hit if NOT jumping
                if (runnerY < 1.0) collision = true;
                else collision = false;
              } else {
                // HIGH Bird (2.0): Hit if Jumping HIGH
                if (runnerY > 0.8) collision = true;
                else collision = false;
              }
            } else {
              // Ground obstacle (Palm, etc)
              // If jumping (runnerY > 1), avoid it
              if (runnerY > 0.8) collision = false;
            }
          }

          if (collision) {
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
                const newScore = s + 10 * speed;
                onScore(newScore);
                return newScore;
              });
              // Chest speed boost
              setSpeed((prev) => prev + 0.02);
              baseSpeedRef.current += 0.02;
              setMaxObstacles((prev) => Math.min(prev + 0.2, 100)); // Augmente le max obstacles
              setMinObstacleSpacing((prev) => Math.max(prev - 0.1, 3)); // Réduit l'espacement min
              updated = updated.filter((p) => p !== o);
            }
          }
        }
      });
      return updated;
    });
    // Pas d'incrémentation automatique du score

    if (corridorOffset < -MAX_OFFSET) {
      setSpeed((prev) => prev + 0.05);
      baseSpeedRef.current += 0.05; // Increase base difficulty (reduced from 0.1)
      setMaxObstacles((prev) => Math.min(prev + 1, 100)); // Augmente le max obstacles
      setMinObstacleSpacing((prev) => Math.max(prev - 0.2, 3));
      setCorridorOffset((prev) => prev + MAX_OFFSET); // on ramène à 0

      setScore((s) => {
        const newScore = s + 100;
        onScore(newScore);
        return newScore;
      });
    }
  });

  const activeBirdLanes = React.useMemo(() => {
    const lanes = obstacles.filter((o) => o.type === "bird").map((o) => o.x);
    return Array.from(new Set(lanes));
  }, [obstacles]);

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
      <TempleCorridor
        offset={corridorOffset}
        activeBirdLanes={activeBirdLanes}
      />

      <SidePalms offset={corridorOffset} />

      <VoxelRocketDino
        position={[runnerX, runnerY, runnerZ]}
        scale={0.5}
        // Jump: Tilt UP when rising (+val), FLAT when falling (max(val, 0))
        rotation={[isDucking ? Math.PI / 4 : Math.max(velocityY * 5, 0), 0, 0]}
        key="runner-rocket"
      />

      {/* <VoxelBod
        position={[runnerX + 1, 1, runnerZ - 2]}
        scale={0.5}
        rotation={[0, 1, 0]}
        key="runner-rocket"
      />

      <VoxelSausage
        position={[runnerX - 1, 1, runnerZ - 2]}
        scale={0.3}
        rotation={[0, 3, 0]}
        key="runner-sausage"
      /> */}

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
          <kbd className="bg-gray-800 px-2 py-1 rounded">↑</kbd>
          <kbd className="bg-gray-800 px-2 py-1 rounded">↓</kbd>
          Controls
        </div>
      </div>
    </div>
  );
}
