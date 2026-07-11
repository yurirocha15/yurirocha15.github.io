import { useEffect, useRef } from "react";
import * as THREE from "three";
import URDFLoader, { type URDFRobot } from "urdf-loader";
import { makeSuctionGripper } from "./RobotTools";

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

const POSES: Record<"home" | "pick" | "carry" | "place", Pose> = {
  home: [-0.34, -0.72, 0.32, -2.22, 0.12, 2.18, 0.66],
  pick: [-0.9, -0.52, 0.5, -2.42, -0.18, 2.42, 0.18],
  carry: [-0.68, -0.82, 0.64, -2.32, 0.24, 2.34, 0.58],
  place: [-0.28, -0.76, 0.82, -2.28, 0.48, 2.2, 0.9],
};

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return x * x * (3 - 2 * x);
}

function mixPose(from: Pose, to: Pose, t: number): Pose {
  return from.map((value, index) => value + (to[index] - value) * t) as Pose;
}

function applyPose(robot: URDFRobot, pose: Pose, fingerOpening: number) {
  ROBOT_JOINTS.forEach((joint, index) => {
    robot.setJointValue(joint, pose[index]);
  });
  robot.setJointValue("finger_joint1", fingerOpening);
  robot.setJointValue("finger_joint2", fingerOpening);
}

