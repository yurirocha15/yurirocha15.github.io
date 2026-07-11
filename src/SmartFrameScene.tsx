import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import URDFLoader, { type URDFRobot } from "urdf-loader";
import { makeSpotWeldGun } from "./RobotTools";

type Pose = [number, number, number, number, number, number, number];

type FrankaRig = {
  robot: URDFRobot;
  holder: THREE.Group;
  station: THREE.Group;
  toolTip: THREE.Object3D;
  sparkGroup: THREE.Group;
  weldGlow: THREE.Mesh;
  weldPose: Pose;
  retractPose: Pose;
  stationIndex: number;
  phase: number;
};

const ROBOT_JOINTS = [
  "joint1",
  "joint2",
  "joint3",
  "joint4",
  "joint5",
  "joint6",
  "joint7",
] as const;

const WELD_POSES: Pose[] = [
  [0.86, -0.64, -0.54, -2.34, 0.92, 2.18, -0.42],
  [1.08, -0.62, -0.7, -2.28, 1.08, 2.08, -0.12],
  [0.72, -0.78, -0.38, -2.42, 0.72, 2.34, -0.58],
  [1.18, -0.72, -0.86, -2.18, 1.2, 1.96, 0.12],
];

const RETRACT_POSES: Pose[] = [
  [0.55, -0.3, -0.2, -1.95, 0.55, 1.72, -0.1],
  [1.38, -0.34, -1.02, -1.9, 1.35, 1.72, 0.18],
  [0.38, -0.46, 0, -2.02, 0.38, 1.9, -0.2],
  [1.5, -0.38, -1.15, -1.82, 1.45, 1.58, 0.45],
];

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

function mixPose(from: Pose, to: Pose, t: number): Pose {
  return from.map((value, index) => value + (to[index] - value) * t) as Pose;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function applyPose(robot: URDFRobot, pose: Pose) {
  ROBOT_JOINTS.forEach((joint, index) => {
    robot.setJointValue(joint, pose[index]);
  });
  robot.setJointValue("finger_joint1", 0.034);
  robot.setJointValue("finger_joint2", 0.034);
}

function setRobotOpacity(robot: URDFRobot, opacity: number) {
  robot.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      material.transparent = opacity < 0.99;
      material.opacity = opacity;
    });
  });
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

function getLocalPosition(parent: THREE.Object3D, object: THREE.Object3D) {
  const world = new THREE.Vector3();
  object.getWorldPosition(world);
  return parent.worldToLocal(world);
}

