import * as THREE from "three";
import type { URDFRobot } from "urdf-loader";
import { makeSuctionGripper } from "../../RobotTools";
import { getFrankaUrdfUrl } from "../shared/assets";
import { createFrankaLoader, hideFrankaHand, styleFrankaRobot } from "../shared/franka";
import { applyFrankaPose } from "../shared/motion";
import { disposeObjectTree, getLocalPosition, makeBox, setObjectOpacity } from "../shared/objects";
import type { PickPlacePlan } from "../shared/pickPlace";
import type { FrameState, SceneContext, SceneController } from "../shared/runtime";
import { palletizerOrigin, planPalletizer } from "./animation";
import {
  PALLETIZER_BOX_SIZE,
  PALLETIZER_POSES,
  PALLETIZER_QUEUE,
  PALLETIZER_ROBOT_SCALE,
  PALLETIZER_STACK,
} from "./config";

type Materials = ReturnType<typeof createMaterials>;

type PalletizerState = {
  context: SceneContext;
  cell: THREE.Group;
  materials: Materials;
  feedCrates: THREE.Mesh[];
  stackCrates: THREE.Mesh[];
  carriedCrate: THREE.Mesh;
  conveyor: THREE.Group;
  pallet: THREE.Group;
  robotHolder: THREE.Group;
  suctionTool: THREE.Group;
  robot: URDFRobot | null;
  gripAnchor: THREE.Group | null;
  plan: PickPlacePlan | null;
  pickPoint: THREE.Vector3;
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

function crate(materials: Materials) {
  const size = PALLETIZER_BOX_SIZE;
  return makeBox([size, size, size], materials.crate.clone(), [0, 0, 0]);
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

  const feedCrates = [crate(materials), crate(materials)];
  feedCrates[0].position.set(-0.48, 0.42, 0.54);
  feedCrates[1].position.set(-0.9, 0.42, 0.54);
  cell.add(...feedCrates);

  const pallet = new THREE.Group();
  pallet.position.set(0.7, 0.1, -0.54);
  [-0.22, 0, 0.22].forEach((z) => {
    pallet.add(makeBox([0.88, 0.055, 0.12], materials.wood.clone(), [0, 0.05, z]));
  });
  cell.add(pallet);

  const stackCrates = PALLETIZER_STACK.map(() => {
    const placed = crate(materials);
    placed.visible = false;
    cell.add(placed);
    return placed;
  });

  return { conveyor, feedCrates, pallet, stackCrates };
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
      const gripAnchor = new THREE.Group();
      gripAnchor.position.set(0, 0, PALLETIZER_BOX_SIZE / PALLETIZER_ROBOT_SCALE / 2);
      suctionContact.add(gripAnchor);
      state.gripAnchor = gripAnchor;

      applyFrankaPose(loadedRobot, PALLETIZER_POSES.pick);
      state.cell.updateMatrixWorld(true);
      const pickPoint = getLocalPosition(state.cell, gripAnchor);
      applyFrankaPose(loadedRobot, PALLETIZER_POSES.place, 0.018);
      state.cell.updateMatrixWorld(true);
      const placePoint = getLocalPosition(state.cell, gripAnchor);

      state.pickPoint = pickPoint;
      state.conveyor.position.set(pickPoint.x - 0.24, pickPoint.y - 0.2675, pickPoint.z);
      state.pallet.position.copy(palletizerOrigin(placePoint));
      state.plan = planPalletizer(loadedRobot, gripAnchor, state.cell, pickPoint, state.pallet.position);
      state.stackCrates.forEach((placed, index) => {
        const [x, y, z] = PALLETIZER_STACK[index];
        placed.position.copy(state.pallet.position).add(new THREE.Vector3(x, y, z));
      });
      applyFrankaPose(loadedRobot, state.plan.loop.startPose);
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

function placeFeedCrates(state: PalletizerState, feed: number) {
  const pick = state.pickPoint;
  const queue = PALLETIZER_QUEUE.map((offset) => pick.clone().add(new THREE.Vector3(offset, 0, 0)));
  state.feedCrates[0].position.copy(queue[0]).lerp(pick, feed);
  state.feedCrates[1].position.copy(queue[1]).lerp(queue[0], feed);
  setObjectOpacity(state.feedCrates[1], THREE.MathUtils.smoothstep(feed, 0, 0.35));
}

function updatePalletizer(state: PalletizerState, frame: FrameState) {
  const { robot, gripAnchor } = state;
  const loop = state.plan?.loop;
  const time = loop
    ? (state.previewPhase !== null ? state.previewPhase * loop.duration : frame.elapsed % loop.duration)
    : 0;
  const phase = loop ? time / loop.duration : 0;
  const sample = loop?.sample(time);

  if (robot && gripAnchor && sample) {
    applyFrankaPose(robot, sample.pose);
    state.cell.updateMatrixWorld(true);
    state.carriedCrate.visible = sample.carrying;
    if (sample.carrying) {
      state.carriedCrate.position.copy(getLocalPosition(state.cell, gripAnchor));
      const cellRotation = state.cell.getWorldQuaternion(new THREE.Quaternion()).invert();
      state.carriedCrate.quaternion.copy(cellRotation.multiply(gripAnchor.getWorldQuaternion(new THREE.Quaternion())));
    }
    state.stackCrates.forEach((placed, index) => {
      setObjectOpacity(placed, index < sample.placed ? 1 - sample.clear : 0);
    });
    placeFeedCrates(state, sample.feed);
    state.context.canvas.dataset.carrying = sample.carrying ? "true" : "false";
    state.context.canvas.dataset.placed = String(sample.placed);
  }

  state.cell.rotation.y = -0.52 + Math.sin(frame.elapsed * 0.16) * 0.03;
  state.context.canvas.dataset.phase = phase.toFixed(3);
  state.context.camera.lookAt(0.27, 0.48, 0.02);
}

export function createPalletizerScene(context: SceneContext): SceneController {
  context.canvas.dataset.scene = "palletizer";
  addLighting(context.scene);
  const materials = createMaterials();
  const cell = new THREE.Group();
  cell.rotation.y = -0.52;
  context.scene.add(cell);
  const { conveyor, feedCrates, pallet, stackCrates } = buildCell(cell, materials);

  const carriedCrate = crate(materials);
  carriedCrate.visible = false;
  cell.add(carriedCrate);

  const robotHolder = new THREE.Group();
  robotHolder.position.set(0.08, 0.02, 0.08);
  robotHolder.scale.setScalar(PALLETIZER_ROBOT_SCALE);
  cell.add(robotHolder);
  const suctionTool = makeSuctionGripper({
    accent: materials.toolLight,
    cup: materials.toolDark,
    dark: materials.toolMid,
    metal: materials.toolLight,
  });

  const state: PalletizerState = {
    context, cell, materials, feedCrates, stackCrates, carriedCrate, conveyor, pallet,
    robotHolder, suctionTool, robot: null, gripAnchor: null, plan: null,
    pickPoint: feedCrates[0].position.clone(),
    previewPhase: getPreviewPhase(),
  };
  loadRobot(state);
  return { update: (frame) => updatePalletizer(state, frame) };
}
