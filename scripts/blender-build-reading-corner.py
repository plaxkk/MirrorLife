import argparse
import math
import os
import sys

import bpy
from mathutils import Vector


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Build the editable MirrorLife reading-corner master.")
    parser.add_argument("--output-root", required=True)
    parser.add_argument("--web-output", required=True)
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


def material(name, color, roughness=0.82):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = hex_color(color)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = hex_color(color)
    node.inputs["Roughness"].default_value = roughness
    node.inputs["Metallic"].default_value = 0.0
    if "Specular IOR Level" in node.inputs:
        node.inputs["Specular IOR Level"].default_value = 0.22
    return mat


def link_material(obj, mat):
    obj.data.materials.append(mat)
    return obj


def parent_to(obj, parent):
    obj.parent = parent
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


def rounded_box(name, dimensions, location, mat, radius=0.08, segments=6, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    apply_transform(obj)
    bevel = obj.modifiers.new("Soft cel bevel", "BEVEL")
    bevel.width = min(radius, min(dimensions) * 0.46)
    bevel.segments = segments
    bevel.limit_method = "ANGLE"
    smooth = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    smooth.keep_sharp = True
    link_material(obj, mat)
    if parent:
        parent_to(obj, parent)
    return obj


def cylinder(name, radius, depth, location, mat, vertices=48, radius_top=None, rotation=(0, 0, 0), parent=None):
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
    bevel = obj.modifiers.new("Edge round", "BEVEL")
    bevel.width = min(0.035, depth * 0.12, radius * 0.14)
    bevel.segments = 4
    smooth = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    smooth.keep_sharp = True
    link_material(obj, mat)
    if parent:
        parent_to(obj, parent)
    return obj


def torus(name, major_radius, minor_radius, location, mat, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=64,
        minor_segments=12,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    link_material(obj, mat)
    if parent:
        parent_to(obj, parent)
    return obj


def ellipsoid(name, location, scale, mat, rotation=(0, 0, 0), parent=None, segments=40):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=24, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    apply_transform(obj)
    link_material(obj, mat)
    if parent:
        parent_to(obj, parent)
    return obj


def curve_tube(name, points, radius, mat, parent=None, cyclic=False):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 4
    curve.bevel_depth = radius
    curve.bevel_resolution = 4
    curve.use_fill_caps = True
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    spline.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    link_material(obj, mat)
    if parent:
        parent_to(obj, parent)
    return obj


def build_chair(root, mats):
    group = empty("Chair", root)
    cx = 0.52
    rounded_box("Chair_Base", (1.45, 0.9, 0.34), (cx, 0.04, 0.56), mats["teal_dark"], 0.14, parent=group)
    rounded_box("Seat_Cushion", (1.18, 0.82, 0.25), (cx, -0.09, 0.86), mats["teal"], 0.12, parent=group)
    rounded_box("Backrest", (1.32, 0.3, 1.28), (cx, 0.34, 1.43), mats["teal_dark"], 0.17, rotation=(math.radians(-4), 0, 0), parent=group)
    rounded_box("Backrest_Face", (1.12, 0.16, 1.02), (cx, 0.13, 1.44), mats["teal"], 0.14, rotation=(math.radians(-4), 0, 0), parent=group)
    for side in (-1, 1):
        x = cx + side * 0.75
        rounded_box(f"Armrest_{'L' if side < 0 else 'R'}", (0.28, 0.95, 0.72), (x, -0.01, 1.13), mats["teal_dark"], 0.13, parent=group)
        rounded_box(f"Armrest_Cap_{'L' if side < 0 else 'R'}", (0.25, 0.88, 0.18), (x, -0.06, 1.5), mats["teal"], 0.085, parent=group)
    for index, (x, y) in enumerate(((cx - 0.55, -0.3), (cx + 0.55, -0.3), (cx - 0.55, 0.3), (cx + 0.55, 0.3))):
        cylinder(f"Chair_Leg_{index + 1}", 0.085, 0.32, (x, y, 0.18), mats["wood_dark"], vertices=32, radius_top=0.07, parent=group)

    pillow = empty("Throw_Pillow", group)
    rounded_box("Pillow_Core", (0.7, 0.18, 0.66), (cx, -0.43, 1.47), mats["coral"], 0.15, rotation=(0, 0, math.radians(-2)), parent=pillow)
    for side in (-1, 1):
        rounded_box(
            f"Pillow_Pinched_Corner_{side}",
            (0.12, 0.16, 0.16),
            (cx + side * 0.33, -0.44, 1.47),
            mats["coral_dark"],
            0.055,
            rotation=(0, 0, math.radians(side * 20)),
            parent=pillow,
        )
    curve_tube("Pillow_Leaf_Stem", [(cx, -0.545, 1.28), (cx - 0.02, -0.55, 1.46), (cx + 0.05, -0.55, 1.65)], 0.018, mats["yellow"], pillow)
    leaf_specs = [(-0.12, 1.42, -32), (0.1, 1.49, 32), (-0.1, 1.56, -28), (0.11, 1.61, 28)]
    for index, (dx, z, angle) in enumerate(leaf_specs):
        ellipsoid(
            f"Pillow_Leaf_{index + 1}",
            (cx + dx, -0.55, z),
            (0.105, 0.025, 0.055),
            mats["yellow"],
            rotation=(0, math.radians(90), math.radians(angle)),
            parent=pillow,
            segments=24,
        )


def build_side_table(root, mats):
    group = empty("Side_Table", root)
    tx, ty = -1.28, -0.7
    cylinder("Table_Top", 0.53, 0.2, (tx, ty, 0.64), mats["wood"], vertices=64, parent=group)
    torus("Table_Top_Rim", 0.46, 0.025, (tx, ty, 0.75), mats["wood_light"], parent=group)
    for index, angle in enumerate((35, 145, 225, 315)):
        radians = math.radians(angle)
        x = tx + math.cos(radians) * 0.34
        y = ty + math.sin(radians) * 0.34
        leg = cylinder(f"Table_Leg_{index + 1}", 0.065, 0.54, (x, y, 0.32), mats["wood_dark"], vertices=24, radius_top=0.05, parent=group)
        leg.rotation_euler.x = math.radians(math.sin(radians) * 7)
        leg.rotation_euler.y = math.radians(-math.cos(radians) * 7)

    plant = empty("Potted_Plant", group)
    cylinder("Plant_Pot", 0.19, 0.28, (tx, ty, 0.89), mats["terracotta"], vertices=48, radius_top=0.24, parent=plant)
    torus("Plant_Pot_Rim", 0.225, 0.03, (tx, ty, 1.035), mats["terracotta_light"], parent=plant)
    cylinder("Plant_Soil", 0.205, 0.035, (tx, ty, 1.04), mats["soil"], vertices=48, parent=plant)
    curve_tube("Plant_Stem", [(tx, ty, 1.04), (tx, ty, 1.43)], 0.018, mats["green_dark"], plant)
    leaves = [
        (-0.13, -0.01, 1.22, -38), (0.13, 0.01, 1.25, 38),
        (-0.1, 0.01, 1.38, -28), (0.1, -0.01, 1.42, 28),
        (0, 0, 1.51, 0),
    ]
    for index, (dx, dy, z, angle) in enumerate(leaves):
        ellipsoid(
            f"Plant_Leaf_{index + 1}",
            (tx + dx, ty + dy, z),
            (0.1, 0.04, 0.21),
            mats["green" if index % 2 else "green_light"],
            rotation=(0, math.radians(angle), 0),
            parent=plant,
            segments=32,
        )


def build_lamp(root, mats):
    group = empty("Floor_Lamp", root)
    lx, ly = -0.52, 0.52
    cylinder("Lamp_Base", 0.24, 0.09, (lx, ly, 0.08), mats["wood_dark"], vertices=64, parent=group)
    torus("Lamp_Base_Rim", 0.205, 0.025, (lx, ly, 0.13), mats["wood_light"], parent=group)
    cylinder("Lamp_Pole", 0.045, 1.98, (lx, ly, 1.095), mats["wood_dark"], vertices=32, parent=group)
    cylinder("Lamp_Joint", 0.075, 0.24, (lx, ly, 2.12), mats["wood"], vertices=32, parent=group)
    curve_tube(
        "Lamp_Arm",
        [(lx, ly, 2.18), (lx - 0.12, ly, 2.32), (lx - 0.42, ly, 2.39), (lx - 0.66, ly, 2.32)],
        0.055,
        mats["wood"],
        group,
    )
    shade_x = lx - 0.72
    cylinder("Lamp_Shade", 0.38, 0.46, (shade_x, ly, 2.09), mats["cream"], vertices=64, radius_top=0.18, parent=group)
    torus("Shade_Top_Rim", 0.18, 0.025, (shade_x, ly, 2.32), mats["wood_light"], parent=group)
    torus("Shade_Bottom_Rim", 0.38, 0.028, (shade_x, ly, 1.86), mats["wood_light"], parent=group)
    for index in range(8):
        angle = index * math.tau / 8
        top = Vector((shade_x + math.cos(angle) * 0.17, ly + math.sin(angle) * 0.17, 2.31))
        bottom = Vector((shade_x + math.cos(angle) * 0.37, ly + math.sin(angle) * 0.37, 1.87))
        curve_tube(f"Shade_Rib_{index + 1}", [top, bottom], 0.012, mats["wood_light"], group)
    ellipsoid("Lamp_Bulb", (shade_x, ly, 1.92), (0.1, 0.1, 0.13), mats["yellow_light"], parent=group, segments=32)


def build_scene():
    clear_scene()
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
    bpy.context.scene.world.color = (0.04, 0.04, 0.06)

    mats = {
        "ink": material("Ink", "#1a1a2e"),
        "teal": material("Chair teal", "#398f7c"),
        "teal_dark": material("Chair deep teal", "#176b60"),
        "coral": material("Pillow coral", "#f58c78"),
        "coral_dark": material("Pillow seam", "#c85f5b"),
        "yellow": material("Leaf motif", "#f1c40f"),
        "yellow_light": material("Lamp glow", "#fff0a6", 0.55),
        "wood": material("Honey wood", "#c97a31"),
        "wood_light": material("Wood highlight", "#eda64b"),
        "wood_dark": material("Wood shadow", "#7c482d"),
        "terracotta": material("Terracotta", "#bf6940"),
        "terracotta_light": material("Terracotta rim", "#e89b60"),
        "soil": material("Soil", "#5b3825"),
        "green": material("Plant green", "#3d9f4f"),
        "green_light": material("Plant light", "#7fbd37"),
        "green_dark": material("Plant stem", "#236b38"),
        "cream": material("Lamp fabric", "#fff1c7"),
    }
    root = empty("Reading_Corner_Master")
    root["asset"] = "reading-corner"
    root["standard"] = "faithful-complete-multiview-v3"
    root["real_world_unit"] = "meter"
    build_chair(root, mats)
    build_side_table(root, mats)
    build_lamp(root, mats)

    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj.select_set(False)
            obj["semantic_part"] = obj.name
    return root


def export_master(output_root, web_output):
    os.makedirs(output_root, exist_ok=True)
    blend_path = os.path.join(output_root, "reading-corner.blend")
    glb_path = os.path.join(output_root, "reading-corner.glb")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
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
    # Preserve the full-detail GLB and native .blend above. The runtime export
    # uses a deterministic per-part decimation pass so the release verifier can
    # compare a genuine high-detail master against a materially smaller Web LOD.
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        decimate = obj.modifiers.new("Web LOD decimation", "DECIMATE")
        decimate.decimate_type = "COLLAPSE"
        decimate.ratio = 0.68
        decimate.use_collapse_triangulate = True
    os.makedirs(os.path.dirname(web_output), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=web_output,
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
    return blend_path, glb_path, web_output


def main():
    args = parse_args()
    build_scene()
    blend_path, glb_path, web_path = export_master(
        os.path.abspath(args.output_root),
        os.path.abspath(args.web_output),
    )
    print(f"Saved editable master: {blend_path}")
    print(f"Exported interchange master: {glb_path}")
    print(f"Exported Web LOD: {web_path}")


if __name__ == "__main__":
    main()
