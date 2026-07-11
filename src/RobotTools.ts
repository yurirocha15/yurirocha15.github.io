import * as THREE from "three";

type SuctionMaterials = {
  accent: THREE.Material;
  cup: THREE.Material;
  dark: THREE.Material;
  metal: THREE.Material;
};

type WeldGunMaterials = {
  accent: THREE.Material;
  body: THREE.Material;
  copper: THREE.Material;
  dark: THREE.Material;
  metal: THREE.Material;
};

type ArcTorchMaterials = {
  accent: THREE.Material;
  body: THREE.Material;
  dark: THREE.Material;
  metal: THREE.Material;
};

function addShadowMesh<T extends THREE.Mesh>(mesh: T) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeBox(
  size: [number, number, number],
  material: THREE.Material,
  position: [number, number, number],
) {
  const mesh = addShadowMesh(new THREE.Mesh(new THREE.BoxGeometry(...size), material));
  mesh.position.set(...position);
  return mesh;
}

function makeZCylinder(
  radius: number,
  length: number,
  material: THREE.Material,
  position: [number, number, number],
  radialSegments = 20,
) {
  const mesh = addShadowMesh(
    new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, radialSegments), material),
  );
  mesh.position.set(...position);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function makeSegment(
  start: [number, number, number],
  end: [number, number, number],
  radius: number,
  material: THREE.Material,
  endRadius = radius,
  radialSegments = 20,
) {
  const from = new THREE.Vector3(...start);
  const to = new THREE.Vector3(...end);
  const direction = to.clone().sub(from);
  const mesh = addShadowMesh(
    new THREE.Mesh(
      new THREE.CylinderGeometry(endRadius, radius, direction.length(), radialSegments),
      material,
    ),
  );
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
  return mesh;
}

export function makeSuctionGripper(materials: SuctionMaterials) {
  const tool = new THREE.Group();
  tool.name = "vacuum-gripper";

  const flange = makeZCylinder(0.052, 0.035, materials.dark, [0, 0, 0.018]);
  const neck = makeZCylinder(0.036, 0.05, materials.metal, [0, 0, 0.056]);
  const manifold = makeBox([0.18, 0.135, 0.052], materials.accent, [0, 0, 0.092]);
  const controller = makeBox([0.07, 0.075, 0.04], materials.dark, [0, 0, 0.045]);
  tool.add(flange, neck, manifold, controller);

  const cupOffsets: Array<[number, number]> = [
    [-0.052, -0.035],
    [0.052, -0.035],
    [-0.052, 0.035],
    [0.052, 0.035],
  ];

  cupOffsets.forEach(([x, y]) => {
    const stem = makeZCylinder(0.009, 0.065, materials.metal, [x, y, 0.14], 14);
    const bell = addShadowMesh(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.031, 0.03, 20, 1, false),
        materials.cup,
      ),
    );
    bell.position.set(x, y, 0.18);
    bell.rotation.x = Math.PI / 2;
    const rim = addShadowMesh(
      new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.005, 8, 24), materials.cup),
    );
    rim.position.set(x, y, 0.195);
    tool.add(stem, bell, rim);
  });

  const contact = new THREE.Group();
  contact.name = "suction-contact";
  contact.position.set(0, 0, 0.195);
  tool.add(contact);
  return tool;
}

