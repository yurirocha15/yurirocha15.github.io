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

type PlatePoint = [x: number, z: number];

function makeExtrudedPlate(
  points: PlatePoint[],
  thickness: number,
  material: THREE.Material,
  holes: Array<[x: number, z: number, radius: number]> = [],
) {
  const shape = new THREE.Shape();
  shape.moveTo(...points[0]);
  points.slice(1).forEach((point) => shape.lineTo(...point));
  shape.closePath();
  holes.forEach(([x, z, radius]) => {
    const hole = new THREE.Path();
    hole.absarc(x, z, radius, 0, Math.PI * 2, false);
    shape.holes.push(hole);
  });

  const geometry = new THREE.ExtrudeGeometry(shape, {
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.002,
    bevelThickness: 0.002,
    curveSegments: 12,
    depth: thickness,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, thickness / 2, 0);
  geometry.computeVertexNormals();
  return addShadowMesh(new THREE.Mesh(geometry, material));
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

  const flange = makeZCylinder(0.042, 0.024, materials.dark, [0, 0, -0.012], 16);
  const upperArm = makeExtrudedPlate(
    [
      [-0.132, -0.178], [-0.02, -0.195], [0.073, -0.219], [0.105, -0.246],
      [0.094, -0.271], [-0.02, -0.245], [-0.105, -0.225], [-0.14, -0.205],
    ],
    0.032,
    materials.body,
  );
  const spine = makeExtrudedPlate(
    [[-0.14, -0.2], [-0.095, -0.22], [-0.085, -0.455], [-0.105, -0.488], [-0.145, -0.475]],
    0.032,
    materials.body,
    [[-0.113, -0.31, 0.011], [-0.11, -0.4, 0.011]],
  );
  const lowerArm = makeExtrudedPlate(
    [
      [-0.115, -0.475], [-0.02, -0.465], [0.09, -0.452], [0.11, -0.48],
      [0.078, -0.505], [-0.02, -0.495], [-0.14, -0.505],
    ],
    0.032,
    materials.body,
  );
  const driveHousing = makeExtrudedPlate(
    [
      [-0.036, -0.032], [0.036, -0.032], [0.047, -0.058], [0.028, -0.132],
      [-0.028, -0.15], [-0.058, -0.12], [-0.052, -0.06],
    ],
    0.056,
    materials.metal,
  );
  const serviceCover = makeExtrudedPlate(
    [[-0.057, -0.078], [-0.026, -0.092], [-0.04, -0.137], [-0.076, -0.126]],
    0.062,
    materials.dark,
  );
  const frameMount = makeExtrudedPlate(
    [[-0.045, -0.13], [0.025, -0.145], [0.005, -0.2], [-0.065, -0.215], [-0.095, -0.18]],
    0.04,
    materials.metal,
  );
  const actuator = makeZCylinder(0.023, 0.078, materials.metal, [0.09, 0, -0.316], 8);
  const actuatorCollar = makeZCylinder(0.028, 0.016, materials.accent, [0.09, 0, -0.278], 8);
  const upperElectrode = makeSegment(
    [0.09, 0, -0.352], [0.09, 0, -0.405], 0.011, materials.copper, 0.006, 12,
  );
  const lowerShank = makeZCylinder(0.015, 0.03, materials.metal, [0.09, 0, -0.47], 8);
  const lowerElectrode = makeSegment(
    [0.09, 0, -0.455], [0.09, 0, -0.405], 0.011, materials.copper, 0.006, 12,
  );

  const tip = new THREE.Group();
  tip.name = "weld-tip";
  tip.position.set(0.09, 0, -0.405);

  tool.add(
    flange,
    upperArm,
    spine,
    lowerArm,
    driveHousing,
    serviceCover,
    frameMount,
    actuator,
    actuatorCollar,
    upperElectrode,
    lowerShank,
    lowerElectrode,
    tip,
  );
  return tool;
}
