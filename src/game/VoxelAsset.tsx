import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { clone } from "three/examples/jsm/utils/SkeletonUtils";

export function VoxelAsset({
  path,
  position,
  scale = 1,
  rotation = [0, 0, 0],
}: {
  path: string;
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF(path);

  // Clone the object once per instance
  const clonedScene = useMemo(() => clone(scene), [scene]);

  return (
    <primitive
      object={clonedScene}
      position={position}
      scale={scale}
      rotation={rotation}
    />
  );
}