export function makeArcWeldTorch(materials: ArcTorchMaterials) {
  const tool = new THREE.Group();
  tool.name = "robotic-arc-welding-torch";

  const flange = makeZCylinder(0.052, 0.035, materials.dark, [0, 0, 0.018]);
  const wristCoupling = makeZCylinder(0.04, 0.055, materials.metal, [0, 0, 0.06]);
  const body = makeBox([0.105, 0.09, 0.12], materials.body, [0, 0, 0.125]);
  const serviceBlock = makeBox([0.055, 0.105, 0.075], materials.dark, [-0.055, 0, 0.12]);

  const neckStart: [number, number, number] = [0, 0, 0.18];
  const neckBend: [number, number, number] = [0.035, 0, 0.27];
  const nozzleStart: [number, number, number] = [0.09, 0, 0.35];
  const nozzleEnd: [number, number, number] = [0.125, 0, 0.415];
  const contactEnd: [number, number, number] = [0.142, 0, 0.455];

  const insulatedNeck = makeSegment(
    neckStart,
    neckBend,
    0.025,
    materials.body,
    0.022,
  );
  const metalNeck = makeSegment(
    neckBend,
    nozzleStart,
    0.019,
    materials.metal,
    0.017,
  );
  const nozzle = makeSegment(
    nozzleStart,
    nozzleEnd,
    0.032,
    materials.accent,
    0.022,
  );
  const contactTip = makeSegment(
    nozzleEnd,
    contactEnd,
    0.009,
    materials.metal,
    0.006,
    14,
  );

  const neckJoint = addShadowMesh(
    new THREE.Mesh(new THREE.SphereGeometry(0.027, 18, 14), materials.body),
  );
  neckJoint.position.set(...neckBend);
  const nozzleBand = addShadowMesh(
    new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 8, 24), materials.dark),
  );
  nozzleBand.position.set(...nozzleStart);
  nozzleBand.quaternion.copy(nozzle.quaternion);

  const tip = new THREE.Group();
  tip.name = "weld-tip";
  tip.position.set(...contactEnd);

  tool.add(
    flange,
    wristCoupling,
    body,
    serviceBlock,
    insulatedNeck,
    metalNeck,
    nozzle,
    contactTip,
    neckJoint,
    nozzleBand,
    tip,
  );
  return tool;
}

export function makeSpotWeldGun(materials: WeldGunMaterials) {
  const tool = new THREE.Group();
  tool.name = "spot-welding-c-gun";

  const flange = makeZCylinder(0.055, 0.04, materials.dark, [0, 0, -0.02]);
  const servo = makeZCylinder(0.062, 0.1, materials.metal, [0, 0, -0.085]);
  const housing = makeBox([0.15, 0.12, 0.15], materials.body, [-0.015, 0, -0.165]);
  const controller = makeBox([0.075, 0.13, 0.06], materials.dark, [-0.075, 0, -0.13]);

  const spine = makeBox([0.06, 0.105, 0.3], materials.body, [-0.105, 0, -0.36]);
  const upperJaw = makeBox([0.25, 0.095, 0.06], materials.body, [0, 0, -0.235]);
  const lowerJaw = makeBox([0.25, 0.095, 0.06], materials.body, [0, 0, -0.515]);
  const upperJoint = addShadowMesh(
    new THREE.Mesh(new THREE.SphereGeometry(0.055, 18, 14), materials.body),
  );
  upperJoint.position.set(-0.105, 0, -0.235);
  const lowerJoint = upperJoint.clone();
  lowerJoint.position.z = -0.515;

  const actuator = makeZCylinder(0.035, 0.12, materials.metal, [0.09, 0, -0.31]);
  const actuatorBand = makeZCylinder(0.041, 0.028, materials.accent, [0.09, 0, -0.265]);
  const upperElectrode = makeZCylinder(0.014, 0.06, materials.copper, [0.09, 0, -0.375], 16);
  const lowerShank = makeZCylinder(0.026, 0.07, materials.metal, [0.09, 0, -0.48], 16);
  const lowerElectrode = makeZCylinder(0.014, 0.06, materials.copper, [0.09, 0, -0.435], 16);

  const tip = addShadowMesh(
    new THREE.Mesh(new THREE.SphereGeometry(0.017, 14, 10), materials.copper),
  );
  tip.name = "weld-tip";
  tip.position.set(0.09, 0, -0.405);

  tool.add(
    flange,
    servo,
    housing,
    controller,
    spine,
    upperJaw,
    lowerJaw,
    upperJoint,
    lowerJoint,
    actuator,
    actuatorBand,
    upperElectrode,
    lowerShank,
    lowerElectrode,
    tip,
  );
  return tool;
}