export default function SmartFrameScene() {
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
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
    camera.position.set(3.05, 2.08, 3.42);

    const line = new THREE.Group();
    scene.add(line);

    const ambient = new THREE.HemisphereLight(0xf5f0df, 0x34464a, 1.3);
    scene.add(ambient);

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

    const materials = {
      floor: new THREE.MeshStandardMaterial({ color: 0xe7e5da, roughness: 0.9 }),
      steel: new THREE.MeshStandardMaterial({ color: 0x34464a, metalness: 0.3, roughness: 0.44 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x151713, metalness: 0.18, roughness: 0.58 }),
      shell: new THREE.MeshStandardMaterial({ color: 0xd5d6cc, metalness: 0.26, roughness: 0.48 }),
      car: new THREE.MeshStandardMaterial({
        color: 0xc8cec5,
        metalness: 0.54,
        roughness: 0.34,
        transparent: true,
        opacity: 0.9,
      }),
      weld: new THREE.MeshStandardMaterial({
        color: 0xf6b932,
        emissive: 0xf6a800,
        emissiveIntensity: 2.3,
        transparent: true,
        opacity: 0.9,
      }),
      toolMid: new THREE.MeshStandardMaterial({
        color: 0x737a76,
        metalness: 0.42,
        opacity: 0.88,
        roughness: 0.4,
        transparent: true,
      }),
      toolLight: new THREE.MeshStandardMaterial({
        color: 0xbfc3bf,
        metalness: 0.56,
        opacity: 0.88,
        roughness: 0.32,
        transparent: true,
      }),
      toolDark: new THREE.MeshStandardMaterial({
        color: 0x444a47,
        metalness: 0.3,
        opacity: 0.88,
        roughness: 0.5,
        transparent: true,
      }),
    };

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 7), materials.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    floor.receiveShadow = true;
    line.add(floor);

    const grid = new THREE.GridHelper(7, 14, 0x8f9484, 0xd0d0c5);
    grid.position.y = 0.002;
    line.add(grid);

    const railLeft = makeBox([0.035, 0.035, 5.8], materials.steel, [-0.84, 0.03, -1.28]);
    const railRight = makeBox([0.035, 0.035, 5.8], materials.steel, [0.84, 0.03, -1.28]);
    line.add(railLeft, railRight);

    const stations = new THREE.Group();
    line.add(stations);

    const stationOffsets = [0, -1.74, -3.48];
    const carStations = stationOffsets.map((z) => {
      const station = new THREE.Group();
      station.position.set(0, 0, z);
      stations.add(station);

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

    const loader = new OBJLoader();
    const baseUrl = import.meta.env.BASE_URL.endsWith("/")
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`;
    const clock = new THREE.Clock();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let disposed = false;
    let visible = false;
    let requestStaticRender = () => {};

    loader.load(
      `${baseUrl}models/smart-frame/simplify_Frame.obj`,
      (object) => {
        if (disposed) {
          disposeTree(object);
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

        carStations.forEach((station, index) => {
          const clone = index === 0 ? centeredCar : centeredCar.clone(true);
          clone.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (mesh.isMesh) {
              mesh.material = materials.car.clone();
              mesh.material.opacity = index === 0 ? 0.86 : Math.max(0.34, 0.56 - index * 0.1);
            }
          });
          station.add(clone);
        });
        requestStaticRender();
      },
      undefined,
      (error) => {
        console.warn("Unable to load smart-frame model", error);
      },
    );

    const frankaRigs: FrankaRig[] = [];
    const robotPlacements = [
      { position: new THREE.Vector3(-0.35, 0.02, -0.92), rotation: Math.PI, phase: 0 },
      { position: new THREE.Vector3(0.48, 0.02, -0.92), rotation: Math.PI, phase: 0.25 },
      { position: new THREE.Vector3(-0.48, 0.02, 0.92), rotation: 0, phase: 0.5 },
      { position: new THREE.Vector3(0.35, 0.02, 0.92), rotation: 0, phase: 0.75 },
    ];

    const urdfLoader = new URDFLoader();
    urdfLoader.packages = { franka_description: `${baseUrl}franka_description` };
    const robotUrl = `${baseUrl}franka_description/fr3_hero.urdf`;

    carStations.forEach((station, stationIndex) => {
      robotPlacements.forEach((placement, placementIndex) => {
        urdfLoader.load(
          robotUrl,
          (robot) => {
            if (disposed) {
              disposeTree(robot);
              return;
            }

            robot.rotation.x = -Math.PI / 2;
            robot.traverse((object) => {
              const mesh = object as THREE.Mesh;
              if (!mesh.isMesh) return;

              mesh.castShadow = true;
              mesh.receiveShadow = true;
              const parentName = mesh.parent?.name ?? mesh.name;
              if (parentName.includes("link0")) {
                mesh.material = materials.dark.clone();
              } else if (/link[1-7]/.test(parentName)) {
                mesh.material = materials.shell.clone();
              }
            });

            if (stationIndex > 0) {
              setRobotOpacity(robot, Math.max(0.46, 0.68 - stationIndex * 0.1));
            }

            const holder = new THREE.Group();
            holder.position.copy(placement.position);
            holder.rotation.y = placement.rotation;
            holder.scale.setScalar(0.78);
            holder.add(robot);
            station.add(holder);

            const link8 = robot.getFrame("link8");
            const tool = makeSpotWeldGun({
              accent: materials.toolLight,
              body: materials.toolMid,
              copper: materials.toolLight,
              dark: materials.toolDark,
              metal: materials.toolLight,
            });
            tool.rotation.set(Math.PI, 0.34, 0);
            tool.position.set(0, 0, 0.015);
            tool.scale.setScalar(1.35);
            link8.add(tool);
            const toolTip = tool.getObjectByName("weld-tip") ?? tool;
            const weldPose = WELD_POSES[placementIndex % WELD_POSES.length];
            const retractPose = RETRACT_POSES[placementIndex % RETRACT_POSES.length];
            applyPose(robot, weldPose);
            const hand = robot.links.hand;
            if (hand) hand.visible = false;

            const weldGlow = new THREE.Mesh(
              new THREE.SphereGeometry(0.045, 14, 10),
              materials.weld.clone(),
            );
            weldGlow.visible = false;
            station.add(weldGlow);
            const sparkGroup = makeSparkGroup(materials.weld, stationIndex === 0 ? 18 : 10);
            station.add(sparkGroup);

            frankaRigs.push({
              robot,
              holder,
              station,
              toolTip,
              sparkGroup,
              weldGlow,
              weldPose,
              retractPose,
              stationIndex,
              phase: placement.phase + stationIndex * 0.08,
            });
            requestStaticRender();
          },
          undefined,
          (error) => {
            console.warn("Unable to load welding-line robot", error);
          },
        );
      });
    });

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

      const elapsed = reduceMotion ? 1.6 : clock.getElapsedTime();
      const activeWelds: number[] = [];
      frankaRigs.forEach((rig) => {
        const cycle = (elapsed * 1.05 + rig.phase) % 1;
        const approach = smoothstep(0, 0.1, cycle);
        const retract = 1 - smoothstep(0.3, 0.42, cycle);
        const contact = approach * retract;
        applyPose(rig.robot, mixPose(rig.retractPose, rig.weldPose, contact));
        activeWelds.push(cycle >= 0.11 && cycle <= 0.32 ? 1 : 0);
      });

      scene.updateMatrixWorld(true);
      frankaRigs.forEach((rig, rigIndex) => {
        const active = activeWelds[rigIndex];
        const tipPosition = getLocalPosition(rig.station, rig.toolTip);
        rig.weldGlow.position.copy(tipPosition);
        rig.sparkGroup.position.copy(tipPosition);
        rig.weldGlow.visible = active > 0;

        const glowMaterial = rig.weldGlow.material as THREE.MeshStandardMaterial;
        glowMaterial.opacity = active * (0.78 + Math.sin(elapsed * 46 + rig.phase * 8) * 0.2);
        glowMaterial.emissiveIntensity = active * 3.2;
        rig.weldGlow.scale.setScalar(0.75 + active * (0.4 + Math.sin(elapsed * 38) * 0.12));

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
      });

      camera.lookAt(-0.08, 0.43, -1.2);
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

  return <div className="smart-frame-scene" ref={mountRef} aria-hidden="true" />;
}
