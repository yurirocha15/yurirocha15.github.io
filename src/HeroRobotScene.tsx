import { HERO_RUNTIME } from "./scenes/hero/config";
import { createHeroScene } from "./scenes/hero/createHeroScene";
import { useThreeScene } from "./scenes/shared/useThreeScene";
import { StaticSceneFallback } from "./visuals/staticVisuals";

export default function HeroRobotScene() {
  const { mountRef, unavailable } = useThreeScene(createHeroScene, HERO_RUNTIME);
  return (
    <div className="robot-scene-panel">
      <div className="robot-scene-canvas" ref={mountRef} aria-hidden="true">
        {unavailable ? <StaticSceneFallback variant="hero" /> : null}
      </div>
    </div>
  );
}
