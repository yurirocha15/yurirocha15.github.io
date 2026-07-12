import { SMART_FRAME_RUNTIME } from "./scenes/smartFrame/config";
import { createSmartFrameScene } from "./scenes/smartFrame/createSmartFrameScene";
import { useThreeScene } from "./scenes/shared/useThreeScene";
import { StaticSceneFallback } from "./visuals/staticVisuals";

export default function SmartFrameScene() {
  const { mountRef, unavailable } = useThreeScene(createSmartFrameScene, SMART_FRAME_RUNTIME);
  return (
    <div className="smart-frame-scene" ref={mountRef} aria-hidden="true">
      {unavailable ? <StaticSceneFallback variant="smart-frame" /> : null}
    </div>
  );
}
