import * as THREE from "three";
import type { URDFRobot } from "urdf-loader";
import { dressTool, makeSuctionGripper } from "../../RobotTools";
import { getFrankaVisualUrdfUrl } from "../shared/assets";
import { createFrankaLoader, hideFrankaHand, loadFrankaRobot, styleFrankaRobot } from "../shared/franka";
import { applyFrankaPose } from "../shared/motion";
import { disposeObjectTree, getLocalPosition, setObjectOpacity } from "../shared/objects";
import { carriedBoxRotations, type PickPlacePlan } from "../shared/pickPlace";
import { loadPropLibrary, type PropLibrary } from "../shared/props";
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
  feedCrates: THREE.Group[];
  stackCrates: THREE.Group[];
  carriedCrate: THREE.Group;
  conveyor: THREE.Group;
  pallet: THREE.Group;
  robotHolder: THREE.Group;
  suctionTool: THREE.Group;
  robot: URDFRobot | null;
  gripAnchor: THREE.Group | null;
  plan: PickPlacePlan | null;
  /** Rotation of the carried box in the gripper's frame, as it was picked. */
  boxInGripper: THREE.Quaternion;
  pickPoint: THREE.Vector3;
  previewPhase: number | null;
};

const FLOOR_Y = -0.02;
/** Belt surface to the underside of the conveyor frame (scripts/blender/props.py). */
const CONVEYOR_DEPTH = 0.112;
/** The EUR pallet model (1.2 x 0.8 x 0.144) fitted under the stack, its deck 0.08 above the floor. */
const PALLET_SCALE: [number, number, number] = [0.733, 0.08 / 0.144, 0.733];

