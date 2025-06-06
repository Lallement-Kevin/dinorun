import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { clone } from "three/examples/jsm/utils/SkeletonUtils";
import Bird from "./../assets/glb/Bird.glb?url";
import Chest from "./../assets/glb/Chest.glb?url";
import Crab from "./../assets/glb/Crab.glb?url";
import Frog from "./../assets/glb/Frog.glb?url";
import Palm from "./../assets/glb/Palm.glb?url";
import RocketDino from "./../assets/glb/RocketDino.glb?url";

export function VoxelBird({
  position,
  scale = 1,
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF(Bird);
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
export function VoxelChest({
  position,
  scale = 1,
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF(Chest);
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
export function VoxelCrab({
  position,
  scale = 1,
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF(Crab);
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
export function VoxelFrog({
  position,
  scale = 1,
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF(Frog);
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
export function VoxelPalm({
  position,
  scale = 1,
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF(Palm);
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
export function VoxelRocketDino({
  position,
  scale = 1,
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF(RocketDino);
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
