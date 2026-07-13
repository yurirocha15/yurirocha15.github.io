import type { PortfolioContent } from "./content";
import { PALLETIZER_RUNTIME } from "./scenes/palletizer/config";
import { createPalletizerScene } from "./scenes/palletizer/createPalletizerScene";
import { useThreeScene } from "./scenes/shared/useThreeScene";
import { StaticSceneFallback } from "./visuals/staticVisuals";

type PalletizerSceneProps = {
  labels: PortfolioContent["visuals"];
};

export default function PalletizerScene({ labels }: PalletizerSceneProps) {
  const { mountRef, unavailable } = useThreeScene(createPalletizerScene, PALLETIZER_RUNTIME);
  return (
    <div className="palletizer-scene" ref={mountRef} aria-hidden="true">
      {unavailable ? <StaticSceneFallback labels={labels.sceneFallback} variant="palletizer" /> : null}
    </div>
  );
}
