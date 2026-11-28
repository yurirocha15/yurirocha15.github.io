import * as THREE from "three";
import type { URDFRobot } from "urdf-loader";
import { dressTool, makeArcWeldTorch, makeSuctionGripper } from "../../RobotTools";
import { getFrankaVisualUrdfUrl } from "../shared/assets";
import { createFrankaLoader, hideFrankaHand, loadFrankaRobot, styleFrankaRobot } from "../shared/franka";
import { applyFrankaPose, type FrankaPose } from "../shared/motion";
import { carriedBoxRotations, type PickPlacePlan } from "../shared/pickPlace";
import {
  disposeObjectTree,
  getLocalPosition,
  makeContactShadow,
  setObjectOpacity,
} from "../shared/objects";
import { loadPropLibrary, type PropLibrary } from "../shared/props";
import type { FrameState, SceneContext, SceneController } from "../shared/runtime";
import type { WeldSequence } from "../shared/weldProgram";
import {
  getHeroAnimationState,
  getHeroCycleDuration,
  heroDeckCentre,
  heroSlots,
  heroWeldStationMatrix,
  planHero,
  planHeroWeld,
  type HeroAnimationState,
} from "./animation";
import { HERO_CRATE_SIZE, HERO_FLOOR_Y, HERO_POSES, HERO_ROBOT_SCALE, HERO_STACK, HERO_WELD_SEAMS } from "./config";

type Materials = ReturnType<typeof createMaterials>;

type PalletEnvironment = {
  root: THREE.Group;
  feedCrate: THREE.Group;
  queueCrate: THREE.Group;
  /** Roller conveyor the boxes arrive on; its origin is on top of the rollers. */
  support: THREE.Group;
  toolCrate: THREE.Group;
  /** Pallet on its stand; the origin is on the deck. */
  pallet: THREE.Group;
  stackCrates: THREE.Group[];
  pickPoint: THREE.Vector3;
  queuePoint: THREE.Vector3;
  /** Where the queued crate rides in from, a crate length and a gap behind the queue point. */
  inletPoint: THREE.Vector3;
};

type Bead = {
  /** Cooled bead from the seam start to the arc. */
  laid: THREE.Mesh;
  /** The last few centimetres behind the arc, still glowing. */
  hot: THREE.Mesh;
  length: number;
};

type WeldEnvironment = {
  root: THREE.Group;
  /** Welding table and workpiece; the origin is on the table top, in the workpiece's frame. */
  station: THREE.Group;
  beads: Bead[];
  glow: THREE.Mesh;
  sparks: THREE.Group;
};

type HeroState = {
  context: SceneContext;
  materials: Materials;
  cell: THREE.Group;
  pallet: PalletEnvironment;
  weld: WeldEnvironment;
  palletShadow: THREE.Mesh;
  weldShadow: THREE.Mesh;
  robotHolder: THREE.Group;
  robot: URDFRobot | null;
  plan: PickPlacePlan | null;
  weldProgram: WeldSequence | null;
  weldTip: THREE.Object3D | null;
  torch: THREE.Group;
  suction: THREE.Group;
  targetOrbit: number;
  orbit: number;
  previewPhase: number | null;
};

/** Rollers' top to the underside of the roller conveyor frame (scripts/blender/props.py). */
const SUPPORT_DEPTH = 0.086;
/** Distance of the roller conveyor's legs from its centre line, under the middle of each channel. */
const SUPPORT_LEG_OFFSET = 0.185;
const PALLET_SCALE = 0.9;
/** Height of the EUR pallet model. */
const PALLET_HEIGHT = 0.144 * PALLET_SCALE;
/** Thickness of the welding table top, below the workpiece origin. */
const TABLE_DEPTH = 0.06;
const BEAD_RADIUS = 0.0065;
/** Length of bead behind the arc that still glows. */
const HOT_LENGTH = 0.05;

