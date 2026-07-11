import type { FrankaPose } from "../shared/motion";
import type { SceneRuntimeOptions } from "../shared/runtime";

export const PALLETIZER_POSES = {
  home: [-0.34, -0.72, 0.32, -2.22, 0.12, 2.18, 0.66],
  pick: [-0.9, -0.52, 0.5, -2.42, -0.18, 2.42, 0.18],
  carry: [-0.68, -0.82, 0.64, -2.32, 0.24, 2.34, 0.58],
  place: [-0.28, -0.76, 0.82, -2.28, 0.48, 2.2, 0.9],
} satisfies Record<"home" | "pick" | "carry" | "place", FrankaPose>;

export const PALLETIZER_RUNTIME = {
  camera: { fov: 32, near: 0.1, far: 100, position: [1.56, 1.12, 1.72] },
  reducedMotionTime: 1.4,
  visibility: { threshold: 0.08 },
} satisfies SceneRuntimeOptions;
