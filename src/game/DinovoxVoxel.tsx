import React from "react"

// Helper for a colored cube
function Cube({ position, size, color }: { position: [number, number, number], size: [number, number, number], color: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

// Voxel Dinovox based on the provided image, rotated to face the corridor (seen from behind)
export default function DinovoxVoxel({ x = 0 }: { x?: number }) {
  // Colors
  const dark = "#444"
  const orange = "#e09b3d"
  const white = "#fff"
  const black = "#222"
  const lightGray = "#bbb"


  // Descendre le dino encore plus bas (y=0.05)
  return (
    <group position={[x, 0.05, 0]} rotation={[0, Math.PI, 0]}>
      {/* Body */}
      <Cube position={[0, 0.45, 0]} size={[0.6, 0.7, 0.3]} color={dark} />
      {/* Belly */}
      <Cube position={[0, 0.35, 0.16]} size={[0.6, 0.5, 0.08]} color={orange} />
      {/* Head */}
      <Cube position={[0, 0.85, 0.23]} size={[0.38, 0.32, 0.38]} color={dark} />
      {/* Jaw */}
      <Cube position={[0, 0.75, 0.38]} size={[0.38, 0.12, 0.14]} color={orange} />
      {/* Eye left */}
      <Cube position={[-0.09, 0.92, 0.41]} size={[0.04, 0.04, 0.04]} color={white} />
      <Cube position={[-0.09, 0.92, 0.43]} size={[0.02, 0.02, 0.02]} color={black} />
      {/* Eye right */}
      <Cube position={[0.09, 0.92, 0.41]} size={[0.04, 0.04, 0.04]} color={white} />
      <Cube position={[0.09, 0.92, 0.43]} size={[0.02, 0.02, 0.02]} color={black} />
      {/* Nostrils */}
      <Cube position={[-0.06, 0.85, 0.42]} size={[0.01, 0.01, 0.01]} color={black} />
      <Cube position={[0.06, 0.85, 0.42]} size={[0.01, 0.01, 0.01]} color={black} />
      {/* Crest (top) */}
      <Cube position={[0, 1.03, 0.23]} size={[0.04, 0.04, 0.12]} color={lightGray} />
      <Cube position={[0, 1.07, 0.18]} size={[0.04, 0.04, 0.08]} color={lightGray} />
      <Cube position={[0, 1.11, 0.13]} size={[0.04, 0.04, 0.06]} color={lightGray} />
      {/* Arms */}
      <Cube position={[-0.19, 0.45, 0.18]} size={[0.08, 0.18, 0.08]} color={dark} />
      <Cube position={[0.19, 0.45, 0.18]} size={[0.08, 0.18, 0.08]} color={dark} />
      {/* Legs */}
      <Cube position={[-0.13, 0.08, 0.08]} size={[0.12, 0.22, 0.12]} color={orange} />
      <Cube position={[0.13, 0.08, 0.08]} size={[0.12, 0.22, 0.12]} color={orange} />
      {/* Feet */}
      <Cube position={[-0.13, -0.05, 0.13]} size={[0.12, 0.06, 0.16]} color={orange} />
      <Cube position={[0.13, -0.05, 0.13]} size={[0.12, 0.06, 0.16]} color={orange} />
      {/* Tail (stacked cubes) */}
      <Cube position={[0, 0.45, -0.23]} size={[0.18, 0.18, 0.18]} color={dark} />
      <Cube position={[0, 0.38, -0.36]} size={[0.14, 0.14, 0.14]} color={dark} />
      <Cube position={[0, 0.32, -0.46]} size={[0.1, 0.1, 0.1]} color={dark} />
      <Cube position={[0, 0.28, -0.54]} size={[0.07, 0.07, 0.07]} color={dark} />
      {/* Side "scales" */}
      <Cube position={[-0.3, 0.45, -0.05]} size={[0.06, 0.12, 0.06]} color={dark} />
      <Cube position={[0.3, 0.45, -0.05]} size={[0.06, 0.12, 0.06]} color={dark} />
    </group>
  )
}
