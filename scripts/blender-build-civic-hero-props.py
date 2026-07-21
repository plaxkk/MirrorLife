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
        "oak": material("Civic oak", PALETTE["oak"], 0.54),
        "walnut": material("Civic walnut", PALETTE["walnut"], 0.66),
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
        "ceramic": material("Civic warm ceramic", PALETTE["ceramic"], 0.34),
        "ceramic_teal": material("Civic teal glaze", PALETTE["teal"], 0.29),
        "ceramic_butter": material("Civic butter glaze", PALETTE["butter"], 0.31),
        "ceramic_coral": material("Civic coral glaze", PALETTE["coral"], 0.32),
        "ceramic_blue": material("Civic blue glaze", PALETTE["blue"], 0.3),
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


def text_mesh(name, body, location, size, mat, parent, extrude=0.006):
    """Create real, orbit-safe sign lettering instead of a blank title slab."""
    bpy.ops.object.text_add(location=(0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.data.body = body
    obj.data.align_x = "CENTER"
    obj.data.align_y = "CENTER"
    obj.data.size = size
    obj.data.extrude = extrude
    obj.data.bevel_depth = min(0.0025, extrude * 0.35)
    obj.data.bevel_resolution = 2
    font_path = "/System/Library/Fonts/Hiragino Sans GB.ttc"
    if os.path.exists(font_path):
        obj.data.font = bpy.data.fonts.load(font_path, check_existing=True)
    obj.location = location
    # Blender text lies on XY with +Z facing out. Rotate it onto the XZ notice
    # plane so the glyph faces the civic-room camera and remains real geometry
    # from every orbit angle.
    obj.rotation_euler = (math.pi / 2, 0, 0)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    # CJK outlines contain many tiny Bézier segments. A low-ratio collapse is
    # visually lossless at the room camera but avoids spending ~24k triangles
    # on a 14cm title and keeps every orbit under the 300k hero-room budget.
    decimate = obj.modifiers.new("Sign glyph optimization", "DECIMATE")
    decimate.ratio = 0.32
    decimate.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    obj.select_set(False)
    return link(obj, mat, parent)


def add_book(parent, mats, name, location, size=(0.18, 0.05, 0.26), color="blue", rotation=(0, 0, 0)):
    rounded_box(name, size, location, mats[color], parent, 0.012, rotation, 2)
    rounded_box(f"{name}_pages", (size[0] * 0.88, size[1] * 0.68, size[2] * 0.92),
                (location[0], location[1] - 0.004, location[2] - 0.006), mats["paper"], parent, 0.008, rotation, 2)
    # A narrow inset and brass foil mark keep books from collapsing into
    # anonymous coloured blocks after the room is viewed from gameplay range.
    rounded_box(
        f"{name}_spine_inset",
        (size[0] * 0.12, size[1] * 1.08, size[2] * 0.76),
        (location[0] - size[0] * 0.37, location[1] - 0.006, location[2]),
        mats["walnut"], parent, 0.006, rotation, 1,
    )
    rounded_box(
        f"{name}_foil",
        (size[0] * 0.07, size[1] * 1.14, size[2] * 0.08),
        (location[0] - size[0] * 0.37, location[1] - 0.009, location[2] + size[2] * 0.19),
        mats["brass"], parent, 0.004, rotation, 1,
    )


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
    glaze_key = f"ceramic_{accent}" if accent in ("teal", "butter", "coral", "blue") else "ceramic"
    glaze = mats[glaze_key]
    cylinder(f"{name}_body", 0.1 * scale, 0.2 * scale, location, glaze, parent, 22, radius_top=0.075 * scale)
    torus(f"{name}_rim", 0.072 * scale, 0.012 * scale, (location[0], location[1], location[2] + 0.105 * scale), mats["brass"] if accent else glaze, parent)
    torus(f"{name}_glaze_band", 0.086 * scale, 0.009 * scale, (location[0], location[1], location[2] + 0.02 * scale), mats["brass"] if accent else mats["oak"], parent, major_segments=20, minor_segments=6)
    cylinder(f"{name}_foot", 0.062 * scale, 0.026 * scale, (location[0], location[1], location[2] - 0.112 * scale), mats["walnut"], parent, 18, radius_top=0.068 * scale)


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
    for x in (-0.28, 0.28):
        rounded_box(f"DisplayGlassMullion_{x}", (0.028, 0.034, 0.62), (x, -0.36, 1.16), mats["brass"], root, 0.009)
    for x in (-0.84, 0.84):
        rounded_box(f"DisplaySideGlass_{x}", (0.026, 0.58, 0.58), (x, -0.01, 1.16), mats["glass"], root, 0.012)
    rounded_box("DisplayShelf", (1.68, 0.55, 0.035), (0, -0.02, 1.1), mats["glass"], root, 0.01)
    rounded_box("DisplayShelfBrassRail", (1.68, 0.025, 0.025), (0, -0.31, 1.1), mats["brass"], root, 0.008)

    for index, x in enumerate((-0.55, -0.18, 0.2, 0.56)):
        rounded_box(f"DisplayTray_{index + 1}", (0.28, 0.35, 0.035), (x, -0.04, 0.87), mats["oak"], root, 0.025)
        sphere(f"DisplayObject_{index + 1}", (0.12, 0.14, 0.07 + (index % 2) * 0.025), (x, -0.05, 0.96), mats[("butter", "ceramic", "coral", "teal")[index]], root, 16, 10)
        rounded_box(f"DisplayLabel_{index + 1}", (0.16, 0.012, 0.075), (x, -0.225, 0.9), mats["paper"], root, 0.008, (-0.22, 0, 0))

    # Top still life gives the foreground silhouette the authored density of the target.
    # The foreground menu is the target composition's "today's topic"
    # clipboard. Give it a readable editorial hierarchy instead of a blank
    # pale slab: warm wood frame, cream paper, title, three response rows and
    # a brass clip, all authored on the front face for orbit-safe lighting.
    rounded_box("DisplayMenuFrame", (0.72, 0.075, 0.72), (-0.58, -0.03, 1.82), mats["walnut"], root, 0.055, (0.12, 0, 0))
    rounded_box("DisplayMenuPaper", (0.6, 0.03, 0.59), (-0.58, -0.072, 1.82), mats["ivory"], root, 0.04, (0.12, 0, 0))
    rounded_box("DisplayMenuTitle", (0.34, 0.018, 0.042), (-0.61, -0.095, 2.04), mats["walnut"], root, 0.009, (0.12, 0, 0), 1)
    for row_index, (z, color) in enumerate(((1.92, "teal"), (1.78, "coral"), (1.64, "brass"))):
        cylinder(f"DisplayMenuMark_{row_index + 1}", 0.023, 0.012, (-0.77, -0.098, z), mats[color], root, 10, (math.pi / 2, 0, 0))
        rounded_box(f"DisplayMenuLine_{row_index + 1}", (0.28 - row_index * 0.022, 0.012, 0.021), (-0.53, -0.1, z), mats["ink"], root, 0.006, (0.12, 0, 0), 1)
    rounded_box("DisplayMenuClip", (0.14, 0.025, 0.04), (-0.58, -0.1, 2.15), mats["brass"], root, 0.013, (0.12, 0, 0), 2)
    add_ceramic(root, mats, "DisplayTopVase", (0.53, -0.03, 1.66), 0.95)
    rounded_box("DisplayStoryCard", (0.3, 0.028, 0.22), (0.08, -0.07, 1.68), mats["paper"], root, 0.026, (-0.08, 0.04, 0.03), 2)
    rounded_box("DisplayStoryCardRule", (0.18, 0.012, 0.018), (0.08, -0.091, 1.7), mats["teal"], root, 0.005, (-0.08, 0.04, 0.03), 1)
    for index, angle in enumerate((-0.75, -0.24, 0.24, 0.78)):
        cylinder(f"DisplayFlowerStem_{index}", 0.009, 0.38 + index * 0.03, (0.53 + angle * 0.08, -0.03, 1.9), mats["leaf"], root, 7, (0, angle * 0.2, -angle * 0.24))
        sphere(f"DisplayFlower_{index}", (0.07, 0.07, 0.055), (0.53 + angle * 0.16, -0.03, 2.08 + index * 0.025), mats[("coral", "butter", "blue", "teal")[index]], root, 14, 9)
    return root


def build_notice_console(mats):
    root = empty("CivicNoticeConsole")
    root["asset"] = "civic-notice-console"
    # The evidence wall is the background hero anchor in the source. Give it a
    # substantial furniture-scale frame, inset rails and recognisable title so
    # it reads as a crafted civic installation rather than a small pinboard.
    rounded_box("NoticeFrame", (2.9, 0.16, 1.56), (0, 0.04, 1.82), mats["walnut"], root, 0.085, segments=6)
    rounded_box("NoticeCork", (2.62, 0.055, 1.28), (0, -0.065, 1.82), mats["cork"], root, 0.055, segments=4)
    for x in (-1.37, 1.37):
        rounded_box(f"NoticeSideRail_{x}", (0.1, 0.1, 1.48), (x, -0.055, 1.82), mats["oak"], root, 0.035, segments=3)
        sphere(f"NoticeRailFinial_{x}", (0.105, 0.07, 0.105), (x, -0.075, 2.56), mats["oak"], root, 18, 10)
        sphere(f"NoticeRailFoot_{x}", (0.085, 0.06, 0.085), (x, -0.075, 1.08), mats["walnut"], root, 16, 9)
    rounded_box("NoticeTopRail", (2.72, 0.1, 0.1), (0, -0.055, 2.54), mats["oak"], root, 0.035, segments=3)
    rounded_box("NoticeBottomRail", (2.72, 0.1, 0.1), (0, -0.055, 1.1), mats["oak"], root, 0.035, segments=3)
    rounded_box("NoticeTitle", (0.82, 0.045, 0.23), (0, -0.115, 2.3), mats["ivory"], root, 0.045, segments=4)
    text_mesh("NoticeTitleText", "倾听墙", (0, -0.145, 2.298), 0.145, mats["walnut"], root, 0.0045)
    for index, (x, z, width, height, color) in enumerate((
        (-0.91, 1.95, 0.38, 0.5, "paper"), (-0.4, 1.84, 0.48, 0.62, "paper"),
        (0.18, 1.97, 0.42, 0.46, "ivory"), (0.78, 1.82, 0.4, 0.68, "paper"),
        (-0.88, 1.5, 0.32, 0.25, "blue"), (-0.31, 1.46, 0.48, 0.28, "paper"),
        (0.32, 1.49, 0.46, 0.3, "butter"), (0.9, 1.48, 0.27, 0.24, "teal"),
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
        # Proper picture lamps project from wall plates. The previous cones
        # were seen end-on and collapsed into two floating gold spheres.
        rounded_box(f"NoticeLampPlate_{side}", (0.13, 0.05, 0.19), (side * 0.96, -0.12, 2.65), mats["brass"], root, 0.03, segments=3)
        cylinder(f"NoticeLampArm_{side}", 0.014, 0.29, (side * 0.96, -0.265, 2.63), mats["brass"], root, 12, (math.pi / 2, 0, 0))
        cylinder(f"NoticeLampShade_{side}", 0.08, 0.13, (side * 0.96, -0.43, 2.54), mats["brass"], root, 20, (math.pi / 2, 0, 0), 0.15)
        sphere(f"NoticeLampBulb_{side}", (0.05, 0.032, 0.04), (side * 0.96, -0.5, 2.515), mats["butter"], root, 16, 9)

    # Console table and woven archive basket below the public wall.
    rounded_box("NoticeConsoleTop", (2.56, 0.56, 0.13), (0, 0, 0.93), mats["oak"], root, 0.055)
    rounded_box("NoticeConsoleApron", (2.22, 0.14, 0.16), (0, 0.12, 0.81), mats["walnut"], root, 0.035)
    for side in (-1, 1):
        rounded_box(f"NoticeDrawer_{side}", (0.72, 0.035, 0.24), (side * 0.45, -0.27, 0.8), mats["oak"], root, 0.028)
        cylinder(f"NoticeDrawerPull_{side}", 0.026, 0.045, (side * 0.45, -0.304, 0.8), mats["brass"], root, 14, (math.pi / 2, 0, 0))
    for x in (-1.04, 1.04):
        cylinder(f"NoticeConsoleLeg_{x}", 0.055, 0.8, (x, 0.08, 0.45), mats["walnut"], root, 16, radius_top=0.045)
    for index, x in enumerate((-0.64, -0.48, 0.38)):
        add_book(root, mats, f"NoticeBook_{index + 1}", (x, -0.08 + index * 0.015, 1.04 + index * 0.045), (0.28, 0.05, 0.2), ("teal", "paper", "blue")[index], (0, 0, (index - 1) * 0.04))
    add_plant(root, mats, "NoticePlant", (0.72, 0, 1.05), 0.72)
    add_ceramic(root, mats, "NoticeWitnessCup", (0.34, -0.08, 1.05), 0.58, "teal")
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
    # Open timber rails and visibly compressed cushions replace the previous
    # full-width rounded blocks. The sofa now reads as upholstered furniture,
    # not a teal toy cuboid, from both the hero camera and reverse orbit.
    rounded_box("LoungeSofaLowerRail", (1.96, 0.62, 0.12), (0, 0.12, 0.28), mats["oak"], root, 0.045, segments=4)
    rounded_box("LoungeSofaBack", (1.94, 0.12, 0.82), (0, 0.38, 0.78), mats["oak"], root, 0.045, (0.035, 0, 0), 4)
    for side in (-1, 1):
        seat = sphere(
            f"LoungeSeat_{side}",
            (0.5, 0.36, 0.135),
            (side * 0.5, -0.03, 0.52),
            mats["teal"], root, 28, 18,
        )
        seat.scale.x *= 0.98
        back = sphere(
            f"LoungeBackCushion_{side}",
            (0.47, 0.13, 0.36),
            (side * 0.49, 0.2, 0.9),
            mats["sage"], root, 28, 18, (0.04, 0, 0),
        )
        back.scale.z *= 1.02
        # Shallow inset seams catch the warm side light and stop the two large
        # upholstered planes from reading as featureless rounded boxes.
        rounded_box(f"LoungeSeatSeam_{side}", (0.76, 0.022, 0.02), (side * 0.5, -0.365, 0.55), mats["deep_teal"], root, 0.008, segments=2)
        rounded_box(f"LoungeBackSeam_{side}", (0.7, 0.018, 0.022), (side * 0.49, 0.064, 0.94), mats["teal"], root, 0.008, (0.04, 0, 0), 2)
        cylinder(f"LoungeSeatPiping_{side}", 0.011, 0.76, (side * 0.5, -0.369, 0.6), mats["sage"], root, 10, (0, math.pi / 2, 0))
        cylinder(f"LoungeBackPiping_{side}", 0.01, 0.69, (side * 0.49, 0.058, 1.03), mats["butter"], root, 10, (0, math.pi / 2, 0))
        sphere(f"LoungeBackTuft_{side}", (0.034, 0.018, 0.034), (side * 0.49, 0.056, 0.9), mats["deep_teal"], root, 14, 8)
    for x in (-1.02, 1.02):
        # Reference-like ladder arms keep the room visible through the frame.
        rounded_box(f"LoungeArmPostFront_{x}", (0.1, 0.1, 0.68), (x, -0.24, 0.5), mats["oak"], root, 0.032)
        rounded_box(f"LoungeArmPostRear_{x}", (0.1, 0.1, 0.9), (x, 0.3, 0.62), mats["oak"], root, 0.032)
        rounded_box(f"LoungeArmRail_{x}", (0.1, 0.66, 0.1), (x, 0.02, 0.78), mats["oak"], root, 0.032, (0, 0, 0.03 * -x))
        rounded_box(f"LoungeArmPad_{x}", (0.15, 0.58, 0.09), (x, 0.0, 0.82), mats["teal"], root, 0.04)
    for x in (-0.82, 0.82):
        for y in (-0.25, 0.25):
            cylinder(f"LoungeFoot_{x}_{y}", 0.045, 0.24, (x, y, 0.12), mats["walnut"], root, 12)
    sphere("LoungePillowButter", (0.23, 0.09, 0.22), (-0.48, -0.14, 1.01), mats["butter"], root, 22, 14, (0.06, -0.08, -0.08))
    sphere("LoungePillowCoral", (0.23, 0.09, 0.22), (0.5, -0.14, 1.0), mats["coral"], root, 22, 14, (-0.05, 0.08, 0.08))
    rounded_box("LoungePillowButterInset", (0.25, 0.018, 0.2), (-0.48, -0.229, 1.01), mats["paper"], root, 0.05, (0.06, -0.08, -0.08), 3)
    rounded_box("LoungePillowCoralInset", (0.25, 0.018, 0.2), (0.5, -0.229, 1.0), mats["butter"], root, 0.05, (-0.05, 0.08, 0.08), 3)

    # Low oval coffee table, ceramics and editorial stack.
    table = rounded_box("LoungeCoffeeTop", (1.35, 0.72, 0.13), (0.1, -1.1, 0.5), mats["oak"], root, 0.16, segments=6)
    table.scale.x = 1.08
    for x in (-0.42, 0.58):
        cylinder(f"LoungeCoffeeLeg_{x}", 0.055, 0.43, (x, -1.1, 0.25), mats["walnut"], root, 14, radius_top=0.045)
    add_book(root, mats, "LoungeBookOne", (-0.2, -1.1, 0.61), (0.4, 0.045, 0.28), "blue", (0, 0, -0.08))
    add_book(root, mats, "LoungeBookTwo", (-0.14, -1.1, 0.67), (0.34, 0.04, 0.24), "paper", (0, 0, 0.05))
    add_ceramic(root, mats, "LoungeCup", (0.46, -1.1, 0.68), 0.72, "teal")
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
        "contract": "mirrorlife-civic-hero-props-v6",
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