function createMaterials() {
  return {
    floor: new THREE.MeshStandardMaterial({ color: 0xe7e5da, metalness: 0.02, roughness: 0.86 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x34464a, metalness: 0.38, roughness: 0.42 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x141711, metalness: 0.16, roughness: 0.58 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xd39b2a, metalness: 0.06, roughness: 0.58 }),
    crate: new THREE.MeshStandardMaterial({ color: 0xd39b2a, metalness: 0.03, roughness: 0.68 }),
    tape: new THREE.MeshStandardMaterial({ color: 0xe9dcb8, metalness: 0, roughness: 0.42 }),
    wood: new THREE.MeshStandardMaterial({ color: 0xa65e2e, metalness: 0.02, roughness: 0.74 }),
    plate: new THREE.MeshStandardMaterial({ color: 0xc8cec5, metalness: 0.62, roughness: 0.34 }),
    bead: new THREE.MeshStandardMaterial({ color: 0x5b5650, metalness: 0.55, roughness: 0.42 }),
    hotBead: new THREE.MeshStandardMaterial({
      color: 0xb2581c, emissive: 0xf2a62a, emissiveIntensity: 1.4, metalness: 0.2, roughness: 0.5,
    }),
    toolLight: new THREE.MeshStandardMaterial({ color: 0xbfc3bf, metalness: 0.54, roughness: 0.34 }),
    toolMid: new THREE.MeshStandardMaterial({ color: 0x737a76, metalness: 0.42, roughness: 0.4 }),
    toolDark: new THREE.MeshStandardMaterial({ color: 0x444a47, metalness: 0.3, roughness: 0.5 }),
    glow: new THREE.MeshStandardMaterial({
      color: 0xf6b932, emissive: 0xf6a800, emissiveIntensity: 2.4, transparent: true,
    }),
  };
}

function addLighting(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xf5f0df, 0x3f453c, 1.35));
  const keyLight = new THREE.DirectionalLight(0xffffff, 4.4);
  keyLight.position.set(3.4, 5.2, 4.2);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.00025;
  keyLight.shadow.normalBias = 0.03;
  const shadowCamera = keyLight.shadow.camera;
  shadowCamera.near = 0.1;
  shadowCamera.far = 12;
  shadowCamera.left = -4.5;
  shadowCamera.right = 4.5;
  shadowCamera.top = 4.5;
  shadowCamera.bottom = -4.5;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xd39b2a, 0.72);
  fillLight.position.set(-4, 2.2, -3.5);
  scene.add(fillLight);
}

function buildFloor(cell: THREE.Group, materials: Materials) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.4), materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = HERO_FLOOR_Y;
  floor.receiveShadow = true;
  cell.add(floor);
  const grid = new THREE.GridHelper(7.2, 12, 0x8f9484, 0xd0d0c5);
  grid.position.y = 0.002;
  cell.add(grid);
}

function buildPalletEnvironment() {
  const root = new THREE.Group();
  const feedCrate = new THREE.Group();
  const queueCrate = new THREE.Group();
  const support = new THREE.Group();
  const pallet = new THREE.Group();
  const stackCrates = HERO_STACK.map(() => {
    const placed = new THREE.Group();
    placed.visible = false;
    return placed;
  });
  root.add(support, pallet, feedCrate, queueCrate, ...stackCrates);
  return {
    root, feedCrate, queueCrate, support, toolCrate: new THREE.Group(), pallet, stackCrates,
    pickPoint: new THREE.Vector3(-1.36, 0.56, 0.54),
    queuePoint: new THREE.Vector3(-0.94, 0.56, 0.54),
    inletPoint: new THREE.Vector3(-0.78, 0.56, 0.54),
  };
}

