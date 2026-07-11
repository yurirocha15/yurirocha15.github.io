import { useEffect, useRef } from "react";
import { mountSceneRuntime, type SceneBuilder, type SceneRuntimeOptions } from "./runtime";

export function useThreeScene(buildScene: SceneBuilder, options: SceneRuntimeOptions) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    return mountSceneRuntime(mount, buildScene, options);
  }, [buildScene, options]);

  return mountRef;
}
