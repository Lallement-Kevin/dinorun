// Sable central avec léger dégradé
export function Sand({ z }: { z: number }) {
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
  );
}
