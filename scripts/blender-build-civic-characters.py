import argparse
import json
import math
import os
import sys

import bpy


ROLE_CONFIGS = {
    "player": {
        "skin": "#e8a678",
        "hair": "#26252d",
        "eye": "#3f342d",
        "top": "#efe4cf",
        "outer": "#71825a",
        "lower": "#303b40",
        "accent": "#996c48",
        "shoe": "#3b342f",
        "hair_style": "spiky",
        "costume": "traveler",
    },
    "listener": {
        "skin": "#e5a174",
        "hair": "#242832",
        "eye": "#3a312b",
        "top": "#258b82",
        "outer": "#eee4d3",
        "lower": "#85765b",
        "accent": "#d1a04c",
        "shoe": "#2d4948",
        "hair_style": "cap",
        "costume": "listener",
    },
    "facilitator": {
        "skin": "#efb187",
        "hair": "#d45f52",
        "eye": "#3d6d5d",
        "top": "#f6efe2",
        "outer": "#faf5eb",
        "lower": "#356e58",
        "accent": "#d98769",
        "shoe": "#5c4031",
        "hair_style": "coral_ponytail",
        "costume": "facilitator",
    },
    "mediator": {
        "skin": "#e9aa80",
        "hair": "#604237",
        "eye": "#4f6149",
        "top": "#f5eee1",
        "outer": "#fff8ed",
        "lower": "#47745d",
        "accent": "#c69455",
        "shoe": "#503b31",
        "hair_style": "braided_bob",
        "costume": "mediator",
    },
}


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Build MirrorLife shared-pivot civic character GLBs.")
    parser.add_argument("--output-root", required=True)
    parser.add_argument("--master-root", required=True)
    return parser.parse_args(argv)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def hex_color(value):
    value = value.lstrip("#")
    channels = [int(value[index:index + 2], 16) / 255 for index in (0, 2, 4)]

    def to_linear(channel):
        return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4

    return tuple(to_linear(channel) for channel in channels) + (1.0,)


