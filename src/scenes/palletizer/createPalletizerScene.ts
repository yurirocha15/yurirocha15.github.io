import * as THREE from "three";
import type { URDFRobot } from "urdf-loader";
import { makeSuctionGripper } from "../../RobotTools";
import { getFrankaUrdfUrl } from "../shared/assets";
import { createFrankaLoader, hideFrankaHand, styleFrankaRobot } from "../shared/franka";
import { applyFrankaPose } from "../shared/motion";
import { disposeObjectTree, getLocalPosition, makeBox } from "../shared/objects";
import type { FrameState, SceneContext, SceneController } from "../shared/runtime";
import { getPalletizerAnimationState } from "./animation";
import { PALLETIZER_POSES } from "./config";

type Materials = ReturnType<typeof createMaterials>;

type PalletizerState = {
  context: SceneContext;
  cell: THREE.Group;
  materials: Materials;
  feedCrates: THREE.Mesh[];
  placedCrate: THREE.Mesh;
  carriedCrate: THREE.Mesh;
  conveyor: THREE.Group;
  pallet: THREE.Group;
  robotHolder: THREE.Group;
  suctionTool: THREE.Group;
  robot: URDFRobot | null;
  gripAnchor: THREE.Group | null;
  queuedCrateBaseX: number;
  previewPhase: number | null;
};

function createMaterials() {
  return {
    floor: new THREE.MeshStandardMaterial({ color: 0xe7e5da, roughness: 0.9 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x34464a, metalness: 0.28, roughness: 0.48 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x151713, metalness: 0.2, roughness: 0.58 }),
    shell: new THREE.MeshStandardMaterial({ color: 0xd5d6cc, metalness: 0.24, roughness: 0.48 }),
    crate: new THREE.MeshStandardMaterial({ color: 0xd39b2a, metalness: 0.03, roughness: 0.68 }),
    wood: new THREE.MeshStandardMaterial({ color: 0xa65e2e, metalness: 0.02, roughness: 0.72 }),
    toolLight: new THREE.MeshStandardMaterial({ color: 0xbfc3bf, metalness: 0.5, roughness: 0.36 }),
    toolMid: new THREE.MeshStandardMaterial({ color: 0x737a76, metalness: 0.38, roughness: 0.44 }),
    toolDark: new THREE.MeshStandardMaterial({ color: 0x444a47, metalness: 0.24, roughness: 0.54 }),
  };
}

function addLighting(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xf5f0df, 0x34464a, 1.35));
  const keyLight = new THREE.DirectionalLight(0xffffff, 4);
  keyLight.position.set(3.5, 5, 3.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.00025;
  keyLight.shadow.normalBias = 0.03;
  scene.add(keyLight);
}

function buildCell(cell: THREE.Group, materials: Materials) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 3.2), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  cell.add(floor);
  const grid = new THREE.GridHelper(4.8, 8, 0x8f9484, 0xd0d0c5);
  grid.position.y = 0.002;
  cell.add(grid);

  const conveyor = new THREE.Group();
  conveyor.position.set(-0.72, 0.12, 0.54);
  conveyor.add(makeBox([1.4, 0.1, 0.42], materials.steel, [0, 0.1, 0]));
  conveyor.add(makeBox([1.32, 0.035, 0.36], materials.dark, [0, 0.17, 0]));
  cell.add(conveyor);

  const feedCrates = [
    makeBox([0.16, 0.16, 0.16], materials.crate.clone(), [-0.9, 0.42, 0.54]),
    makeBox([0.16, 0.16, 0.16], materials.crate.clone(), [-0.48, 0.42, 0.54]),
  ];
  cell.add(...feedCrates);

  const pallet = new THREE.Group();
  pallet.position.set(0.7, 0.1, -0.54);
  [-0.22, 0, 0.22].forEach((z) => {
    pallet.add(makeBox([0.88, 0.055, 0.12], materials.wood.clone(), [0, 0.05, z]));
  });
  const stackPositions: Array<[number, number, number]> = [
    [-0.1, 0.16, -0.1], [0.1, 0.16, -0.1], [-0.1, 0.16, 0.1], [0.1, 0.16, 0.1],
  ];
  stackPositions.forEach((position) => {
    pallet.add(makeBox([0.16, 0.16, 0.16], materials.crate.clone(), position));
  });
  cell.add(pallet);

  return { conveyor, feedCrates, pallet };
}

function getPreviewPhase() {
  const requested = new URLSearchParams(window.location.search).get("palletPhase");
  const parsed = requested === null ? Number.NaN : Number(requested);
  return import.meta.env.DEV && Number.isFinite(parsed)
    ? THREE.MathUtils.clamp(parsed, 0, 0.999)
    : null;
}

