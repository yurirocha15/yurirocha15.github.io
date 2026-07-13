import type { PortfolioContent } from "./content";
import { HERO_RUNTIME } from "./scenes/hero/config";
import { createHeroScene } from "./scenes/hero/createHeroScene";
import { useThreeScene } from "./scenes/shared/useThreeScene";
import { StaticSceneFallback } from "./visuals/staticVisuals";

type HeroRobotSceneProps = {
  labels: PortfolioContent["visuals"];
};

export default function HeroRobotScene({ labels }: HeroRobotSceneProps) {
  const { mountRef, unavailable } = useThreeScene(createHeroScene, HERO_RUNTIME);
  return (
    <div className="robot-scene-panel">
      <div className="robot-scene-canvas" ref={mountRef} aria-hidden="true">
        {unavailable ? <StaticSceneFallback labels={labels.sceneFallback} variant="hero" /> : null}
      </div>
    </div>
  );
}