def material(name, color, roughness=0.78, metallic=0.0, clearcoat=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = hex_color(color)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = hex_color(color)
    node.inputs["Roughness"].default_value = roughness
    node.inputs["Metallic"].default_value = metallic
    if "Coat Weight" in node.inputs:
        node.inputs["Coat Weight"].default_value = clearcoat
    if "Coat Roughness" in node.inputs:
        node.inputs["Coat Roughness"].default_value = 0.18
    if "Specular IOR Level" in node.inputs:
        node.inputs["Specular IOR Level"].default_value = 0.24
    return mat


def link_material(obj, mat):
    obj.data.materials.append(mat)
    return obj


def empty(name, parent=None, location=(0, 0, 0), rotation=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    return obj


def apply_scale(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.select_set(False)


def ellipsoid(name, location, scale, mat, parent=None, rotation=(0, 0, 0), segments=28, rings=18):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=(0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    obj.scale = scale
    apply_scale(obj)
    link_material(obj, mat)
    bpy.ops.object.shade_smooth()
    return obj


def rounded_box(name, dimensions, location, mat, parent=None, radius=0.035, rotation=(0, 0, 0), segments=4):
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    obj.dimensions = dimensions
    apply_scale(obj)
    bevel = obj.modifiers.new("Tailored edge", "BEVEL")
    bevel.width = min(radius, min(dimensions) * 0.46)
    bevel.segments = segments
    bevel.limit_method = "ANGLE"
    smooth = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    smooth.keep_sharp = True
    link_material(obj, mat)
    return obj


def cylinder(name, radius_bottom, radius_top, depth, location, mat, parent=None, vertices=24, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius_bottom,
        radius2=radius_top,
        depth=depth,
        location=(0, 0, 0),
    )
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    bevel = obj.modifiers.new("Soft edge", "BEVEL")
    bevel.width = min(0.018, depth * 0.08, radius_bottom * 0.14)
    bevel.segments = 3
    smooth = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    smooth.keep_sharp = True
    link_material(obj, mat)
    return obj


def torus(name, major_radius, minor_radius, location, mat, parent=None, rotation=(0, 0, 0), major_segments=32):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=major_segments,
        minor_segments=8,
        location=(0, 0, 0),
    )
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    link_material(obj, mat)
    bpy.ops.object.shade_smooth()
    return obj


def curve_tube(name, points, radius, mat, parent=None, cyclic=False, resolution=3):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = resolution
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
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
    obj.parent = parent
    link_material(obj, mat)
    return obj


def build_materials(role, config):
    return {
        "skin": material(f"{role} skin", config["skin"], 0.82),
        "hair": material(f"{role} hair", config["hair"], 0.72),
        "eye_white": material(f"{role} eye white", "#fffaf0", 0.3, clearcoat=0.42),
        "iris": material(f"{role} iris", config["eye"], 0.34, clearcoat=0.35),
        "ink": material(f"{role} ink", "#25242b", 0.58),
        "blush": material(f"{role} blush", "#df8e88", 0.88),
        "top": material(f"{role} top fabric", config["top"], 0.91),
        "outer": material(f"{role} outer fabric", config["outer"], 0.9),
        "lower": material(f"{role} lower fabric", config["lower"], 0.88),
        "accent": material(f"{role} accent", config["accent"], 0.72),
        "shoe": material(f"{role} shoes", config["shoe"], 0.68),
        "sole": material(f"{role} soles", "#e9ddca", 0.8),
        "metal": material(f"{role} metal", "#c69b4a", 0.34, metallic=0.62),
        "paper": material(f"{role} paper", "#f5ead6", 0.93),
    }


def build_face(head, mats):
    ellipsoid("Head", (0, 0, 0), (0.265, 0.218, 0.28), mats["skin"], head, segments=32, rings=20)
    for side in (-1, 1):
        ellipsoid(f"Ear_{side}", (side * 0.255, 0.002, -0.015), (0.052, 0.032, 0.072), mats["skin"], head, segments=18, rings=12)
        eye = empty(f"EyePivot_{side}", head, (side * 0.09, -0.207, 0.035))
        ellipsoid(f"EyeWhite_{side}", (0, 0, 0), (0.049, 0.023, 0.064), mats["eye_white"], eye, segments=20, rings=12)
        ellipsoid(f"Iris_{side}", (0, -0.022, -0.004), (0.027, 0.011, 0.041), mats["iris"], eye, segments=18, rings=10)
        ellipsoid(f"Pupil_{side}", (0, -0.033, -0.006), (0.014, 0.007, 0.025), mats["ink"], eye, segments=14, rings=8)
        ellipsoid(f"EyeGlint_{side}", (-side * 0.006, -0.041, 0.013), (0.005, 0.0035, 0.008), mats["eye_white"], eye, segments=10, rings=6)
        curve_tube(
            f"Brow_{side}",
            [(side * 0.145, -0.225, 0.115), (side * 0.09, -0.236, 0.125), (side * 0.045, -0.225, 0.115)],
            0.009,
            mats["hair"],
            head,
        )
        ellipsoid(f"Blush_{side}", (side * 0.175, -0.211, -0.045), (0.04, 0.009, 0.018), mats["blush"], head, segments=14, rings=8)
    ellipsoid("Nose", (0, -0.222, -0.02), (0.026, 0.018, 0.035), mats["skin"], head, segments=14, rings=8)
    curve_tube("Mouth", [(-0.044, -0.228, -0.095), (0, -0.236, -0.11), (0.044, -0.228, -0.095)], 0.008, mats["ink"], head)


def build_hair(head, mats, style):
    ellipsoid("HairCap", (0, 0.045, 0.085), (0.282, 0.225, 0.255), mats["hair"], head, segments=30, rings=18)
    fringe_x = (-0.2, -0.12, -0.04, 0.05, 0.14, 0.21)
    for index, x in enumerate(fringe_x):
        height = 0.16 + (index % 2) * 0.035
        ellipsoid(
            f"Fringe_{index + 1}",
            (x, -0.194, 0.125 - abs(x) * 0.12),
            (0.062, 0.035, height),
            mats["hair"],
            head,
            rotation=(0, math.radians(-8), math.radians(-x * 75)),
            segments=18,
            rings=12,
        )
    for side in (-1, 1):
        ellipsoid(f"SideHair_{side}", (side * 0.235, -0.008, -0.07), (0.07, 0.075, 0.17), mats["hair"], head, rotation=(0, 0, side * 0.12), segments=20, rings=12)

    if style == "spiky":
        for index, (x, z, angle) in enumerate(((-0.2, 0.25, -28), (-0.07, 0.29, -12), (0.08, 0.29, 12), (0.21, 0.24, 28))):
            ellipsoid(f"HairSpike_{index + 1}", (x, 0.04, z), (0.07, 0.06, 0.16), mats["hair"], head, rotation=(0, math.radians(8), math.radians(angle)), segments=18, rings=10)
    elif style == "coral_ponytail":
        ellipsoid("HairBun", (0.19, 0.12, 0.18), (0.15, 0.13, 0.16), mats["hair"], head, segments=24, rings=14)
        for index in range(4):
            ellipsoid(
                f"Ponytail_{index + 1}",
                (0.24 + index * 0.025, 0.13, 0.02 - index * 0.15),
                (0.115 - index * 0.012, 0.095 - index * 0.008, 0.13),
                mats["hair"],
                head,
                rotation=(0, 0, -0.12 - index * 0.07),
                segments=22,
                rings=14,
            )
    elif style == "braided_bob":
        for index, x in enumerate((-0.22, -0.11, 0, 0.11, 0.22)):
            ellipsoid(
                f"BraidKnot_{index + 1}",
                (x, -0.018, 0.18 - abs(x) * 0.45),
                (0.052, 0.05, 0.045),
                mats["hair"],
                head,
                segments=16,
                rings=10,
            )


def build_cap(head, mats):
    ellipsoid("CapCrown", (0, -0.005, 0.255), (0.29, 0.22, 0.12), mats["top"], head, segments=28, rings=14)
    rounded_box("CapBrim", (0.28, 0.19, 0.035), (0, -0.24, 0.215), mats["top"], head, radius=0.025, rotation=(math.radians(8), 0, 0))
    torus("CapBadge", 0.035, 0.012, (0.09, -0.226, 0.286), mats["accent"], head, rotation=(math.pi / 2, 0, 0), major_segments=20)


def build_body(role, config, mats, visual):
    torso = ellipsoid("Torso", (0, 0, 1.0), (0.25, 0.155, 0.32), mats["top"], visual, segments=28, rings=18)
    cylinder("Neck", 0.09, 0.085, 0.12, (0, 0, 1.33), mats["skin"], visual, vertices=20)
    rounded_box("WaistBand", (0.45, 0.28, 0.075), (0, -0.005, 0.76), mats["accent"], visual, radius=0.04)

    left_arm = empty("LeftArmPivot", visual, (-0.275, 0, 1.2))
    right_arm = empty("RightArmPivot", visual, (0.275, 0, 1.2))
    left_leg = empty("LeftLegPivot", visual, (-0.135, 0, 0.73))
    right_leg = empty("RightLegPivot", visual, (0.135, 0, 0.73))

    for side, pivot in ((-1, left_arm), (1, right_arm)):
        ellipsoid(f"Arm_{side}", (0, 0, -0.25), (0.078, 0.073, 0.27), mats["top"], pivot, segments=22, rings=14)
        cylinder(f"Cuff_{side}", 0.085, 0.083, 0.08, (0, 0, -0.48), mats["outer"], pivot, vertices=18)
        ellipsoid(f"Hand_{side}", (0, -0.006, -0.555), (0.072, 0.06, 0.085), mats["skin"], pivot, segments=20, rings=12)
        ellipsoid(f"Thumb_{side}", (-side * 0.05, -0.045, -0.535), (0.025, 0.022, 0.05), mats["skin"], pivot, rotation=(0, side * 0.38, side * 0.35), segments=14, rings=8)

    for side, pivot in ((-1, left_leg), (1, right_leg)):
        ellipsoid(f"Leg_{side}", (0, 0, -0.285), (0.095, 0.09, 0.31), mats["lower"], pivot, segments=22, rings=14)
        cylinder(f"TrouserCuff_{side}", 0.102, 0.096, 0.09, (0, 0, -0.535), mats["accent"], pivot, vertices=18)
        rounded_box(f"Shoe_{side}", (0.21, 0.31, 0.15), (0, -0.055, -0.63), mats["shoe"], pivot, radius=0.055)
        rounded_box(f"Sole_{side}", (0.215, 0.31, 0.035), (0, -0.055, -0.705), mats["sole"], pivot, radius=0.012, segments=2)
        curve_tube(f"Lace_{side}", [(-0.055, -0.218, -0.605), (0, -0.225, -0.59), (0.055, -0.218, -0.605)], 0.009, mats["sole"], pivot)

    return torso, left_arm, right_arm, left_leg, right_leg


def build_costume(role, config, mats, visual, left_arm, right_arm):
    costume = config["costume"]
    if costume == "traveler":
        for side in (-1, 1):
            rounded_box(f"Vest_{side}", (0.18, 0.05, 0.45), (side * 0.105, -0.16, 1.0), mats["outer"], visual, radius=0.045, rotation=(0, side * 0.03, side * 0.1))
        rounded_box("Backpack", (0.42, 0.19, 0.5), (0, 0.17, 0.98), mats["accent"], visual, radius=0.1)
        rounded_box("BackpackFlap", (0.33, 0.045, 0.16), (0, 0.275, 1.1), mats["shoe"], visual, radius=0.035)
        rounded_box("BackpackPocket", (0.27, 0.045, 0.17), (0, 0.275, 0.88), mats["outer"], visual, radius=0.04)
        curve_tube("Scarf", [(-0.18, -0.01, 1.27), (0, -0.12, 1.24), (0.18, -0.01, 1.27)], 0.045, mats["accent"], visual)
    elif costume == "listener":
        curve_tube("Hood", [(-0.19, 0.02, 1.27), (0, 0.11, 1.34), (0.19, 0.02, 1.27)], 0.055, mats["outer"], visual)
        rounded_box("Satchel", (0.34, 0.14, 0.27), (0.31, 0.08, 0.78), mats["accent"], visual, radius=0.065)
        curve_tube("CrossBodyStrap", [(-0.2, -0.17, 1.23), (0.02, -0.19, 1.0), (0.25, -0.12, 0.78)], 0.018, mats["outer"], visual)
        for side in (-1, 1):
            rounded_box(f"CargoPocket_{side}", (0.14, 0.055, 0.17), (side * 0.14, -0.095, 0.52), mats["accent"], visual, radius=0.025)
    elif costume in ("facilitator", "mediator"):
        cylinder("Skirt", 0.29, 0.21, 0.5, (0, 0, 0.72), mats["lower"], visual, vertices=32)
        for side in (-1, 1):
            ellipsoid(f"CoatPanel_{side}", (side * 0.13, -0.155, 0.99), (0.13, 0.045, 0.32), mats["outer"], visual, rotation=(0, side * 0.04, side * 0.08), segments=22, rings=14)
            rounded_box(f"Lapel_{side}", (0.12, 0.035, 0.3), (side * 0.07, -0.21, 1.12), mats["outer"], visual, radius=0.025, rotation=(0, side * 0.08, side * 0.45))
        for index in range(3):
            ellipsoid(f"CoatButton_{index + 1}", (0, -0.236, 1.1 - index * 0.12), (0.022, 0.012, 0.022), mats["accent"], visual, segments=12, rings=8)
        if costume == "facilitator":
            rounded_box("StoryNotebook", (0.22, 0.05, 0.3), (0.12, -0.12, -0.39), mats["accent"], left_arm, radius=0.035, rotation=(0.08, -0.18, -0.08))
            rounded_box("NotebookPaper", (0.19, 0.012, 0.27), (0.12, -0.151, -0.39), mats["paper"], left_arm, radius=0.025, rotation=(0.08, -0.18, -0.08))
        else:
            curve_tube("Necklace", [(-0.11, -0.205, 1.2), (0, -0.225, 1.08), (0.11, -0.205, 1.2)], 0.012, mats["metal"], visual)
            ellipsoid("NecklacePendant", (0, -0.24, 1.07), (0.035, 0.012, 0.05), mats["metal"], visual, segments=14, rings=8)


def build_character(role, config):
    clear_scene()
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
    bpy.context.scene.world.color = (0.03, 0.03, 0.04)
    mats = build_materials(role, config)

    root = empty("VisualRoot")
    root["asset"] = f"civic-{role}"
    root["rig_contract"] = "mirrorlife-shared-pivot-v1"
    root["real_world_unit"] = "meter"
    root["identity_role"] = role

    torso, left_arm, right_arm, left_leg, right_leg = build_body(role, config, mats, root)
    head = empty("HeadPivot", root, (0, 0, 1.46))
    build_face(head, mats)
    build_hair(head, mats, config["hair_style"])
    if config["hair_style"] == "cap":
        build_cap(head, mats)
    build_costume(role, config, mats, root, left_arm, right_arm)

    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj["semantic_part"] = obj.name
            obj["actor_role"] = role
    return root


def export_character(role, output_root, master_root):
    os.makedirs(output_root, exist_ok=True)
    os.makedirs(master_root, exist_ok=True)
    blend_path = os.path.join(master_root, f"{role}.blend")
    glb_path = os.path.join(output_root, f"{role}.glb")
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
    return blend_path, glb_path


def mesh_metrics():
    triangles = 0
    meshes = 0
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        meshes += 1
        evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        triangles += len(mesh.loop_triangles)
        evaluated.to_mesh_clear()
    return {"meshes": meshes, "triangles": triangles}


def main():
    args = parse_args()
    output_root = os.path.abspath(args.output_root)
    master_root = os.path.abspath(args.master_root)
    manifest = {
        "contract": "mirrorlife-shared-pivot-v1",
        "worldUnitMeters": 1,
        "heightMeters": 1.72,
        "roles": {},
    }
    for role, config in ROLE_CONFIGS.items():
        build_character(role, config)
        metrics = mesh_metrics()
        blend_path, glb_path = export_character(role, output_root, master_root)
        manifest["roles"][role] = {
            "file": os.path.basename(glb_path),
            # Keep developer workstation paths out of the public Web manifest.
            "editableSource": os.path.relpath(blend_path, os.getcwd()).replace(os.sep, "/"),
            **metrics,
        }
        print(f"Built {role}: {metrics['meshes']} meshes, {metrics['triangles']} triangles -> {glb_path}")
    with open(os.path.join(output_root, "manifest.json"), "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


if __name__ == "__main__":
    main()