function loadRobot(state: PalletizerState) {
  const { context, materials } = state;
  const loader = createFrankaLoader(context.baseUrl);
  loader.load(
    getFrankaUrdfUrl(context.baseUrl),
    (loadedRobot) => {
      if (context.isDisposed()) {
        disposeObjectTree(loadedRobot);
        return;
      }

      state.robot = loadedRobot;
      styleFrankaRobot(loadedRobot, materials);
      hideFrankaHand(loadedRobot);
      state.robotHolder.add(loadedRobot);
      loadedRobot.getFrame("link8").add(state.suctionTool);
      const suctionContact = state.suctionTool.getObjectByName("suction-contact") ?? state.suctionTool;
      state.gripAnchor = new THREE.Group();
      state.gripAnchor.position.set(0, 0, 0.08);
      suctionContact.add(state.gripAnchor);

      applyFrankaPose(loadedRobot, PALLETIZER_POSES.pick);
      state.cell.updateMatrixWorld(true);
      const pickPoint = getLocalPosition(state.cell, state.gripAnchor);
      applyFrankaPose(loadedRobot, PALLETIZER_POSES.place, 0.018);
      state.cell.updateMatrixWorld(true);
      const placePoint = getLocalPosition(state.cell, state.gripAnchor);

      state.feedCrates[0].position.copy(pickPoint);
      state.feedCrates[1].position.set(pickPoint.x - 0.38, pickPoint.y, pickPoint.z);
      state.queuedCrateBaseX = state.feedCrates[1].position.x;
      state.conveyor.position.set(pickPoint.x - 0.24, pickPoint.y - 0.2675, pickPoint.z);
      state.pallet.position.set(placePoint.x, placePoint.y - 0.32, placePoint.z);
      state.placedCrate.position.copy(placePoint);
      applyFrankaPose(loadedRobot, PALLETIZER_POSES.home);
      state.cell.updateMatrixWorld(true);

      context.canvas.dataset.robotReady = "true";
      context.canvas.dataset.pickPoint = pickPoint.toArray().map((value) => value.toFixed(3)).join(",");
      context.canvas.dataset.placePoint = placePoint.toArray().map((value) => value.toFixed(3)).join(",");
      context.requestRender();
    },
    undefined,
    (error) => console.warn("Unable to load palletizer robot", error),
  );
}

function updatePalletizer(state: PalletizerState, frame: FrameState) {
  const phase = state.previewPhase ?? (frame.elapsed % 6.4) / 6.4;
  const animation = getPalletizerAnimationState(phase);

  if (state.robot) {
    applyFrankaPose(state.robot, animation.pose, animation.fingerOpening);
    if (state.gripAnchor) {
      state.cell.updateMatrixWorld(true);
      state.carriedCrate.position.copy(getLocalPosition(state.cell, state.gripAnchor));
    }
  }

  state.carriedCrate.visible = animation.grasped;
  state.feedCrates[0].visible = phase < 0.24;
  state.placedCrate.visible = phase >= 0.68;
  state.feedCrates[1].position.x = state.queuedCrateBaseX + Math.sin(frame.elapsed * 0.8) * 0.035;
  state.cell.rotation.y = -0.52 + Math.sin(frame.elapsed * 0.16) * 0.03;
  state.context.canvas.dataset.phase = phase.toFixed(3);
  state.context.canvas.dataset.carrying = animation.grasped ? "true" : "false";
  state.context.camera.lookAt(0.27, 0.48, 0.02);
}

export function createPalletizerScene(context: SceneContext): SceneController {
  context.canvas.dataset.scene = "palletizer";
  addLighting(context.scene);
  const materials = createMaterials();
  const cell = new THREE.Group();
  cell.rotation.y = -0.52;
  context.scene.add(cell);
  const { conveyor, feedCrates, pallet } = buildCell(cell, materials);

  const placedCrate = makeBox([0.16, 0.16, 0.16], materials.crate.clone(), [0.82, 0.54, -0.5]);
  const carriedCrate = makeBox([0.16, 0.16, 0.16], materials.crate.clone(), [0, 0, 0]);
  placedCrate.visible = false;
  carriedCrate.visible = false;
  cell.add(placedCrate, carriedCrate);

  const robotHolder = new THREE.Group();
  robotHolder.position.set(0.08, 0.02, 0.08);
  robotHolder.scale.setScalar(1.05);
  cell.add(robotHolder);
  const suctionTool = makeSuctionGripper({
    accent: materials.toolLight,
    cup: materials.toolDark,
    dark: materials.toolMid,
    metal: materials.toolLight,
  });

  const state: PalletizerState = {
    context, cell, materials, feedCrates, placedCrate, carriedCrate, conveyor, pallet,
    robotHolder, suctionTool, robot: null, gripAnchor: null,
    queuedCrateBaseX: feedCrates[1].position.x,
    previewPhase: getPreviewPhase(),
  };
  loadRobot(state);
  return { update: (frame) => updatePalletizer(state, frame) };
}
