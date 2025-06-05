import React from "react"

// Palmier stylisé en voxels (tronc = cylindre, feuilles = cubes verts)
export default function PalmierVoxel({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Tronc */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 1.4, 8]} />
        <meshStandardMaterial color="#b97a56" />
      </mesh>
      {/* Feuilles (5 cubes verts, disposés en étoile) */}
      <mesh position={[0, 1.45, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.7, 0.12, 0.18]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      <mesh position={[0, 1.45, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.7, 0.12, 0.18]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      <mesh position={[0, 1.45, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.6, 0.1, 0.16]} />
        <meshStandardMaterial color="#4ade80" />
      </mesh>
      <mesh position={[0, 1.45, 0]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[0.6, 0.1, 0.16]} />
        <meshStandardMaterial color="#22d3ee" />
      </mesh>
      <mesh position={[0, 1.55, 0]} rotation={[Math.PI / 2.5, 0, 0]}>
        <boxGeometry args={[0.4, 0.08, 0.12]} />
        <meshStandardMaterial color="#bef264" />
      </mesh>
      {/* Noix de coco */}
      <mesh position={[0.13, 1.32, 0.08]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#a16207" />
      </mesh>
      <mesh position={[-0.13, 1.32, -0.08]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#a16207" />
      </mesh>
    </group>
  )
}