function getLocalPosition(parent: THREE.Object3D, object: THREE.Object3D) {
  const world = new THREE.Vector3();
  object.getWorldPosition(world);
  return parent.worldToLocal(world);
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

function disposeTree(root: THREE.Object3D) {
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

export default function PalletizerScene() {
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
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(1.56, 1.12, 1.72);

    const cell = new THREE.Group();
    cell.rotation.y = -0.52;
    scene.add(cell);

    scene.add(new THREE.HemisphereLight(0xf5f0df, 0x34464a, 1.35));
    const keyLight = new THREE.DirectionalLight(0xffffff, 4);
    keyLight.position.set(3.5, 5, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.00025;
    keyLight.shadow.normalBias = 0.03;
    scene.add(keyLight);

    const materials = {
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
    [
      [-0.1, 0.16, -0.1],
      [0.1, 0.16, -0.1],
      [-0.1, 0.16, 0.1],
      [0.1, 0.16, 0.1],
    ].forEach((position) => {
      pallet.add(makeBox([0.16, 0.16, 0.16], materials.crate.clone(), position as [number, number, number]));
    });
    cell.add(pallet);

    const placedCrate = makeBox([0.16, 0.16, 0.16], materials.crate.clone(), [0.82, 0.54, -0.5]);
    cell.add(placedCrate);

    const robotHolder = new THREE.Group();
    robotHolder.position.set(0.08, 0.02, 0.08);
    robotHolder.scale.setScalar(1.05);
    cell.add(robotHolder);

    let robot: URDFRobot | null = null;
    let gripAnchor: THREE.Group | null = null;
    let robotMeshCount = 0;
    let queuedCrateBaseX = feedCrates[1].position.x;
    const carriedCrate = makeBox([0.16, 0.16, 0.16], materials.crate.clone(), [0, 0, 0]);
    carriedCrate.visible = false;
    placedCrate.visible = false;
    cell.add(carriedCrate);
    const suctionTool = makeSuctionGripper({
      accent: materials.toolLight,
      cup: materials.toolDark,
      dark: materials.toolMid,
      metal: materials.toolLight,
    });

    const clock = new THREE.Clock();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const requestedPhase = new URLSearchParams(window.location.search).get("palletPhase");
    const parsedRequestedPhase = requestedPhase === null ? Number.NaN : Number(requestedPhase);
    const previewPhase = import.meta.env.DEV && Number.isFinite(parsedRequestedPhase)
      ? THREE.MathUtils.clamp(parsedRequestedPhase, 0, 0.999)
      : null;
    let frame = 0;
    let disposed = false;
    let visible = false;
    let requestStaticRender = () => {};

    const baseUrl = import.meta.env.BASE_URL.endsWith("/")
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`;
    const loader = new URDFLoader();
    loader.packages = { franka_description: `${baseUrl}franka_description` };
    loader.load(
      `${baseUrl}franka_description/fr3_hero.urdf`,
      (loadedRobot) => {
        if (disposed) {
          disposeTree(loadedRobot);
          return;
        }

        robot = loadedRobot;
        loadedRobot.rotation.x = -Math.PI / 2;
        robotHolder.add(loadedRobot);

        loadedRobot.links.hand.visible = false;
        loadedRobot.getFrame("link8").add(suctionTool);
        const suctionContact = suctionTool.getObjectByName("suction-contact") ?? suctionTool;
        gripAnchor = new THREE.Group();
        gripAnchor.position.set(0, 0, 0.08);
        suctionContact.add(gripAnchor);

        applyPose(loadedRobot, POSES.pick, 0.034);
        cell.updateMatrixWorld(true);
        const pickPoint = getLocalPosition(cell, gripAnchor);

        applyPose(loadedRobot, POSES.place, 0.018);
        cell.updateMatrixWorld(true);
        const placePoint = getLocalPosition(cell, gripAnchor);

        feedCrates[0].position.copy(pickPoint);
        feedCrates[1].position.set(pickPoint.x - 0.38, pickPoint.y, pickPoint.z);
        queuedCrateBaseX = feedCrates[1].position.x;
        conveyor.position.set(pickPoint.x - 0.24, pickPoint.y - 0.2675, pickPoint.z);

        pallet.position.set(placePoint.x, placePoint.y - 0.32, placePoint.z);
        placedCrate.position.copy(placePoint);

        applyPose(loadedRobot, POSES.home, 0.034);
        cell.updateMatrixWorld(true);
        renderer.domElement.dataset.robotReady = "true";
        renderer.domElement.dataset.pickPoint = pickPoint.toArray().map((value) => value.toFixed(3)).join(",");
        renderer.domElement.dataset.placePoint = placePoint.toArray().map((value) => value.toFixed(3)).join(",");
        requestStaticRender();
      },
      undefined,
      (error) => {
        console.warn("Unable to load palletizer robot", error);
      },
    );

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (reduceMotion && visible) renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const render = () => {
      if (disposed || !visible) return;

      const elapsed = reduceMotion ? 1.4 : clock.getElapsedTime();
      const phase = previewPhase ?? (elapsed % 6.4) / 6.4;
      const grasped = phase >= 0.24 && phase < 0.68;

      let pose: Pose;
      if (phase < 0.18) {
        pose = mixPose(POSES.home, POSES.pick, smoothstep(0, 0.18, phase));
      } else if (phase < 0.3) {
        pose = POSES.pick;
      } else if (phase < 0.44) {
        pose = mixPose(POSES.pick, POSES.carry, smoothstep(0.3, 0.44, phase));
      } else if (phase < 0.58) {
        pose = mixPose(POSES.carry, POSES.place, smoothstep(0.44, 0.58, phase));
      } else if (phase < 0.72) {
        pose = POSES.place;
      } else {
        pose = mixPose(POSES.place, POSES.home, smoothstep(0.72, 1, phase));
      }

      if (robot) {
        let fingerOpening = 0.034;
        if (phase >= 0.2 && phase < 0.24) {
          fingerOpening = THREE.MathUtils.lerp(0.034, 0.018, smoothstep(0.2, 0.24, phase));
        } else if (phase >= 0.24 && phase < 0.66) {
          fingerOpening = 0.018;
        } else if (phase >= 0.66 && phase < 0.7) {
          fingerOpening = THREE.MathUtils.lerp(0.018, 0.034, smoothstep(0.66, 0.7, phase));
        }
        applyPose(robot, pose, fingerOpening);

        if (robotMeshCount < 8) {
          robotMeshCount = 0;
          robot.traverse((object) => {
            const mesh = object as THREE.Mesh;
            if (!mesh.isMesh) return;

            robotMeshCount += 1;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            const parentName = mesh.parent?.name ?? mesh.name;
            if (parentName.includes("link0")) {
              mesh.material = materials.dark;
            } else if (/link[1-7]/.test(parentName)) {
              mesh.material = materials.shell;
            }
          });
        }

        if (gripAnchor) {
          cell.updateMatrixWorld(true);
          carriedCrate.position.copy(getLocalPosition(cell, gripAnchor));
        }
      }

      carriedCrate.visible = grasped;
      feedCrates[0].visible = phase < 0.24;
      placedCrate.visible = phase >= 0.68;
      feedCrates[1].position.x = queuedCrateBaseX + Math.sin(elapsed * 0.8) * 0.035;
      cell.rotation.y = -0.52 + Math.sin(elapsed * 0.16) * 0.03;
      renderer.domElement.dataset.phase = phase.toFixed(3);
      renderer.domElement.dataset.carrying = grasped ? "true" : "false";

      camera.lookAt(0.27, 0.48, 0.02);
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

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startRender();
        } else {
          stopRender();
        }
      },
      { threshold: 0.08 },
    );
    visibilityObserver.observe(mount);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      renderer.dispose();
      disposeTree(scene);
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="palletizer-scene" ref={mountRef} aria-hidden="true" />;
}
