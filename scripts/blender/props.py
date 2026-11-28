"""Models the tools and props of the site's robot scenes and exports them as one GLB.

Headless export (see scripts/build-props.mjs, which also compresses the result):
    blender -b --factory-startup -P scripts/blender/props.py -- <raw.glb>
Preview in a running Blender: exec this file, then call build_all() and layout_preview().

Units are metres and Z is up. Each asset is one object at the origin, named after the asset:
- tools are in the robot flange frame (link8): the tool axis is +Z, except the spot-welding gun,
  which hangs along -Z and is turned over by the scene;
- the carton is centred on its origin; the other props stand on their origin, or have it on the
  top surface where parts are placed (pallet deck, conveyor belt and rollers, welding table).
Every material is named after its role; the scenes swap roles for their own palette and keep the
colours below for roles they leave out. Empties named "<asset>-<point>" mark tool centre points
and weld seams; the scene code holds the same numbers and a unit test compares them.
"""
import math
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

TAU = math.tau
# Round parts are modelled with generous side counts; this scales them down to what reads at the
# size the site shows them. Hexagons and other low counts (12 or fewer) stay as they are.
SIDES_SCALE = 0.6
COLLECTION = "site-props"
PREVIEW_COLLECTION = "site-props-preview"

# role: (sRGB colour, metallic, roughness)
ROLES = {
    "metal": (0xbfc3bf, 0.65, 0.32),
    "body": (0x737a76, 0.45, 0.42),
    "dark": (0x2b2f2c, 0.3, 0.5),
    "accent": (0xd39b2a, 0.1, 0.5),
    "cup": (0x1d201d, 0.0, 0.72),
    "copper": (0xb8733e, 0.85, 0.3),
    "hose": (0x34464a, 0.05, 0.6),
    "cardboard": (0xc99a5b, 0.0, 0.86),
    "tape": (0xe2cfa3, 0.0, 0.42),
    "label": (0xf1efe6, 0.0, 0.7),
    "wood": (0xb98a55, 0.0, 0.8),
    "wood-dark": (0x8f633a, 0.0, 0.82),
    "steel": (0x34464a, 0.35, 0.45),
    "frame": (0x1c1f1b, 0.25, 0.55),
    "plate": (0xc8cec5, 0.6, 0.35),
    "roller": (0xc4c8c3, 0.75, 0.28),
    "belt": (0x232622, 0.0, 0.8),
    "rubber": (0x161816, 0.0, 0.85),
}


# ---------------------------------------------------------------- materials and objects


def linear(hex_colour):
    def channel(value):
        value /= 255
        return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4

    return (
        channel((hex_colour >> 16) & 255),
        channel((hex_colour >> 8) & 255),
        channel(hex_colour & 255),
        1.0,
    )


def material(role):
    existing = bpy.data.materials.get(role)
    if existing:
        return existing
    colour, metallic, roughness = ROLES[role]
    mat = bpy.data.materials.new(role)
    if not mat.node_tree:
        mat.use_nodes = True
    bsdf = next(node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = linear(colour)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    mat.diffuse_color = linear(colour)
    mat.use_backface_culling = True
    return mat


def collection(name):
    coll = bpy.data.collections.get(name)
    if not coll:
        coll = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(coll)
    return coll


def from_bmesh(bm, role, matrix=None, name="part"):
    if matrix is not None:
        bm.transform(matrix)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    collection(COLLECTION).objects.link(obj)
    mesh.materials.append(material(role))
    return obj


def place(location=(0, 0, 0), rotation=(0, 0, 0), axis=None):
    """Matrix for a part: rotation in XYZ Euler radians, or `axis` to turn local +Z onto it."""
    if axis is not None:
        z = Vector(axis).normalized()
        rot = Vector((0, 0, 1)).rotation_difference(z).to_matrix().to_4x4()
    else:
        rot = Matrix.Rotation(rotation[2], 4, "Z") @ Matrix.Rotation(rotation[1], 4, "Y") @ Matrix.Rotation(rotation[0], 4, "X")
    return Matrix.Translation(location) @ rot


def bevel(obj, width, segments=3, angle=40):
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(angle)
    mod.miter_outer = "MITER_ARC"
    return obj


def apply_modifiers(obj):
    if not obj.modifiers:
        return
    depsgraph = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph))
    old = obj.data
    obj.modifiers.clear()
    obj.data = mesh
    bpy.data.meshes.remove(old)


def subtract(obj, cutters):
    """Boolean difference with every cutter, which is then deleted."""
    if not cutters:
        return obj
    cutter = merge("cutter", cutters, smooth=False)
    mod = obj.modifiers.new("cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cutter
    try:
        mod.solver = "EXACT"
    except TypeError:
        pass
    apply_modifiers(obj)
    mesh = cutter.data
    bpy.data.objects.remove(cutter)
    bpy.data.meshes.remove(mesh)
    return obj


def merge(name, parts, smooth=True, sharp_angle=35):
    """Joins parts into one object with one material slot per role. Each part stays a closed
    shell of its own: vertices of parts that touch are not welded together."""
    materials = []
    bm = bmesh.new()
    for obj in parts:
        apply_modifiers(obj)
        source = bmesh.new()
        source.from_mesh(obj.data)
        remap = []
        for mat in obj.data.materials:
            if mat not in materials:
                materials.append(mat)
            remap.append(materials.index(mat))
        for face in source.faces:
            face.material_index = remap[face.material_index] if remap else 0
        source.transform(obj.matrix_world)
        staging = bpy.data.meshes.new("staging")
        source.to_mesh(staging)
        source.free()
        bm.from_mesh(staging)
        bpy.data.meshes.remove(staging)
        mesh = obj.data
        bpy.data.objects.remove(obj)
        bpy.data.meshes.remove(mesh)
    # Bevels wider than half a thin part leave zero-length edges; collapse them within each part.
    bmesh.ops.dissolve_degenerate(bm, dist=1e-7, edges=bm.edges)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for mat in materials:
        mesh.materials.append(mat)
    if smooth:
        mesh.shade_smooth()
        mesh.set_sharp_from_angle(angle=math.radians(sharp_angle))
    obj = bpy.data.objects.new(name, mesh)
    collection(COLLECTION).objects.link(obj)
    return obj


# ---------------------------------------------------------------- shapes


def box(size, location, role, bevel_width=0.0, rotation=(0, 0, 0), segments=3):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bm.transform(Matrix.Diagonal((*size, 1)))
    obj = from_bmesh(bm, role, place(location, rotation))
    if bevel_width:
        bevel(obj, bevel_width, segments)
    return obj


def round_sides(sides):
    return sides if sides <= 12 else max(12, round(sides * SIDES_SCALE))


def cylinder(radius, depth, location, role, sides=32, axis=(0, 0, 1), radius_top=None, bevel_width=0.0):
    sides = round_sides(sides)
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=sides,
        radius1=radius, radius2=radius if radius_top is None else radius_top, depth=depth,
    )
    obj = from_bmesh(bm, role, place(location, axis=axis))
    if bevel_width:
        bevel(obj, bevel_width, 2)
    return obj


