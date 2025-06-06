// Génère des bords irréguliers pour la plage, de façon déterministe par segment
export function BeachEdge({
  side,
  z,
  seed,
}: {
  side: "left" | "right";
  z: number;
  seed: number;
}) {
  const edgeSegments = 8;
  function pseudoRandom(i: number) {
    return Math.abs(Math.sin(seed * 100 + i * 17.3)) % 1;
  }
  const edge: JSX.Element[] = [];
  for (let i = 0; i < edgeSegments; i++) {
    const segZ = z - 25 + (i * 50) / edgeSegments + 50 / edgeSegments / 2;
    const width = 0.3 + pseudoRandom(i) * 0.25;
    const height = 0.18 + pseudoRandom(i + 10) * 0.08;
    edge.push(
      <mesh
        key={i}
        position={[
          side === "left" ? -3.15 - width / 2 : 3.15 + width / 2,
          0.11,
          segZ,
        ]}
      >
        <boxGeometry args={[width, height, (50 / edgeSegments) * 0.95]} />
        <meshStandardMaterial color="#f4e2b6" />
      </mesh>
    );
  }
  return <>{edge}</>;
}