/** A weld bead along each seam, grown by scaling along the seam, with its glowing end. */
function makeBeads(materials: Materials): Bead[] {
  const geometry = new THREE.CylinderGeometry(BEAD_RADIUS, BEAD_RADIUS, 1, 10, 1);
  geometry.translate(0, 0.5, 0);
  return HERO_WELD_SEAMS.map(({ start, end, wall }) => {
    const segment = (material: THREE.Material) => {
      const mesh = new THREE.Mesh(geometry, material.clone());
      // Sit the bead in the corner, out of both plates.
      mesh.position.copy(start).addScaledVector(new THREE.Vector3(0, 1, 0).add(wall), BEAD_RADIUS * 0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
      mesh.visible = false;
      return mesh;
    };
    const laid = segment(materials.bead);
    laid.castShadow = true;
    const hot = segment(materials.hotBead);
    hot.scale.setScalar(1.08);
    return { laid, hot, length: start.distanceTo(end) };
  });
}

function buildWeldEnvironment(materials: Materials) {
  const root = new THREE.Group();
  const station = new THREE.Group();
  station.applyMatrix4(heroWeldStationMatrix());
  const beads = makeBeads(materials);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), materials.glow.clone());
  const sparks = new THREE.Group();
  for (let index = 0; index < 20; index += 1) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.008 + (index % 3) * 0.003, 8, 8),
      materials.glow.clone(),
    );
    spark.userData.seed = index * 0.71;
    sparks.add(spark);
  }
  station.add(...beads.flatMap((bead) => [bead.laid, bead.hot]), glow, sparks);
  root.add(station);
  return { root, station, beads, glow, sparks };
}

function createTools() {
  const torch = makeArcWeldTorch();
  torch.position.set(0, 0, 0.01);
  torch.scale.setScalar(1.12);
  const suction = makeSuctionGripper();
  setObjectOpacity(torch, 0);
  setObjectOpacity(suction, 0);
  return { torch, suction };
}

function toolPointForPose(state: HeroState, robot: URDFRobot, pose: FrankaPose, tool: THREE.Object3D) {
  applyFrankaPose(robot, pose, 0.034);
  state.context.scene.updateMatrixWorld(true);
  return getLocalPosition(state.cell, tool);
}

/** Stand tubes from the floor up to `top`, in the coordinates of `parent`, with base plates. */
function addLegs(
  parent: THREE.Group,
  library: PropLibrary,
  materials: Materials,
  points: Array<[number, number]>,
  top: number,
  size: number,
) {
  const floor = HERO_FLOOR_Y - parent.position.y;
  const height = top - floor;
  if (height <= 0.01) return;
  const palette = { frame: materials.dark };
  points.forEach(([x, z]) => {
    const leg = library.create("tube", palette, { cloneMaterials: true, scale: [size, height, size] });
    const foot = library.create("foot", palette, { cloneMaterials: true, scale: size * 2 });
    leg.position.set(x, floor, z);
    foot.position.set(x, floor, z);
    parent.add(leg, foot);
  });
}

function alignPalletEnvironment(state: HeroState, pickPoint: THREE.Vector3, deckCentre: THREE.Vector3) {
  const { pallet } = state;
  pallet.pickPoint.copy(pickPoint);
  pallet.queuePoint.copy(pickPoint).add(new THREE.Vector3(-0.3, 0, 0));
  pallet.inletPoint.copy(pallet.queuePoint).add(new THREE.Vector3(-(HERO_CRATE_SIZE + 0.02), 0, 0));
  pallet.feedCrate.position.copy(pallet.pickPoint);
  pallet.queueCrate.position.copy(pallet.queuePoint);
  pallet.support.position.set(
    (pallet.pickPoint.x + pallet.queuePoint.x) / 2,
    pickPoint.y - HERO_CRATE_SIZE / 2,
    pickPoint.z,
  );
  pallet.pallet.position.copy(deckCentre);
  heroSlots(deckCentre).forEach((slot, index) => pallet.stackCrates[index].position.copy(slot));
  state.palletShadow.position.set(deckCentre.x, HERO_FLOOR_Y + 0.006, deckCentre.z);
}