def lathe(profile, role, sides=32, location=(0, 0, 0), axis=(0, 0, 1), closed=False):
    """Revolves (radius, z) points about Z. Points on the axis close the solid."""
    sides = round_sides(sides)
    bm = bmesh.new()
    verts = [bm.verts.new((r, 0, z)) for r, z in profile]
    edges = [bm.edges.new((verts[i], verts[i + 1])) for i in range(len(verts) - 1)]
    if closed:
        edges.append(bm.edges.new((verts[-1], verts[0])))
    bmesh.ops.spin(
        bm, geom=verts + edges, cent=(0, 0, 0), axis=(0, 0, 1), dvec=(0, 0, 0),
        angle=TAU, steps=sides, use_merge=True, use_duplicate=False,
    )
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return from_bmesh(bm, role, place(location, axis=axis))


def fillet(points, radius, segments=3):
    """Rounds the corners of a closed 2D polygon; `radius` is one value or one per corner."""
    out = []
    count = len(points)
    for i in range(count):
        r = radius[i] if isinstance(radius, (list, tuple)) else radius
        p = Vector(points[i])
        a = Vector(points[i - 1])
        b = Vector(points[(i + 1) % count])
        if r <= 0:
            out.append(p)
            continue
        d1 = (a - p).normalized()
        d2 = (b - p).normalized()
        angle = d1.angle(d2)
        if angle < 1e-3 or abs(angle - math.pi) < 1e-3:
            out.append(p)
            continue
        t = min(r / math.tan(angle / 2), (a - p).length * 0.49, (b - p).length * 0.49)
        r_eff = t * math.tan(angle / 2)
        p1 = p + d1 * t
        p2 = p + d2 * t
        centre = p + (d1 + d2).normalized() * (r_eff / math.sin(angle / 2))
        a1 = math.atan2((p1 - centre).y, (p1 - centre).x)
        a2 = math.atan2((p2 - centre).y, (p2 - centre).x)
        delta = (a2 - a1 + math.pi) % TAU - math.pi
        for k in range(segments + 1):
            angle_k = a1 + delta * k / segments
            out.append(centre + Vector((math.cos(angle_k), math.sin(angle_k))) * r_eff)
    return out


