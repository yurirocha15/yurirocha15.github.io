import * as THREE from "three";
import type { URDFRobot } from "urdf-loader";
import { makeArcWeldTorch, makeSuctionGripper } from "../../RobotTools";
import { getFrankaVisualUrdfUrl } from "../shared/assets";
import { createFrankaLoader, hideFrankaHand, styleFrankaRobot } from "../shared/franka";
import { applyFrankaPose, type FrankaPose } from "../shared/motion";
import type { PickPlacePlan } from "../shared/pickPlace";
import {
  disposeObjectTree,
  getLocalPosition,
  makeBox,
  makeContactShadow,
  setObjectOpacity,
} from "../shared/objects";
import type { FrameState, SceneContext, SceneController } from "../shared/runtime";
import { getHeroAnimationState, getHeroCycleDuration, heroDeckCentre, heroSlots, planHero } from "./animation";
import { HERO_CRATE_SIZE, HERO_FLOOR_Y, HERO_POSES, HERO_ROBOT_SCALE, HERO_STACK } from "./config";

type Materials = ReturnType<typeof createMaterials>;

type PalletEnvironment = {
  root: THREE.Group;
  feedCrate: THREE.Mesh;
  queueCrate: THREE.Mesh;
  pickSupport: THREE.Mesh;
  pickLegs: THREE.Mesh[];
  toolCrate: THREE.Mesh;
  pallet: THREE.Group;
  palletPosts: THREE.Mesh[];
  stackCrates: THREE.Mesh[];
  pickPoint: THREE.Vector3;
  queuePoint: THREE.Vector3;
};

type WeldEnvironment = {
  root: THREE.Group;
  station: THREE.Group;
  legs: THREE.Mesh[];
  contact: THREE.Vector3;
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
  weldTip: THREE.Object3D | null;
  torch: THREE.Group;
  suction: THREE.Group;
  targetOrbit: number;
  orbit: number;
  previewPhase: number | null;
};