function dressPalletEnvironment(state: HeroState, library: PropLibrary) {
  const { pallet, materials } = state;
  const frame = { steel: materials.steel, frame: materials.dark };
  pallet.support.add(library.create("conveyor_roller", frame, { cloneMaterials: true }));
  const legs: Array<[number, number]> = [-0.3, 0.3].flatMap((x) => [-1, 1].map((side): [number, number] => [x, side * SUPPORT_LEG_OFFSET]));
  addLegs(pallet.support, library, materials, legs, -SUPPORT_DEPTH, 0.04);

  pallet.pallet.add(library.create("pallet", { wood: materials.wood }, { cloneMaterials: true, scale: PALLET_SCALE }));
  const beamTop = -PALLET_HEIGHT;
  [-0.3, 0.3].forEach((z) => {
    const beam = library.create("tube", frame, { cloneMaterials: true, scale: [0.05, 1.04, 0.05] });
    beam.rotation.z = -Math.PI / 2;
    beam.position.set(-0.52, beamTop - 0.025, z);
    pallet.pallet.add(beam);
  });
  addLegs(pallet.pallet, library, materials, [[-0.48, -0.3], [0.48, -0.3], [-0.48, 0.3], [0.48, 0.3]], beamTop - 0.05, 0.05);

  const cartons = { cardboard: materials.crate, tape: materials.tape };
  [pallet.feedCrate, pallet.queueCrate, ...pallet.stackCrates].forEach((crate) => {
    crate.add(library.create("carton", cartons, { cloneMaterials: true, scale: HERO_CRATE_SIZE }));
  });
  pallet.toolCrate.add(
    library.create("carton", cartons, { cloneMaterials: true, scale: HERO_CRATE_SIZE / HERO_ROBOT_SCALE }),
  );
}

function dressWeldEnvironment(state: HeroState, library: PropLibrary) {
  const { station } = state.weld;
  const { materials } = state;
  const table = library.create("weld_table", { steel: materials.steel }, { cloneMaterials: true });
  table.position.set(0, 0, 0.1);
  station.add(table);
  addLegs(station, library, materials, [[-0.52, -0.12], [0.52, -0.12], [-0.52, 0.32], [0.52, 0.32]], -TABLE_DEPTH, 0.05);
  station.add(library.create("weld_part", { plate: materials.plate }, { cloneMaterials: true }));
  state.weldShadow.position.set(station.position.x, HERO_FLOOR_Y + 0.008, station.position.z + 0.1);
}

function dressTools(state: HeroState, library: PropLibrary) {
  const { materials } = state;
  dressTool(state.torch, library, {
    accent: materials.toolLight, body: materials.toolMid, dark: materials.toolDark, metal: materials.toolLight,
  }, true);
  dressTool(state.suction, library, {
    accent: materials.toolLight, cup: materials.toolDark, dark: materials.toolMid, metal: materials.toolLight,
  }, true);
  setObjectOpacity(state.torch, 0);
  setObjectOpacity(state.suction, 0);
}

/** Mounts the tools, lays out both cells from the reachable pick and place points, and plans. */
function assemble(state: HeroState, robot: URDFRobot, library: PropLibrary) {
  state.robot = robot;
  styleFrankaRobot(robot, {
    shell: new THREE.MeshStandardMaterial({ color: 0xd5d6cc, metalness: 0.24, roughness: 0.48 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x151711, metalness: 0.28, roughness: 0.42 }),
    metal: state.materials.toolLight,
    accent: state.materials.yellow,
  });
  hideFrankaHand(robot);
  state.robotHolder.add(robot);
  robot.getFrame("link8").add(state.torch, state.suction);
  dressTools(state, library);
  const suctionContact = state.suction.getObjectByName("suction-contact") ?? state.suction;
  suctionContact.add(state.pallet.toolCrate);
  state.pallet.toolCrate.position.set(0, 0, HERO_CRATE_SIZE / HERO_ROBOT_SCALE / 2);
  state.weldTip = state.torch.getObjectByName("weld-tip") ?? state.torch;

  const pick = toolPointForPose(state, robot, HERO_POSES.palletPick, state.pallet.toolCrate);
  const place = toolPointForPose(state, robot, HERO_POSES.palletPlace, state.pallet.toolCrate);
  const deckCentre = heroDeckCentre(place);
  alignPalletEnvironment(state, pick, deckCentre);
  dressPalletEnvironment(state, library);
  dressWeldEnvironment(state, library);
  state.plan = planHero(robot, state.pallet.toolCrate, state.cell, pick, deckCentre);
  // The carried carton keeps the rotation it was picked with, and the stacked ones land turned to
  // match. Only the carton inside the tool frame turns; the planner's tool frame stays as it is.
  const rotations = carriedBoxRotations(robot, state.pallet.toolCrate, state.pallet.root, state.plan);
  state.pallet.toolCrate.children.forEach((carton) => carton.quaternion.copy(rotations.inGripper));
  state.pallet.stackCrates.forEach((crate, index) => crate.quaternion.copy(rotations.placed[index]));
  state.weldProgram = planHeroWeld(robot, state.weldTip, state.cell);
  applyFrankaPose(robot, state.plan.once.startPose, 0.034);
  state.context.canvas.dataset.robotReady = "true";
  state.context.requestRender();
}