def prism(points, depth, role, axis="Y", offset=0.0, location=(0, 0, 0)):
    """Extrudes a 2D polygon by `depth` along `axis`, centred on `offset` along it.
    The polygon is in (x, z) for axis Y, (y, z) for axis X and (x, y) for axis Z."""
    def to3(u, v, w):
        if axis == "Y":
            return Vector((u, w, v))
        if axis == "X":
            return Vector((w, u, v))
        return Vector((u, v, w))

    bm = bmesh.new()
    lower = [bm.verts.new(to3(u, v, offset - depth / 2)) for u, v in points]
    upper = [bm.verts.new(to3(u, v, offset + depth / 2)) for u, v in points]
    bm.faces.new(lower)
    bm.faces.new(upper)
    n = len(points)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((lower[i], lower[j], upper[j], upper[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return from_bmesh(bm, role, Matrix.Translation(location))


def circle_profile(radius, sides=12):
    sides = round_sides(sides)
    return [(radius * math.cos(TAU * k / sides), radius * math.sin(TAU * k / sides)) for k in range(sides)]


def sweep(points, role, radius=0.005, profile=None, caps=True, up=None):
    """Sweeps a closed 2D profile (default a circle) along a 3D polyline with parallel transport."""
    shape = profile or circle_profile(radius)
    pts = [Vector(p) for p in points]
    tangents = []
    for i in range(len(pts)):
        if i == 0:
            t = pts[1] - pts[0]
        elif i == len(pts) - 1:
            t = pts[-1] - pts[-2]
        else:
            t = pts[i + 1] - pts[i - 1]
        tangents.append(t.normalized())
    reference = Vector(up) if up else (Vector((0, 0, 1)) if abs(tangents[0].z) < 0.9 else Vector((1, 0, 0)))
    normal = tangents[0].cross(reference).normalized()
    bm = bmesh.new()
    rings = []
    for i, p in enumerate(pts):
        t = tangents[i]
        if i:
            axis = tangents[i - 1].cross(t)
            if axis.length > 1e-9:
                normal = Matrix.Rotation(tangents[i - 1].angle(t), 3, axis.normalized()) @ normal
            normal = (normal - t * normal.dot(t)).normalized()
        binormal = t.cross(normal)
        rings.append([bm.verts.new(p + normal * u + binormal * v) for u, v in shape])
    sides = len(shape)
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(sides):
            bm.faces.new((r0[k], r0[(k + 1) % sides], r1[(k + 1) % sides], r1[k]))
    if caps:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return from_bmesh(bm, role)


def bezier(p0, p1, p2, p3, steps=16):
    p0, p1, p2, p3 = (Vector(p) for p in (p0, p1, p2, p3))
    out = []
    for i in range(steps + 1):
        s = i / steps
        u = 1 - s
        out.append(p0 * u ** 3 + p1 * 3 * u * u * s + p2 * 3 * u * s * s + p3 * s ** 3)
    return out


def helix(radius, z0, z1, turns, centre=(0, 0), steps_per_turn=16):
    count = int(turns * steps_per_turn)
    return [
        (
            centre[0] + radius * math.cos(TAU * turns * i / count),
            centre[1] + radius * math.sin(TAU * turns * i / count),
            z0 + (z1 - z0) * i / count,
        )
        for i in range(count + 1)
    ]


def marker(asset, point, location, direction=None):
    """Empty `<asset>-<point>`; its Z axis follows `direction` when given."""
    empty = bpy.data.objects.new(f"{asset}-{point}", None)
    empty.empty_display_type = "ARROWS"
    empty.empty_display_size = 0.03
    empty.matrix_world = place(location, axis=direction) if direction else Matrix.Translation(location)
    collection(COLLECTION).objects.link(empty)
    return empty


def tslot_profile(size=0.018, slot=0.005, depth=0.003, open_top=False):
    """Section of an aluminium T-slot profile in (u, v), slots on the sides and the bottom."""
    h = size / 2
    w = slot / 2
    points = [(-h, -h), (h, -h), (h, -w), (h - depth, -w), (h - depth, w), (h, w), (h, h),
              (w, h), (w, h - depth), (-w, h - depth), (-w, h), (-h, h),
              (-h, w), (-h + depth, w), (-h + depth, -w), (-h, -w)]
    radii = [0.0015 if abs(abs(u) - h) < 1e-9 and abs(abs(v) - h) < 1e-9 else 0.0 for u, v in points]
    return fillet(points, radii, 3)


# ---------------------------------------------------------------- tools


def tool_suction():
    """Four bellows cups on spring plungers, two T-slot profiles, a vacuum ejector with hoses.
    The cup lips touch z = 0.195 (the "contact" point)."""
    parts = [
        lathe([(0, 0), (0.04, 0), (0.04, 0.007), (0.037, 0.01), (0.03, 0.012), (0, 0.012)], "dark", 48),
        lathe([(0, 0.012), (0.03, 0.012), (0.03, 0.018), (0.022, 0.021), (0.022, 0.039),
               (0.026, 0.042), (0.026, 0.046), (0, 0.046)], "metal", 40),
        box((0.032, 0.074, 0.010), (0, 0, 0.051), "accent", 0.0015),
    ]
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        parts.append(cylinder(0.0042, 0.003, (0.033 * math.cos(a), 0.033 * math.sin(a), 0.0135), "metal", 16))
    for y in (-0.026, 0.026):
        parts.append(prism(tslot_profile(), 0.094, "accent", axis="X", location=(0, y, 0.065)))
    # Vacuum ejector across the +x ends of the profiles, with a silencer and an indicator.
    parts.append(box((0.03, 0.074, 0.022), (0.062, 0, 0.065), "dark", 0.002))
    parts.append(box((0.031, 0.02, 0.004), (0.062, -0.018, 0.0535), "accent", 0.0008))
    parts.append(cylinder(0.0065, 0.026, (0.088, 0.016, 0.065), "metal", 16, axis=(1, 0, 0), bevel_width=0.001))
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * 0.026, sy * 0.026
            parts += [
                cylinder(0.0045, 0.1, (x, y, 0.095), "metal", 12),
                cylinder(0.0068, 0.004, (x, y, 0.054), "metal", 6),
                cylinder(0.0068, 0.004, (x, y, 0.076), "metal", 6),
                sweep(helix(0.0062, 0.08, 0.114, 6, (x, y), 10), "dark", 0.001, profile=circle_profile(0.001, 5)),
                cylinder(0.0064, 0.005, (x, y, 0.1165), "metal", 16),
                cylinder(0.0064, 0.006, (x, y, 0.143), "metal", 6),
                cylinder(0.0036, 0.006, (x, y, 0.049), "metal", 12),
                lathe([(0, 0.146), (0.0062, 0.146), (0.0068, 0.15), (0.0128, 0.1545), (0.0092, 0.1595),
                       (0.0152, 0.1645), (0.0118, 0.169), (0.0172, 0.176), (0.0187, 0.188),
                       (0.0192, 0.1932), (0.0186, 0.195), (0.0162, 0.195), (0.0146, 0.1915), (0, 0.1885)],
                      "cup", 24, location=(x, y, 0)),
            ]
            # Hose from the ejector's top face over to the plunger's elbow.
            start = Vector((0.054 + 0.004 * sy, y * 0.55, 0.054))
            end = Vector((x, y, 0.046))
            parts.append(sweep(bezier(start, start + Vector((0, 0, -0.022)), end + Vector((0, 0, -0.026)), end, 10),
                               "hose", 0.0024, profile=circle_profile(0.0024, 8)))
    obj = merge("tool_suction", parts)
    marker("tool_suction", "contact", (0, 0, 0.195))
    return obj


TORCH_TCP = Vector((0.142, 0.0, 0.455))
TORCH_ANGLE = math.radians(22.5)


def tool_arc_torch():
    """Robotic MIG torch: collision sensor, clamp, straight body, 22.5-degree swan neck, gas nozzle,
    contact tip and 15 mm of wire. The wire tip is the TCP; its Z axis follows the nozzle."""
    d = Vector((math.sin(TORCH_ANGLE), 0, math.cos(TORCH_ANGLE)))
    body_x = 0.058
    bend_radius = 0.12
    bend_end_x = body_x + bend_radius * (1 - math.cos(TORCH_ANGLE))
    s_bend = (TORCH_TCP.x - bend_end_x) / d.x
    bend_end = TORCH_TCP - d * s_bend
    bend_start_z = bend_end.z - bend_radius * math.sin(TORCH_ANGLE)
    nozzle_start = TORCH_TCP - d * 0.064

    parts = [
        lathe([(0, 0), (0.046, 0), (0.046, 0.01), (0.043, 0.012), (0, 0.012)], "dark", 48),
        lathe([(0, 0.012), (0.038, 0.012), (0.04, 0.015), (0.04, 0.034), (0.036, 0.036), (0, 0.036)], "metal", 40),
        lathe([(0, 0.036), (0.034, 0.036), (0.037, 0.039), (0.034, 0.042), (0.037, 0.045), (0.034, 0.048), (0, 0.048)], "dark", 40),
        lathe([(0, 0.048), (0.037, 0.048), (0.039, 0.051), (0.039, 0.066), (0.036, 0.069), (0, 0.069)], "metal", 40),
        box((0.1, 0.044, 0.026), (0.03, 0, 0.081), "body", 0.004),
        lathe([(0, 0.07), (0.025, 0.07), (0.027, 0.073), (0.027, 0.11), (0.025, 0.113), (0, 0.113)], "body", 32,
              location=(body_x, 0, 0)),
        cylinder(0.005, 0.03, (body_x, 0.03, 0.09), "metal", 6, axis=(0, 1, 0)),
        cylinder(0.0165, bend_start_z - 0.058, (body_x, 0, (0.058 + bend_start_z) / 2), "body", 28),
        lathe([(0, 0.05), (0.0175, 0.05), (0.0185, 0.053), (0.0185, 0.062), (0, 0.062)], "dark", 28, location=(body_x, 0, 0)),
    ]
    for z in (0.125, 0.14, 0.155):
        parts.append(lathe([(0.0164, z), (0.0182, z + 0.002), (0.0182, z + 0.006), (0.0164, z + 0.008)],
                           "dark", 28, location=(body_x, 0, 0), closed=True))
    # Swan neck: the bend, then straight to the nozzle.
    path = []
    for i in range(13):
        a = TORCH_ANGLE * i / 12
        path.append((body_x + bend_radius * (1 - math.cos(a)), 0, bend_start_z + bend_radius * math.sin(a)))
    path.append(tuple(nozzle_start + d * 0.004))
    parts.append(sweep([(body_x, 0, bend_start_z - 0.004)] + path, "metal", 0.0125, profile=circle_profile(0.0125, 24)))
    # Gas nozzle with its insulator, contact tip and wire, built along +Z and turned onto d.
    frame = Matrix.Translation(nozzle_start) @ Vector((0, 0, 1)).rotation_difference(d).to_matrix().to_4x4()
    nozzle = lathe([(0.0128, -0.004), (0.0142, 0.0), (0.0142, 0.03), (0.0118, 0.052), (0.0106, 0.0525),
                    (0.0082, 0.051), (0.0094, 0.02), (0.0094, 0.0), (0.0110, -0.004)], "accent", 32, closed=True)
    insulator = lathe([(0, -0.012), (0.0136, -0.012), (0.0138, -0.004), (0, -0.004)], "dark", 32)
    # Tip holder (gas diffuser) from the insulator into the contact tip.
    holder = lathe([(0, -0.005), (0.0058, -0.005), (0.0058, 0.011), (0.0045, 0.014), (0, 0.014)], "metal", 16)
    tip = lathe([(0, 0.01), (0.004, 0.01), (0.0036, 0.046), (0.0026, 0.0505), (0, 0.0505)], "copper", 16)
    wire = cylinder(0.0006, 0.0145, (0, 0, 0.0505 + 0.00725), "metal", 6)
    for part in (nozzle, insulator, holder, tip, wire):
        part.matrix_world = frame @ part.matrix_world
        parts.append(part)
    # Hose package from the end of the torch body into the gland on the flange rim.
    gland = Vector((0.052, 0, 0.004))
    parts.append(box((0.024, 0.03, 0.018), (0.05, 0, 0.012), "dark", 0.003))
    parts.append(sweep(bezier((body_x, 0, 0.05), (body_x, 0, 0.035), gland + Vector((0.004, 0, 0.02)), gland, 12),
                       "dark", 0.011, profile=circle_profile(0.011, 16)))
    obj = merge("tool_arc_torch", parts)
    marker("tool_arc_torch", "tcp", TORCH_TCP, d)
    return obj


GUN_TIP = Vector((0.09, 0.0, -0.405))


def tool_spot_gun():
    """Servo C-gun: transformer on the mount, C-shaped yoke, servo actuator driving the upper
    electrode, fixed lower electrode, cooling hoses and a shunt. The electrodes meet at the tip."""
    x = GUN_TIP.x
    yoke = fillet([
        (-0.145, -0.14), (0.075, -0.14), (0.128, -0.162), (0.128, -0.222), (0.06, -0.228),
        (-0.07, -0.232), (-0.088, -0.252), (-0.088, -0.436), (-0.07, -0.454), (0.06, -0.46),
        (0.124, -0.466), (0.124, -0.5), (0.08, -0.516), (-0.122, -0.516), (-0.145, -0.494),
    ], [0.02, 0.02, 0.018, 0.014, 0.02, 0.022, 0.03, 0.03, 0.022, 0.02, 0.012, 0.014, 0.02, 0.02, 0.02], 4)
    yoke_obj = prism([tuple(p) for p in yoke], 0.03, "body", axis="Y")
    bevel(yoke_obj, 0.003, 2)
    cutters = [cylinder(0.022, 0.05, (-0.116, 0, z), "body", 24, axis=(0, 1, 0)) for z in (-0.3, -0.39)]
    subtract(yoke_obj, cutters)
    parts = [
        yoke_obj,
        lathe([(0, 0), (0.042, 0), (0.042, -0.02), (0.039, -0.024), (0, -0.024)], "dark", 40),
        box((0.12, 0.07, 0.016), (-0.02, 0, -0.032), "body", 0.003),
        box((0.11, 0.09, 0.1), (-0.02, 0, -0.09), "dark", 0.004),
    ]
    for i in range(6):
        for y in (-0.047, 0.047):
            parts.append(box((0.098, 0.006, 0.006), (-0.02, y, -0.05 - i * 0.016), "body"))
    parts.append(box((0.022, 0.05, 0.03), (0.046, 0, -0.12), "copper", 0.002))
    # Servo motor above the upper arm, actuator below it, then the moving electrode.
    parts += [
        lathe([(0, -0.07), (0.022, -0.07), (0.026, -0.074), (0.026, -0.138), (0.028, -0.14), (0, -0.14)], "dark", 32, location=(x, 0, 0)),
        box((0.03, 0.022, 0.022), (x - 0.03, 0, -0.085), "dark", 0.002),
        lathe([(0, -0.14), (0.03, -0.14), (0.03, -0.152), (0, -0.152)], "metal", 32, location=(x, 0, 0)),
        lathe([(0, -0.222), (0.026, -0.222), (0.026, -0.235), (0.029, -0.238), (0.029, -0.25), (0.024, -0.253),
               (0.024, -0.33), (0.02, -0.334), (0, -0.334)], "metal", 32, location=(x, 0, 0)),
        lathe([(0, -0.236), (0.0305, -0.236), (0.0305, -0.25), (0, -0.25)], "accent", 32, location=(x, 0, 0)),
        cylinder(0.0105, 0.026, (x, 0, -0.345), "metal", 24),
        lathe([(0, -0.356), (0.0125, -0.356), (0.0125, -0.388), (0, -0.388)], "metal", 24, location=(x, 0, 0)),
        lathe([(0, -0.386), (0.0105, -0.386), (0.0105, -0.396), (0.0075, -0.4025), (0.0045, -0.405), (0, -0.405)],
              "copper", 24, location=(x, 0, 0)),
        lathe([(0, -0.466), (0.019, -0.466), (0.019, -0.452), (0, -0.452)], "metal", 24, location=(x, 0, 0)),
        lathe([(0, -0.452), (0.0125, -0.452), (0.0125, -0.422), (0, -0.422)], "metal", 24, location=(x, 0, 0)),
        lathe([(0, -0.424), (0.0105, -0.424), (0.0105, -0.414), (0.0075, -0.4075), (0.0045, -0.405), (0, -0.405)],
              "copper", 24, location=(x, 0, 0)),
    ]
    # Cooling hoses from the transformer to both electrodes, and the shunt to the moving one.
    parts.append(sweep(bezier((0.03, 0.03, -0.13), (0.07, 0.06, -0.16), (0.12, 0.05, -0.3), (x + 0.012, 0.012, -0.37), 18),
                       "hose", 0.0045, profile=circle_profile(0.0045, 10)))
    parts.append(sweep(bezier((0.03, -0.03, -0.13), (-0.03, -0.07, -0.25), (0.02, -0.06, -0.47), (x - 0.006, -0.016, -0.46), 22),
                       "hose", 0.0045, profile=circle_profile(0.0045, 10)))
    strap = [(-0.0025, -0.012), (0.0025, -0.012), (0.0025, 0.012), (-0.0025, 0.012)]
    parts.append(sweep(bezier((0.046, 0, -0.135), (0.07, 0, -0.2), (0.05, 0, -0.32), (x - 0.012, 0, -0.37), 16),
                       "copper", profile=strap, up=(0, 1, 0)))
    obj = merge("tool_spot_gun", parts)
    marker("tool_spot_gun", "tip", GUN_TIP)
    return obj


# ---------------------------------------------------------------- props


def carton():
    """Unit cardboard carton, centred, with a taped top seam and a shipping label."""
    edge = 0.035
    parts = [box((1, 1, 1), (0, 0, 0), "cardboard", edge, segments=3)]
    # The tape is 0.004 thick; its underside sinks just into the cardboard so it lies on it.
    lift = 0.0015
    offset = 0.5 + lift
    path = [(-offset, 0, 0.16), (-offset, 0, 0.5 - edge)]
    for i in range(1, 6):
        a = math.pi / 2 * i / 6
        path.append((-(0.5 - edge) - (edge + lift) * math.cos(a), 0, (0.5 - edge) + (edge + lift) * math.sin(a)))
    path += [(-(0.5 - edge), 0, offset), (0.5 - edge, 0, offset)]
    for i in range(1, 6):
        a = math.pi / 2 * i / 6
        path.append(((0.5 - edge) + (edge + lift) * math.sin(a), 0, (0.5 - edge) + (edge + lift) * math.cos(a)))
    path += [(offset, 0, 0.5 - edge), (offset, 0, 0.16)]
    tape = [(-0.002, -0.11), (0.002, -0.11), (0.002, 0.11), (-0.002, 0.11)]
    parts.append(sweep(path, "tape", profile=tape, up=(0, 1, 0)))
    parts.append(box((0.34, 0.006, 0.22), (0.12, -0.5, -0.12), "label", 0.004))
    parts.append(box((0.22, 0.007, 0.03), (0.08, -0.5, -0.06), "dark"))
    parts.append(box((0.22, 0.007, 0.018), (0.08, -0.5, -0.12), "dark"))
    parts.append(box((0.14, 0.007, 0.018), (0.04, -0.5, -0.17), "dark"))
    return merge("carton", parts, sharp_angle=40)


def pallet():
    """EUR pallet, 1.2 x 0.8 x 0.144; the origin is on the top deck. Top boards, three cross
    boards, nine blocks and three bottom boards; each row of blocks is as wide as the bottom
    board under it, the outer rows flush with the pallet's sides."""
    parts = []
    for y, width in ((-0.3275, 0.145), (-0.16375, 0.1), (0, 0.145), (0.16375, 0.1), (0.3275, 0.145)):
        parts.append(box((1.2, width, 0.022), (0, y, -0.011), "wood", 0.003, segments=2))
    rows = ((-0.35, 0.1), (0, 0.145), (0.35, 0.1))
    for x in (-0.5275, 0, 0.5275):
        parts.append(box((0.145, 0.8, 0.022), (x, 0, -0.033), "wood", 0.003, segments=2))
        for y, width in rows:
            parts.append(box((0.145, width, 0.078), (x, y, -0.083), "wood-dark", 0.004, segments=2))
    for y, width in rows:
        parts.append(box((1.2, width, 0.022), (0, y, -0.133), "wood", 0.003, segments=2))
    for x in (-0.5275, 0, 0.5275):
        for y in (-0.3275, 0, 0.3275):
            for dx in (-0.045, 0.045):
                parts.append(cylinder(0.006, 0.002, (x + dx, y, 0.0005), "metal", 8))
    return merge("pallet", parts)


def c_channel(length, height, flange, thickness, role, location, facing=1):
    """C-channel along X; its back faces -Y when facing is 1."""
    h, f, t = height / 2, flange, thickness
    points = [(0, -h), (f, -h), (f, -h + t), (t, -h + t), (t, h - t), (f, h - t), (f, h), (0, h)]
    points = [(facing * u, v) for u, v in points]
    if facing < 0:
        points.reverse()
    return prism(points, length, role, axis="X", location=location)


def conveyor_belt():
    """Belt conveyor, 1.4 m long; the origin is on the belt surface at its centre."""
    length, width = 1.4, 0.42
    parts = [
        c_channel(length, 0.11, 0.035, 0.004, "steel", (0, -width / 2, -0.057), facing=1),
        c_channel(length, 0.11, 0.035, 0.004, "steel", (0, width / 2, -0.057), facing=-1),
    ]
    belt = [(-0.68, -0.056)] + [(0.68 + 0.028 * math.sin(a), -0.028 - 0.028 * math.cos(a))
                                for a in [math.pi * i / 10 for i in range(11)]]
    belt += [(-0.68 - 0.028 * math.sin(a), -0.028 + 0.028 * math.cos(a)) for a in [math.pi * i / 10 for i in range(11)]]
    parts.append(prism(belt[1:], 0.36, "belt", axis="Y"))
    for x in (-0.68, 0.68):
        for y in (-width / 2 - 0.004, width / 2 + 0.004):
            parts.append(cylinder(0.014, 0.012, (x, y, -0.028), "metal", 6, axis=(0, 1, 0)))
    # Cross braces on the bottom flanges, their ends in the webs.
    for x in (-0.45, 0, 0.45):
        parts.append(box((0.04, width - 0.006, 0.006), (x, 0, -0.105), "steel"))
    # Side guides on posts.
    for y in (-0.2, 0.2):
        parts.append(cylinder(0.008, 1.36, (0, y, 0.045), "metal", 16, axis=(1, 0, 0)))
        for x in (-0.6, -0.2, 0.2, 0.6):
            parts.append(cylinder(0.005, 0.05, (x, y * 1.04, 0.02), "metal", 12))
    # Gear motor on the drive end.
    parts.append(box((0.09, 0.07, 0.09), (0.64, width / 2 + 0.045, -0.04), "dark", 0.006))
    parts.append(lathe([(0, 0), (0.036, 0), (0.038, 0.004), (0.038, 0.12), (0.034, 0.126), (0, 0.126)], "dark", 32,
                       location=(0.6, width / 2 + 0.045, -0.04), axis=(-1, 0, 0)))
    parts.append(box((0.04, 0.03, 0.03), (0.52, width / 2 + 0.045, 0.0), "accent", 0.003))
    return merge("conveyor_belt", parts)


def conveyor_roller():
    """Gravity roller conveyor, 0.72 m long; the origin is on top of the rollers at the centre.
    The rollers turn on hex axles through the webs of two C-channels 0.34 apart, whose flanges
    face out and whose top stays 6 mm below the rollers; the frame's underside is 0.086 down."""
    length, width, radius = 0.72, 0.34, 0.022
    height, flange, thickness, top = 0.08, 0.03, 0.004, -0.006
    half = width / 2
    parts = [
        c_channel(length, height, flange, thickness, "steel", (0, -half, top - height / 2), facing=-1),
        c_channel(length, height, flange, thickness, "steel", (0, half, top - height / 2), facing=1),
    ]
    count = 11
    for i in range(count):
        x = -0.32 + 0.64 * i / (count - 1)
        parts.append(lathe([(0, -0.162), (0.017, -0.162), (radius, -0.159), (radius, 0.159), (0.017, 0.162), (0, 0.162)],
                           "roller", 24, location=(x, 0, -radius), axis=(0, 1, 0)))
        parts.append(cylinder(0.005, width + 2 * thickness + 0.008, (x, 0, -radius), "metal", 6, axis=(0, 1, 0)))
        for y in (-half - thickness - 0.002, half + thickness + 0.002):
            parts.append(cylinder(0.0075, 0.004, (x, y, -radius), "metal", 6, axis=(0, 1, 0)))
    parts.append(box((0.03, width + 0.002, 0.006), (0, 0, top - height + 0.012), "steel"))
    return merge("conveyor_roller", parts)


def tube():
    """Square steel tube, 1 x 1 in section and 1 long from the origin along Z, with rounded edges
    and square ends, so the scenes stretch it into legs and beams of any size."""
    square = fillet([(-0.5, -0.5), (0.5, -0.5), (0.5, 0.5), (-0.5, 0.5)], 0.14, 4)
    return merge("tube", [prism([tuple(p) for p in square], 1.0, "frame", axis="Z", offset=0.5)])


def foot():
    """Base plate bolted to the floor under a stand tube; 1 unit across, sized by the scene."""
    parts = [box((1, 1, 0.12), (0, 0, 0.06), "frame", 0.03, segments=2)]
    for x in (-0.36, 0.36):
        for y in (-0.36, 0.36):
            parts.append(cylinder(0.08, 0.07, (x, y, 0.155), "metal", 6))
            parts.append(cylinder(0.12, 0.02, (x, y, 0.13), "metal", 16))
    return merge("foot", parts)


def weld_table():
    """Welding fixture table top, 1.18 x 0.56, with a 100 mm hole grid; origin on the top face."""
    top = box((1.18, 0.56, 0.06), (0, 0, -0.03), "steel", 0.004, segments=2)
    apply_modifiers(top)
    cutters = []
    for i in range(11):
        for j in range(5):
            cutters.append(cylinder(0.011, 0.07, (-0.5 + 0.1 * i, -0.2 + 0.1 * j, 0), "steel", 16))
    for i in range(11):
        for y in (-0.28, 0.28):
            cutters.append(cylinder(0.009, 0.06, (-0.5 + 0.1 * i, y, -0.03), "steel", 12, axis=(0, 1, 0)))
    subtract(top, cutters)
    return merge("weld_table", [top], sharp_angle=30)


WELD_PART_SEAMS = {
    # Fillet seams of the workpiece, in its frame: along the front foot of the web, then along
    # the front foot of the flat bar, both welded in the same direction.
    "seam1": (Vector((-0.2, -0.042, 0.02)), Vector((0.16, -0.042, 0.02))),
    "seam2": (Vector((-0.16, -0.166, 0.02)), Vector((0.12, -0.166, 0.02))),
}


def toggle_clamp(base):
    """Vertical toggle clamp, clamped, bolted to the table at `base` with its arm reaching +Y:
    a flanged base, two side plates with pivot pins, a horizontal arm whose spindle and rubber
    pad rest on the work 0.02 up and 0.072 ahead, and a handle with a grip tilted back."""
    def at(x, y, z):
        return base + Vector((x, y, z))

    parts = [box((0.034, 0.04, 0.004), at(0, -0.012, 0.002), "dark", 0.001)]
    for x in (-0.011, 0.011):
        parts.append(cylinder(0.0032, 0.002, at(x, -0.025, 0.005), "metal", 6))
    side = [(-0.026, 0.004), (0.006, 0.004), (0.006, 0.05), (-0.006, 0.055), (-0.016, 0.05)]
    for x in (-0.0075, 0.0075):
        parts.append(prism(side, 0.003, "dark", axis="X", offset=x, location=base))
    pivot = at(0, -0.002, 0.048)
    lever_start = at(0, -0.014, 0.04)
    parts += [
        cylinder(0.0028, 0.022, pivot, "metal", 12, axis=(1, 0, 0)),
        cylinder(0.0028, 0.022, lever_start, "metal", 12, axis=(1, 0, 0)),
        box((0.01, 0.086, 0.008), at(0, 0.035, 0.048), "metal", 0.0015),
        cylinder(0.003, 0.038, at(0, 0.072, 0.045), "metal", 12),
        cylinder(0.0055, 0.004, at(0, 0.072, 0.054), "metal", 6),
        cylinder(0.0055, 0.004, at(0, 0.072, 0.042), "metal", 6),
        lathe([(0, 0.02), (0.0075, 0.02), (0.0075, 0.024), (0.0045, 0.027), (0, 0.027)], "rubber", 16,
              location=at(0, 0.072, 0)),
    ]
    lever_end = at(0, -0.05, 0.075)
    direction = (lever_end - lever_start).normalized()
    bar = [(-0.0035, -0.0025), (0.0035, -0.0025), (0.0035, 0.0025), (-0.0035, 0.0025)]
    parts.append(sweep([lever_start, lever_end], "metal", profile=bar, up=(1, 0, 0)))
    parts.append(lathe([(0, 0), (0.0048, 0), (0.0056, 0.005), (0.0056, 0.033), (0.0046, 0.039), (0, 0.04)],
                       "accent", 16, location=lever_end - direction * 0.008, axis=direction))
    return parts


def weld_part():
    """Workpiece on the table: a base plate with an upright web and, in front of it, a flat bar
    on edge, held by two toggle clamps. Seams are the fillets along the front foot of the web and
    of the bar; both face the robot and the camera."""
    parts = [
        box((0.5, 0.34, 0.02), (0, -0.09, 0.01), "plate", 0.0015, segments=2),
        box((0.44, 0.016, 0.16), (-0.02, -0.034, 0.1), "plate", 0.0015, segments=2),
        box((0.32, 0.012, 0.06), (-0.02, -0.16, 0.05), "plate", 0.0015, segments=2),
    ]
    # Tack welds at the ends of each seam.
    for start, end in WELD_PART_SEAMS.values():
        for p in (start, end):
            parts.append(lathe([(0, 0), (0.004, 0), (0.0035, 0.002), (0, 0.0028)], "body", 10, location=tuple(p)))
    # Toggle clamps on the table, pressing the base plate's front corners.
    for x in (-0.22, 0.24):
        parts += toggle_clamp(Vector((x, -0.3, 0)))
    obj = merge("weld_part", parts)
    for name, (start, end) in WELD_PART_SEAMS.items():
        marker("weld_part", f"{name}_start", start)
        marker("weld_part", f"{name}_end", end)
    return obj


# The welding line's car body (scripts/convert-smart-frame.mjs) at each support, in the jig's
# frame, measured from its sill: the lowest point of the sill's pinch-weld flange over the pad
# (the body sits slightly nose up, so each pad has its own height); how far out the rocker's
# lower outer face is 18, 30 and 42 mm above the pad, where the clamp jaw presses it; and how far
# out the clamp arm stands to clear the rocker.
JIG_SUPPORTS = [
    # (x, y), pad top, jaw face |y| low / middle / high, arm inner face |y|
    ((-0.32, -0.36), 0.2193, (0.3775, 0.3848, 0.3907), 0.4001),
    ((-0.32, 0.36), 0.2238, (0.4138, 0.4232, 0.4285), 0.4346),
    ((0.2, -0.36), 0.2079, (0.3547, 0.3834, 0.3912), 0.4),
    ((0.2, 0.36), 0.2133, (0.3669, 0.3955, 0.4029), 0.4117),
]


def sill_clamp(x, y, height, jaw_face, arm_inner, rail_top):
    """Support tower under the sill at (x, y): a post on the rail with a support pad meeting the
    sill's flange at `height`, and a clamp whose arm rises outside the rocker from a bracket on
    the post, its jaw shaped to the rocker's lower outer face (`jaw_face`) and pressing it."""
    side = 1 if y > 0 else -1
    pad = 0.012
    post_top = height - pad
    post_face = abs(y) + 0.025
    arm = 0.012
    jaw_low, jaw_high = height + 0.018, height + 0.042
    face_low, face_mid, face_high = jaw_face
    jaw = [(face_low, jaw_low), (arm_inner + 0.002, jaw_low), (arm_inner + 0.002, jaw_high), (face_high, jaw_high),
           (face_mid, (jaw_low + jaw_high) / 2)]

    def at_u(u, z):
        """Point `u` out from the centre line on this side."""
        return (x, side * u, z)

    return [
        box((0.07, 0.07, 0.012), (x, y, rail_top + 0.006), "frame", 0.002),
        box((0.05, 0.05, post_top - rail_top), (x, y, (rail_top + post_top) / 2), "steel", 0.004),
        box((0.06, 0.045, pad), (x, y, height - pad / 2), "accent", 0.002),
        # Clamp cylinder on the post's outer face, driving the arm through the bracket above it.
        cylinder(0.011, 0.06, at_u(post_face + 0.011, 0.11), "metal", 16),
        box((0.03, arm_inner + arm + 0.004 - post_face, 0.02), at_u((post_face + arm_inner + arm + 0.004) / 2, 0.15),
            "frame", 0.002),
        cylinder(0.004, 0.034, at_u(arm_inner + arm / 2, 0.15), "metal", 12, axis=(1, 0, 0)),
        box((0.02, arm, height + 0.05 - 0.14), at_u(arm_inner + arm / 2, (0.14 + height + 0.05) / 2), "steel", 0.002),
        prism([(side * u, z) for u, z in jaw], 0.03, "accent", axis="X", offset=x),
    ]


def jig():
    """Body-in-white welding jig holding the welding line's car body by its sills: a base frame of
    square tubes on four feet, and four support towers whose pads carry the sills while their
    clamps press the rockers from outside; 1.24 x 0.8, origin on the floor at its centre."""
    tube, rail_y = 0.045, 0.36
    top = 0.02 + tube
    parts = []
    for y in (-rail_y, rail_y):
        parts.append(box((1.24, tube, tube), (0, y, top - tube / 2), "steel", 0.004))
    for x in (-0.5, 0.5):
        parts.append(box((tube, 2 * rail_y, tube), (x, 0, top - tube / 2), "frame", 0.004))
    for x in (-0.6, 0.6):
        for y in (-rail_y, rail_y):
            parts.append(box((0.08, 0.08, 0.02), (x, y, 0.01), "frame", 0.003))
    for (x, y), height, jaw_face, arm_inner in JIG_SUPPORTS:
        parts += sill_clamp(x, y, height, jaw_face, arm_inner, top)
    obj = merge("jig", parts)
    for index, ((x, y), height, _, _) in enumerate(JIG_SUPPORTS):
        marker("jig", f"support{index + 1}", (x, y, height))
    return obj


def rail():
    """Floor rail of the welding line, 1 m long along Y, standing on the origin."""
    section = [(-0.025, 0), (0.025, 0), (0.025, 0.006), (0.005, 0.008), (0.005, 0.028), (0.012, 0.03),
               (0.012, 0.04), (-0.012, 0.04), (-0.012, 0.03), (-0.005, 0.028), (-0.005, 0.008), (-0.025, 0.006)]
    obj = prism(section, 1.0, "steel", axis="Y")
    return merge("rail", [obj])


BUILDERS = [tool_suction, tool_arc_torch, tool_spot_gun, carton, pallet, conveyor_belt, conveyor_roller,
            tube, foot, weld_table, weld_part, jig, rail]


# ---------------------------------------------------------------- build, preview, export


def clear():
    coll = bpy.data.collections.get(COLLECTION)
    if coll:
        for obj in list(coll.objects):
            data = obj.data
            bpy.data.objects.remove(obj)
            if data is not None and data.users == 0:
                bpy.data.meshes.remove(data)
    for role in ROLES:
        mat = bpy.data.materials.get(role)
        if mat and mat.users == 0:
            bpy.data.materials.remove(mat)


def build_all(only=None):
    clear()
    built = {}
    for builder in BUILDERS:
        if only and builder.__name__ not in only:
            continue
        built[builder.__name__] = builder()
    return built


def layout_preview(spacing=0.35):
    """Spreads the assets along X (object transforms only) and sizes the props for viewing."""
    scale = {"carton": 0.16, "pallet": 0.5, "conveyor_belt": 0.5, "conveyor_roller": 0.6, "tube": 0.3,
             "foot": 0.08, "weld_table": 0.5, "weld_part": 1.0, "jig": 0.5, "rail": 0.5}
    x = 0.0
    coll = bpy.data.collections[COLLECTION]
    for builder in BUILDERS:
        obj = coll.objects.get(builder.__name__)
        if not obj:
            continue
        s = scale.get(obj.name, 1.0)
        obj.scale = (s,) * 3
        width = obj.dimensions.x if obj.dimensions.x else 0.3
        lowest = min(corner[2] for corner in obj.bound_box) * s
        obj.location = (x + width / 2, 0, 0.3 if obj.name.startswith("tool_") else -lowest)
        x += width + spacing
    for empty in coll.objects:
        if empty.type == "EMPTY":
            empty.hide_set(True)


def export(path):
    coll = bpy.data.collections[COLLECTION]
    for obj in bpy.context.scene.objects:
        obj.select_set(False)
    for obj in coll.objects:
        obj.location = obj.matrix_world.translation if obj.type == "EMPTY" else (0, 0, 0)
        obj.scale = (1, 1, 1)
        obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", use_selection=True, export_apply=True, export_yup=True,
        export_texcoords=False, export_normals=True, export_materials="EXPORT", export_extras=False,
    )


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if not argv:
        raise SystemExit("usage: blender -b --factory-startup -P scripts/blender/props.py -- <out.glb>")
    for obj in list(bpy.context.scene.objects):
        bpy.data.objects.remove(obj)
    build_all()
    export(argv[0])
