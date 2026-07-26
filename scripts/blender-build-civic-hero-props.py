import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector


PALETTE = {
    "ivory": "#f4ead9",
    "paper": "#f7f0e3",
    "paper_warm": "#f0dfc5",
    "paper_cool": "#e7eceb",
    "paper_edge": "#cdb28e",
    "linen": "#e8dfd2",
    "oak": "#9a6240",
    "oak_light": "#b8794e",
    "oak_dark": "#75462f",
    "oak_aged": "#66402f",
    "walnut": "#573725",
    "cork": "#c69062",
    "coral": "#df8066",
    "teal": "#3d8d83",
    "deep_teal": "#286b65",
    "sage": "#6f9a70",
    "leaf": "#477b50",
    "leaf_light": "#76a768",
    "leaf_deep": "#285f42",
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
        "paper_warm": material("Civic warm cotton paper", PALETTE["paper_warm"], 0.96),
        "paper_cool": material("Civic cool archive paper", PALETTE["paper_cool"], 0.9),
        "paper_edge": material("Civic paper edge", PALETTE["paper_edge"], 0.98),
        "linen": material("Civic woven ivory textile", PALETTE["linen"], 0.96),
        "oak": material("Civic oak", PALETTE["oak"], 0.54),
        "oak_light": material("Civic honey oak", PALETTE["oak_light"], 0.5),
        "oak_dark": material("Civic smoked oak", PALETTE["oak_dark"], 0.59),
        "oak_aged": material("Civic aged oak", PALETTE["oak_aged"], 0.64),
        "walnut": material("Civic walnut", PALETTE["walnut"], 0.66),
        "cork": material("Civic cork", PALETTE["cork"], 0.88),
        "coral": material("Civic coral paint", PALETTE["coral"], 0.7),
        "teal": material("Civic teal textile", PALETTE["teal"], 0.9),
        "deep_teal": material("Civic deep teal", PALETTE["deep_teal"], 0.86),
        "sage": material("Civic sage textile", PALETTE["sage"], 0.92),
        "leaf": material("Civic foliage", PALETTE["leaf"], 0.96),
        "leaf_light": material("Civic young foliage", PALETTE["leaf_light"], 0.94),
        "leaf_deep": material("Civic deep foliage", PALETTE["leaf_deep"], 0.97),
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
        # A glass pane's cut edge reads denser than its broad face because the
        # viewer looks through more material. Keep this rim opaque and narrow
        # so the runtime can batch it with the furniture while the large pane
        # retains physical transmission.
        "glass_edge": material("Civic vitrified rim", "#79a99e", 0.32),
        # Kept microscopically translucent so the runtime preserves it as one
        # dedicated emissive batch instead of flattening it into the opaque
        # vertex-colour furniture batch.
        "display_glow": material("Civic display illumination", "#ffd9a0", 0.34, 0.0, 0.995),
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


def apply_modifiers(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    for modifier in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.select_set(False)


def sculpted_cushion(
    name,
    size,
    location,
    mat,
    parent,
    radius=0.08,
    rotation=(0, 0, 0),
    segments=5,
    compression=0.1,
    compression_bias=0.0,
):
    """Create an upholstered volume with compression and a soft centre bulge.

    A rounded cube keeps believable furniture edges but remains mechanically
    flat across its broad faces. Applying the bevel, adding a simple topology
    subdivision and then displacing the local surface produces the subtle
    tension/sag visible in sewn cushions without changing the authored world
    footprint or relying on a camera-facing normal trick.
    """
    obj = rounded_box(name, size, location, mat, parent, radius, rotation, segments)
    apply_modifiers(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    subdivision = obj.modifiers.new("Upholstery topology", "SUBSURF")
    subdivision.subdivision_type = "SIMPLE"
    subdivision.levels = 1
    subdivision.render_levels = 1
    bpy.ops.object.modifier_apply(modifier=subdivision.name)
    obj.select_set(False)

    half_x = max(0.001, size[0] * 0.5)
    half_y = max(0.001, size[1] * 0.5)
    half_z = max(0.001, size[2] * 0.5)
    for vertex in obj.data.vertices:
        x, y, z = vertex.co
        nx = min(1.0, abs(x) / half_x)
        ny = min(1.0, abs(y) / half_y)
        nz = min(1.0, abs(z) / half_z)
        face_tension = max(0.0, 1.0 - nx * nx) * max(0.0, 1.0 - nz * nz)
        if abs(y) > half_y * 0.28:
            vertex.co.y += math.copysign(half_y * 0.075 * face_tension, y)
        if z > 0:
            top_sag = max(0.0, 1.0 - nx * nx) * max(0.0, 1.0 - ny * ny)
            vertex.co.z -= half_z * 0.055 * top_sag
            # Build the sit/contact impression into the cushion silhouette.
            # A shallow off-centre Gaussian trough reads as occupied fabric
            # from any orbit angle and avoids a pristine rounded-cube finish.
            normalized_bias = max(-0.55, min(0.55, compression_bias))
            contact_x = (x / half_x) - normalized_bias
            contact_y = (y / half_y) + 0.08
            contact = math.exp(-(contact_x * contact_x * 2.7 + contact_y * contact_y * 3.6))
            vertex.co.z -= half_z * max(0.0, compression) * contact
            vertex.co.x += half_x * 0.018 * normalized_bias * contact
        # Pull the corners gently toward their seams. The broad face stays
        # generous while the perimeter reads as fabric under tension.
        vertex.co.x *= 1.0 - 0.024 * nz * nz
        vertex.co.z *= 1.0 - 0.026 * nx * nx
    obj.data.update()
    return obj


def draped_textile(
    name,
    width,
    location,
    mat,
    parent,
    depth_offset=0.0,
    height_offset=0.0,
    columns=10,
    rows=12,
):
    """Create a thin woven throw that bends from the seat over its front edge."""
    x0, y0, z0 = location
    vertices = []
    faces = []
    for row in range(rows + 1):
        t = row / rows
        if t <= 0.34:
            local_t = t / 0.34
            y = y0 - local_t * 0.22 - depth_offset
            z = z0 - math.sin(local_t * math.pi) * 0.018 + height_offset
        else:
            local_t = (t - 0.34) / 0.66
            y = y0 - 0.22 - local_t * 0.035 - depth_offset
            z = z0 - local_t * 0.43 + math.sin(local_t * math.pi) * 0.012 + height_offset
        for column in range(columns + 1):
            u = column / columns
            x = x0 + (u - 0.5) * width
            ripple = math.sin(u * math.pi * 5 + t * 1.7) * 0.009
            edge_softening = math.sin(u * math.pi) * 0.006
            vertices.append((x, y - edge_softening, z + ripple))
    stride = columns + 1
    for row in range(rows):
        for column in range(columns):
            a = row * stride + column
            b = a + 1
            c = a + stride + 1
            d = a + stride
            faces.append((a, b, c, d))
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    link(obj, mat, parent)
    solidify = obj.modifiers.new("Woven textile thickness", "SOLIDIFY")
    solidify.thickness = 0.012
    solidify.offset = 0
    bevel = obj.modifiers.new("Soft textile edge", "BEVEL")
    bevel.width = 0.007
    bevel.segments = 2
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


def cylinder_between(name, start, end, radius, mat, parent, vertices=10, radius_top=None):
    start_vector = Vector(start)
    end_vector = Vector(end)
    direction = end_vector - start_vector
    midpoint = (start_vector + end_vector) * 0.5
    obj = cylinder(
        name,
        radius,
        max(0.001, direction.length),
        tuple(midpoint),
        mat,
        parent,
        vertices,
        radius_top=radius if radius_top is None else radius_top,
    )
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    return obj


def triangular_prism(name, points_xz, depth, center_y, mat, parent):
    """Create a tiny orbit-safe folded-paper wedge with real thickness."""
    front_y = center_y - depth * 0.5
    back_y = center_y + depth * 0.5
    vertices = [(x, front_y, z) for x, z in points_xz] + [(x, back_y, z) for x, z in points_xz]
    faces = [
        (0, 1, 2),
        (5, 4, 3),
        (0, 3, 4, 1),
        (1, 4, 5, 2),
        (2, 5, 3, 0),
    ]
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return link(obj, mat, parent)


def curled_paper_corner(name, location, size, lift, mat, parent, rotation=0):
    """Create a folded paper corner with a real underside and thickness."""
    x0, y0, z0 = location
    thickness = 0.006
    cosine = math.cos(rotation)
    sine = math.sin(rotation)

    def rotate_xy(x, y, z):
        dx = x - x0
        dy = y - y0
        return (
            x0 + dx * cosine - dy * sine,
            y0 + dx * sine + dy * cosine,
            z,
        )

    top = [
        rotate_xy(x0 - size, y0, z0),
        rotate_xy(x0, y0 - size, z0),
        rotate_xy(x0, y0, z0 + lift),
    ]
    bottom = [(x, y, z - thickness) for x, y, z in top]
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(
        top + bottom,
        [],
        [
            (0, 1, 2),
            (5, 4, 3),
            (0, 3, 4, 1),
            (1, 4, 5, 2),
            (2, 5, 3, 0),
        ],
    )
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return link(obj, mat, parent)


def add_document_packet(
    parent,
    mats,
    name,
    location,
    size=(0.34, 0.24),
    rotation=0,
    accent="teal",
    sheets=4,
):
    """Build a layered file packet instead of one blank rounded cuboid."""
    width, depth = size
    x, y, z = location
    for sheet_index in range(sheets):
        offset_x = (sheet_index - (sheets - 1) * 0.5) * 0.008
        offset_y = ((sheet_index % 2) - 0.5) * 0.009
        rounded_box(
            f"{name}Sheet_{sheet_index + 1}",
            (width - sheet_index * 0.006, depth, 0.009),
            (x + offset_x, y + offset_y, z + sheet_index * 0.009),
            mats["paper_warm" if sheet_index % 2 == 0 else "paper_cool"],
            parent,
            0.012,
            (0, 0, rotation + (sheet_index - 1.5) * 0.009),
            2,
        )
    rounded_box(
        f"{name}Rule",
        (width * 0.58, depth * 0.055, 0.012),
        (x - width * 0.06, y - depth * 0.17, z + sheets * 0.009 + 0.006),
        mats[accent],
        parent,
        0.005,
        (0, 0, rotation),
        1,
    )
    rounded_box(
        f"{name}Clip",
        (width * 0.16, depth * 0.09, 0.022),
        (x - width * 0.3, y + depth * 0.32, z + sheets * 0.009 + 0.012),
        mats["brass"],
        parent,
        0.012,
        (0, 0, rotation),
        2,
    )
    curled_paper_corner(
        f"{name}CornerCurl",
        (
            x + width * 0.47,
            y + depth * 0.47,
            z + sheets * 0.009 + 0.008,
        ),
        min(width, depth) * 0.18,
        min(width, depth) * 0.07,
        mats["paper_cool"],
        parent,
        rotation,
    )


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


def lathed_profile(name, profile, location, mat, parent, segments=24, rotation=(0, 0, 0)):
    """Turn an authored radius/height profile into a closed handmade vessel."""
    x0, y0, z0 = location
    vertices = []
    faces = []
    for radius, height in profile:
        for segment in range(segments):
            angle = segment / segments * math.pi * 2
            # The restrained oval is deliberate: perfectly radial pottery is
            # one of the clearest remaining primitive/model-generator tells.
            oval = 1.0 + math.cos(angle * 2) * 0.018
            vertices.append((
                x0 + math.cos(angle) * radius * oval,
                y0 + math.sin(angle) * radius / oval,
                z0 + height,
            ))
    rings = len(profile)
    for ring in range(rings - 1):
        for segment in range(segments):
            next_segment = (segment + 1) % segments
            a = ring * segments + segment
            b = ring * segments + next_segment
            c = (ring + 1) * segments + next_segment
            d = (ring + 1) * segments + segment
            faces.append((a, b, c, d))
    faces.append(tuple(reversed(range(segments))))
    top_offset = (rings - 1) * segments
    faces.append(tuple(top_offset + segment for segment in range(segments)))
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.rotation_euler = rotation
    return link(obj, mat, parent)


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


def add_plant(parent, mats, name, location, scale=1.0, variety="upright"):
    """Author recognisable botanical silhouettes instead of one repeated tuft."""
    x0, y0, z0 = location
    cylinder(f"{name}_pot", 0.14 * scale, 0.22 * scale, location, mats["ceramic"], parent, 18, radius_top=0.17 * scale)
    torus(f"{name}_pot_rim", 0.15 * scale, 0.018 * scale, (x0, y0, z0 + 0.11 * scale), mats["oak_light"], parent, major_segments=20, minor_segments=6)
    cylinder(f"{name}_soil", 0.135 * scale, 0.018 * scale, (x0, y0, z0 + 0.116 * scale), mats["walnut"], parent, 18)

    if variety == "trailing":
        # A shelf plant with three real hanging vines. Its downward rhythm is
        # deliberately distinct from the upright witness-console plant.
        vines = (
            (-0.09, -0.02, 0.31, -0.17, -0.04, -0.17),
            (0.02, -0.06, 0.34, 0.06, -0.09, -0.23),
            (0.1, 0.01, 0.29, 0.18, -0.02, -0.12),
        )
        for vine_index, (sx, sy, sz, ex, ey, ez) in enumerate(vines):
            start = (x0 + sx * scale, y0 + sy * scale, z0 + sz * scale)
            end = (x0 + ex * scale, y0 + ey * scale, z0 + ez * scale)
            cylinder_between(f"{name}_vine_{vine_index + 1}", start, end, 0.009 * scale, mats["leaf_deep"], parent, 7)
            for leaf_index, t in enumerate((0.18, 0.42, 0.68, 0.9)):
                px = start[0] + (end[0] - start[0]) * t
                py = start[1] + (end[1] - start[1]) * t
                pz = start[2] + (end[2] - start[2]) * t
                side = -1 if (leaf_index + vine_index) % 2 else 1
                leaf = sphere(
                    f"{name}_leaf_{vine_index + 1}_{leaf_index + 1}",
                    (0.055 * scale, 0.021 * scale, 0.085 * scale),
                    (px + side * 0.035 * scale, py - 0.006 * scale, pz),
                    mats["leaf_light"] if leaf_index % 3 == 0 else mats["leaf"],
                    parent,
                    12,
                    7,
                    (0.2, side * 0.48, side * 0.65),
                )
                leaf["semantic_part"] = "foliage"
        for crown_index, angle in enumerate((-0.9, -0.3, 0.32, 0.88)):
            leaf = sphere(
                f"{name}_crown_leaf_{crown_index + 1}",
                (0.072 * scale, 0.028 * scale, 0.14 * scale),
                (x0 + math.sin(angle) * 0.1 * scale, y0, z0 + 0.24 * scale + math.cos(angle) * 0.08 * scale),
                mats["leaf_light"] if crown_index % 2 else mats["leaf"],
                parent,
                12,
                8,
                (0.18, angle * 0.3, -angle * 0.62),
            )
            leaf["semantic_part"] = "foliage"
        return

    leaf_specs = (
        (-0.18, 0.03, 0.32, 0.16, 0.09, 0.52),
        (0.14, -0.02, 0.34, -0.13, 0.02, 0.56),
        (-0.08, 0.04, 0.44, 0.05, -0.02, 0.66),
        (0.2, 0.03, 0.48, -0.08, 0.05, 0.71),
        (-0.22, -0.01, 0.5, 0.12, -0.04, 0.74),
        (0.06, 0.01, 0.58, -0.03, 0.02, 0.82),
        (0.0, 0.0, 0.68, 0.0, 0.0, 0.91),
    )
    base = (x0, y0, z0 + 0.11 * scale)
    for index, (dx, dy, dz, tx, ty, tz) in enumerate(leaf_specs):
        shoulder = (x0 + dx * scale, y0 + dy * scale, z0 + dz * scale)
        tip = (x0 + tx * scale, y0 + ty * scale, z0 + tz * scale)
        cylinder_between(f"{name}_stem_{index + 1}", base, shoulder, 0.009 * scale, mats["leaf_deep"], parent, 7, 0.006 * scale)
        cylinder_between(f"{name}_petiole_{index + 1}", shoulder, tip, 0.006 * scale, mats["leaf_deep"], parent, 7, 0.004 * scale)
        direction_x = tx - dx
        leaf = sphere(
            f"{name}_leaf_{index + 1}",
            (0.09 * scale, 0.026 * scale, (0.18 + (index % 3) * 0.018) * scale),
            tip,
            mats[("leaf", "leaf_light", "leaf_deep")[index % 3]],
            parent,
            14,
            8,
            (0.13 + (index % 2) * 0.08, direction_x * 1.2, -direction_x * 0.9),
        )
        leaf["semantic_part"] = "foliage"


def add_ceramic(parent, mats, name, location, scale=1.0, accent=None):
    glaze_key = f"ceramic_{accent}" if accent in ("teal", "butter", "coral", "blue") else "ceramic"
    glaze = mats[glaze_key]
    body_height = 0.22 * scale
    lathed_profile(
        f"{name}_body",
        (
            (0.055 * scale, -body_height * 0.5),
            (0.082 * scale, -body_height * 0.46),
            (0.105 * scale, -body_height * 0.28),
            (0.112 * scale, body_height * 0.04),
            (0.101 * scale, body_height * 0.3),
            (0.078 * scale, body_height * 0.46),
            (0.072 * scale, body_height * 0.5),
        ),
        location,
        glaze,
        parent,
        24,
    )
    torus(
        f"{name}_rim",
        0.073 * scale,
        0.012 * scale,
        (location[0], location[1], location[2] + body_height * 0.52),
        mats["brass"] if accent else glaze,
        parent,
    )
    # A dark inner glaze makes the opening and wall thickness readable from
    # elevated/reverse cameras; the old capped cone looked like a chess pawn.
    cylinder(
        f"{name}_inner",
        0.061 * scale,
        0.008 * scale,
        (location[0], location[1], location[2] + body_height * 0.505),
        mats["deep_teal"] if accent else mats["walnut"],
        parent,
        20,
    )
    torus(
        f"{name}_glaze_band",
        0.099 * scale,
        0.008 * scale,
        (location[0], location[1], location[2] + body_height * 0.02),
        mats["brass"] if accent else mats["oak"],
        parent,
        major_segments=20,
        minor_segments=6,
    )
    cylinder(
        f"{name}_foot",
        0.061 * scale,
        0.026 * scale,
        (location[0], location[1], location[2] - body_height * 0.57),
        mats["walnut"],
        parent,
        18,
        radius_top=0.069 * scale,
    )


def build_display_case(mats):
    root = empty("CivicDisplayCase")
    root["asset"] = "civic-display-case"
    # Low cabinet with real joinery, inset doors and a brass toe rail.
    rounded_box("DisplayOakBase", (1.86, 0.65, 0.7), (0, 0, 0.38), mats["oak"], root, 0.1, segments=5)
    rounded_box("DisplayWalnutPlinth", (1.96, 0.12, 0.78), (0, 0, 0.73), mats["walnut"], root, 0.045)
    for side in (-1, 1):
        rounded_box(f"DisplayInset_{side}", (0.68, 0.035, 0.37), (side * 0.41, -0.357, 0.38), mats["deep_teal"], root, 0.045)
        # A real face-frame and recessed panel reveal keep the lower cabinet
        # from reading as two stickers on a single rounded toy block.
        for rail_z in (0.19, 0.57):
            rounded_box(
                f"DisplayDoorRail_{side}_{rail_z}",
                (0.74, 0.045, 0.055),
                (side * 0.41, -0.382, rail_z),
                mats["oak_dark"], root, 0.014, segments=2,
            )
        for stile_x in (side * 0.75, side * 0.07):
            rounded_box(
                f"DisplayDoorStile_{side}_{stile_x}",
                (0.055, 0.045, 0.42),
                (stile_x, -0.382, 0.38),
                mats["oak_dark"], root, 0.014, segments=2,
            )
        cylinder(f"DisplayKnob_{side}", 0.035, 0.045, (side * 0.12, -0.392, 0.39), mats["brass"], root, 14, (math.pi / 2, 0, 0))
        rounded_box(
            f"DisplayKnobBackplate_{side}", (0.11, 0.018, 0.075),
            (side * 0.12, -0.407, 0.39), mats["brass"], root, 0.018, segments=3,
        )
    rounded_box("DisplayBrassToeRail", (1.68, 0.03, 0.035), (0, -0.382, 0.11), mats["brass"], root, 0.012)
    for x in (-0.78, 0.78):
        cylinder(f"DisplayFoot_{x}", 0.055, 0.22, (x, 0, 0.11), mats["walnut"], root, 14)

    # The upper glass case has a complete back, shelf, wood frame and side panes.
    rounded_box("DisplayCaseFloor", (1.78, 0.66, 0.09), (0, 0, 0.8), mats["oak"], root, 0.03)
    rounded_box("DisplayCaseBack", (1.78, 0.08, 0.68), (0, 0.29, 1.13), mats["oak_aged"], root, 0.035)
    rounded_box("DisplayCaseTop", (1.82, 0.72, 0.1), (0, 0, 1.5), mats["oak_aged"], root, 0.035)
    rounded_box("DisplayTopOakReveal", (1.68, 0.04, 0.045), (0, -0.375, 1.47), mats["oak"], root, 0.014)
    # A lightly raked front plane gives the case a furniture-maker silhouette
    # instead of a vertical aquarium box. Glass, posts and mullions share the
    # exact tilt, so side orbit never exposes detached trim.
    display_front_tilt = -0.115
    for x in (-0.86, 0.86):
        rounded_box(
            f"DisplayPost_{x}", (0.07, 0.07, 0.7), (x, -0.3, 1.14),
            mats["oak_aged"], root, 0.025, (display_front_tilt, 0, 0),
        )
        rounded_box(
            f"DisplayPostCap_{x}", (0.12, 0.105, 0.06), (x, -0.315, 1.49),
            mats["brass"], root, 0.018, (display_front_tilt, 0, 0), 3,
        )
    rounded_box(
        "DisplayFrontGlass", (1.68, 0.026, 0.58), (0, -0.345, 1.16),
        mats["glass"], root, 0.012, (display_front_tilt, 0, 0),
    )
    # Real glass edge rails establish pane thickness under side light and stop
    # the sheet disappearing at 90° without making the whole panel opaque.
    for x in (-0.835, 0.835):
        rounded_box(
            f"DisplayGlassEdgeVertical_{x}", (0.018, 0.041, 0.56), (x, -0.35, 1.16),
            mats["glass_edge"], root, 0.008, (display_front_tilt, 0, 0), 2,
        )
    for z in (0.885, 1.435):
        rounded_box(
            f"DisplayGlassEdgeHorizontal_{z}", (1.64, 0.041, 0.018), (0, -0.35, z),
            mats["glass_edge"], root, 0.008, (display_front_tilt, 0, 0), 2,
        )
    for x in (-0.28, 0.28):
        rounded_box(
            f"DisplayGlassMullion_{x}", (0.028, 0.034, 0.62), (x, -0.36, 1.16),
            mats["brass"], root, 0.009, (display_front_tilt, 0, 0),
        )
    for x in (-0.84, 0.84):
        rounded_box(f"DisplaySideGlass_{x}", (0.026, 0.58, 0.58), (x, -0.01, 1.16), mats["glass"], root, 0.012)
    rounded_box("DisplayShelf", (1.68, 0.55, 0.035), (0, -0.02, 1.1), mats["glass"], root, 0.01)
    rounded_box("DisplayShelfBrassRail", (1.68, 0.025, 0.025), (0, -0.31, 1.1), mats["brass"], root, 0.008)
    rounded_box("DisplayShelfOakLip", (1.72, 0.035, 0.055), (0, -0.332, 1.08), mats["oak"], root, 0.012)
    rounded_box("DisplayIlluminationTop", (1.55, 0.035, 0.028), (0, 0.16, 1.43), mats["display_glow"], root, 0.01)
    rounded_box("DisplayIlluminationShelf", (1.5, 0.028, 0.022), (0, 0.18, 1.08), mats["display_glow"], root, 0.009)

    # The lower shelf is a true curated counter, not four recoloured domes.
    # Each bay has a different silhouette and civic meaning: listening pastry,
    # handled witness cup, berry tart and sealed memory parcel.
    for index, x in enumerate((-0.55, -0.18, 0.2, 0.56)):
        rounded_box(f"DisplayTray_{index + 1}", (0.28, 0.35, 0.035), (x, -0.04, 0.87), mats["oak"], root, 0.025)
        rounded_box(f"DisplayTrayRim_{index + 1}", (0.24, 0.03, 0.025), (x, -0.215, 0.9), mats["brass"], root, 0.008)
        rounded_box(f"DisplayLabel_{index + 1}", (0.16, 0.012, 0.075), (x, -0.225, 0.9), mats["paper"], root, 0.008, (-0.22, 0, 0))
        if index == 0:
            cylinder("DisplayObject_1_Base", 0.108, 0.034, (x, -0.05, 0.925), mats["ivory"], root, 20)
            torus("DisplayObject_1_PastryFold", 0.078, 0.035, (x, -0.05, 0.975), mats["butter"], root, major_segments=20, minor_segments=8)
            sphere("DisplayObject_1_Glaze", (0.07, 0.07, 0.055), (x, -0.05, 1.015), mats["ceramic"], root, 18, 10)
            sphere("DisplayObject_1_Garnish", (0.026, 0.026, 0.02), (x + 0.025, -0.073, 1.06), mats["leaf"], root, 12, 7)
        elif index == 1:
            add_ceramic(root, mats, "DisplayObject_2", (x, -0.05, 0.99), 0.72, "teal")
            torus(
                "DisplayObject_2_Handle",
                0.07,
                0.015,
                (x + 0.092, -0.05, 1.0),
                mats["ceramic_teal"],
                root,
                (0, math.pi / 2, 0),
                18,
                7,
            )
        elif index == 2:
            cylinder("DisplayObject_3_Base", 0.11, 0.035, (x, -0.05, 0.925), mats["ivory"], root, 20)
            torus("DisplayObject_3_Crust", 0.078, 0.028, (x, -0.05, 0.965), mats["oak_light"], root, major_segments=20, minor_segments=7)
            sphere("DisplayObject_3_Glaze", (0.082, 0.082, 0.055), (x, -0.05, 0.995), mats["coral"], root, 18, 10)
            for berry_index, angle in enumerate((0, 2.1, 4.2)):
                sphere(
                    f"DisplayObject_3_Berry_{berry_index + 1}",
                    (0.025, 0.025, 0.022),
                    (x + math.cos(angle) * 0.032, -0.065 + math.sin(angle) * 0.016, 1.045),
                    mats["blue" if berry_index == 1 else "leaf_deep"],
                    root,
                    12,
                    7,
                )
        else:
            rounded_box("DisplayObject_4_Base", (0.2, 0.16, 0.035), (x, -0.05, 0.93), mats["paper_warm"], root, 0.018, (0, 0, -0.05), 2)
            rounded_box("DisplayObject_4_Parcel", (0.17, 0.14, 0.085), (x, -0.05, 0.985), mats["paper_cool"], root, 0.025, (0, 0, -0.05), 3)
            rounded_box("DisplayObject_4_RibbonX", (0.035, 0.15, 0.09), (x, -0.05, 0.99), mats["teal"], root, 0.009, (0, 0, -0.05), 1)
            rounded_box("DisplayObject_4_RibbonY", (0.175, 0.035, 0.09), (x, -0.05, 0.99), mats["teal"], root, 0.009, (0, 0, -0.05), 1)
            cylinder("DisplayObject_4_Seal", 0.032, 0.014, (x + 0.035, -0.125, 1.025), mats["coral"], root, 14, (math.pi / 2, 0, 0))

    # A second evidence tier adds the small-scale narrative density visible in
    # the reference: archive tokens, folded response cards and individual
    # labels. Keep it behind the mullions so the cabinet still reads as glass.
    for index, x in enumerate((-0.47, 0.0, 0.47)):
        rounded_box(f"DisplayUpperTray_{index + 1}", (0.34, 0.28, 0.028), (x, 0.01, 1.18), mats["oak"], root, 0.02)
        cylinder(f"DisplayArchiveToken_{index + 1}", 0.075, 0.07, (x - 0.065, -0.02, 1.245), mats[("teal", "brass", "coral")[index]], root, 16)
        rounded_box(f"DisplayFoldedEvidence_{index + 1}", (0.13, 0.1, 0.1), (x + 0.07, -0.015, 1.245), mats[("paper", "blue", "ivory")[index]], root, 0.018, (0, 0, -0.1 + index * 0.1))
        rounded_box(f"DisplayUpperLabel_{index + 1}", (0.14, 0.012, 0.058), (x, -0.2, 1.19), mats["paper"], root, 0.007, (-0.18, 0, 0))

    # The full "today's topic" clipboard belongs on the foreground record
    # desk. A second large board on the cabinet duplicated the same white
    # rectangle and exposed the old procedural composition. This is now the
    # source-like small counter certificate beside the flowers.
    rounded_box("DisplayMenuFrame", (0.38, 0.065, 0.32), (-0.42, -0.03, 1.7), mats["oak_aged"], root, 0.042, (0.12, 0, 0), 4)
    rounded_box("DisplayMenuPaperEdge", (0.315, 0.02, 0.255), (-0.416, -0.058, 1.695), mats["paper_edge"], root, 0.03, (0.12, 0, 0), 3)
    rounded_box("DisplayMenuPaper", (0.3, 0.028, 0.24), (-0.42, -0.072, 1.7), mats["ivory"], root, 0.028, (0.12, 0, 0), 3)
    rounded_box("DisplayMenuTitle", (0.18, 0.016, 0.026), (-0.43, -0.095, 1.775), mats["walnut"], root, 0.007, (0.12, 0, 0), 1)
    for row_index, (z, color) in enumerate(((1.72, "teal"), (1.665, "coral"))):
        cylinder(f"DisplayMenuMark_{row_index + 1}", 0.014, 0.011, (-0.52, -0.098, z), mats[color], root, 9, (math.pi / 2, 0, 0))
        rounded_box(f"DisplayMenuLine_{row_index + 1}", (0.14 - row_index * 0.015, 0.01, 0.012), (-0.405, -0.1, z), mats["ink"], root, 0.004, (0.12, 0, 0), 1)
    rounded_box("DisplayMenuClip", (0.09, 0.022, 0.027), (-0.42, -0.1, 1.835), mats["brass"], root, 0.009, (0.12, 0, 0), 2)
    add_ceramic(root, mats, "DisplayTopVase", (0.53, -0.03, 1.66), 0.95)
    rounded_box("DisplayStoryCard", (0.3, 0.028, 0.22), (0.08, -0.07, 1.68), mats["paper"], root, 0.026, (-0.08, 0.04, 0.03), 2)
    rounded_box("DisplayStoryCardRule", (0.18, 0.012, 0.018), (0.08, -0.091, 1.7), mats["teal"], root, 0.005, (-0.08, 0.04, 0.03), 1)
    add_document_packet(
        root,
        mats,
        "DisplayWitnessPacket",
        (0.1, 0.0, 1.565),
        (0.36, 0.24),
        -0.08,
        "coral",
        4,
    )
    rounded_box("DisplayArchiveFolder", (0.3, 0.09, 0.42), (-0.18, 0.08, 1.77), mats["paper_warm"], root, 0.025, (0.02, -0.1, -0.08), 3)
    rounded_box("DisplayArchiveFolderTab", (0.14, 0.095, 0.07), (-0.25, 0.08, 1.995), mats["teal"], root, 0.016, (0.02, -0.1, -0.08), 2)
    for index, angle in enumerate((-0.75, -0.24, 0.24, 0.78)):
        flower_x = 0.53 + angle * 0.16
        flower_z = 2.08 + index * 0.025
        cylinder(f"DisplayFlowerStem_{index}", 0.009, 0.38 + index * 0.03, (0.53 + angle * 0.08, -0.03, 1.9), mats["leaf"], root, 7, (0, angle * 0.2, -angle * 0.24))
        sphere(f"DisplayFlower_{index}", (0.032, 0.026, 0.026), (flower_x, -0.03, flower_z), mats["brass"], root, 12, 7)
        petal_material = mats[("coral", "butter", "paper", "coral")[index]]
        for petal_index in range(6):
            petal_angle = petal_index / 6 * math.pi * 2
            sphere(
                f"DisplayFlower_{index}_Petal_{petal_index + 1}",
                (0.052, 0.018, 0.028),
                (
                    flower_x + math.cos(petal_angle) * 0.064,
                    -0.032,
                    flower_z + math.sin(petal_angle) * 0.058,
                ),
                petal_material,
                root,
                10,
                6,
                (0, petal_angle * 0.1, petal_angle),
            )
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
        rounded_box(
            f"NoticePaperShadow_{index + 1}",
            (width + 0.018, 0.012, height + 0.018),
            (x + 0.018, -0.052, z - 0.018),
            mats["paper_edge"],
            root,
            0.018,
            rotation,
            2,
        )
        rounded_box(f"NoticePaper_{index + 1}", (width, 0.02, height), (x, -0.075 - index * 0.0005, z), mats[color], root, 0.018, rotation, 2)
        cylinder(f"NoticePin_{index + 1}", 0.018, 0.028, (x - width * 0.32, -0.095, z + height * 0.36), mats[("brass", "coral", "teal")[index % 3]], root, 10, (math.pi / 2, 0, 0))
        for line_index in range(2 if height < 0.35 else 3):
            rounded_box(
                f"NoticeLine_{index + 1}_{line_index + 1}",
                (width * (0.52 + 0.12 * (line_index % 2)), 0.012, 0.018),
                (x, -0.09, z + height * 0.12 - line_index * 0.075),
                mats["ink"], root, 0.006, rotation, 1,
            )
        fold_size = min(width, height) * 0.18
        triangular_prism(
            f"NoticePaperFold_{index + 1}",
            (
                (x + width * 0.5 - fold_size, z - height * 0.5),
                (x + width * 0.5, z - height * 0.5),
                (x + width * 0.5, z - height * 0.5 + fold_size),
            ),
            0.018,
            -0.091,
            mats["paper_warm" if index % 2 else "paper_cool"],
            root,
        )
        if index in (0, 3, 5, 7):
            cylinder(
                f"NoticeConsentSeal_{index + 1}",
                min(width, height) * 0.085,
                0.014,
                (x + width * 0.28, -0.098, z - height * 0.28),
                mats[("coral", "teal", "brass", "blue")[index % 4]],
                root,
                14,
                (math.pi / 2, 0, 0),
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
    add_plant(root, mats, "NoticePlant", (0.72, 0, 1.05), 0.72, "upright")
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
    # The complete suite also contains a tall side bookcase, so max-dimension
    # normalization used to shrink this sofa to armchair scale. Author it as a
    # credible 2.5-seat piece: after normalization its visible width is still
    # close to two metres and it can anchor the lounge like the reference.
    rounded_box("LoungeSofaLowerRail", (2.72, 0.7, 0.13), (0, 0.1, 0.27), mats["oak"], root, 0.047, segments=4)
    rounded_box("LoungeSofaFrontRail", (2.66, 0.11, 0.22), (0, -0.28, 0.35), mats["walnut"], root, 0.04, segments=4)
    rounded_box("LoungeSofaFrontReveal", (2.48, 0.025, 0.045), (0, -0.342, 0.38), mats["brass"], root, 0.01, segments=2)
    rounded_box("LoungeSofaBack", (2.68, 0.15, 0.88), (0, 0.4, 0.79), mats["oak"], root, 0.05, (0.035, 0, 0), 4)
    for side in (-1, 1):
        # Upholstery uses compressed rounded cushions instead of scaled
        # spheres. The latter read as detached beanbags once the complete
        # suite was normalized in Three.js; these retain a believable seat
        # edge, seam and contact plane from front and reverse orbit views.
        seat = sculpted_cushion(
            f"LoungeSeat_{side}",
            (1.28, 0.69, 0.28),
            (side * 0.68, -0.055, 0.54),
            mats["teal"],
            root,
            0.125,
            rotation=(0.02, 0, side * 0.012),
            segments=4,
            compression=0.14,
            compression_bias=-0.16 * side,
        )
        back = sculpted_cushion(
            f"LoungeBackCushion_{side}",
            (1.24, 0.32, 0.64),
            (side * 0.67, 0.175, 0.94),
            mats["teal"],
            root,
            0.14,
            rotation=(0.075, 0, side * 0.015),
            segments=4,
            compression=0.075,
            compression_bias=0.12 * side,
        )
        # Shallow inset seams catch the warm side light and stop the two large
        # upholstered planes from reading as featureless rounded boxes.
        rounded_box(f"LoungeSeatSeam_{side}", (1.08, 0.022, 0.022), (side * 0.68, -0.412, 0.58), mats["deep_teal"], root, 0.009, segments=2)
        rounded_box(f"LoungeBackSeam_{side}", (1.02, 0.019, 0.024), (side * 0.67, -0.006, 0.98), mats["sage"], root, 0.009, (0.055, 0, 0), 2)
        cylinder(f"LoungeSeatPiping_{side}", 0.012, 1.08, (side * 0.68, -0.417, 0.635), mats["sage"], root, 10, (0, math.pi / 2, 0))
        cylinder(f"LoungeBackPiping_{side}", 0.011, 1.02, (side * 0.67, -0.012, 1.075), mats["butter"], root, 10, (0, math.pi / 2, 0))
        sphere(f"LoungeBackTuft_{side}", (0.036, 0.02, 0.036), (side * 0.67, 0.012, 0.94), mats["deep_teal"], root, 14, 8)
        # Side boxing and a low welt line give each cushion an upholstered
        # perimeter under glancing light instead of one uninterrupted volume.
        rounded_box(
            f"LoungeSeatSideBoxing_{side}", (0.035, 0.6, 0.2),
            (side * 1.295, -0.055, 0.54), mats["deep_teal"], root, 0.014,
            (0.02, 0, side * 0.012), 2,
        )
        rounded_box(
            f"LoungeBackSideBoxing_{side}", (0.035, 0.25, 0.52),
            (side * 1.275, 0.175, 0.94), mats["deep_teal"], root, 0.014,
            (0.075, 0, side * 0.015), 2,
        )
    for x in (-1.4, 1.4):
        # Reference-like ladder arms keep the room visible through the frame.
        rounded_box(f"LoungeArmPostFront_{x}", (0.1, 0.1, 0.68), (x, -0.24, 0.5), mats["oak"], root, 0.032)
        rounded_box(f"LoungeArmPostRear_{x}", (0.1, 0.1, 0.9), (x, 0.3, 0.62), mats["oak"], root, 0.032)
        rounded_box(f"LoungeArmRail_{x}", (0.1, 0.72, 0.1), (x, 0.0, 0.8), mats["oak"], root, 0.032, (0, 0, 0.03 * -x))
        rounded_box(f"LoungeArmPad_{x}", (0.16, 0.62, 0.105), (x, -0.015, 0.855), mats["teal"], root, 0.045, segments=4)
    for x in (-1.18, 1.18):
        for y in (-0.25, 0.25):
            cylinder(f"LoungeFoot_{x}_{y}", 0.045, 0.24, (x, y, 0.12), mats["walnut"], root, 12)
    # Cushions need an authored front, side thickness and seams. Flattened
    # spheres looked like detached candy pieces in the game camera and could
    # not carry the editorial textile pattern visible in the target.
    sculpted_cushion(
        "LoungePillowButter", (0.5, 0.22, 0.44), (-0.48, -0.14, 1.035),
        mats["linen"], root, 0.13, (0.06, -0.08, -0.08), 5, 0.045, -0.08,
    )
    sculpted_cushion(
        "LoungePillowCoral", (0.48, 0.21, 0.42), (0.5, -0.14, 1.02),
        mats["linen"], root, 0.13, (-0.05, 0.08, 0.08), 5, 0.05, 0.08,
    )
    rounded_box("LoungePillowButterInset", (0.4, 0.02, 0.34), (-0.48, -0.261, 1.035), mats["linen"], root, 0.09, (0.06, -0.08, -0.08), 4)
    rounded_box("LoungePillowCoralInset", (0.38, 0.02, 0.32), (0.5, -0.256, 1.02), mats["linen"], root, 0.087, (-0.05, 0.08, 0.08), 4)
    # Real raised textile bands survive orbit and lighting changes unlike a
    # camera-facing decal. The two pillows deliberately use different pattern
    # grammar so the suite feels collected rather than procedurally duplicated.
    for band_index, band_x in enumerate((-0.09, 0.09)):
        rounded_box(
            f"LoungePillowButterBand_{band_index + 1}",
            (0.075, 0.014, 0.32),
            (-0.48 + band_x, -0.273, 1.035),
            mats["teal"],
            root,
            0.018,
            (0.06, -0.08 + (band_index - 0.5) * 0.42, -0.08),
            3,
        )
    for dot_index, (dot_x, dot_z) in enumerate(((-0.09, 0.08), (0.09, 0.08), (-0.09, -0.08), (0.09, -0.08))):
        sphere(
            f"LoungePillowCoralDot_{dot_index + 1}",
            (0.035, 0.012, 0.035),
            (0.5 + dot_x, -0.269, 1.02 + dot_z),
            mats["coral"],
            root,
            12,
            7,
        )
    # A casually folded throw adds a soft foreground overlap and breaks the
    # perfect bilateral sofa silhouette without widening its collider.
    sculpted_cushion(
        "LoungeThrowFold", (0.58, 0.14, 0.17), (0.72, -0.24, 0.69),
        mats["linen"], root, 0.055, (0.025, 0.1, -0.06), 4, 0.025, 0.12,
    )
    draped_textile(
        "LoungeThrowDrape", 0.54, (0.76, -0.16, 0.69),
        mats["linen"], root,
    )
    for stripe_index, stripe_x in enumerate((-0.16, 0.0, 0.16)):
        draped_textile(
            f"LoungeThrowStripe_{stripe_index + 1}",
            0.055,
            (0.76 + stripe_x, -0.16, 0.69),
            mats["blue"] if stripe_index != 1 else mats["teal"],
            root,
            depth_offset=0.008,
            height_offset=0.008,
            columns=3,
            rows=12,
        )

    # The coffee table is a separate layout prop with its own metre-space
    # collider and interaction anchor. Keeping a second copy inside this GLB
    # produced two overlapping tabletops and an ambiguous physical footprint.
    # The suite therefore owns only sofa, textiles and storage; the room
    # profile remains the single source of truth for the table and its decor.

    # Side bookshelf gives the lounge a real back/side silhouette in orbit.
    rounded_box("LoungeBookcaseBack", (0.95, 0.18, 1.65), (1.72, 0.24, 0.9), mats["deep_teal"], root, 0.06)
    rounded_box("LoungeBookcaseCrown", (1.12, 0.58, 0.1), (1.72, 0.02, 1.79), mats["walnut"], root, 0.035)
    rounded_box("LoungeBookcaseToeKick", (0.98, 0.48, 0.11), (1.72, 0.04, 0.09), mats["walnut"], root, 0.032)
    for x in (1.25, 2.19):
        rounded_box(f"LoungeBookcaseSide_{x}", (0.08, 0.52, 1.72), (x, 0, 0.88), mats["oak"], root, 0.035)
    for shelf_index, z in enumerate((0.16, 0.62, 1.08, 1.52)):
        rounded_box(f"LoungeShelf_{shelf_index + 1}", (1.02, 0.5, 0.075), (1.72, 0.02, z), mats["oak"], root, 0.035)
        rounded_box(
            f"LoungeShelfLip_{shelf_index + 1}", (0.94, 0.035, 0.045),
            (1.72, -0.248, z + 0.005), mats["walnut"], root, 0.012,
        )
    # Curate each shelf as a different lived-in vignette. The previous 3x5
    # procedural book grid was one of the largest remaining "generated room"
    # tells in the hero camera. Upright folios, horizontal reading stacks,
    # archive boxes, a framed witness portrait and open negative space now
    # create the collected rhythm visible in the reference.
    upright_books = (
        ("LoungeShelfBook_0_0", 1.34, 0.33, 0.27, 0.105, "paper", -0.045),
        ("LoungeShelfBook_0_1", 1.48, 0.34, 0.29, 0.12, "blue", 0.018),
        ("LoungeShelfBook_0_2", 1.64, 0.32, 0.25, 0.11, "teal", 0.055),
        ("LoungeShelfBook_0_3", 1.79, 0.35, 0.31, 0.13, "paper_warm", -0.025),
        ("LoungeShelfBook_1_0", 1.31, 0.79, 0.28, 0.115, "coral", -0.055),
        ("LoungeShelfBook_1_1", 1.47, 0.78, 0.26, 0.105, "paper", 0.012),
        ("LoungeShelfBook_1_2", 1.61, 0.8, 0.3, 0.12, "butter", 0.048),
        ("LoungeShelfBook_2_0", 1.89, 1.25, 0.31, 0.12, "teal", -0.04),
        ("LoungeShelfBook_2_1", 2.04, 1.24, 0.28, 0.11, "paper_cool", 0.025),
    )
    for name, x, z, height, width, color, lean in upright_books:
        add_book(
            root,
            mats,
            name,
            (x, -0.055 + (x % 0.07), z),
            (width, 0.22, height),
            color,
            (0, 0, lean),
        )

    for stack_index, (z, x, colors) in enumerate((
        (0.28, 2.02, ("paper_warm", "blue", "paper")),
        (0.73, 1.98, ("paper", "teal")),
    )):
        for layer, color in enumerate(colors):
            add_book(
                root,
                mats,
                f"LoungeReadingStack_{stack_index + 1}_{layer + 1}",
                (x + layer * 0.012, -0.04, z + layer * 0.045),
                (0.31 - layer * 0.018, 0.23, 0.038),
                color,
                (0, 0, (layer - 1) * 0.018),
            )

    rounded_box(
        "LoungeArchiveBox",
        (0.42, 0.31, 0.29),
        (1.45, 0.02, 1.26),
        mats["paper_warm"],
        root,
        0.045,
        (0, 0, -0.025),
        4,
    )
    rounded_box(
        "LoungeArchiveBoxLid",
        (0.45, 0.33, 0.06),
        (1.45, -0.005, 1.425),
        mats["oak_light"],
        root,
        0.025,
        (0, 0, -0.025),
        3,
    )
    rounded_box(
        "LoungeArchiveBoxLabel",
        (0.2, 0.018, 0.09),
        (1.45, -0.155, 1.27),
        mats["paper"],
        root,
        0.014,
        (0, 0, -0.025),
        2,
    )
    rounded_box(
        "LoungeArchiveBoxHandle",
        (0.14, 0.025, 0.045),
        (1.45, -0.174, 1.34),
        mats["brass"],
        root,
        0.012,
        (0, 0, -0.025),
        2,
    )
    for corner_index, (corner_x, corner_z) in enumerate((
        (1.255, 1.14),
        (1.645, 1.14),
        (1.255, 1.38),
        (1.645, 1.38),
    )):
        rounded_box(
            f"LoungeArchiveBoxCorner_{corner_index + 1}",
            (0.04, 0.025, 0.055),
            (corner_x, -0.165, corner_z),
            mats["oak_dark"],
            root,
            0.012,
            (0, 0, -0.025),
            2,
        )

    portrait = empty("LoungeWitnessPortrait", root, (1.77, -0.14, 0.85), (0.055, 0, 0.055))
    rounded_box("LoungeWitnessPortraitFrame", (0.34, 0.035, 0.28), (0, 0, 0), mats["walnut"], portrait, 0.035, segments=4)
    rounded_box("LoungeWitnessPortraitPaper", (0.27, 0.018, 0.21), (0, -0.022, 0), mats["paper_cool"], portrait, 0.025, segments=3)
    sphere("LoungeWitnessPortraitMark", (0.065, 0.012, 0.065), (0, -0.036, 0.025), mats["coral"], portrait, 14, 8)
    rounded_box("LoungeWitnessPortraitCaption", (0.16, 0.012, 0.018), (0, -0.038, -0.075), mats["teal"], portrait, 0.006, segments=1)

    # Alternating brass/wood bookends preserve shelf load and create pauses.
    for row in range(3):
        cylinder(
            f"LoungeBookend_{row + 1}", 0.025, 0.2,
            (2.12 if row % 2 else 1.27, -0.17, 0.36 + row * 0.46),
            mats["brass"] if row == 1 else mats["walnut"], root, 12,
        )
    add_document_packet(
        root,
        mats,
        "LoungeArchivePacket",
        (1.72, -0.06, 1.59),
        (0.38, 0.28),
        0.035,
        "blue",
        3,
    )
    add_plant(root, mats, "LoungeShelfPlant", (1.74, 0, 1.67), 0.72, "trailing")
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
        "contract": "mirrorlife-civic-hero-props-v15",
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
