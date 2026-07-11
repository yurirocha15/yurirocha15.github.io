import { HERO_RUNTIME } from "./scenes/hero/config";
import { createHeroScene } from "./scenes/hero/createHeroScene";
import { useThreeScene } from "./scenes/shared/useThreeScene";

export default function HeroRobotScene() {
  const mountRef = useThreeScene(createHeroScene, HERO_RUNTIME);
  return (
    <div className="robot-scene-panel">
      <div className="robot-scene-canvas" ref={mountRef} aria-hidden="true" />
    </div>
  );
}
