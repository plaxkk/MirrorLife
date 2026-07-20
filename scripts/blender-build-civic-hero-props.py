import argparse
import json
import math
import os
import sys

import bpy


PALETTE = {
    "ivory": "#f4ead9",
    "paper": "#f7f0e3",
    "oak": "#9a6240",
    "walnut": "#573725",
    "cork": "#c69062",
    "coral": "#df8066",
    "teal": "#3d8d83",
    "deep_teal": "#286b65",
    "sage": "#6f9a70",
    "leaf": "#477b50",
    "butter": "#efc85d",
    "blue": "#6f9fd1",
    "brass": "#c29a48",
    "ink": "#37302c",
    "ceramic": "#efe2cf",
    "glass": "#d8ece5",
}


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Build MirrorLife civic hero prop GLBs.")
    parser.add_argument("--output-root", required=True)
    parser.add_argument("--master-root", required=True)
    return parser.parse_args(argv)


def hex_color(value, alpha=1.0):
    value = value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) / 255 for index in (0, 2, 4)) + (alpha,)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def material(name, color, roughness=0.72, metallic=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = hex_color(color, alpha)
    mat.use_nodes = True
    # Closed opaque hero meshes are authored with outward normals, so export
    # them single-sided. The runtime can then preserve color/roughness as
    # vertex attributes and batch the complete suite without changing its
    # visible material hierarchy. Glass remains double-sided.
    mat.use_backface_culling = alpha >= 1
    node = mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = hex_color(color, alpha)
    node.inputs["Roughness"].default_value = roughness
    node.inputs["Metallic"].default_value = metallic
    node.inputs["Alpha"].default_value = alpha
    if alpha < 1:
        if hasattr(mat, "surface_render_method"):
            mat.surface_render_method = "DITHERED"
        elif hasattr(mat, "blend_method"):
            mat.blend_method = "BLEND"
        mat.use_transparency_overlap = False
    return mat


def materials():
    return {
        "ivory": material("Civic plaster ivory", PALETTE["ivory"], 0.94),
        "paper": material("Civic paper", PALETTE["paper"], 0.92),
        "oak": material("Civic oak", PALETTE["oak"], 0.62),
        "walnut": material("Civic walnut", PALETTE["walnut"], 0.7),
        "cork": material("Civic cork", PALETTE["cork"], 0.88),
        "coral": material("Civic coral paint", PALETTE["coral"], 0.7),
        "teal": material("Civic teal textile", PALETTE["teal"], 0.9),
        "deep_teal": material("Civic deep teal", PALETTE["deep_teal"], 0.86),
        "sage": material("Civic sage textile", PALETTE["sage"], 0.92),
        "leaf": material("Civic foliage", PALETTE["leaf"], 0.96),
        "butter": material("Civic butter textile", PALETTE["butter"], 0.9),
        "blue": material("Civic cornflower paper", PALETTE["blue"], 0.86),
        "brass": material("Civic brushed brass", PALETTE["brass"], 0.3, 0.7),
        "ink": material("Civic ink", PALETTE["ink"], 0.74),
        "ceramic": material("Civic warm ceramic", PALETTE["ceramic"], 0.46),
        "glass": material("Civic display glass", PALETTE["glass"], 0.18, 0.0, 0.28),
    }


def link(obj, mat, parent=None):
    obj.data.materials.append(mat)
    obj.parent = parent
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def apply_scale(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.select_set(False)


def empty(name, parent=None, location=(0, 0, 0), rotation=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    return obj


def rounded_box(name, size, location, mat, parent, radius=0.04, rotation=(0, 0, 0), segments=3):
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    obj.dimensions = size
    apply_scale(obj)
    bevel = obj.modifiers.new("Crafted edge", "BEVEL")
    bevel.width = min(radius, min(size) * 0.46)
    bevel.segments = segments
    bevel.limit_method = "ANGLE"
    link(obj, mat)
    return obj


def cylinder(name, radius, depth, location, mat, parent, vertices=20, rotation=(0, 0, 0), radius_top=None):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius,
        radius2=radius if radius_top is None else radius_top,
        depth=depth,
        location=(0, 0, 0),
    )
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    return link(obj, mat)


def sphere(name, scale, location, mat, parent, segments=18, rings=12, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=(0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    obj.scale = scale
    apply_scale(obj)
    return link(obj, mat)


def torus(name, major, minor, location, mat, parent, rotation=(0, 0, 0), major_segments=24, minor_segments=8):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major,
        minor_radius=minor,
        major_segments=major_segments,
        minor_segments=minor_segments,
        location=(0, 0, 0),
    )
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    return link(obj, mat)


def add_book(parent, mats, name, location, size=(0.18, 0.05, 0.26), color="blue", rotation=(0, 0, 0)):
    rounded_box(name, size, location, mats[color], parent, 0.012, rotation, 2)
    rounded_box(f"{name}_pages", (size[0] * 0.88, size[1] * 0.68, size[2] * 0.92),
                (location[0], location[1] - 0.004, location[2] - 0.006), mats["paper"], parent, 0.008, rotation, 2)


def add_plant(parent, mats, name, location, scale=1.0):
    cylinder(f"{name}_pot", 0.14 * scale, 0.22 * scale, location, mats["ceramic"], parent, 18, radius_top=0.17 * scale)
    for index, angle in enumerate((-1.0, -0.48, 0.05, 0.55, 1.06)):
        leaf = sphere(
            f"{name}_leaf_{index + 1}",
            (0.075 * scale, 0.032 * scale, 0.22 * scale),
            (location[0] + math.sin(angle) * 0.12 * scale, location[1] - 0.015 * scale, location[2] + 0.23 * scale + math.cos(angle) * 0.13 * scale),
            mats["leaf"] if index % 2 else mats["sage"],
            parent,
            14,
            9,
            (0.15, angle * 0.28, -angle * 0.42),
        )
        leaf["semantic_part"] = "foliage"


def add_ceramic(parent, mats, name, location, scale=1.0, accent=None):
    cylinder(f"{name}_body", 0.1 * scale, 0.2 * scale, location, mats[accent or "ceramic"], parent, 22, radius_top=0.075 * scale)
    torus(f"{name}_rim", 0.072 * scale, 0.012 * scale, (location[0], location[1], location[2] + 0.105 * scale), mats["brass"] if accent else mats["ceramic"], parent)


def build_display_case(mats):
    root = empty("CivicDisplayCase")
    root["asset"] = "civic-display-case"
    # Low cabinet with real joinery, inset doors and a brass toe rail.
    rounded_box("DisplayOakBase", (1.86, 0.65, 0.7), (0, 0, 0.38), mats["oak"], root, 0.1, segments=5)
    rounded_box("DisplayWalnutPlinth", (1.96, 0.12, 0.78), (0, 0, 0.73), mats["walnut"], root, 0.045)
    for side in (-1, 1):
        rounded_box(f"DisplayInset_{side}", (0.68, 0.035, 0.37), (side * 0.41, -0.357, 0.38), mats["deep_teal"], root, 0.045)
        cylinder(f"DisplayKnob_{side}", 0.035, 0.045, (side * 0.12, -0.392, 0.39), mats["brass"], root, 14, (math.pi / 2, 0, 0))
    rounded_box("DisplayBrassToeRail", (1.68, 0.03, 0.035), (0, -0.382, 0.11), mats["brass"], root, 0.012)
    for x in (-0.78, 0.78):
        cylinder(f"DisplayFoot_{x}", 0.055, 0.22, (x, 0, 0.11), mats["walnut"], root, 14)

    # The upper glass case has a complete back, shelf, wood frame and side panes.
    rounded_box("DisplayCaseFloor", (1.78, 0.66, 0.09), (0, 0, 0.8), mats["oak"], root, 0.03)
    rounded_box("DisplayCaseBack", (1.78, 0.08, 0.68), (0, 0.29, 1.13), mats["walnut"], root, 0.035)
    rounded_box("DisplayCaseTop", (1.82, 0.72, 0.1), (0, 0, 1.5), mats["walnut"], root, 0.035)
    for x in (-0.86, 0.86):
        rounded_box(f"DisplayPost_{x}", (0.07, 0.07, 0.7), (x, -0.3, 1.14), mats["walnut"], root, 0.025)
    rounded_box("DisplayFrontGlass", (1.68, 0.026, 0.58), (0, -0.345, 1.16), mats["glass"], root, 0.012)
    for x in (-0.84, 0.84):
        rounded_box(f"DisplaySideGlass_{x}", (0.026, 0.58, 0.58), (x, -0.01, 1.16), mats["glass"], root, 0.012)
    rounded_box("DisplayShelf", (1.68, 0.55, 0.035), (0, -0.02, 1.1), mats["glass"], root, 0.01)

    for index, x in enumerate((-0.55, -0.18, 0.2, 0.56)):
        rounded_box(f"DisplayTray_{index + 1}", (0.28, 0.35, 0.035), (x, -0.04, 0.87), mats["oak"], root, 0.025)
        sphere(f"DisplayObject_{index + 1}", (0.12, 0.14, 0.07 + (index % 2) * 0.025), (x, -0.05, 0.96), mats[("butter", "ceramic", "coral", "teal")[index]], root, 16, 10)
        rounded_box(f"DisplayLabel_{index + 1}", (0.16, 0.012, 0.075), (x, -0.225, 0.9), mats["paper"], root, 0.008, (-0.22, 0, 0))

    # Top still life gives the foreground silhouette the authored density of the target.
    rounded_box("DisplayMenuFrame", (0.48, 0.06, 0.4), (-0.48, -0.03, 1.75), mats["walnut"], root, 0.045, (0.16, 0, 0))
    rounded_box("DisplayMenuPaper", (0.39, 0.03, 0.31), (-0.48, -0.055, 1.75), mats["paper"], root, 0.035, (0.16, 0, 0))
    add_ceramic(root, mats, "DisplayTopVase", (0.53, -0.03, 1.66), 0.95)
    for index, angle in enumerate((-0.75, -0.24, 0.24, 0.78)):
        cylinder(f"DisplayFlowerStem_{index}", 0.009, 0.38 + index * 0.03, (0.53 + angle * 0.08, -0.03, 1.9), mats["leaf"], root, 7, (0, angle * 0.2, -angle * 0.24))
        sphere(f"DisplayFlower_{index}", (0.07, 0.07, 0.055), (0.53 + angle * 0.16, -0.03, 2.08 + index * 0.025), mats[("coral", "butter", "blue", "teal")[index]], root, 14, 9)
    return root


def build_notice_console(mats):
    root = empty("CivicNoticeConsole")
    root["asset"] = "civic-notice-console"
    # Framed cork wall with layered paper, pins and warm picture lamps.
    rounded_box("NoticeFrame", (2.55, 0.12, 1.42), (0, 0.04, 1.78), mats["walnut"], root, 0.075, segments=5)
    rounded_box("NoticeCork", (2.34, 0.055, 1.22), (0, -0.035, 1.78), mats["cork"], root, 0.045)
    rounded_box("NoticeTitle", (0.62, 0.035, 0.2), (0, -0.08, 2.27), mats["ivory"], root, 0.035)
    for index, (x, z, width, height, color) in enumerate((
        (-0.78, 1.95, 0.38, 0.5, "paper"), (-0.29, 1.84, 0.48, 0.62, "paper"),
        (0.25, 1.97, 0.42, 0.46, "ivory"), (0.76, 1.82, 0.4, 0.68, "paper"),
        (-0.72, 1.5, 0.32, 0.25, "blue"), (-0.22, 1.46, 0.48, 0.28, "paper"),
        (0.36, 1.49, 0.46, 0.3, "butter"), (0.8, 1.48, 0.27, 0.24, "teal"),
    )):
        rotation = (0, 0, ((index % 3) - 1) * 0.035)
        rounded_box(f"NoticePaper_{index + 1}", (width, 0.02, height), (x, -0.075 - index * 0.0005, z), mats[color], root, 0.018, rotation, 2)
        cylinder(f"NoticePin_{index + 1}", 0.018, 0.028, (x - width * 0.32, -0.095, z + height * 0.36), mats[("brass", "coral", "teal")[index % 3]], root, 10, (math.pi / 2, 0, 0))
        for line_index in range(2 if height < 0.35 else 3):
            rounded_box(
                f"NoticeLine_{index + 1}_{line_index + 1}",
                (width * (0.52 + 0.12 * (line_index % 2)), 0.012, 0.018),
                (x, -0.09, z + height * 0.12 - line_index * 0.075),
                mats["ink"], root, 0.006, rotation, 1,
            )
    for side in (-1, 1):
        cylinder(f"NoticeLampArm_{side}", 0.018, 0.3, (side * 0.82, 0, 2.61), mats["brass"], root, 10, (math.pi / 2, 0, 0))
        cylinder(f"NoticeLampShade_{side}", 0.11, 0.18, (side * 0.82, -0.16, 2.55), mats["brass"], root, 18, (math.pi / 2, 0, 0), 0.18)

    # Console table and woven archive basket below the public wall.
    rounded_box("NoticeConsoleTop", (2.25, 0.52, 0.13), (0, 0, 0.93), mats["oak"], root, 0.055)
    rounded_box("NoticeConsoleApron", (1.95, 0.14, 0.16), (0, 0.12, 0.81), mats["walnut"], root, 0.035)
    for x in (-0.9, 0.9):
        cylinder(f"NoticeConsoleLeg_{x}", 0.055, 0.8, (x, 0.08, 0.45), mats["walnut"], root, 16, radius_top=0.045)
    for index, x in enumerate((-0.64, -0.48, 0.38)):
        add_book(root, mats, f"NoticeBook_{index + 1}", (x, -0.08 + index * 0.015, 1.04 + index * 0.045), (0.28, 0.05, 0.2), ("teal", "paper", "blue")[index], (0, 0, (index - 1) * 0.04))
    add_plant(root, mats, "NoticePlant", (0.72, 0, 1.05), 0.72)
    cylinder("NoticeBasketCore", 0.33, 0.5, (0, 0.05, 0.3), mats["cork"], root, 24, radius_top=0.38)
    for ring_index in range(7):
        torus(
            f"NoticeBasketRing_{ring_index + 1}",
            0.326 + ring_index * 0.008,
            0.012,
            (0, 0.05, 0.11 + ring_index * 0.067),
            mats["walnut"] if ring_index % 2 else mats["oak"],
            root,
            major_segments=28,
            minor_segments=6,
        )
    for rib_index in range(14):
        angle = rib_index / 14 * math.pi * 2
        cylinder(
            f"NoticeBasketRib_{rib_index + 1}", 0.012, 0.46,
            (math.cos(angle) * 0.345, 0.05 + math.sin(angle) * 0.345, 0.3),
            mats["walnut"], root, 7,
        )
    cylinder("NoticeBasketLiner", 0.35, 0.12, (0, 0.05, 0.52), mats["paper"], root, 28, radius_top=0.39)
    return root


def build_lounge_suite(mats):
    root = empty("CivicLoungeSuite")
    root["asset"] = "civic-lounge-suite"
    # Real two-seat sofa with timber frame, separate cushions and readable seams.
    rounded_box("LoungeSofaBase", (2.15, 0.82, 0.42), (0, 0.12, 0.38), mats["oak"], root, 0.09, segments=5)
    rounded_box("LoungeSofaBack", (2.04, 0.25, 0.92), (0, 0.38, 0.92), mats["teal"], root, 0.13, (0.04, 0, 0), 5)
    for side in (-1, 1):
        rounded_box(f"LoungeSeat_{side}", (0.94, 0.68, 0.22), (side * 0.5, -0.02, 0.58), mats["teal"], root, 0.12, segments=5)
        rounded_box(f"LoungeBackCushion_{side}", (0.88, 0.2, 0.62), (side * 0.49, 0.17, 0.94), mats["sage"], root, 0.12, (0.05, 0, 0), 5)
        # Shallow inset seams catch the warm side light and stop the two large
        # upholstered planes from reading as featureless rounded boxes.
        rounded_box(f"LoungeSeatSeam_{side}", (0.76, 0.022, 0.02), (side * 0.5, -0.365, 0.6), mats["deep_teal"], root, 0.008, segments=2)
        rounded_box(f"LoungeBackSeam_{side}", (0.7, 0.018, 0.022), (side * 0.49, 0.058, 0.98), mats["teal"], root, 0.008, (0.05, 0, 0), 2)
        sphere(f"LoungeBackTuft_{side}", (0.035, 0.018, 0.035), (side * 0.49, 0.055, 0.94), mats["deep_teal"], root, 14, 8)
    for x in (-1.02, 1.02):
        rounded_box(f"LoungeArm_{x}", (0.15, 0.76, 0.72), (x, 0.02, 0.62), mats["oak"], root, 0.055)
    for x in (-0.82, 0.82):
        for y in (-0.25, 0.25):
            cylinder(f"LoungeFoot_{x}_{y}", 0.045, 0.24, (x, y, 0.12), mats["walnut"], root, 12)
    rounded_box("LoungePillowButter", (0.42, 0.16, 0.38), (-0.48, -0.13, 1.05), mats["butter"], root, 0.11, (0.05, -0.08, -0.08), 5)
    rounded_box("LoungePillowCoral", (0.42, 0.16, 0.38), (0.5, -0.13, 1.04), mats["coral"], root, 0.11, (-0.04, 0.08, 0.08), 5)
    rounded_box("LoungePillowButterInset", (0.3, 0.018, 0.27), (-0.48, -0.218, 1.05), mats["paper"], root, 0.06, (0.05, -0.08, -0.08), 3)
    rounded_box("LoungePillowCoralInset", (0.3, 0.018, 0.27), (0.5, -0.218, 1.04), mats["butter"], root, 0.06, (-0.04, 0.08, 0.08), 3)

    # Low oval coffee table, ceramics and editorial stack.
    table = rounded_box("LoungeCoffeeTop", (1.35, 0.72, 0.13), (0.1, -1.1, 0.5), mats["oak"], root, 0.16, segments=6)
    table.scale.x = 1.08
    for x in (-0.42, 0.58):
        cylinder(f"LoungeCoffeeLeg_{x}", 0.055, 0.43, (x, -1.1, 0.25), mats["walnut"], root, 14, radius_top=0.045)
    add_book(root, mats, "LoungeBookOne", (-0.2, -1.1, 0.61), (0.4, 0.045, 0.28), "blue", (0, 0, -0.08))
    add_book(root, mats, "LoungeBookTwo", (-0.14, -1.1, 0.67), (0.34, 0.04, 0.24), "paper", (0, 0, 0.05))
    add_ceramic(root, mats, "LoungeCup", (0.46, -1.1, 0.68), 0.72, "ceramic")
    torus("LoungeCupHandle", 0.055, 0.011, (0.53, -1.1, 0.69), mats["ceramic"], root, rotation=(math.pi / 2, 0, 0), major_segments=18, minor_segments=6)
    rounded_box("LoungeBookmark", (0.035, 0.012, 0.2), (-0.12, -1.1, 0.7), mats["coral"], root, 0.008, (0, 0, 0.05), 2)

    # Side bookshelf gives the lounge a real back/side silhouette in orbit.
    rounded_box("LoungeBookcaseBack", (0.95, 0.18, 1.65), (1.72, 0.24, 0.9), mats["deep_teal"], root, 0.06)
    for x in (1.25, 2.19):
        rounded_box(f"LoungeBookcaseSide_{x}", (0.08, 0.52, 1.72), (x, 0, 0.88), mats["oak"], root, 0.035)
    for shelf_index, z in enumerate((0.16, 0.62, 1.08, 1.52)):
        rounded_box(f"LoungeShelf_{shelf_index + 1}", (1.02, 0.5, 0.075), (1.72, 0.02, z), mats["oak"], root, 0.035)
    book_palette = ("paper", "blue", "butter", "coral", "teal")
    for row in range(3):
        for column in range(5):
            height = 0.22 + ((row * 5 + column) % 3) * 0.035
            add_book(
                root, mats, f"LoungeShelfBook_{row}_{column}",
                (1.38 + column * 0.16, -0.04, 0.29 + row * 0.46 + height / 2),
                (0.11 + (column % 2) * 0.02, 0.22, height),
                book_palette[(row + column) % len(book_palette)],
                (0, 0, ((column % 3) - 1) * 0.025),
            )
    add_plant(root, mats, "LoungeShelfPlant", (1.74, 0, 1.67), 0.72)
    add_ceramic(root, mats, "LoungeShelfVase", (2.0, 0.02, 1.71), 0.62, "butter")
    return root


BUILDERS = {
    "civic-display-case": build_display_case,
    "civic-notice-console": build_notice_console,
    "civic-lounge-suite": build_lounge_suite,
}


def mesh_metrics():
    depsgraph = bpy.context.evaluated_depsgraph_get()
    triangles = 0
    meshes = 0
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        meshes += 1
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        triangles += len(mesh.loop_triangles)
        evaluated.to_mesh_clear()
    return meshes, triangles


def export_asset(asset_id, output_root, master_root):
    clear_scene()
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
    root = BUILDERS[asset_id](materials())
    root["world_unit_meters"] = 1.0
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj["semantic_part"] = obj.name
            obj["hero_asset"] = asset_id
    meshes, triangles = mesh_metrics()
    os.makedirs(output_root, exist_ok=True)
    os.makedirs(master_root, exist_ok=True)
    blend_path = os.path.join(master_root, f"{asset_id}.blend")
    glb_path = os.path.join(output_root, f"{asset_id}.glb")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        export_apply=True,
        export_materials="EXPORT",
        export_texcoords=True,
        export_normals=True,
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_yup=True,
    )
    return {"file": f"{asset_id}.glb", "meshes": meshes, "triangles": triangles}


def main():
    args = parse_args()
    manifest = {
        "contract": "mirrorlife-civic-hero-props-v2",
        "worldUnitMeters": 1,
        "assets": {},
    }
    for asset_id in BUILDERS:
        manifest["assets"][asset_id] = export_asset(asset_id, args.output_root, args.master_root)
        print(f"Built {asset_id}: {manifest['assets'][asset_id]}")
    with open(os.path.join(args.output_root, "civic-hero-props-manifest.json"), "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


if __name__ == "__main__":
    main()
