import { useEffect, useRef } from "react";
import * as THREE from "three";
import URDFLoader, { type URDFRobot } from "urdf-loader";
import { makeArcWeldTorch, makeSuctionGripper } from "./RobotTools";

type Pose = [number, number, number, number, number, number, number];

const ROBOT_JOINTS = [
  "joint1",
  "joint2",
  "joint3",
  "joint4",
  "joint5",
  "joint6",
  "joint7",
] as const;

const FLOOR_Y = -0.02;

const POSES: Record<
  "palletHome" | "palletPick" | "palletCarry" | "palletPlace" | "weldStart" | "weldEnd",
  Pose
> = {
  palletHome: [-0.34, -0.72, 0.32, -2.22, 0.12, 2.18, 0.66],
  palletPick: [-0.9, -0.52, 0.5, -2.42, -0.18, 2.42, 0.18],
  palletCarry: [-0.68, -0.82, 0.64, -2.32, 0.24, 2.34, 0.58],
  palletPlace: [-0.28, -0.76, 0.82, -2.28, 0.48, 2.2, 0.9],
  weldStart: [0.86, -0.64, -0.54, -2.34, 0.92, 2.18, -0.42],
  weldEnd: [1.08, -0.62, -0.7, -2.28, 1.08, 2.08, -0.12],
};

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mixPose(from: Pose, to: Pose, t: number): Pose {
  return from.map((value, index) => lerp(value, to[index], t)) as Pose;
}

function setMeshOpacity(object: THREE.Object3D, opacity: number) {
  object.visible = opacity > 0.01;
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      material.transparent = opacity < 0.99;
      material.opacity = opacity;
    });
  });
}