function createMaterials() {
  return {
    floor: new THREE.MeshStandardMaterial({ color: 0xe7e5da, metalness: 0.02, roughness: 0.86 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x34464a, metalness: 0.38, roughness: 0.42 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x141711, metalness: 0.16, roughness: 0.58 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xd39b2a, metalness: 0.06, roughness: 0.58 }),
    crate: new THREE.MeshStandardMaterial({ color: 0xd39b2a, metalness: 0.03, roughness: 0.68 }),
    wood: new THREE.MeshStandardMaterial({ color: 0xa65e2e, metalness: 0.02, roughness: 0.74 }),
    plate: new THREE.MeshStandardMaterial({ color: 0xc8cec5, metalness: 0.62, roughness: 0.34 }),
    seam: new THREE.MeshStandardMaterial({
      color: 0x9d5528, emissive: 0xd39b2a, emissiveIntensity: 0, metalness: 0.12, roughness: 0.5,
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

function buildPalletEnvironment(materials: Materials) {
  const root = new THREE.Group();
  const toolCrateSize = HERO_CRATE_SIZE / HERO_ROBOT_SCALE;
  const crate: [number, number, number] = [HERO_CRATE_SIZE, HERO_CRATE_SIZE, HERO_CRATE_SIZE];
  const toolCrate = makeBox(
    [toolCrateSize, toolCrateSize, toolCrateSize],
    materials.crate.clone(),
    [0, 0, 0],
  );
  const feedCrate = makeBox(crate, materials.crate.clone(), [-1.36, 0.56, 0.54]);
  const queueCrate = makeBox(crate, materials.crate.clone(), [-0.94, 0.56, 0.54]);
  const pickSupport = makeBox([0.72, 0.08, 0.34], materials.steel.clone(), [-1.15, 0.38, 0.54]);
  const pickLegs = [[-0.3, -0.13], [0.3, -0.13], [-0.3, 0.13], [0.3, 0.13]].map(
    ([x, z]) => {
      const leg = makeBox([0.045, 1, 0.045], materials.dark.clone(), [x, 0, z]);
      leg.userData.offset = { x, z };
      root.add(leg);
      return leg;
    },
  );
  root.add(pickSupport, feedCrate, queueCrate);

  const pallet = new THREE.Group();
  pallet.position.set(-0.36, 0, -0.74);
  const palletPosts = [[-0.46, -0.34], [0.46, -0.34], [-0.46, 0.34], [0.46, 0.34]].map(
    ([x, z]) => {
      const post = makeBox([0.07, 1, 0.07], materials.dark.clone(), [x, -0.04, z]);
      pallet.add(post);
      return post;
    },
  );
  [-0.38, 0, 0.38].forEach((z) => {
    pallet.add(makeBox([1.08, 0.08, 0.18], materials.wood.clone(), [0, 0.06, z]));
  });
  root.add(pallet);
  const stackCrates = HERO_STACK.map(() => {
    const placed = makeBox(crate, materials.crate.clone(), [0, 0, 0]);
    placed.visible = false;
    root.add(placed);
    return placed;
  });
  return {
    root, feedCrate, queueCrate, pickSupport, pickLegs, toolCrate, pallet, palletPosts, stackCrates,
    pickPoint: feedCrate.position.clone(),
    queuePoint: queueCrate.position.clone(),
  };
}

function buildWeldEnvironment(materials: Materials) {
  const root = new THREE.Group();
  const station = new THREE.Group();
  station.position.set(1.22, 0, -0.36);
  const weldTableTopY = 0.22;
  const basePlateHeight = 0.07;
  const basePlateTopY = weldTableTopY + basePlateHeight;
  const legs = [[-0.5, -0.04], [0.5, -0.04], [-0.5, 0.36], [0.5, 0.36]].map(
    ([x, z]) => {
      const leg = makeBox([0.055, 1, 0.055], materials.dark.clone(), [x, 0, z]);
      station.add(leg);
      return leg;
    },
  );
  station.add(makeBox([1.18, 0.08, 0.52], materials.steel.clone(), [0, 0.18, 0.16]));
  station.add(
    makeBox([0.86, basePlateHeight, 0.42], materials.plate.clone(), [0, weldTableTopY + basePlateHeight / 2, 0]),
    makeBox([0.78, 0.34, 0.075], materials.plate.clone(), [0, basePlateTopY + 0.17, 0]),
  );
  const contact = new THREE.Vector3(0, basePlateTopY + 0.018, -0.058);
  station.add(makeBox([0.7, 0.03, 0.034], materials.seam, [contact.x, contact.y, contact.z]));
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), materials.glow.clone());
  glow.position.copy(contact);
  station.add(glow);
  const sparks = new THREE.Group();
  for (let index = 0; index < 20; index += 1) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.012 + (index % 3) * 0.004, 8, 8),
      materials.glow.clone(),
    );
    spark.userData.seed = index * 0.71;
    sparks.add(spark);
  }
  station.add(sparks);
  root.add(station);
  return { root, station, legs, contact, glow, sparks };
}

function createTools(materials: Materials) {
  const torch = makeArcWeldTorch({
    accent: materials.toolLight.clone(), body: materials.toolMid.clone(),
    dark: materials.toolDark.clone(), metal: materials.toolLight.clone(),
  });
  torch.position.set(0, 0, 0.01);
  torch.scale.setScalar(1.12);
  const suction = makeSuctionGripper({
    accent: materials.toolLight.clone(), cup: materials.toolDark.clone(),
    dark: materials.toolMid.clone(), metal: materials.toolLight.clone(),
  });
  setObjectOpacity(torch, 0);
  setObjectOpacity(suction, 0);
  return { torch, suction };
}

function toolPointForPose(
  state: HeroState,
  robot: URDFRobot,
  pose: FrankaPose,
  tool: THREE.Object3D,
  fingerOpening: number,
) {
  applyFrankaPose(robot, pose, fingerOpening);
  state.context.scene.updateMatrixWorld(true);
  return getLocalPosition(state.cell, tool);
}