function loadHero(state: HeroState) {
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
    (error) => console.warn("Unable to load robot scene assets", error),
  );
}

function addOrbitControls(state: HeroState) {
  const canvas = state.context.canvas;
  let dragging = false;
  let lastX = 0;
  const onPointerDown = (event: PointerEvent) => {
    dragging = true;
    lastX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return;
    state.targetOrbit += (event.clientX - lastX) * 0.008;
    lastX = event.clientX;
    state.context.requestRender();
  };
  const onPointerUp = (event: PointerEvent) => {
    dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = "grab";
  };
  canvas.dataset.scene = "franka-robot-cell";
  canvas.style.cursor = "grab";
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  state.context.addCleanup(() => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
  });
}

function updateSparks(state: HeroState, frame: FrameState, weldActive: number) {
  state.weld.sparks.children.forEach((child, index) => {
    const spark = child as THREE.Mesh;
    const seed = spark.userData.seed as number;
    const local = (frame.elapsed * 3.4 + seed) % 1;
    const scale = weldActive * (1 - local);
    spark.visible = weldActive > 0.05;
    spark.scale.setScalar(0.45 + scale * 2.6);
    spark.position.set(
      Math.cos(seed * 4.7) * local * 0.16,
      Math.abs(Math.sin(seed * 5.1)) * local * 0.18 - local * local * 0.06,
      Math.sin(seed * 2.2 + index) * local * 0.14,
    );
    const material = spark.material as THREE.MeshStandardMaterial;
    material.opacity = weldActive * (1 - local);
    material.transparent = true;
  });
}

/** Grows each bead with its seam; its last centimetres glow behind the burning arc. */
function updateBeads(state: HeroState, frame: FrameState, animation: HeroAnimationState) {
  const visible = animation.weldMode > 0.01;
  state.weld.beads.forEach(({ laid, hot, length }, index) => {
    const welded = (animation.seams[index] ?? 0) * length;
    laid.visible = visible && welded > 0.001;
    laid.scale.y = Math.max(welded, 0.001);
    const heat = index === animation.seam ? animation.weldActive : 0;
    const glowing = Math.min(welded, HOT_LENGTH);
    hot.visible = visible && heat > 0.01 && glowing > 0.001;
    hot.scale.y = Math.max(glowing, 0.001);
    hot.position.copy(laid.position).addScaledVector(new THREE.Vector3(0, 1, 0).applyQuaternion(laid.quaternion), welded - glowing);
    const material = hot.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = 1.4 + Math.sin(frame.elapsed * 16) * 0.25;
    material.opacity = heat;
    material.transparent = heat < 0.99;
  });
}

function placeHeroCrates(state: HeroState, palletMode: number, placed: number, carrying: boolean, feed: number) {
  const { pallet } = state;
  const palletVisible = palletMode > 0.01;
  // The conveyor moves both crates one place on: the queued one into the pick, and a new one from
  // the inlet into the queue, fading in on the way.
  pallet.feedCrate.position.copy(pallet.queuePoint).lerp(pallet.pickPoint, feed);
  pallet.feedCrate.visible = palletVisible;
  pallet.queueCrate.position.copy(pallet.inletPoint).lerp(pallet.queuePoint, feed);
  setObjectOpacity(pallet.queueCrate, palletMode * THREE.MathUtils.smoothstep(feed, 0, 0.35));
  pallet.toolCrate.visible = palletVisible && carrying;
  pallet.stackCrates.forEach((crate, index) => {
    crate.visible = palletVisible && index < placed;
  });
}

