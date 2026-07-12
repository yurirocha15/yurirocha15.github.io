import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { URDFRobot } from "urdf-loader";
import { makeSpotWeldGun } from "../../RobotTools";
import { getAssetUrl, getFrankaUrdfUrl } from "../shared/assets";
import { createFrankaLoader, hideFrankaHand, styleFrankaRobot } from "../shared/franka";
import { applyFrankaPose, type FrankaPose } from "../shared/motion";
import { disposeObjectTree, getLocalPosition, makeBox, setObjectOpacity } from "../shared/objects";
import type { FrameState, SceneContext, SceneController } from "../shared/runtime";
import { getWeldingAnimationState } from "./animation";
import { RETRACT_POSES, ROBOT_PLACEMENTS, STATION_OFFSETS, WELD_POSES } from "./config";

type Materials = ReturnType<typeof createMaterials>;

type FrankaRig = {
  robot: URDFRobot;
  station: THREE.Group;
  toolTip: THREE.Object3D;
  sparkGroup: THREE.Group;
  weldGlow: THREE.Mesh;
  weldPose: FrankaPose;
  retractPose: FrankaPose;
  stationIndex: number;
  phase: number;
};

type SmartFrameState = {
  context: SceneContext;
  materials: Materials;
  stations: THREE.Group[];
  rigs: FrankaRig[];
};

function createMaterials() {
  return {
    floor: new THREE.MeshStandardMaterial({ color: 0xe7e5da, roughness: 0.9 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x34464a, metalness: 0.3, roughness: 0.44 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x151713, metalness: 0.18, roughness: 0.58 }),
    shell: new THREE.MeshStandardMaterial({ color: 0xd5d6cc, metalness: 0.26, roughness: 0.48 }),
    car: new THREE.MeshStandardMaterial({
      color: 0xc8cec5, metalness: 0.54, roughness: 0.34, transparent: true, opacity: 0.9,
    }),
    weld: new THREE.MeshStandardMaterial({
      color: 0xf6b932, emissive: 0xf6a800, emissiveIntensity: 2.3,
      transparent: true, opacity: 0.9,
    }),
    toolMid: new THREE.MeshStandardMaterial({
      color: 0x737a76, metalness: 0.42, opacity: 0.6, roughness: 0.4, transparent: true,
    }),
    toolLight: new THREE.MeshStandardMaterial({
      color: 0xbfc3bf, metalness: 0.56, opacity: 0.6, roughness: 0.32, transparent: true,
    }),
    toolDark: new THREE.MeshStandardMaterial({
      color: 0x444a47, metalness: 0.3, opacity: 0.6, roughness: 0.5, transparent: true,
    }),
  };
}

function addLighting(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xf5f0df, 0x34464a, 1.3));
  const keyLight = new THREE.DirectionalLight(0xffffff, 4);
  keyLight.position.set(4, 5, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.0002;
  keyLight.shadow.normalBias = 0.025;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xd9e2dc, 1.6);
  fillLight.position.set(-3, 2.5, -2);
  scene.add(fillLight);
}

function buildProductionLine(scene: THREE.Scene, materials: Materials) {
  const line = new THREE.Group();
  scene.add(line);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 7), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  line.add(floor);
  const grid = new THREE.GridHelper(7, 14, 0x8f9484, 0xd0d0c5);
  grid.position.y = 0.002;
  line.add(grid);
  line.add(
    makeBox([0.035, 0.035, 5.8], materials.steel, [-0.84, 0.03, -1.28]),
    makeBox([0.035, 0.035, 5.8], materials.steel, [0.84, 0.03, -1.28]),
  );

  const stationsRoot = new THREE.Group();
  line.add(stationsRoot);
  return STATION_OFFSETS.map((z) => {
    const station = new THREE.Group();
    station.position.set(0, 0, z);
    stationsRoot.add(station);
    const fixture = new THREE.Group();
    fixture.add(
      makeBox([1.2, 0.045, 0.045], materials.steel.clone(), [0, 0.07, -0.38]),
      makeBox([1.2, 0.045, 0.045], materials.steel.clone(), [0, 0.07, 0.38]),
      makeBox([0.055, 0.05, 0.82], materials.dark.clone(), [-0.5, 0.065, 0]),
      makeBox([0.055, 0.05, 0.82], materials.dark.clone(), [0.5, 0.065, 0]),
    );
    station.add(fixture);
    return station;
  });
}

function loadCarFrames(state: SmartFrameState) {
  const { context, materials, stations } = state;
  new OBJLoader().load(
    getAssetUrl("models/smart-frame/simplify_Frame.obj", context.baseUrl),
    (object) => {
      if (context.isDisposed()) {
        disposeObjectTree(object);
        return;
      }
      object.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.material = materials.car;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.geometry.computeVertexNormals();
      });

      const box = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      object.position.copy(center).multiplyScalar(-1);
      const centeredCar = new THREE.Group();
      centeredCar.add(object);
      centeredCar.rotation.x = -Math.PI / 2;
      centeredCar.position.y = 0.54;
      centeredCar.scale.setScalar(1.48 / Math.max(size.x, size.y, size.z));

      stations.forEach((station, index) => {
        const clone = index === 0 ? centeredCar : centeredCar.clone(true);
        clone.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.material = materials.car.clone();
          mesh.material.opacity = index === 0 ? 0.86 : Math.max(0.34, 0.56 - index * 0.1);
        });
        station.add(clone);
      });
      context.canvas.dataset.modelReady = "true";
      context.requestRender();
    },
    undefined,
    (error) => console.warn("Unable to load smart-frame model", error),
  );
}

