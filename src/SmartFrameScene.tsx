import { SMART_FRAME_RUNTIME } from "./scenes/smartFrame/config";
import { createSmartFrameScene } from "./scenes/smartFrame/createSmartFrameScene";
import { useThreeScene } from "./scenes/shared/useThreeScene";

export default function SmartFrameScene() {
  const mountRef = useThreeScene(createSmartFrameScene, SMART_FRAME_RUNTIME);
  return <div className="smart-frame-scene" ref={mountRef} aria-hidden="true" />;
}