function createMaterials() {
  return {
    floor: new THREE.MeshStandardMaterial({ color: 0xe7e5da, roughness: 0.9 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x34464a, metalness: 0.28, roughness: 0.48 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x151713, metalness: 0.2, roughness: 0.58 }),
    shell: new THREE.MeshStandardMaterial({ color: 0xd5d6cc, metalness: 0.24, roughness: 0.48 }),
    crate: new THREE.MeshStandardMaterial({ color: 0xd39b2a, metalness: 0.03, roughness: 0.68 }),
    tape: new THREE.MeshStandardMaterial({ color: 0xe9dcb8, metalness: 0, roughness: 0.42 }),
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
  floor.position.y = FLOOR_Y;
  floor.receiveShadow = true;
  cell.add(floor);
  const grid = new THREE.GridHelper(4.8, 8, 0x8f9484, 0xd0d0c5);
  grid.position.y = 0.002;
  cell.add(grid);

  const conveyor = new THREE.Group();
  const pallet = new THREE.Group();
  const feedCrates = [new THREE.Group(), new THREE.Group()];
  const stackCrates = PALLETIZER_STACK.map(() => new THREE.Group());
  stackCrates.forEach((placed) => {
    placed.visible = false;
  });
  cell.add(conveyor, pallet, ...feedCrates, ...stackCrates);
  return { conveyor, feedCrates, pallet, stackCrates };
}

/** Conveyor on four stand legs down to the floor, the pallet and the cartons. */
function dressCell(state: PalletizerState, library: PropLibrary) {
  const { materials, conveyor } = state;
  const frame = { steel: materials.steel, frame: materials.dark };
  conveyor.add(library.create("conveyor_belt", frame));
  const floorLocal = FLOOR_Y - conveyor.position.y;
  const legHeight = -CONVEYOR_DEPTH - floorLocal;
  // Under the conveyor's side channels, 0.42 apart and 0.035 deep.
  [-0.6, 0.6].forEach((x) => {
    [-0.19, 0.19].forEach((z) => {
      const leg = library.create("tube", frame, { scale: [0.04, legHeight, 0.04] });
      const foot = library.create("foot", frame, { scale: 0.085 });
      leg.position.set(x, floorLocal, z);
      foot.position.set(x, floorLocal, z);
      conveyor.add(leg, foot);
    });
  });

  const deck = library.create("pallet", { wood: materials.wood }, { scale: PALLET_SCALE });
  deck.position.y = PALLET_SCALE[1] * 0.144;
  state.pallet.add(deck);

  const cartons = { cardboard: materials.crate, tape: materials.tape };
  [...state.feedCrates, ...state.stackCrates, state.carriedCrate].forEach((crate) => {
    crate.add(library.create("carton", cartons, { cloneMaterials: true, scale: PALLETIZER_BOX_SIZE }));
  });
  dressTool(state.suctionTool, library, {
    accent: materials.toolLight, cup: materials.toolDark, dark: materials.toolMid, metal: materials.toolLight,
  });
}

function getPreviewPhase() {
  const requested = new URLSearchParams(window.location.search).get("palletPhase");
  const parsed = requested === null ? Number.NaN : Number(requested);
  return import.meta.env.DEV && Number.isFinite(parsed)
    ? THREE.MathUtils.clamp(parsed, 0, 0.999)
    : null;
}

/** Mounts the tool, measures the pick and place points, lays out the cell and plans the cycle. */
function assemble(state: PalletizerState, robot: URDFRobot, library: PropLibrary) {
  const { context, materials } = state;
  state.robot = robot;
  styleFrankaRobot(robot, { ...materials, metal: materials.toolLight, accent: materials.crate });
  hideFrankaHand(robot);
  state.robotHolder.add(robot);
  robot.getFrame("link8").add(state.suctionTool);
  const suctionContact = state.suctionTool.getObjectByName("suction-contact") ?? state.suctionTool;
  const gripAnchor = new THREE.Group();
  gripAnchor.position.set(0, 0, PALLETIZER_BOX_SIZE / PALLETIZER_ROBOT_SCALE / 2);
  suctionContact.add(gripAnchor);
  state.gripAnchor = gripAnchor;

  applyFrankaPose(robot, PALLETIZER_POSES.pick);
  state.cell.updateMatrixWorld(true);
  const pickPoint = getLocalPosition(state.cell, gripAnchor);
  applyFrankaPose(robot, PALLETIZER_POSES.place, 0.018);
  state.cell.updateMatrixWorld(true);
  const placePoint = getLocalPosition(state.cell, gripAnchor);

  state.pickPoint = pickPoint;
  state.conveyor.position.set(pickPoint.x - 0.24, pickPoint.y - PALLETIZER_BOX_SIZE / 2, pickPoint.z);
  state.pallet.position.copy(palletizerOrigin(placePoint));
  dressCell(state, library);
  state.plan = planPalletizer(robot, gripAnchor, state.cell, pickPoint, state.pallet.position);
  // The boxes on the conveyor are square to the cell.
  const rotations = carriedBoxRotations(robot, gripAnchor, state.cell, state.plan);
  state.boxInGripper = rotations.inGripper;
  state.stackCrates.forEach((placed, index) => {
    const [x, y, z] = PALLETIZER_STACK[index];
    placed.position.copy(state.pallet.position).add(new THREE.Vector3(x, y, z));
    placed.quaternion.copy(rotations.placed[index]);
  });
  applyFrankaPose(robot, state.plan.loop.startPose);
  state.cell.updateMatrixWorld(true);

  context.canvas.dataset.robotReady = "true";
  context.canvas.dataset.pickPoint = pickPoint.toArray().map((value) => value.toFixed(3)).join(",");
  context.canvas.dataset.placePoint = placePoint.toArray().map((value) => value.toFixed(3)).join(",");
  context.requestRender();
}

function loadCell(state: PalletizerState) {
  const { context } = state;
  const robot = loadFrankaRobot(createFrankaLoader(context.baseUrl), getFrankaVisualUrdfUrl(context.baseUrl));
  Promise.all([robot, loadPropLibrary(context.baseUrl)]).then(
    ([loadedRobot, library]) => {
      if (context.isDisposed()) {
        disposeObjectTree(loadedRobot);
        return;
      }
      assemble(state, loadedRobot, library);
    },
    (error) => console.warn("Unable to load palletizer scene assets", error),
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
      state.carriedCrate.quaternion.copy(cellRotation.multiply(gripAnchor.getWorldQuaternion(new THREE.Quaternion())))
        .multiply(state.boxInGripper);
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

  const carriedCrate = new THREE.Group();
  carriedCrate.visible = false;
  cell.add(carriedCrate);

  const robotHolder = new THREE.Group();
  robotHolder.position.set(0.08, 0.02, 0.08);
  robotHolder.scale.setScalar(PALLETIZER_ROBOT_SCALE);
  cell.add(robotHolder);

  const state: PalletizerState = {
    context, cell, materials, feedCrates, stackCrates, carriedCrate, conveyor, pallet,
    robotHolder, suctionTool: makeSuctionGripper(), robot: null, gripAnchor: null, plan: null,
    boxInGripper: new THREE.Quaternion(),
    pickPoint: new THREE.Vector3(-0.48, 0.42, 0.54),
    previewPhase: getPreviewPhase(),
  };
  loadCell(state);
  return { update: (frame) => updatePalletizer(state, frame) };
}
