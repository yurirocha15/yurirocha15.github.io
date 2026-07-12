import { PALLETIZER_RUNTIME } from "./scenes/palletizer/config";
import { createPalletizerScene } from "./scenes/palletizer/createPalletizerScene";
import { useThreeScene } from "./scenes/shared/useThreeScene";
import { StaticSceneFallback } from "./visuals/staticVisuals";

export default function PalletizerScene() {
  const { mountRef, unavailable } = useThreeScene(createPalletizerScene, PALLETIZER_RUNTIME);
  return (
    <div className="palletizer-scene" ref={mountRef} aria-hidden="true">
      {unavailable ? <StaticSceneFallback variant="palletizer" /> : null}
    </div>
  );
}
