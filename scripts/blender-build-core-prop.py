import argparse
import math
import os
import sys

import bpy


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Build editable release masters for MirrorLife core props.")
    parser.add_argument("--slot", choices=("bed", "workbench"), required=True)
    parser.add_argument("--output-root", required=True)
    parser.add_argument("--web-output", required=True)
    return parser.parse_args(argv)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collections in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for datablock in list(collections):
            if datablock.users == 0:
                collections.remove(datablock)


def srgb(value):
    value = value.lstrip("#")
    channels = [int(value[index:index + 2], 16) / 255 for index in (0, 2, 4)]
    return tuple(channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4 for channel in channels) + (1.0,)


def make_material(name, color, roughness=0.72, metallic=0.0):
    result = bpy.data.materials.new(name)
    result.diffuse_color = srgb(color)
    result.use_nodes = True
    shader = result.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = srgb(color)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    return result


def tag(obj, semantic):
    obj["semantic_part"] = semantic
    obj.data.materials[0].name = obj.data.materials[0].name
    return obj


def apply_scale(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.select_set(False)


def box(name, dimensions, location, material, semantic, radius=0.035, rotation=(0, 0, 0), bevel_segments=4):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    apply_scale(obj)
    obj.data.materials.append(material)
    if radius > 0:
        bevel = obj.modifiers.new("Authored edge radius", "BEVEL")
        bevel.width = min(radius, min(dimensions) * 0.45)
        bevel.segments = bevel_segments
        bevel.limit_method = "ANGLE"
        normals = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
        normals.keep_sharp = True
    return tag(obj, semantic)


def cylinder(name, radius, depth, location, material, semantic, vertices=32, rotation=(0, 0, 0), radius_top=None):
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
    obj.data.materials.append(material)
    bevel = obj.modifiers.new("Authored edge radius", "BEVEL")
    bevel.width = min(0.018, radius * 0.18, depth * 0.15)
    bevel.segments = 3
    normals = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    normals.keep_sharp = True
    return tag(obj, semantic)


def torus(name, major_radius, minor_radius, location, material, semantic, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=40,
        minor_segments=10,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return tag(obj, semantic)


def build_bed(materials):
    # A 2.24 m care bed with a readable domestic silhouette and complete care
    # affordances. All geometry is closed and both long sides remain navigable.
    box("Bed_Frame", (2.24, 1.02, 0.18), (0, 0, 0.58), materials["teal_dark"], "bed frame", 0.055)
    box("Mattress", (2.04, 0.94, 0.24), (-0.02, 0, 0.78), materials["ivory"], "mattress", 0.095, rotation=(0, math.radians(-1.5), 0))
    box("Headboard", (0.15, 1.04, 0.96), (-1.09, 0, 1.02), materials["teal"], "headboard", 0.06)
    box("Footboard", (0.12, 1.0, 0.66), (1.08, 0, 0.88), materials["teal"], "footboard", 0.055)
    box("Pillow", (0.55, 0.72, 0.16), (-0.69, 0, 1.02), materials["peach"], "pillow", 0.09, rotation=(0, math.radians(-5), 0))
    box("Blanket", (1.16, 0.91, 0.08), (0.3, 0, 0.96), materials["yellow"], "blanket", 0.04)
    for x in (-0.82, 0.82):
        for y in (-0.39, 0.39):
            cylinder(f"Caster_Stem_{x}_{y}", 0.035, 0.24, (x, y, 0.39), materials["metal"], "caster wheels", 24)
            torus(
                f"Caster_Wheel_{x}_{y}",
                0.075,
                0.022,
                (x, y, 0.24),
                materials["rubber"],
                "caster wheels",
                rotation=(math.radians(90), 0, 0),
            )
    # Bedside table with a closed rear carcass and two visible drawers.
    box("Bedside_Carcass", (0.62, 0.58, 0.72), (-0.66, -0.91, 0.54), materials["wood"], "bedside table", 0.045)
    for index, z in enumerate((0.67, 0.42)):
        box(f"Bedside_Drawer_{index + 1}", (0.53, 0.04, 0.2), (-0.66, -1.205, z), materials["wood_light"], "bedside table", 0.018)
        cylinder(f"Bedside_Handle_{index + 1}", 0.025, 0.13, (-0.66, -1.245, z), materials["metal"], "bedside table", 20, rotation=(math.radians(90), 0, 0))
    # Patient monitor uses a teal bezel, readable screen, stand and rear body.
    cylinder("Monitor_Pole", 0.035, 0.84, (-0.69, -0.91, 1.32), materials["metal"], "patient monitor", 28)
    box("Monitor_Body", (0.52, 0.18, 0.39), (-0.69, -0.91, 1.75), materials["teal_dark"], "patient monitor", 0.055)
    box("Monitor_Screen", (0.39, 0.025, 0.25), (-0.69, -1.015, 1.77), materials["screen"], "patient monitor", 0.035)
    for offset in (-0.11, 0, 0.11):
        box("Monitor_Trace", (0.055, 0.012, 0.018), (-0.69 + offset, -1.034, 1.77 + offset * 0.22), materials["mint"], "patient monitor", 0.007)
    # Freestanding IV assembly with bag, cap and hook; the bag is a closed,
    # translucent-looking solid instead of an alpha billboard.
    iv_x, iv_y = -0.92, 0.82
    cylinder("IV_Base", 0.22, 0.055, (iv_x, iv_y, 0.08), materials["metal"], "IV stand", 40)
    cylinder("IV_Pole", 0.025, 1.92, (iv_x, iv_y, 1.06), materials["metal"], "IV stand", 28)
    cylinder("IV_Hook", 0.018, 0.42, (iv_x, iv_y, 2.01), materials["metal"], "IV stand", 24, rotation=(0, math.radians(90), 0))
    box("IV_Bag", (0.25, 0.09, 0.42), (iv_x + 0.17, iv_y, 1.75), materials["iv_bag"], "IV bag", 0.075)
    box("IV_Bag_Label", (0.13, 0.014, 0.1), (iv_x + 0.17, iv_y - 0.052, 1.76), materials["mint"], "IV bag", 0.018)


def build_workbench(materials):
    # Finished four-sided bench: 2.15 m wide with accessible tool surface,
    # lower storage, tool rail and fully modeled rear braces.
    box("Worktop", (2.15, 0.9, 0.16), (0, 0, 1.08), materials["wood_light"], "worktop", 0.045)
    box("Worktop_Apron_Front", (2.08, 0.14, 0.28), (0, -0.38, 0.92), materials["wood"], "wood frame", 0.025)
    box("Worktop_Apron_Back", (2.08, 0.14, 0.28), (0, 0.38, 0.92), materials["wood"], "finished backside", 0.025)
    for x in (-0.91, 0.91):
        for y in (-0.33, 0.33):
            box(f"Leg_{x}_{y}", (0.14, 0.14, 0.94), (x, y, 0.51), materials["wood_dark"], "four legs", 0.025)
    box("Lower_Brace_Front", (1.88, 0.1, 0.12), (0, -0.33, 0.29), materials["wood"], "lower brace", 0.02)
    box("Lower_Brace_Back", (1.88, 0.1, 0.12), (0, 0.33, 0.29), materials["wood"], "finished backside", 0.02)
    box("Lower_Shelf", (1.78, 0.64, 0.1), (0, 0, 0.38), materials["wood"], "lower brace", 0.025)
    # The rail and pegboard are thin closed solids with rear structure.
    box("Rear_Tool_Rail", (2.02, 0.12, 0.14), (0, 0.37, 1.42), materials["teal"], "rear tool rail", 0.025)
    box("Pegboard", (1.86, 0.08, 0.72), (0, 0.4, 1.78), materials["ivory"], "rear tool rail", 0.035)
    box("Pegboard_Back_Frame", (1.96, 0.1, 0.12), (0, 0.45, 2.1), materials["teal_dark"], "finished backside", 0.02)
    for x in (-0.92, 0.92):
        box("Pegboard_Side_Frame", (0.12, 0.11, 0.78), (x, 0.44, 1.78), materials["teal_dark"], "finished backside", 0.02)
    # Tool containers read from both front obliques.
    for index, x in enumerate((-0.62, -0.34, 0.52)):
        cylinder(f"Tool_Container_{index + 1}", 0.11, 0.24, (x, -0.18, 1.28), materials["coral" if index == 2 else "teal"], "tool containers", 32, radius_top=0.13)
    # A vise with fixed body, slide, jaws and spindle.
    box("Vise_Body", (0.42, 0.35, 0.2), (0.72, -0.25, 1.25), materials["teal_dark"], "bench vise", 0.045)
    box("Vise_Fixed_Jaw", (0.12, 0.4, 0.25), (0.57, -0.25, 1.39), materials["metal"], "bench vise", 0.025)
    box("Vise_Moving_Jaw", (0.12, 0.4, 0.25), (0.9, -0.25, 1.39), materials["metal"], "bench vise", 0.025)
    cylinder("Vise_Spindle", 0.025, 0.58, (0.92, -0.46, 1.24), materials["metal"], "bench vise", 24, rotation=(math.radians(90), 0, 0))
    cylinder("Vise_Handle", 0.022, 0.45, (0.92, -0.76, 1.24), materials["wood_light"], "bench vise", 24, rotation=(0, math.radians(90), 0))
    # Distinct hammer, wrench and screwdrivers; each is real 3D geometry.
    cylinder("Hammer_Handle", 0.035, 0.48, (-0.55, -0.08, 1.66), materials["wood_light"], "hand tools", 24, rotation=(0, math.radians(18), 0))
    box("Hammer_Head", (0.32, 0.11, 0.12), (-0.49, -0.08, 1.89), materials["metal"], "hand tools", 0.025, rotation=(0, math.radians(18), 0))
    cylinder("Wrench_Shaft", 0.028, 0.46, (0.04, -0.08, 1.67), materials["metal"], "hand tools", 24, rotation=(0, math.radians(-12), 0))
    torus("Wrench_Ring", 0.075, 0.025, (-0.01, -0.08, 1.9), materials["metal"], "hand tools", rotation=(math.radians(90), 0, 0))
    for index, x in enumerate((0.28, 0.42)):
        cylinder(f"Screwdriver_{index + 1}", 0.026, 0.35, (x, -0.08, 1.68), materials["metal"], "hand tools", 20)
        cylinder(f"Screwdriver_Handle_{index + 1}", 0.055, 0.16, (x, -0.08, 1.91), materials["coral" if index else "yellow"], "hand tools", 24, radius_top=0.045)


def build_scene(slot):
    clear_scene()
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    materials = {
        "ivory": make_material("Warm ivory textile", "#f7ead2", 0.86),
        "teal": make_material("Civic teal", "#4e9b8f", 0.7),
        "teal_dark": make_material("Deep civic teal", "#23665f", 0.66),
        "peach": make_material("Care peach", "#ef8d77", 0.82),
        "coral": make_material("Tool coral", "#dd6f5c", 0.72),
        "yellow": make_material("Wayfinding yellow", "#efc65a", 0.78),
        "mint": make_material("Signal mint", "#88d4b2", 0.58),
        "wood": make_material("Honey oak", "#a96537", 0.76),
        "wood_light": make_material("Oak highlight", "#d58d49", 0.74),
        "wood_dark": make_material("Oak end grain", "#70432f", 0.8),
        "metal": make_material("Brushed steel", "#7e8d92", 0.34, 0.55),
        "rubber": make_material("Caster rubber", "#263238", 0.92),
        "screen": make_material("Monitor face", "#223f4c", 0.38),
        "iv_bag": make_material("IV bag polymer", "#d8eee5", 0.32),
    }
    root = bpy.data.objects.new(f"{slot.title()}_Release_Master", None)
    bpy.context.collection.objects.link(root)
    root["asset"] = slot
    root["standard"] = "mirrorlife-runtime-art-bible-v1"
    root["real_world_unit"] = "meter"
    if slot == "bed":
        build_bed(materials)
    else:
        build_workbench(materials)
    for obj in bpy.context.scene.objects:
        if obj is not root:
            obj.parent = root


def export_assets(slot, output_root, web_output):
    os.makedirs(output_root, exist_ok=True)
    os.makedirs(os.path.dirname(web_output), exist_ok=True)
    blend_path = os.path.join(output_root, f"{slot}.blend")
    master_path = os.path.join(output_root, f"{slot}.glb")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    export_options = dict(
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
    bpy.ops.export_scene.gltf(filepath=master_path, **export_options)
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        decimate = obj.modifiers.new("Web LOD decimation", "DECIMATE")
        decimate.decimate_type = "COLLAPSE"
        decimate.ratio = 0.62
        decimate.use_collapse_triangulate = True
    bpy.ops.export_scene.gltf(filepath=web_output, **export_options)
    return blend_path, master_path, web_output


def main():
    args = parse_args()
    build_scene(args.slot)
    paths = export_assets(args.slot, os.path.abspath(args.output_root), os.path.abspath(args.web_output))
    print(f"Saved editable master: {paths[0]}")
    print(f"Exported high-detail master: {paths[1]}")
    print(f"Installed Web GLB: {paths[2]}")


if __name__ == "__main__":
    main()