/** Development-only `?heroPhase=0..1` freezes the cycle at that fraction, for inspecting the motion. */
function getPreviewPhase() {
  const requested = new URLSearchParams(window.location.search).get("heroPhase");
  const parsed = requested === null ? Number.NaN : Number(requested);
  return import.meta.env.DEV && Number.isFinite(parsed) ? THREE.MathUtils.clamp(parsed, 0, 0.999) : null;
}

function updateHero(state: HeroState, frame: FrameState) {
  const pass = state.plan?.once ?? null;
  const cycle = getHeroCycleDuration(pass, state.weldProgram);
  const elapsed = state.previewPhase === null ? frame.elapsed : state.previewPhase * cycle;
  const animation = getHeroAnimationState(elapsed, pass, state.weldProgram);
  if (state.robot) applyFrankaPose(state.robot, animation.pose, 0.034);
  if (state.weldTip) {
    state.context.scene.updateMatrixWorld(true);
    const tip = getLocalPosition(state.weld.station, state.weldTip);
    state.weld.glow.position.copy(tip);
    state.weld.sparks.position.copy(tip);
  }
  setObjectOpacity(state.pallet.root, animation.palletMode);
  setObjectOpacity(state.weld.root, animation.weldMode);
  setObjectOpacity(state.palletShadow, animation.palletMode * 0.12);
  setObjectOpacity(state.weldShadow, animation.weldMode * 0.12);
  setObjectOpacity(state.suction, animation.palletMode);
  setObjectOpacity(state.torch, animation.weldMode);
  placeHeroCrates(state, animation.palletMode, animation.placed, animation.carrying, animation.feed);
  setObjectOpacity(state.weld.glow, animation.weldActive);
  updateBeads(state, frame, animation);
  updateSparks(state, frame, animation.weldActive);

  state.orbit += (state.targetOrbit - state.orbit) * 0.08;
  state.cell.rotation.x = animation.spinPulse * 0.12;
  state.cell.rotation.y = -0.32 + state.orbit
    + (animation.spinToWeld + animation.spinToPallet) * Math.PI * 2
    + Math.sin(elapsed * 0.15) * 0.018;
  state.cell.scale.setScalar(1 - animation.spinPulse * 0.05);
  const { dataset } = state.context.canvas;
  dataset.mode = animation.weldMode > 0.5 ? "welding" : "palletizing";
  dataset.phase = ((elapsed % cycle) / cycle).toFixed(3);
  dataset.placed = String(animation.placed);
  dataset.carrying = animation.carrying ? "true" : "false";
  dataset.welded = animation.seams.map((progress) => progress.toFixed(2)).join(",");
  state.context.camera.lookAt(0, 0.72, -0.12);
}

export function createHeroScene(context: SceneContext): SceneController {
  addLighting(context.scene);
  const materials = createMaterials();
  const cell = new THREE.Group();
  cell.rotation.y = -0.32;
  context.scene.add(cell);
  buildFloor(cell, materials);
  const pallet = buildPalletEnvironment();
  const weld = buildWeldEnvironment(materials);
  cell.add(pallet.root, weld.root);
  const palletShadow = makeContactShadow([1.2, 0.9], [-0.35, HERO_FLOOR_Y + 0.006, -0.58], 0.12);
  const weldShadow = makeContactShadow([1.3, 0.72], [0.8, HERO_FLOOR_Y + 0.008, -0.7], 0.12);
  cell.add(
    makeContactShadow([0.84, 0.58], [0.06, HERO_FLOOR_Y + 0.004, 0.08], 0.16),
    palletShadow,
    weldShadow,
  );
  const robotHolder = new THREE.Group();
  robotHolder.position.set(0.08, 0.02, 0.02);
  robotHolder.scale.setScalar(HERO_ROBOT_SCALE);
  cell.add(robotHolder);
  const { torch, suction } = createTools();
  const state: HeroState = {
    context, materials, cell, pallet, weld, palletShadow, weldShadow, robotHolder,
    robot: null, plan: null, weldProgram: null, weldTip: null, torch, suction,
    targetOrbit: 0, orbit: 0, previewPhase: getPreviewPhase(),
  };
  addOrbitControls(state);
  loadHero(state);
  return { update: (frame) => updateHero(state, frame) };
}
