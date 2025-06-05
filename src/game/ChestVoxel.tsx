import React from "react"

// Helper for a colored cube
function Cube({
  position,
  size,
  color,
}: {
  position: [number, number, number]
  size: [number, number, number]
  color: string
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

// Voxel Chest based on the provided image
export default function ChestVoxel({
  x = 0,
  y = 0,
  z = 0,
}: {
  x?: number
  y?: number
  z?: number
}) {
  // Colors
  const brown = "#8a5a2b"
  const gray = "#666"
  const darkGray = "#222"

  return (
    <group position={[x, y, z]}>
      {/* Main chest body */}
      <Cube position={[0, 0.2, 0]} size={[0.7, 0.4, 0.4]} color={brown} />
      {/* Top lid */}
      <Cube position={[0, 0.45, 0]} size={[0.7, 0.1, 0.4]} color={brown} />
      {/* Vertical gray bands */}
      <Cube position={[-0.22, 0.25, 0]} size={[0.08, 0.5, 0.42]} color={gray} />
      <Cube position={[0, 0.25, 0]} size={[0.08, 0.5, 0.42]} color={gray} />
      <Cube position={[0.22, 0.25, 0]} size={[0.08, 0.5, 0.42]} color={gray} />
      {/* Horizontal gray band */}
      <Cube position={[0, 0.15, 0]} size={[0.72, 0.08, 0.44]} color={gray} />
      {/* Lock base */}
      <Cube position={[0, 0.05, 0.18]} size={[0.16, 0.16, 0.08]} color={gray} />
      {/* Lock keyhole */}
      <Cube position={[0, 0.05, 0.21]} size={[0.04, 0.04, 0.01]} color={darkGray} />
    </group>
  )
}