function makeSparkGroup(material: THREE.MeshStandardMaterial, count: number) {
  const sparkGroup = new THREE.Group();
  for (let index = 0; index < count; index += 1) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.012 + (index % 3) * 0.0025, 7, 7),
      material.clone(),
    );
    spark.userData.seed = index * 0.73;
    spark.visible = false;
    sparkGroup.add(spark);
  }
  return sparkGroup;
}

function attachRobot(
  state: SmartFrameState,
  robot: URDFRobot,
  stationIndex: number,
  placementIndex: number,
) {
  const { context, materials, stations } = state;
  if (context.isDisposed()) {
    disposeObjectTree(robot);
    return;
  }
  styleFrankaRobot(robot, materials, true);
  if (stationIndex > 0) setObjectOpacity(robot, Math.max(0.46, 0.68 - stationIndex * 0.1));
  hideFrankaHand(robot);
  const placement = ROBOT_PLACEMENTS[placementIndex];
  const holder = new THREE.Group();
  holder.position.copy(placement.position);
  holder.rotation.y = placement.rotation;
  holder.scale.setScalar(0.78);
  holder.add(robot);
  const station = stations[stationIndex];
  station.add(holder);

  const tool = makeSpotWeldGun({
    accent: materials.toolLight, body: materials.toolMid, copper: materials.toolLight,
    dark: materials.toolDark, metal: materials.toolLight,
  });
  tool.rotation.set(Math.PI, 0.34, 0);
  tool.position.set(0, 0, 0.015);
  tool.scale.setScalar(1.35);
  robot.getFrame("link8").add(tool);
  const weldPose = WELD_POSES[placementIndex % WELD_POSES.length];
  const retractPose = RETRACT_POSES[placementIndex % RETRACT_POSES.length];
  applyFrankaPose(robot, weldPose);

  const weldGlow = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), materials.weld.clone());
  weldGlow.visible = false;
  station.add(weldGlow);
  const sparkGroup = makeSparkGroup(materials.weld, stationIndex === 0 ? 18 : 10);
  station.add(sparkGroup);
  state.rigs.push({
    robot, station, toolTip: tool.getObjectByName("weld-tip") ?? tool,
    sparkGroup, weldGlow, weldPose, retractPose, stationIndex,
    phase: placement.phase + stationIndex * 0.08,
  });
  context.canvas.dataset.robotCount = state.rigs.length.toString();
  context.requestRender();
}

function loadRobots(state: SmartFrameState) {
  const loader = createFrankaLoader(state.context.baseUrl);
  const robotUrl = getFrankaUrdfUrl(state.context.baseUrl);
  state.stations.forEach((_station, stationIndex) => {
    ROBOT_PLACEMENTS.forEach((_placement, placementIndex) => {
      loader.load(
        robotUrl,
        (robot) => attachRobot(state, robot, stationIndex, placementIndex),
        undefined,
        (error) => console.warn("Unable to load welding-line robot", error),
      );
    });
  });
}

function updateSparks(rig: FrankaRig, elapsed: number, active: number) {
  rig.sparkGroup.children.forEach((child, sparkIndex) => {
    const spark = child as THREE.Mesh;
    const seed = spark.userData.seed as number;
    const local = (elapsed * 10.5 + seed) % 1;
    const depthScale = rig.stationIndex === 0 ? 1 : Math.max(0.55, 0.8 - rig.stationIndex * 0.12);
    const scale = active * (1 - local) * depthScale;
    spark.visible = scale > 0.04;
    spark.scale.setScalar(0.5 + scale * 2.4);
    spark.position.set(
      Math.cos(seed * 4.1) * local * 0.2,
      Math.abs(Math.sin(seed * 5.6)) * local * 0.23 - local * local * 0.08,
      Math.sin(seed * 2.7 + sparkIndex) * local * 0.18,
    );
    const material = spark.material as THREE.MeshStandardMaterial;
    material.opacity = active * (1 - local);
    material.transparent = true;
  });
}

function updateSmartFrame(state: SmartFrameState, frame: FrameState) {
  const activeWelds = state.rigs.map((rig) => {
    const animation = getWeldingAnimationState(
      frame.elapsed, rig.phase, rig.retractPose, rig.weldPose,
    );
    applyFrankaPose(rig.robot, animation.pose);
    return animation.active ? 1 : 0;
  });
  state.context.scene.updateMatrixWorld(true);
  state.rigs.forEach((rig, index) => {
    const active = activeWelds[index];
    const tipPosition = getLocalPosition(rig.station, rig.toolTip);
    rig.weldGlow.position.copy(tipPosition);
    rig.sparkGroup.position.copy(tipPosition);
    rig.weldGlow.visible = active > 0;
    const material = rig.weldGlow.material as THREE.MeshStandardMaterial;
    material.opacity = active * (0.78 + Math.sin(frame.elapsed * 46 + rig.phase * 8) * 0.2);
    material.emissiveIntensity = active * 3.2;
    rig.weldGlow.scale.setScalar(0.75 + active * (0.4 + Math.sin(frame.elapsed * 38) * 0.12));
    updateSparks(rig, frame.elapsed, active);
  });
  state.context.camera.lookAt(-0.08, 0.43, -1.2);
}

export function createSmartFrameScene(context: SceneContext): SceneController {
  context.canvas.dataset.scene = "smart-frame-welding-line";
  addLighting(context.scene);
  const materials = createMaterials();
  const state: SmartFrameState = {
    context,
    materials,
    stations: buildProductionLine(context.scene, materials),
    rigs: [],
  };
  loadCarFrames(state);
  loadRobots(state);
  return { update: (frame) => updateSmartFrame(state, frame) };
}
