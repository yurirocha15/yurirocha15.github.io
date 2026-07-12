import { useEffect, useRef, useState } from "react";
import { mountSceneRuntime, type SceneBuilder, type SceneRuntimeOptions } from "./runtime";

export function useThreeScene(buildScene: SceneBuilder, options: SceneRuntimeOptions) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    mount.removeAttribute("data-scene-unavailable");
    try {
      const dispose = mountSceneRuntime(mount, buildScene, options);
      return () => {
        dispose();
        mount.removeAttribute("data-scene-unavailable");
      };
    } catch (error) {
      mount.dataset.sceneUnavailable = "true";
      const fallbackTimer = window.setTimeout(() => setUnavailable(true), 0);
      console.warn("3D scene unavailable; using the static fallback.", error);
      return () => {
        window.clearTimeout(fallbackTimer);
        mount.removeAttribute("data-scene-unavailable");
      };
    }
  }, [buildScene, options]);

  return { mountRef, unavailable };
}
