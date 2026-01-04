// Sable central avec 5 voies distinctes
export function Sand({
  z,
  activeBirdLanes = [],
}: {
  z: number;
  activeBirdLanes?: number[];
}) {
  const lanes = [-2, -1, 0, 1, 2];
  return (
    <>
      {lanes.map((laneX, i) => {
        const isWarning = activeBirdLanes.includes(laneX);
        const baseColor = i % 2 === 0 ? "#f4e2b6" : "#e0cea3";
        return (
          <mesh key={laneX} receiveShadow position={[laneX, 0, z]}>
            <boxGeometry args={[1, 0.2, 50]} />
            <meshStandardMaterial color={isWarning ? "#89CFF0" : baseColor} />
          </mesh>
        );
      })}
    </>
  );
}