function makeBox(
  size: [number, number, number],
  material: THREE.Material,
  position: [number, number, number],
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeContactShadow(
  size: [number, number],
  position: [number, number, number],
  opacity = 0.18,
) {
  const material = new THREE.MeshBasicMaterial({
    color: 0x1a1c16,
    depthWrite: false,
    transparent: true,
    opacity,
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 40), material);
  shadow.position.set(...position);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(size[0], size[1], 1);
  shadow.renderOrder = 1;
  return shadow;
}

function applyRobotPose(robot: URDFRobot, pose: Pose, fingerOpening: number) {
  ROBOT_JOINTS.forEach((joint, index) => {
    robot.setJointValue(joint, pose[index]);
  });
  robot.setJointValue("finger_joint1", fingerOpening);
  robot.setJointValue("finger_joint2", fingerOpening);
}

function getCellPosition(cell: THREE.Object3D, object: THREE.Object3D) {
  const world = new THREE.Vector3();
  object.updateWorldMatrix(true, false);
  object.getWorldPosition(world);
  return cell.worldToLocal(world);
}

function disposeObjectTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;

    geometries.add(mesh.geometry);
    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((item) => materials.add(item));
    } else {
      materials.add(material);
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

export default function HeroRobotScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(3.05, 2.0, 3.65);

    const cell = new THREE.Group();
    cell.rotation.y = -0.32;
    scene.add(cell);

    const ambient = new THREE.HemisphereLight(0xf5f0df, 0x3f453c, 1.35);
    scene.add(ambient);

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

    const materials = {
      floor: new THREE.MeshStandardMaterial({
        color: 0xe7e5da,
        metalness: 0.02,
        roughness: 0.86,
      }),
      steel: new THREE.MeshStandardMaterial({
        color: 0x34464a,
        metalness: 0.38,
        roughness: 0.42,
      }),
      dark: new THREE.MeshStandardMaterial({
        color: 0x141711,
        metalness: 0.16,
        roughness: 0.58,
      }),
      yellow: new THREE.MeshStandardMaterial({
        color: 0xd39b2a,
        metalness: 0.06,
        roughness: 0.58,
      }),
      crate: new THREE.MeshStandardMaterial({
        color: 0xd39b2a,
        metalness: 0.03,
        roughness: 0.68,
      }),
      wood: new THREE.MeshStandardMaterial({
        color: 0xa65e2e,
        metalness: 0.02,
        roughness: 0.74,
      }),
      plate: new THREE.MeshStandardMaterial({
        color: 0xc8cec5,
        metalness: 0.62,
        roughness: 0.34,
      }),
      seam: new THREE.MeshStandardMaterial({
        color: 0x9d5528,
        emissive: 0xd39b2a,
        emissiveIntensity: 0,
        metalness: 0.12,
        roughness: 0.5,
      }),
      toolLight: new THREE.MeshStandardMaterial({
        color: 0xbfc3bf,
        metalness: 0.54,
        roughness: 0.34,
      }),
      toolMid: new THREE.MeshStandardMaterial({
        color: 0x737a76,
        metalness: 0.42,
        roughness: 0.4,
      }),
      toolDark: new THREE.MeshStandardMaterial({
        color: 0x444a47,
        metalness: 0.3,
        roughness: 0.5,
      }),
      glow: new THREE.MeshStandardMaterial({
        color: 0xf6b932,
        emissive: 0xf6a800,
        emissiveIntensity: 2.4,
        transparent: true,
      }),
    };

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.4), materials.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    floor.receiveShadow = true;
    cell.add(floor);

    const grid = new THREE.GridHelper(7.2, 12, 0x8f9484, 0xd0d0c5);
    grid.position.y = 0.002;
    cell.add(grid);

    const palletCell = new THREE.Group();
    const weldCell = new THREE.Group();
    cell.add(palletCell, weldCell);

    const robotScale = 1.52;
    const cellCrateSize = 0.14;
    const toolCrateSize = cellCrateSize / robotScale;
    const crate: [number, number, number] = [cellCrateSize, cellCrateSize, cellCrateSize];
    const toolFrameCrate: [number, number, number] = [toolCrateSize, toolCrateSize, toolCrateSize];
    const feedCrate = makeBox(crate, materials.crate.clone(), [-1.36, 0.56, 0.54]);
    const queueCrate = makeBox(crate, materials.crate.clone(), [-0.94, 0.56, 0.54]);
    const pickSupport = makeBox([0.72, 0.08, 0.34], materials.steel.clone(), [-1.15, 0.38, 0.54]);
    const pickLegs = [
      [-0.3, -0.13],
      [0.3, -0.13],
      [-0.3, 0.13],
      [0.3, 0.13],
    ].map(([x, z]) => {
      const leg = makeBox([0.045, 1, 0.045], materials.dark.clone(), [x, 0, z]);
      leg.userData.offset = { x, z };
      palletCell.add(leg);
      return leg;
    });
    const toolCrate = makeBox(toolFrameCrate, materials.crate.clone(), [0, 0, 0]);
    palletCell.add(pickSupport, feedCrate, queueCrate);

    const pallet = new THREE.Group();
    pallet.position.set(-0.36, 0, -0.74);
    const palletPosts = [
      [-0.46, -0.34],
      [0.46, -0.34],
      [-0.46, 0.34],
      [0.46, 0.34],
    ].map(([x, z]) => {
      const post = makeBox([0.07, 1, 0.07], materials.dark.clone(), [x, -0.04, z]);
      pallet.add(post);
      return post;
    });
    pallet.add(makeBox([1.08, 0.08, 0.18], materials.wood.clone(), [0, 0.06, -0.38]));
    pallet.add(makeBox([1.08, 0.08, 0.18], materials.wood.clone(), [0, 0.06, 0]));
    pallet.add(makeBox([1.08, 0.08, 0.18], materials.wood.clone(), [0, 0.06, 0.38]));
    palletCell.add(pallet);

    const placedCrate = makeBox(crate, materials.crate.clone(), [-0.44, 0.66, -0.74]);
    palletCell.add(placedCrate);

    const weldStation = new THREE.Group();
    weldStation.position.set(1.22, 0, -0.36);
    const weldTableTopY = 0.22;
    const basePlateHeight = 0.07;
    const basePlateTopY = weldTableTopY + basePlateHeight;
    const verticalPlateHeight = 0.34;
    const weldLegs = [
      [-0.5, -0.04],
      [0.5, -0.04],
      [-0.5, 0.36],
      [0.5, 0.36],
    ].map(([x, z]) => {
      const leg = makeBox([0.055, 1, 0.055], materials.dark.clone(), [x, 0, z]);
      weldStation.add(leg);
      return leg;
    });
    weldStation.add(makeBox([1.18, 0.08, 0.52], materials.steel.clone(), [0, 0.18, 0.16]));
    const basePlate = makeBox([0.86, basePlateHeight, 0.42], materials.plate.clone(), [
      0,
      weldTableTopY + basePlateHeight / 2,
      0,
    ]);
    const verticalPlate = makeBox([0.78, verticalPlateHeight, 0.075], materials.plate.clone(), [
      0,
      basePlateTopY + verticalPlateHeight / 2,
      0,
    ]);
    weldStation.add(basePlate, verticalPlate);
    const weldContactLocal = new THREE.Vector3(0, basePlateTopY + 0.018, -0.058);
    const weldSeam = makeBox([0.7, 0.03, 0.034], materials.seam, [
      weldContactLocal.x,
      weldContactLocal.y,
      weldContactLocal.z,
    ]);
    weldStation.add(weldSeam);
    const weldGlow = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), materials.glow.clone());
    weldGlow.position.copy(weldContactLocal);
    weldStation.add(weldGlow);
    weldCell.add(weldStation);

    const sparks = new THREE.Group();
    for (let i = 0; i < 20; i += 1) {
      const spark = new THREE.Mesh(new THREE.SphereGeometry(0.012 + (i % 3) * 0.004, 8, 8), materials.glow.clone());
      spark.position.set(0, 0, 0);
      spark.userData.seed = i * 0.71;
      sparks.add(spark);
    }
    weldStation.add(sparks);

    const robotContactShadow = makeContactShadow([0.84, 0.58], [0.06, FLOOR_Y + 0.004, 0.08], 0.16);
    const palletContactShadow = makeContactShadow([1.2, 0.9], [-0.35, FLOOR_Y + 0.006, -0.58], 0.12);
    const weldContactShadow = makeContactShadow([1.18, 0.72], [1.05, FLOOR_Y + 0.008, -0.16], 0.12);
    cell.add(robotContactShadow, palletContactShadow, weldContactShadow);

    const baseUrl = import.meta.env.BASE_URL.endsWith("/")
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`;
    const packageRoot = `${baseUrl}franka_description`;
    const robotHolder = new THREE.Group();
    robotHolder.position.set(0.08, 0.02, 0.02);
    robotHolder.scale.setScalar(robotScale);
    cell.add(robotHolder);

    let robot: URDFRobot | null = null;
    let weldTipObject: THREE.Object3D | null = null;
    let requestStaticRender = () => {};
    const toolTorch = makeArcWeldTorch({
      accent: materials.toolLight.clone(),
      body: materials.toolMid.clone(),
      dark: materials.toolDark.clone(),
      metal: materials.toolLight.clone(),
    });
    toolTorch.position.set(0, 0, 0.01);
    toolTorch.rotation.set(0, 0, 0);
    toolTorch.scale.setScalar(1.12);
    const suctionTool = makeSuctionGripper({
      accent: materials.toolLight.clone(),
      cup: materials.toolDark.clone(),
      dark: materials.toolMid.clone(),
      metal: materials.toolLight.clone(),
    });
    setMeshOpacity(toolTorch, 0);
    setMeshOpacity(suctionTool, 0);
    setMeshOpacity(toolCrate, 0);
    const robotMaterials = {
      shell: new THREE.MeshStandardMaterial({
        color: 0xd5d6cc,
        metalness: 0.24,
        roughness: 0.48,
      }),
      dark: new THREE.MeshStandardMaterial({
        color: 0x151711,
        metalness: 0.28,
        roughness: 0.42,
      }),
    };

    const loader = new URDFLoader();
    loader.packages = { franka_description: packageRoot };
    loader.load(
      `${packageRoot}/fr3_hero.urdf`,
      (loadedRobot) => {
        robot = loadedRobot;
        robot.rotation.x = -Math.PI / 2;
        robot.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;

          mesh.castShadow = true;
          mesh.receiveShadow = true;
          const parentName = mesh.parent?.name ?? mesh.name;
          if (parentName.includes("link0")) {
            mesh.material = robotMaterials.dark;
          } else if (/link[1-7]/.test(parentName)) {
            mesh.material = robotMaterials.shell;
          }
        });
        robotHolder.add(robot);
        loadedRobot.links.hand.visible = false;
        loadedRobot.getFrame("link8").add(toolTorch, suctionTool);
        const suctionContact = suctionTool.getObjectByName("suction-contact") ?? suctionTool;
        suctionContact.add(toolCrate);
        toolCrate.position.set(0, 0, toolCrateSize / 2);

        const weldTip = toolTorch.getObjectByName("weld-tip") ?? toolTorch;
        weldTipObject = weldTip;
        const toolPointForPose = (pose: Pose, tool: THREE.Object3D, fingerOpening = 0.004) => {
          applyRobotPose(loadedRobot, pose, fingerOpening);
          scene.updateMatrixWorld(true);
          return getCellPosition(cell, tool);
        };

        const pickPoint = toolPointForPose(POSES.palletPick, toolCrate, 0.026);
        const placePoint = toolPointForPose(POSES.palletPlace, toolCrate, 0.026);
        const weldPoint = toolPointForPose(POSES.weldStart, weldTip, 0.032);

        feedCrate.position.copy(pickPoint);
        queueCrate.position.copy(pickPoint).add(new THREE.Vector3(-0.3, 0, -0.08));
        const pickSupportTop = pickPoint.y - cellCrateSize / 2 - 0.004;
        pickSupport.position.set(
          (feedCrate.position.x + queueCrate.position.x) / 2,
          pickSupportTop - 0.04,
          (feedCrate.position.z + queueCrate.position.z) / 2,
        );
        const pickLegHeight = Math.max(0.05, pickSupportTop - 0.08 - FLOOR_Y);
        pickLegs.forEach((leg) => {
          const offset = leg.userData.offset as { x: number; z: number };
          leg.position.set(
            pickSupport.position.x + offset.x,
            FLOOR_Y + pickLegHeight / 2,
            pickSupport.position.z + offset.z,
          );
          leg.scale.y = pickLegHeight;
        });

        placedCrate.position.copy(placePoint);
        pallet.position.set(
          placePoint.x + 0.03,
          placePoint.y - cellCrateSize / 2 - 0.1,
          placePoint.z + 0.03,
        );
        const palletFloorLocal = FLOOR_Y - pallet.position.y;
        const palletPostTop = 0.02;
        const palletPostHeight = Math.max(0.05, palletPostTop - palletFloorLocal);
        palletPosts.forEach((post) => {
          post.position.y = palletFloorLocal + palletPostHeight / 2;
          post.scale.y = palletPostHeight;
        });
        palletContactShadow.position.set(pallet.position.x, FLOOR_Y + 0.006, pallet.position.z);

        const weldEndPoint = toolPointForPose(POSES.weldEnd, weldTip, 0.034);
        const weldCenter = weldPoint.clone().add(weldEndPoint).multiplyScalar(0.5);
        const weldDirection = weldEndPoint.clone().sub(weldPoint);
        const weldDirectionFlat = new THREE.Vector3(weldDirection.x, 0, weldDirection.z);
        if (weldDirectionFlat.lengthSq() > 0.0001) {
          weldDirectionFlat.normalize();
          weldStation.rotation.y = Math.atan2(-weldDirectionFlat.z, weldDirectionFlat.x);
        }
        const weldContactOffset = weldContactLocal.clone().applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          weldStation.rotation.y,
        );
        weldStation.position.copy(weldCenter).sub(weldContactOffset);
        const weldFloorLocal = FLOOR_Y - weldStation.position.y;
        const weldLegTop = 0.14;
        const weldLegHeight = Math.max(0.06, weldLegTop - weldFloorLocal);
        weldLegs.forEach((leg) => {
          leg.position.y = weldFloorLocal + weldLegHeight / 2;
          leg.scale.y = weldLegHeight;
        });
        weldContactShadow.position.set(weldStation.position.x, FLOOR_Y + 0.008, weldStation.position.z);

        applyRobotPose(robot, POSES.palletHome, 0.034);
        requestStaticRender();
      },
      undefined,
      (error) => {
        console.warn("Unable to load robot scene assets", error);
      },
    );

    let targetOrbit = 0;
    let orbit = 0;
    let dragging = false;
    let lastX = 0;

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor = "grabbing";
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const delta = event.clientX - lastX;
      lastX = event.clientX;
      targetOrbit += delta * 0.008;
      requestStaticRender();
    };

    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      renderer.domElement.style.cursor = "grab";
    };

    renderer.domElement.dataset.scene = "franka-robot-cell";
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      requestStaticRender();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const clock = new THREE.Clock();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frame = 0;
    let disposed = false;
    let visible = false;

    const render = () => {
      if (disposed || !visible) return;

      const elapsed = reduceMotion ? 2.2 : clock.getElapsedTime();
      const cycle = (elapsed % 11.2) / 11.2;
      const spinToWeld = smoothstep(0.42, 0.5, cycle);
      const spinToPallet = smoothstep(0.86, 0.94, cycle);
      const weldMode = spinToWeld * (1 - spinToPallet);
      const palletMode = 1 - weldMode;
      const spinPulse = Math.max(
        Math.sin(spinToWeld * Math.PI),
        Math.sin(spinToPallet * Math.PI),
      );
      const palletPhase = Math.min(cycle / 0.42, 1);
      const carryIn = smoothstep(0.2, 0.28, palletPhase);
      const carryOut = 1 - smoothstep(0.62, 0.72, palletPhase);
      const carrying = Math.max(0, Math.min(carryIn, carryOut)) * palletMode;
      const placed = smoothstep(0.66, 0.76, palletPhase) * palletMode;
      const weldActive =
        weldMode *
        smoothstep(0.54, 0.6, cycle) *
        (1 - smoothstep(0.78, 0.84, cycle));

      let pose: Pose;
      if (cycle < 0.42) {
        if (palletPhase < 0.22) {
          pose = mixPose(POSES.palletHome, POSES.palletPick, smoothstep(0, 0.22, palletPhase));
        } else if (palletPhase < 0.46) {
          pose = mixPose(POSES.palletPick, POSES.palletCarry, smoothstep(0.22, 0.46, palletPhase));
        } else if (palletPhase < 0.74) {
          pose = mixPose(POSES.palletCarry, POSES.palletPlace, smoothstep(0.46, 0.74, palletPhase));
        } else {
          pose = mixPose(POSES.palletPlace, POSES.palletHome, smoothstep(0.74, 1, palletPhase));
        }
      } else if (cycle < 0.5) {
        pose = mixPose(POSES.palletHome, POSES.weldStart, spinToWeld);
      } else if (cycle < 0.86) {
        const weldPhase = (cycle - 0.5) / 0.36;
        const sweep = (Math.sin(weldPhase * Math.PI * 2 - Math.PI / 2) + 1) / 2;
        pose = mixPose(POSES.weldStart, POSES.weldEnd, sweep);
      } else {
        pose = mixPose(POSES.weldStart, POSES.palletHome, spinToPallet);
      }

      if (robot) {
        applyRobotPose(robot, pose, carrying > 0.08 ? 0.026 : 0.034);
      }

      if (weldTipObject) {
        scene.updateMatrixWorld(true);
        const tipPosition = getCellPosition(weldStation, weldTipObject);
        weldGlow.position.copy(tipPosition);
        sparks.position.copy(tipPosition);
      }

      setMeshOpacity(palletCell, palletMode);
      setMeshOpacity(weldCell, weldMode);
      setMeshOpacity(palletContactShadow, palletMode * 0.12);
      setMeshOpacity(weldContactShadow, weldMode * 0.12);
      setMeshOpacity(suctionTool, palletMode);
      setMeshOpacity(toolTorch, weldMode);
      setMeshOpacity(toolCrate, carrying);
      setMeshOpacity(feedCrate, palletMode * (1 - carrying));
      setMeshOpacity(placedCrate, placed);
      setMeshOpacity(weldGlow, weldActive);

      const seamMaterial = materials.seam;
      seamMaterial.emissiveIntensity = weldActive * (1.2 + Math.sin(elapsed * 16) * 0.25);

      sparks.children.forEach((child, index) => {
        const spark = child as THREE.Mesh;
        const seed = spark.userData.seed as number;
        const local = (elapsed * 3.4 + seed) % 1;
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

      orbit += (targetOrbit - orbit) * 0.08;
      cell.rotation.x = spinPulse * 0.12;
      cell.rotation.y =
        -0.32 +
        orbit +
        (spinToWeld + spinToPallet) * Math.PI * 2 +
        Math.sin(elapsed * 0.15) * 0.018;
      cell.scale.setScalar(1 - spinPulse * 0.05);
      renderer.domElement.dataset.mode = weldMode > 0.5 ? "welding" : "palletizing";
      camera.lookAt(0, 0.72, -0.12);
      renderer.render(scene, camera);
      if (!reduceMotion) frame = window.requestAnimationFrame(render);
    };

    requestStaticRender = () => {
      if (reduceMotion && visible) render();
    };

    const startRender = () => {
      if (disposed || visible) return;
      visible = true;
      clock.start();
      render();
    };

    const stopRender = () => {
      visible = false;
      window.cancelAnimationFrame(frame);
    };

    let visibilityObserver: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            startRender();
          } else {
            stopRender();
          }
        },
        { rootMargin: "120px 0px", threshold: 0.05 },
      );
      visibilityObserver.observe(mount);
    } else {
      startRender();
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      visibilityObserver?.disconnect();
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.dispose();
      disposeObjectTree(scene);
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="robot-scene-panel">
      <div className="robot-scene-canvas" ref={mountRef} aria-hidden="true" />
    </div>
  );
}