function alignPalletEnvironment(state: HeroState, pickPoint: THREE.Vector3, deckCentre: THREE.Vector3) {
  const { pallet } = state;
  pallet.pickPoint.copy(pickPoint);
  pallet.queuePoint.copy(pickPoint).add(new THREE.Vector3(-0.3, 0, 0));
  pallet.feedCrate.position.copy(pallet.pickPoint);
  pallet.queueCrate.position.copy(pallet.queuePoint);
  const supportTop = pickPoint.y - HERO_CRATE_SIZE / 2 - 0.004;
  pallet.pickSupport.position.set(
    (pallet.feedCrate.position.x + pallet.queueCrate.position.x) / 2,
    supportTop - 0.04,
    (pallet.feedCrate.position.z + pallet.queueCrate.position.z) / 2,
  );
  const legHeight = Math.max(0.05, supportTop - 0.08 - HERO_FLOOR_Y);
  pallet.pickLegs.forEach((leg) => {
    const { x, z } = leg.userData.offset as { x: number; z: number };
    leg.position.set(pallet.pickSupport.position.x + x, HERO_FLOOR_Y + legHeight / 2, pallet.pickSupport.position.z + z);
    leg.scale.y = legHeight;
  });
  // The deck boards' top face is 0.1 above the pallet group origin.
  pallet.pallet.position.copy(deckCentre).add(new THREE.Vector3(0, -0.1, 0));
  heroSlots(deckCentre).forEach((slot, index) => pallet.stackCrates[index].position.copy(slot));
  const palletFloorLocal = HERO_FLOOR_Y - pallet.pallet.position.y;
  const postHeight = Math.max(0.05, 0.02 - palletFloorLocal);
  pallet.palletPosts.forEach((post) => {
    post.position.y = palletFloorLocal + postHeight / 2;
    post.scale.y = postHeight;
  });
  state.palletShadow.position.set(pallet.pallet.position.x, HERO_FLOOR_Y + 0.006, pallet.pallet.position.z);
}

function alignWeldEnvironment(
  state: HeroState,
  weldPoint: THREE.Vector3,
  weldEndPoint: THREE.Vector3,
) {
  const { station, contact, legs } = state.weld;
  const center = weldPoint.clone().add(weldEndPoint).multiplyScalar(0.5);
  const direction = weldEndPoint.clone().sub(weldPoint);
  const flat = new THREE.Vector3(direction.x, 0, direction.z);
  if (flat.lengthSq() > 0.0001) {
    flat.normalize();
    station.rotation.y = Math.atan2(-flat.z, flat.x);
  }
  const offset = contact.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), station.rotation.y);
  station.position.copy(center).sub(offset);
  const floorLocal = HERO_FLOOR_Y - station.position.y;
  const legHeight = Math.max(0.06, 0.14 - floorLocal);
  legs.forEach((leg) => {
    leg.position.y = floorLocal + legHeight / 2;
    leg.scale.y = legHeight;
  });
  state.weldShadow.position.set(station.position.x, HERO_FLOOR_Y + 0.008, station.position.z);
}

function loadHeroRobot(state: HeroState) {
  const loader = createFrankaLoader(state.context.baseUrl);
  loader.load(
    getFrankaVisualUrdfUrl(state.context.baseUrl),
    (robot) => {
      if (state.context.isDisposed()) {
        disposeObjectTree(robot);
        return;
      }
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
      const suctionContact = state.suction.getObjectByName("suction-contact") ?? state.suction;
      suctionContact.add(state.pallet.toolCrate);
      state.pallet.toolCrate.position.set(0, 0, HERO_CRATE_SIZE / HERO_ROBOT_SCALE / 2);
      state.weldTip = state.torch.getObjectByName("weld-tip") ?? state.torch;

      const pick = toolPointForPose(state, robot, HERO_POSES.palletPick, state.pallet.toolCrate, 0.034);
      const place = toolPointForPose(state, robot, HERO_POSES.palletPlace, state.pallet.toolCrate, 0.034);
      const weldStart = toolPointForPose(state, robot, HERO_POSES.weldStart, state.weldTip, 0.034);
      const weldEnd = toolPointForPose(state, robot, HERO_POSES.weldEnd, state.weldTip, 0.034);
      const deckCentre = heroDeckCentre(place);
      alignPalletEnvironment(state, pick, deckCentre);
      alignWeldEnvironment(state, weldStart, weldEnd);
      state.plan = planHero(robot, state.pallet.toolCrate, state.cell, pick, deckCentre);
      applyFrankaPose(robot, state.plan.once.startPose, 0.034);
      state.context.canvas.dataset.robotReady = "true";
      state.context.requestRender();
    },
    undefined,
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
      Math.cos(seed * 4.7) * local * 0.24,
      Math.abs(Math.sin(seed * 5.1)) * local * 0.24,
      Math.sin(seed * 2.2 + index) * local * 0.2,
    );
    const material = spark.material as THREE.MeshStandardMaterial;
    material.opacity = weldActive * (1 - local);
    material.transparent = true;
  });
}

