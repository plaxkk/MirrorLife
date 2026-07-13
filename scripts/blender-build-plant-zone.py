import argparse
import math
import os
import sys

import bpy
from mathutils import Vector


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Build the editable MirrorLife plant-zone master and web LOD.")
    parser.add_argument("--output-root", required=True)
    parser.add_argument("--lod", choices=("master", "web"), default="master")
    return parser.parse_args(argv)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def hex_color(value):
    value = value.lstrip("#")
    channels = [int(value[index:index + 2], 16) / 255 for index in (0, 2, 4)]

    def to_linear(channel):
        return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4

    return tuple(to_linear(channel) for channel in channels) + (1.0,)


def material(name, color, roughness=0.8, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = hex_color(color)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = hex_color(color)
    node.inputs["Roughness"].default_value = roughness
    node.inputs["Metallic"].default_value = metallic
    if "Specular IOR Level" in node.inputs:
        node.inputs["Specular IOR Level"].default_value = 0.2
    return mat


def link_material(obj, mat):
    obj.data.materials.append(mat)
    return obj


def empty(name, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    return obj


def apply_transform(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.select_set(False)


def tag(obj, semantic):
    obj["semantic_part"] = semantic
    return obj


def rounded_box(name, dimensions, location, mat, radius=0.025, segments=4, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    apply_transform(obj)
    bevel = obj.modifiers.new("Cel bevel", "BEVEL")
    bevel.width = min(radius, min(dimensions) * 0.44)
    bevel.segments = segments
    bevel.limit_method = "ANGLE"
    smooth = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    smooth.keep_sharp = True
    link_material(obj, mat)
    if parent:
        obj.parent = parent
    return tag(obj, name)


def beam_between(name, start, end, width, depth, mat, parent=None, radius=0.035, segments=4):
    start_v = Vector(start)
    end_v = Vector(end)
    direction = end_v - start_v
    obj = rounded_box(
        name,
        (width, depth, direction.length),
        (start_v + end_v) * 0.5,
        mat,
        radius,
        segments,
        parent=parent,
    )
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    return obj


def cylinder(name, radius, depth, location, mat, vertices=32, radius_top=None, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius,
        radius2=radius if radius_top is None else radius_top,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    bevel = obj.modifiers.new("Rounded edge", "BEVEL")
    bevel.width = min(0.018, radius * 0.16, depth * 0.12)
    bevel.segments = 3
    smooth = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    smooth.keep_sharp = True
    link_material(obj, mat)
    if parent:
        obj.parent = parent
    return tag(obj, name)


def torus(name, major_radius, minor_radius, location, mat, major_segments, minor_segments, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=major_segments,
        minor_segments=minor_segments,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    link_material(obj, mat)
    if parent:
        obj.parent = parent
    return tag(obj, name)


def ellipsoid(name, location, scale, mat, segments, rings, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=rings,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    apply_transform(obj)
    link_material(obj, mat)
    if parent:
        obj.parent = parent
    return tag(obj, name)


def curve_tube(name, points, radius, mat, resolution, parent=None):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = resolution
    curve.bevel_depth = radius
    curve.bevel_resolution = max(1, resolution - 1)
    curve.use_fill_caps = True
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    link_material(obj, mat)
    if parent:
        obj.parent = parent
    return tag(obj, name)


def make_leaf(name, location, size, mat, detail, rotation=(0, 0, 0), parent=None, shape="oval"):
    length = size
    if shape == "spear":
        scale = (length * 0.17, length * 0.055, length * 0.52)
    elif shape == "round":
        scale = (length * 0.38, length * 0.075, length * 0.42)
    elif shape == "heart":
        scale = (length * 0.42, length * 0.07, length * 0.48)
    else:
        scale = (length * 0.28, length * 0.06, length * 0.5)
    leaf = ellipsoid(
        name,
        location,
        scale,
        mat,
        detail["leaf_segments"],
        detail["leaf_rings"],
        rotation,
        parent,
    )
    if shape == "heart":
        leaf.scale.z = 0.94
        apply_transform(leaf)
    return leaf


def build_rack(root, mats, detail):
    group = empty("Tiered_Plant_Rack", root)
    frames = {
        "L": empty("Left_Support_Frame", group),
        "R": empty("Right_Support_Frame", group),
    }
    for side, x in (("L", -0.73), ("R", 0.73)):
        frame = frames[side]
        beam_between(f"{side}_Front_Leg", (x, -0.30, 0.04), (x, -0.07, 1.78), 0.13, 0.12, mats["wood"], frame, 0.04, detail["bevel"])
        beam_between(f"{side}_Rear_Leg", (x, 0.30, 0.04), (x, 0.07, 1.78), 0.13, 0.12, mats["wood_dark"], frame, 0.04, detail["bevel"])
        rounded_box(f"{side}_Bottom_Brace", (0.14, 0.56, 0.11), (x, 0, 0.14), mats["wood_dark"], 0.03, detail["bevel"], parent=frame)
        rounded_box(f"{side}_Top_Cap", (0.15, 0.20, 0.20), (x, 0, 1.76), mats["wood_light"], 0.06, detail["bevel"], parent=frame)

    shelf_specs = [
        ("Bottom", 0.31, 1.34, 0.52),
        ("Middle", 0.84, 1.25, 0.47),
        ("Top", 1.36, 1.14, 0.42),
    ]
    shelves = empty("Three_Shelf_Boards", group)
    for name, z, width, depth in shelf_specs:
        rounded_box(f"{name}_Shelf", (width, depth, 0.12), (0, -0.015, z), mats["wood"], 0.035, detail["bevel"], parent=shelves)
        rounded_box(f"{name}_Front_Lip", (width - 0.04, 0.055, 0.13), (0, -depth * 0.5 - 0.014, z + 0.015), mats["wood_dark"], 0.018, detail["bevel"], parent=shelves)
        rounded_box(f"{name}_Top_Highlight", (width - 0.10, depth - 0.08, 0.012), (0, -0.035, z + 0.066), mats["wood_light"], 0.005, 2, parent=shelves)
        for grain_index, offset in enumerate((-0.22, 0.20)):
            rounded_box(
                f"{name}_Wood_Grain_{grain_index + 1}",
                (width - 0.18, 0.012, 0.012),
                (0, offset * depth, z + 0.074),
                mats["wood_grain"],
                0.004,
                2,
                parent=shelves,
            )

    hardware = empty("Side_Bolts", group)
    for side, x, rotation in (("L", -0.805, (0, math.radians(90), 0)), ("R", 0.805, (0, math.radians(90), 0))):
        for index, z in enumerate((0.31, 0.84, 1.36)):
            cylinder(f"{side}_Bolt_{index + 1}", 0.035, 0.035, (x, -0.25 + index * 0.07, z + 0.02), mats["bronze"], detail["cylinder"], rotation=rotation, parent=hardware)
            cylinder(f"{side}_Bolt_Inset_{index + 1}", 0.014, 0.038, (x + (-0.003 if side == "L" else 0.003), -0.25 + index * 0.07, z + 0.02), mats["ink"], 16, rotation=rotation, parent=hardware)


def build_pot(root, mats, detail, name, x, y, shelf_z, radius=0.16):
    group = empty(name, root)
    pot_height = radius * 1.05
    center_z = shelf_z + 0.07 + pot_height * 0.5
    cylinder(f"{name}_Ceramic_Body", radius * 0.82, pot_height, (x, y, center_z), mats["pot"], detail["cylinder"], radius_top=radius, parent=group)
    torus(f"{name}_Rim", radius * 0.92, radius * 0.10, (x, y, center_z + pot_height * 0.49), mats["pot_light"], detail["torus_major"], detail["torus_minor"], parent=group)
    cylinder(f"{name}_Soil", radius * 0.82, 0.024, (x, y, center_z + pot_height * 0.51), mats["soil"], detail["cylinder"], parent=group)
    torus(f"{name}_Foot_Ring", radius * 0.72, radius * 0.045, (x, y, center_z - pot_height * 0.48), mats["pot_dark"], detail["torus_major"], detail["torus_minor"], parent=group)
    ellipsoid(f"{name}_Glaze_Highlight", (x - radius * 0.42, y - radius * 0.79, center_z + radius * 0.12), (radius * 0.12, radius * 0.025, radius * 0.19), mats["pot_highlight"], 16, 8, rotation=(math.radians(6), 0, math.radians(-15)), parent=group)
    return group, center_z + pot_height * 0.52


def add_stem(group, mats, detail, name, base, end):
    return curve_tube(name, [base, end], 0.012, mats["stem"], detail["curve"], group)


def plant_coin_vine(group, mats, detail, base, prefix):
    x, y, z = base
    crown_specs = [
        (-0.13, 0.01, 0.11, -42), (-0.09, -0.01, 0.17, -24), (-0.04, 0.01, 0.22, -10),
        (0.02, -0.01, 0.24, 8), (0.08, 0.01, 0.20, 22), (0.13, -0.01, 0.14, 38),
        (-0.14, 0.02, 0.22, -34), (-0.07, -0.01, 0.28, -18), (0.01, 0.01, 0.30, 2),
        (0.09, -0.01, 0.27, 20), (0.15, 0.01, 0.21, 36),
    ]
    for index, (dx, dy, dz, angle) in enumerate(crown_specs):
        add_stem(
            group,
            mats,
            detail,
            f"{prefix}_Crown_Stem_{index + 1}",
            (x, y, z),
            (x + dx * 0.72, y + dy, z + dz * 0.76),
        )
        make_leaf(
            f"{prefix}_Crown_Leaf_{index + 1}",
            (x + dx, y + dy, z + dz),
            0.115 if index % 3 else 0.13,
            mats["lime"] if index % 3 == 0 else mats["green_light"],
            detail,
            rotation=(math.radians(84), math.radians(angle), 0),
            parent=group,
            shape="round",
        )
    points = [(x, y, z), (x - 0.04, y, z + 0.18), (x - 0.17, y - 0.01, z + 0.23), (x - 0.24, y - 0.02, z + 0.08), (x - 0.23, y - 0.04, z - 0.13)]
    curve_tube(f"{prefix}_Trailing_Stem", points, 0.012, mats["stem"], detail["curve"], group)
    leaf_points = [
        (-0.02, 0.11, -28), (-0.08, 0.19, 24), (-0.15, 0.22, -16),
        (-0.22, 0.16, 34), (-0.25, 0.07, -28), (-0.24, -0.04, 24), (-0.23, -0.14, -18),
    ]
    for index, (dx, dz, angle) in enumerate(leaf_points):
        make_leaf(f"{prefix}_Coin_Leaf_{index + 1}", (x + dx, y - 0.015, z + dz), 0.105, mats["lime" if index % 2 else "green_light"], detail, rotation=(math.radians(85), math.radians(angle), 0), parent=group, shape="round")


def plant_snake(group, mats, detail, base, prefix):
    x, y, z = base
    specs = [(-0.10, 0.00, 0.27, -18), (-0.04, 0.02, 0.38, -8), (0.03, 0.01, 0.42, 5), (0.10, 0.00, 0.31, 18), (0.00, -0.03, 0.34, 0)]
    for index, (dx, dy, length, angle) in enumerate(specs):
        make_leaf(f"{prefix}_Snake_Leaf_{index + 1}", (x + dx, y + dy, z + length * 0.40), length, mats["green_dark" if index % 2 else "green"], detail, rotation=(0, math.radians(angle), 0), parent=group, shape="spear")
        make_leaf(f"{prefix}_Snake_Stripe_{index + 1}", (x + dx - 0.002, y - 0.018, z + length * 0.40), length * 0.72, mats["lime"], detail, rotation=(0, math.radians(angle), 0), parent=group, shape="spear")


def plant_pothos(group, mats, detail, base, prefix, variegated=False):
    x, y, z = base
    specs = [(-0.14, 0.00, 0.17, -34), (0.14, 0.02, 0.19, 34), (-0.09, 0.01, 0.27, -20), (0.10, -0.01, 0.29, 22), (0.00, 0.02, 0.35, 0)]
    for index, (dx, dy, dz, angle) in enumerate(specs):
        add_stem(group, mats, detail, f"{prefix}_Stem_{index + 1}", (x, y, z), (x + dx * 0.78, y + dy, z + dz * 0.78))
        leaf_mat = mats["green"] if index % 2 else mats["green_light"]
        make_leaf(f"{prefix}_Heart_Leaf_{index + 1}", (x + dx, y + dy, z + dz), 0.22, leaf_mat, detail, rotation=(math.radians(84), math.radians(angle), math.radians(angle * 0.3)), parent=group, shape="heart")
        if variegated:
            make_leaf(f"{prefix}_Variegation_{index + 1}", (x + dx - 0.012, y - 0.020, z + dz + 0.008), 0.105, mats["cream_green"], detail, rotation=(math.radians(84), math.radians(angle), math.radians(angle * 0.3)), parent=group, shape="oval")


def plant_rosette(group, mats, detail, base, prefix, large=False):
    x, y, z = base
    rings = ((7, 0.13, 0.17), (5, 0.08, 0.15), (3, 0.035, 0.12))
    scale = 1.2 if large else 1.0
    for ring_index, (count, radius, leaf_size) in enumerate(rings):
        for index in range(count):
            angle = index * math.tau / count + ring_index * 0.42
            px = x + math.cos(angle) * radius * scale
            py = y + math.sin(angle) * radius * 0.42 * scale
            pz = z + 0.045 + ring_index * 0.035
            make_leaf(f"{prefix}_Rosette_{ring_index + 1}_{index + 1}", (px, py, pz), leaf_size * scale, mats["sage" if (index + ring_index) % 2 else "green_light"], detail, rotation=(math.radians(70), math.radians(math.degrees(angle)), 0), parent=group, shape="oval")


def plant_jade(group, mats, detail, base, prefix):
    x, y, z = base
    stems = [(-0.08, 0.22, -12), (0.02, 0.28, 4), (0.10, 0.21, 18)]
    for stem_index, (dx, height, lean) in enumerate(stems):
        end = (x + dx, y, z + height)
        add_stem(group, mats, detail, f"{prefix}_Branch_{stem_index + 1}", (x, y, z), end)
        for leaf_index, offset in enumerate((0.08, 0.15, 0.22)):
            for side in (-1, 1):
                make_leaf(
                    f"{prefix}_Jade_Leaf_{stem_index + 1}_{leaf_index + 1}_{'L' if side < 0 else 'R'}",
                    (x + dx + side * (0.045 + leaf_index * 0.01), y - 0.005, z + min(height, offset + stem_index * 0.015)),
                    0.10,
                    mats["lime" if leaf_index % 2 else "green"],
                    detail,
                    rotation=(math.radians(85), math.radians(side * 35), 0),
                    parent=group,
                    shape="round",
                )


def plant_monstera(group, mats, detail, base, prefix):
    x, y, z = base
    specs = [(-0.12, 0.18, -30), (0.13, 0.22, 30), (-0.02, 0.31, -4)]
    for index, (dx, dz, angle) in enumerate(specs):
        add_stem(group, mats, detail, f"{prefix}_Stem_{index + 1}", (x, y, z), (x + dx * 0.75, y, z + dz * 0.78))
        leaf = make_leaf(f"{prefix}_Monstera_Leaf_{index + 1}", (x + dx, y, z + dz), 0.27, mats["green" if index != 1 else "green_light"], detail, rotation=(math.radians(82), math.radians(angle), 0), parent=group, shape="heart")
        for slot_index, side in enumerate((-1, 1)):
            ellipsoid(
                f"{prefix}_Leaf_Slot_{index + 1}_{slot_index + 1}",
                (x + dx + side * 0.038, y - 0.022, z + dz + 0.012 + slot_index * 0.025),
                (0.014, 0.010, 0.040),
                mats["shadow_green"],
                12,
                6,
                rotation=(math.radians(82), math.radians(angle + side * 8), 0),
                parent=group,
            )


def build_plants(root, mats, detail):
    plants = empty("Eight_Potted_Plants", root)
    specs = [
        ("Top_Trailing_Coin_Plant", -0.30, -0.02, 1.36, 0.17, plant_coin_vine),
        ("Top_Snake_Plant", 0.30, -0.01, 1.36, 0.17, plant_snake),
        ("Middle_Pothos", -0.38, -0.02, 0.84, 0.16, plant_pothos),
        ("Middle_Rosette_Succulent", 0.00, -0.02, 0.84, 0.15, plant_rosette),
        ("Middle_Jade_Plant", 0.38, -0.02, 0.84, 0.15, plant_jade),
        ("Bottom_Variegated_Plant", -0.38, -0.02, 0.31, 0.16, None),
        ("Bottom_Compact_Succulent", 0.00, -0.02, 0.31, 0.15, None),
        ("Bottom_Monstera", 0.38, -0.02, 0.31, 0.16, plant_monstera),
    ]
    for name, x, y, shelf_z, radius, builder in specs:
        pot_group, base_z = build_pot(plants, mats, detail, name, x, y, shelf_z, radius)
        if name == "Bottom_Variegated_Plant":
            plant_pothos(pot_group, mats, detail, (x, y, base_z), name, True)
        elif name == "Bottom_Compact_Succulent":
            plant_rosette(pot_group, mats, detail, (x, y, base_z), name, True)
        else:
            builder(pot_group, mats, detail, (x, y, base_z), name)


def build_scene(lod):
    clear_scene()
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
    bpy.context.scene.world.color = (0.04, 0.04, 0.06)

    detail = {
        "master": {"bevel": 6, "cylinder": 40, "torus_major": 48, "torus_minor": 12, "leaf_segments": 28, "leaf_rings": 16, "curve": 4},
        "web": {"bevel": 3, "cylinder": 24, "torus_major": 28, "torus_minor": 8, "leaf_segments": 16, "leaf_rings": 9, "curve": 2},
    }[lod]
    mats = {
        "ink": material("Ink", "#1a1a2e"),
        "wood": material("Honey wood", "#d98b2b"),
        "wood_light": material("Honey wood highlight", "#f4b84f"),
        "wood_dark": material("Honey wood shadow", "#8d4f22"),
        "wood_grain": material("Wood grain", "#b76a25"),
        "bronze": material("Bronze hardware", "#b56a20", 0.52, 0.28),
        "pot": material("Olive ceramic", "#668f3c", 0.48),
        "pot_light": material("Ceramic rim", "#9fbe58", 0.42),
        "pot_dark": material("Ceramic foot", "#365d2d", 0.55),
        "pot_highlight": material("Ceramic gloss highlight", "#d6e78c", 0.35),
        "soil": material("Rich soil", "#51351f"),
        "stem": material("Leaf stem", "#285b2b"),
        "green": material("Leaf green", "#3e8f28"),
        "green_light": material("Leaf light green", "#69b82b"),
        "green_dark": material("Leaf deep green", "#22622a"),
        "lime": material("Leaf lime highlight", "#9ad52f"),
        "sage": material("Succulent sage", "#7fa55d"),
        "cream_green": material("Variegated cream", "#d7e878"),
        "shadow_green": material("Monstera cutout shadow", "#173f24"),
    }
    root = empty("Plant_Zone_Master")
    root["asset"] = "plant-zone"
    root["standard"] = "faithful-complete-multiview-v3"
    root["provider"] = "blender-manual"
    root["lod"] = lod
    root["real_world_unit"] = "meter"
    root["source_reference"] = "greenhouse_garden/plant_shelf.png"
    build_rack(root, mats, detail)
    build_plants(root, mats, detail)
    return root


def export_asset(output_root, lod):
    os.makedirs(output_root, exist_ok=True)
    if lod == "master":
        blend_path = os.path.join(output_root, "plant-zone.blend")
        bpy.ops.wm.save_as_mainfile(filepath=blend_path)
        print(f"Saved editable master: {blend_path}")
    glb_path = os.path.join(output_root, "plant-zone.glb")
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        export_apply=True,
        export_materials="EXPORT",
        export_texcoords=True,
        export_normals=True,
        export_tangents=False,
        export_attributes=True,
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_yup=True,
    )
    print(f"Exported {lod} asset: {glb_path}")
    return glb_path


def main():
    args = parse_args()
    build_scene(args.lod)
    export_asset(os.path.abspath(args.output_root), args.lod)


if __name__ == "__main__":
    main()
