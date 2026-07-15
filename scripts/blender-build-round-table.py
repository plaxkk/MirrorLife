import argparse
import math
import os
import sys

import bpy
from mathutils import Vector


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Build the editable MirrorLife round-table master and web LOD.")
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


def material(name, color, roughness=0.78, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = hex_color(color)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = hex_color(color)
    node.inputs["Roughness"].default_value = roughness
    node.inputs["Metallic"].default_value = metallic
    if "Specular IOR Level" in node.inputs:
        node.inputs["Specular IOR Level"].default_value = 0.22
    return mat


def empty(name, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    return obj


def link_material(obj, mat):
    obj.data.materials.append(mat)
    return obj


def apply_transform(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.select_set(False)


def finish(obj, name, mat, parent=None):
    obj.name = name
    obj["semantic_part"] = name
    link_material(obj, mat)
    if parent:
        obj.parent = parent
    return obj


def rounded_box(name, dimensions, location, mat, detail, radius=0.035, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.dimensions = dimensions
    apply_transform(obj)
    bevel = obj.modifiers.new("Cel bevel", "BEVEL")
    bevel.width = min(radius, min(dimensions) * 0.45)
    bevel.segments = detail["bevel"]
    bevel.limit_method = "ANGLE"
    normals = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    normals.keep_sharp = True
    return finish(obj, name, mat, parent)


def cylinder(name, radius, depth, location, mat, detail, radius_top=None, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cone_add(
        vertices=detail["cylinder"],
        radius1=radius,
        radius2=radius if radius_top is None else radius_top,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    bevel = obj.modifiers.new("Rounded edge", "BEVEL")
    bevel.width = min(0.025, radius * 0.15, depth * 0.12)
    bevel.segments = min(4, detail["bevel"])
    normals = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    normals.keep_sharp = True
    return finish(obj, name, mat, parent)


def torus(name, major_radius, minor_radius, location, mat, detail, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=detail["torus_major"],
        minor_segments=detail["torus_minor"],
        location=location,
        rotation=rotation,
    )
    return finish(bpy.context.object, name, mat, parent)


def ellipsoid(name, location, scale, mat, detail, rotation=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=detail["sphere_segments"],
        ring_count=detail["sphere_rings"],
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.scale = scale
    apply_transform(obj)
    return finish(obj, name, mat, parent)


def beam_between(name, start, end, width, depth, mat, detail, parent=None, radius=0.025):
    start_v = Vector(start)
    end_v = Vector(end)
    direction = end_v - start_v
    obj = rounded_box(
        name,
        (width, depth, direction.length),
        (start_v + end_v) * 0.5,
        mat,
        detail,
        radius,
        parent=parent,
    )
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    return obj


def build_table(root, mats, detail):
    table = empty("Round_Table", root)
    top_z = 0.77
    cylinder("Tabletop_Wood_Core", 0.79, 0.14, (0, 0, top_z), mats["wood"], detail, parent=table)
    cylinder("Tabletop_Cream_Inlay", 0.735, 0.026, (0, 0, top_z + 0.083), mats["cream"], detail, parent=table)
    torus("Tabletop_Gold_Rim", 0.748, 0.027, (0, 0, top_z + 0.075), mats["wood_light"], detail, parent=table)
    torus("Tabletop_Shadow_Apron", 0.71, 0.055, (0, 0, top_z - 0.085), mats["wood_dark"], detail, parent=table)
    torus("Tabletop_Inner_Line", 0.64, 0.009, (0, 0, top_z + 0.101), mats["wood_grain"], detail, parent=table)

    cylinder("Pedestal_Upper_Collar", 0.20, 0.11, (0, 0, 0.65), mats["wood_light"], detail, radius_top=0.16, parent=table)
    cylinder("Pedestal_Column", 0.13, 0.46, (0, 0, 0.40), mats["wood"], detail, radius_top=0.16, parent=table)
    torus("Pedestal_Mid_Ring", 0.145, 0.026, (0, 0, 0.47), mats["wood_light"], detail, parent=table)
    cylinder("Pedestal_Lower_Collar", 0.24, 0.12, (0, 0, 0.17), mats["wood_dark"], detail, radius_top=0.15, parent=table)
    cylinder("Table_Base", 0.37, 0.09, (0, 0, 0.075), mats["wood"], detail, radius_top=0.31, parent=table)
    torus("Table_Base_Rim", 0.32, 0.025, (0, 0, 0.12), mats["wood_light"], detail, parent=table)
    for index, angle in enumerate((0, math.pi / 2, math.pi, math.pi * 1.5)):
        foot = rounded_box(
            f"Pedestal_Foot_{index + 1}",
            (0.44, 0.12, 0.08),
            (math.cos(angle) * 0.27, math.sin(angle) * 0.27, 0.055),
            mats["wood_dark"],
            detail,
            0.04,
            rotation=(0, 0, angle),
            parent=table,
        )
        foot["finished_underside"] = True

    centerpiece = empty("Center_Plant", table)
    cylinder("Center_Pot", 0.115, 0.15, (0, 0, 0.965), mats["terracotta"], detail, radius_top=0.14, parent=centerpiece)
    torus("Center_Pot_Rim", 0.13, 0.018, (0, 0, 1.043), mats["terracotta_light"], detail, parent=centerpiece)
    cylinder("Center_Pot_Soil", 0.112, 0.018, (0, 0, 1.045), mats["soil"], detail, parent=centerpiece)
    for index in range(9):
        angle = index * math.tau / 9
        radius = 0.09 if index % 3 else 0.055
        height = 1.14 + (index % 3) * 0.035
        ellipsoid(
            f"Center_Leaf_{index + 1}",
            (math.cos(angle) * radius, math.sin(angle) * radius, height),
            (0.045, 0.025, 0.14),
            mats["green_light" if index % 2 else "green"],
            detail,
            rotation=(math.radians(math.cos(angle) * 24), math.radians(math.sin(angle) * 24), -angle),
            parent=centerpiece,
        )


def build_chair(root, mats, detail, index, angle):
    chair = empty(f"Chair_{index}", root)
    rounded_box("Seat_Frame", (0.54, 0.52, 0.11), (0, 0, 0.47), mats["wood"], detail, 0.06, parent=chair)
    rounded_box("Seat_Cushion", (0.46, 0.44, 0.10), (0, 0.015, 0.555), mats["cushion"], detail, 0.07, parent=chair)
    rounded_box("Seat_Cushion_Highlight", (0.35, 0.32, 0.012), (0, -0.005, 0.613), mats["cushion_light"], detail, 0.04, parent=chair)

    for leg_index, (x, y) in enumerate(((-0.20, -0.18), (0.20, -0.18), (-0.20, 0.18), (0.20, 0.18))):
        leg = cylinder(
            f"Chair_Leg_{leg_index + 1}",
            0.047,
            0.43,
            (x, y, 0.245),
            mats["wood_dark" if y < 0 else "wood"],
            detail,
            radius_top=0.041,
            parent=chair,
        )
        leg.rotation_euler.x = math.radians(-4 if y < 0 else 4)
        leg.rotation_euler.y = math.radians(4 if x < 0 else -4)

    for side, x in (("L", -0.23), ("R", 0.23)):
        beam_between(
            f"Back_Post_{side}",
            (x, -0.22, 0.48),
            (x, -0.25, 1.13),
            0.075,
            0.075,
            mats["wood"],
            detail,
            chair,
            0.025,
        )
    beam_between("Back_Cross_A", (-0.19, -0.235, 0.68), (0.19, -0.235, 1.02), 0.052, 0.052, mats["wood_dark"], detail, chair, 0.018)
    beam_between("Back_Cross_B", (0.19, -0.235, 0.68), (-0.19, -0.235, 1.02), 0.052, 0.052, mats["wood_dark"], detail, chair, 0.018)
    rounded_box("Backrest_Cap", (0.57, 0.13, 0.17), (0, -0.25, 1.14), mats["wood"], detail, 0.075, parent=chair)
    rounded_box("Backrest_Pad", (0.43, 0.105, 0.12), (0, -0.278, 1.145), mats["cushion"], detail, 0.055, parent=chair)
    rounded_box("Backrest_Highlight", (0.31, 0.012, 0.045), (0, -0.337, 1.175), mats["cushion_light"], detail, 0.02, parent=chair)

    for side, x in (("L", -0.235), ("R", 0.235)):
        cylinder(
            f"Backrest_Bolt_{side}",
            0.018,
            0.018,
            (x, -0.296, 1.14),
            mats["bronze"],
            detail,
            rotation=(math.radians(90), 0, 0),
            parent=chair,
        )
    radius = 1.13
    chair.location.x = math.sin(angle) * radius
    chair.location.y = -math.cos(angle) * radius
    chair.rotation_euler.z = angle
    return chair


def build_scene(lod):
    clear_scene()
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
    bpy.context.scene.world.color = (0.04, 0.04, 0.06)
    detail = {
        "master": {"bevel": 6, "cylinder": 64, "torus_major": 64, "torus_minor": 14, "sphere_segments": 28, "sphere_rings": 16},
        "web": {"bevel": 3, "cylinder": 32, "torus_major": 32, "torus_minor": 8, "sphere_segments": 16, "sphere_rings": 9},
    }[lod]
    mats = {
        "ink": material("Ink", "#1a1a2e"),
        "wood": material("Honey wood", "#d8943b"),
        "wood_light": material("Honey wood highlight", "#f2b856"),
        "wood_dark": material("Honey wood shadow", "#8b532d"),
        "wood_grain": material("Wood grain line", "#b76b2d"),
        "cream": material("Cream tabletop", "#fff1c7", 0.7),
        "cushion": material("Leaf green cushion", "#72ad45", 0.72),
        "cushion_light": material("Cushion highlight", "#a8d766", 0.65),
        "terracotta": material("Plant pot", "#c87443", 0.72),
        "terracotta_light": material("Plant pot rim", "#efaa67", 0.64),
        "soil": material("Plant soil", "#51351f"),
        "green": material("Plant green", "#3d8f3a"),
        "green_light": material("Plant light green", "#8ecf45"),
        "bronze": material("Bronze fastener", "#b97225", 0.48, 0.22),
    }
    root = empty("Round_Table_Master")
    root["asset"] = "round-table"
    root["standard"] = "faithful-complete-multiview-v3"
    root["provider"] = "blender-manual"
    root["lod"] = lod
    root["real_world_unit"] = "meter"
    root["source_reference"] = "residence/round_dining_table.png"
    root["fallback_reference"] = "residence/dining_table_set.png"
    build_table(root, mats, detail)
    chairs = empty("Four_Matching_Chairs", root)
    for index, angle in enumerate((0, math.pi / 2, math.pi, math.pi * 1.5), 1):
        build_chair(chairs, mats, detail, index, angle)
    return root


def export_asset(output_root, lod):
    os.makedirs(output_root, exist_ok=True)
    if lod == "master":
        blend_path = os.path.join(output_root, "round-table.blend")
        bpy.ops.wm.save_as_mainfile(filepath=blend_path)
        print(f"Saved editable master: {blend_path}")
    glb_path = os.path.join(output_root, "round-table.glb")
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


def main():
    args = parse_args()
    build_scene(args.lod)
    export_asset(os.path.abspath(args.output_root), args.lod)


if __name__ == "__main__":
    main()