function placeHeroCrates(state: HeroState, palletMode: number, placed: number, carrying: boolean, feed: number) {
  const { pallet } = state;
  const palletVisible = palletMode > 0.01;
  pallet.feedCrate.position.copy(pallet.queuePoint).lerp(pallet.pickPoint, feed);
  pallet.feedCrate.visible = palletVisible;
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
  const cycle = getHeroCycleDuration(pass);
  const elapsed = state.previewPhase === null ? frame.elapsed : state.previewPhase * cycle;
  const animation = getHeroAnimationState(elapsed, pass);
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
  state.materials.seam.emissiveIntensity = animation.weldActive
    * (1.2 + Math.sin(frame.elapsed * 16) * 0.25);
  updateSparks(state, frame, animation.weldActive);

  state.orbit += (state.targetOrbit - state.orbit) * 0.08;
  state.cell.rotation.x = animation.spinPulse * 0.12;
  state.cell.rotation.y = -0.32 + state.orbit
    + (animation.spinToWeld + animation.spinToPallet) * Math.PI * 2
    + Math.sin(elapsed * 0.15) * 0.018;
  state.cell.scale.setScalar(1 - animation.spinPulse * 0.05);
  state.context.canvas.dataset.mode = animation.weldMode > 0.5 ? "welding" : "palletizing";
  state.context.canvas.dataset.phase = ((elapsed % cycle) / cycle).toFixed(3);
  state.context.canvas.dataset.placed = String(animation.placed);
  state.context.canvas.dataset.carrying = animation.carrying ? "true" : "false";
  state.context.camera.lookAt(0, 0.72, -0.12);
}

export function createHeroScene(context: SceneContext): SceneController {
  addLighting(context.scene);
  const materials = createMaterials();
  const cell = new THREE.Group();
  cell.rotation.y = -0.32;
  context.scene.add(cell);
  buildFloor(cell, materials);
  const pallet = buildPalletEnvironment(materials);
  const weld = buildWeldEnvironment(materials);
  cell.add(pallet.root, weld.root);
  const palletShadow = makeContactShadow([1.2, 0.9], [-0.35, HERO_FLOOR_Y + 0.006, -0.58], 0.12);
  const weldShadow = makeContactShadow([1.18, 0.72], [1.05, HERO_FLOOR_Y + 0.008, -0.16], 0.12);
  cell.add(
    makeContactShadow([0.84, 0.58], [0.06, HERO_FLOOR_Y + 0.004, 0.08], 0.16),
    palletShadow,
    weldShadow,
  );
  const robotHolder = new THREE.Group();
  robotHolder.position.set(0.08, 0.02, 0.02);
  robotHolder.scale.setScalar(HERO_ROBOT_SCALE);
  cell.add(robotHolder);
  const { torch, suction } = createTools(materials);
  setObjectOpacity(pallet.toolCrate, 0);
  const state: HeroState = {
    context, materials, cell, pallet, weld, palletShadow, weldShadow, robotHolder,
    robot: null, plan: null, weldTip: null, torch, suction,
    targetOrbit: 0, orbit: 0, previewPhase: getPreviewPhase(),
  };
  addOrbitControls(state);
  loadHeroRobot(state);
  return { update: (frame) => updateHero(state, frame) };
}
