import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector


ROLE_CONFIGS = {
    "player": {
        "skin": "#efb28a",
        "hair": "#26252d",
        "hair_highlight": "#3d3a45",
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
        "skin": "#ecad82",
        "hair": "#242832",
        "hair_highlight": "#39414f",
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
        "skin": "#f2b991",
        "hair": "#d45f52",
        "hair_highlight": "#ec796b",
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
        "skin": "#efb38a",
        "hair": "#604237",
        "hair_highlight": "#79584b",
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


def tailored_panel(
    name,
    width_top,
    width_waist,
    width_bottom,
    height,
    depth,
    location,
    mat,
    parent=None,
    radius=0.025,
    rotation=(0, 0, 0),
):
    """Create a fitted fabric panel with authored drape in the base topology.

    Earlier panels used three box-like rings and then relied on decorative
    strips for every fold.  Five height rings and seven width samples now bow
    the cloth over the chest, relax it at the waist and break the front into
    broad alternating planes.  The result reads as one garment from every
    orbit angle while retaining one inexpensive mesh and the existing rig.
    """
    ring_factors = (0.0, 0.24, 0.5, 0.76, 1.0)
    column_factors = (-1.0, -0.66, -0.33, 0.0, 0.33, 0.66, 1.0)
    vertices = []
    for height_factor in ring_factors:
        if height_factor <= 0.5:
            width = width_bottom + (width_waist - width_bottom) * (height_factor / 0.5)
        else:
            width = width_waist + (width_top - width_waist) * ((height_factor - 0.5) / 0.5)
        z = -height / 2 + height * height_factor
        body_roll = math.sin(math.pi * height_factor)
        for column in column_factors:
            x = column * width / 2
            broad_fold = math.cos(column * math.pi * 2.5) * depth * 0.075 * body_roll
            centre_bow = (1.0 - abs(column)) * depth * 0.13 * body_roll
            vertices.append((x, -depth / 2 - broad_fold - centre_bow, z))
        for column in column_factors:
            vertices.append((column * width / 2, depth / 2, z))
    columns = len(column_factors)
    stride = columns * 2
    faces = []
    for ring in range(len(ring_factors) - 1):
        current = ring * stride
        following = (ring + 1) * stride
        for column in range(columns - 1):
            faces.append((current + column, current + column + 1, following + column + 1, following + column))
            back = current + columns + column
            back_following = following + columns + column
            faces.append((back + 1, back, back_following, back_following + 1))
        faces.append((current + columns, current, following, following + columns))
        faces.append((current + columns - 1, current + stride - 1, following + stride - 1, following + columns - 1))
    bottom = 0
    top = (len(ring_factors) - 1) * stride
    for column in range(columns - 1):
        faces.append((bottom + column, bottom + columns + column, bottom + columns + column + 1, bottom + column + 1))
        faces.append((top + column + 1, top + columns + column + 1, top + columns + column, top + column))
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    bevel = obj.modifiers.new("Tailored cloth edge", "BEVEL")
    bevel.width = min(radius, depth * 0.42, min(width_top, width_waist, width_bottom) * 0.18)
    bevel.segments = 4
    smooth = obj.modifiers.new("Tailored cloth normals", "WEIGHTED_NORMAL")
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


def organic_limb(name, depth, profile, location, mat, parent=None, rotation=(0, 0, 0), sides=18):
    """Build a softly changing limb volume instead of a straight cone.

    ``profile`` contains ``(height_ratio, radius_x, radius_y)`` rings ordered
    from top to bottom.  A calf can therefore swell before tapering into the
    ankle, and a sleeve can roll naturally from the shoulder into the elbow.
    The mesh stays inexpensive and keeps the existing pivot-rig contract.
    """
    if len(profile) < 3:
        raise ValueError("organic_limb requires at least three profile rings")
    vertices = []
    faces = []
    for height_ratio, radius_x, radius_y in profile:
        z = depth * height_ratio
        for side in range(sides):
            angle = math.tau * side / sides
            vertices.append((
                math.cos(angle) * radius_x,
                math.sin(angle) * radius_y,
                z,
            ))
    for ring in range(len(profile) - 1):
        current = ring * sides
        following_ring = (ring + 1) * sides
        for side in range(sides):
            following = (side + 1) % sides
            faces.append((
                current + side,
                current + following,
                following_ring + following,
                following_ring + side,
            ))
    vertices.extend(((0, 0, depth * profile[0][0]), (0, 0, depth * profile[-1][0])))
    top_center = len(vertices) - 2
    bottom_center = len(vertices) - 1
    last_ring = (len(profile) - 1) * sides
    for side in range(sides):
        following = (side + 1) % sides
        faces.append((top_center, side, following))
        faces.append((bottom_center, last_ring + following, last_ring + side))
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    link_material(obj, mat)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    bevel = obj.modifiers.new("Organic limb softness", "BEVEL")
    bevel.width = 0.006
    bevel.segments = 2
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


def tapered_lock(name, points, radii, mat, parent=None, sides=10):
    """Build a light, curved and tapered hair lock instead of a capsule fringe."""
    if len(points) != len(radii) or len(points) < 2:
        raise ValueError("tapered_lock requires matching point/radius arrays")
    vertices = []
    faces = []
    vectors = [Vector(point) for point in points]
    for index, (point, radius) in enumerate(zip(vectors, radii)):
        before = vectors[max(0, index - 1)]
        after = vectors[min(len(vectors) - 1, index + 1)]
        tangent = (after - before).normalized()
        reference = Vector((0, 1, 0)) if abs(tangent.dot(Vector((0, 1, 0)))) < 0.9 else Vector((1, 0, 0))
        normal = tangent.cross(reference).normalized()
        binormal = tangent.cross(normal).normalized()
        for side in range(sides):
            angle = math.tau * side / sides
            # A path-aligned oval prevents the sheared, stacked-cylinder look
            # that the old horizontal rings produced on curved fringe locks.
            coordinate = point + normal * (math.cos(angle) * radius) + binormal * (math.sin(angle) * radius * 0.72)
            vertices.append(tuple(coordinate))
    for ring in range(len(points) - 1):
        base = ring * sides
        next_base = (ring + 1) * sides
        for side in range(sides):
            following = (side + 1) % sides
            faces.append((base + side, base + following, next_base + following, next_base + side))
    vertices.extend([tuple(vectors[0]), tuple(vectors[-1])])
    start_center = len(vertices) - 2
    end_center = len(vertices) - 1
    for side in range(sides):
        following = (side + 1) % sides
        faces.append((start_center, following, side))
        last = (len(points) - 1) * sides
        faces.append((end_center, last + side, last + following))
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    link_material(obj, mat)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    return obj


def sculpted_hand(name, location, mat, crease_mat, parent=None, rotation=(0, 0, 0), side=1):
    """Build one continuous illustrated hand with a readable finger fan.

    Separate pill-shaped fingers left visible gaps in the gameplay camera.
    This tapered palm carries the wrist, palm, knuckles and fingertip mass in
    one watertight volume; three shallow crease meshes preserve four-finger
    readability and can still be stripped at the phone LOD.
    """
    hand = organic_limb(
        name,
        0.16,
        (
            (0.5, 0.038, 0.033),
            (0.28, 0.049, 0.038),
            (0.05, 0.057, 0.041),
            (-0.18, 0.059, 0.039),
            (-0.38, 0.052, 0.034),
            (-0.5, 0.039, 0.027),
        ),
        location,
        mat,
        parent,
        rotation=rotation,
        sides=24,
    )
    for crease_index, crease_x in enumerate((-0.026, 0.0, 0.026), start=1):
        curve_tube(
            f"FingerCrease_{side}_{crease_index}",
            [
                (location[0] + crease_x, location[1] - 0.036, location[2] - 0.048),
                (location[0] + crease_x * 0.92, location[1] - 0.039, location[2] - 0.071),
            ],
            0.0031,
            crease_mat,
            parent,
            resolution=2,
        )
    return hand


def pleated_skirt(name, waist_radius, hem_radius, depth, location, mat, parent=None, pleats=10, segments=40):
    """Create a conical skirt whose folds belong to its silhouette."""
    rings = ((0.5, waist_radius, 0.06), (0.12, (waist_radius + hem_radius) * 0.5, 0.55), (-0.5, hem_radius, 1.0))
    vertices = []
    faces = []
    for z_factor, radius, fold_strength in rings:
        for segment in range(segments):
            angle = math.tau * segment / segments
            fold = math.cos(angle * pleats) * 0.014 * fold_strength
            front_bias = max(0.0, -math.sin(angle)) * 0.008 * fold_strength
            current_radius = radius + fold + front_bias
            vertices.append((math.cos(angle) * current_radius, math.sin(angle) * current_radius, depth * z_factor))
    for ring in range(len(rings) - 1):
        current = ring * segments
        following = (ring + 1) * segments
        for segment in range(segments):
            next_segment = (segment + 1) % segments
            faces.append((current + segment, current + next_segment, following + next_segment, following + segment))
    vertices.extend(((0, 0, depth * rings[0][0]), (0, 0, depth * rings[-1][0])))
    top_center = len(vertices) - 2
    bottom_center = len(vertices) - 1
    last = (len(rings) - 1) * segments
    for segment in range(segments):
        next_segment = (segment + 1) % segments
        faces.append((top_center, next_segment, segment))
        faces.append((bottom_center, last + segment, last + next_segment))
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    link_material(obj, mat)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    bevel = obj.modifiers.new("Pleated hem softness", "BEVEL")
    bevel.width = 0.006
    bevel.segments = 2
    return obj


def cloth_fold_ribbon(name, points, widths, mat, parent=None, depth=0.008):
    """Create a shallow tapered fabric ridge that reads as cloth, not piping.

    The earlier garment creases were round curve tubes. At gameplay distance
    those looked like cords glued onto the costume. This low triangular ribbon
    rolls one soft highlight across the fold and then disappears into the base
    cloth at both ends.
    """
    if len(points) != len(widths) or len(points) < 2:
        raise ValueError("cloth_fold_ribbon requires matching point/width arrays")
    vertices = []
    for point, width in zip(points, widths):
        x, y, z = point
        vertices.extend((
            (x - width, y, z),
            (x, y - depth, z),
            (x + width, y, z),
        ))
    faces = []
    for index in range(len(points) - 1):
        base = index * 3
        following = (index + 1) * 3
        faces.extend((
            (base, base + 1, following + 1, following),
            (base + 1, base + 2, following + 2, following + 1),
        ))
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    link_material(obj, mat)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    bevel = obj.modifiers.new("Fabric fold softness", "BEVEL")
    bevel.width = min(depth * 0.46, min(widths) * 0.32)
    bevel.segments = 2
    return obj


def build_materials(role, config):
    return {
        "skin": material(f"{role} skin", config["skin"], 0.7, clearcoat=0.035),
        "skin_shadow": material(f"{role} hand crease", "#c97e64", 0.82),
        # Matte hair keeps the warm key light broad and painterly.  The older
        # clear-coated finish exposed every low-poly facet in the game camera.
        "hair": material(f"{role} hair", config["hair"], 0.68, clearcoat=0.025),
        "hair_highlight": material(f"{role} hair highlight", config["hair_highlight"], 0.64, clearcoat=0.035),
        "eye_white": material(f"{role} eye white", "#fffefa", 0.3, clearcoat=0.42),
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


def build_face(head, mats, role):
    """Translate the illustrated avatar language into lit, rotatable geometry.

    The 2D portraits depend on a dark upper eye contour, a clean white sclera,
    readable iris catchlights and role-specific lashes.  Those cues must live
    on the curved head (and under the expression pivots), rather than on a
    camera-facing portrait card, so they survive orbit, occlusion and shadow.
    """
    feminine = role in ("facilitator", "mediator")
    face = ellipsoid("Head", (0, 0, 0), (0.246, 0.214, 0.288), mats["skin"], head, segments=40, rings=28)
    # Narrow the lower third into an illustrated jaw rather than leaving the
    # UV sphere's toy-like circular chin. The change is deliberately subtle so
    # all existing facial pivots and expression shape keys stay aligned.
    for vertex in face.data.vertices:
        x, y, z = vertex.co
        lower = max(0.0, min(1.0, (-z - 0.012) / 0.22))
        front = max(0.0, min(1.0, (-y - 0.015) / 0.17))
        vertex.co.x *= 1.0 - lower * 0.16
        if front > 0 and z < -0.02:
            vertex.co.y += lower * front * 0.008
    # Keep the facial volume itself expressive. The previous rig swapped
    # mouth meshes but left the cheeks and jaw completely rigid, which read as
    # a toy mask in close conversational framing. These sparse, authored shape
    # keys preserve the illustrated silhouette while giving speech and warmth
    # a continuous deformation that can be driven in Three.js.
    face.shape_key_add(name="Basis")
    smile = face.shape_key_add(name="WarmSmile")
    speech = face.shape_key_add(name="SpeechJaw")
    concern = face.shape_key_add(name="Concern")
    for index, vertex in enumerate(face.data.vertices):
        x, y, z = vertex.co
        front = max(0.0, min(1.0, (-y - 0.035) / 0.155))
        lower = max(0.0, min(1.0, (-z + 0.015) / 0.17))
        cheek = max(0.0, min(1.0, (abs(x) - 0.045) / 0.12)) * front

        smile_co = smile.data[index].co
        smile_co.x *= 1.0 + cheek * lower * 0.018
        smile_co.y -= cheek * 0.004
        smile_co.z += cheek * lower * 0.012
        if z < -0.045:
            smile_co.z += front * lower * 0.009

        speech_co = speech.data[index].co
        if z < -0.02:
            speech_co.z -= front * lower * 0.02
            speech_co.y -= front * lower * 0.006
            speech_co.x *= 1.0 - front * lower * 0.012

        concern_co = concern.data[index].co
        concern_co.x *= 1.0 - cheek * 0.009
        concern_co.z += cheek * 0.004
        if z < -0.055:
            concern_co.z -= front * lower * 0.005
    for side in (-1, 1):
        ellipsoid(f"Ear_{side}", (side * 0.255, 0.002, -0.015), (0.052, 0.032, 0.072), mats["skin"], head, segments=18, rings=12)
        ellipsoid(f"EarInner_{side}", (side * 0.272, -0.027, -0.014), (0.018, 0.008, 0.034), mats["blush"], head, segments=12, rings=8)
        # Keep the eyes readable without letting two protruding white spheres
        # dominate the face.  A flatter corneal stack and a slightly narrower
        # sclera read much closer to the painted reference at gameplay scale.
        eye = empty(f"EyePivot_{side}", head, (side * 0.086, -0.205, 0.036))
        ellipsoid(f"EyeWhite_{side}", (0, -0.001, 0), (0.042, 0.013, 0.053), mats["eye_white"], eye, segments=24, rings=16)
        ellipsoid(f"Iris_{side}", (-side * 0.0015, -0.014, -0.002), (0.024, 0.006, 0.039), mats["iris"], eye, segments=20, rings=12)
        ellipsoid(f"Pupil_{side}", (-side * 0.0015, -0.019, -0.004), (0.0135, 0.0035, 0.026), mats["ink"], eye, segments=14, rings=8)
        ellipsoid(f"EyeGlint_{side}", (-side * 0.008, -0.023, 0.014), (0.0055, 0.0022, 0.008), mats["eye_white"], eye, segments=10, rings=6)
        curve_tube(
            f"EyeOutline_{side}",
            [
                (-0.041, -0.016, 0),
                (-0.032, -0.016, 0.036),
                (0, -0.016, 0.052),
                (0.032, -0.016, 0.036),
                (0.041, -0.016, 0),
                (0.032, -0.016, -0.036),
                (0, -0.016, -0.052),
                (-0.032, -0.016, -0.036),
            ],
            0.0021,
            mats["ink"],
            eye,
            cyclic=True,
            resolution=2,
        )
        # Upper lids/lashes preserve the drawn identity at normal gameplay
        # distance. They remain children of EyePivot, so blinking still works.
        curve_tube(
            f"UpperLid_{side}",
            [(-0.04, -0.017, 0.035), (0, -0.02, 0.051), (0.04, -0.017, 0.035)],
            0.0046 if feminine else 0.004,
            mats["ink"],
            eye,
            resolution=2,
        )
        if feminine:
            curve_tube(
                f"OuterLash_{side}",
                [(side * 0.034, -0.017, 0.037), (side * 0.052, -0.019, 0.05)],
                0.0038,
                mats["ink"],
                eye,
                resolution=2,
            )
        brow = empty(f"BrowPivot_{side}", head, (side * 0.086, -0.219, 0.116))
        curve_tube(
            f"Brow_{side}",
            [(side * 0.057, 0.003, -0.007), (0, -0.008, 0.008), (-side * 0.05, 0.003, -0.004)],
            0.0072,
            mats["hair"],
            brow,
        )
        ellipsoid(f"Blush_{side}", (side * 0.175, -0.211, -0.048), (0.043, 0.009, 0.018), mats["blush"], head, segments=14, rings=8)
    ellipsoid("Nose", (0, -0.219, -0.019), (0.016, 0.011, 0.023), mats["skin"], head, segments=16, rings=10)
    mouth = empty("MouthPivot", head, (0, -0.225, -0.099))
    closed = empty("MouthClosedPivot", mouth)
    curve_tube("MouthClosed", [(-0.036, 0.002, 0.005), (-0.005, -0.005, -0.008), (0.036, 0.002, 0.003)], 0.0042, mats["ink"], closed)
    # A separate glossy lower-lip mesh read as a floating moustache at the
    # authored gameplay distance. Keep the closed mouth as one clean ink line;
    # the open-mouth/tongue pair supplies colour only while speaking.
    open_mouth = empty("MouthOpenPivot", mouth)
    ellipsoid("MouthOpen", (0, -0.004, -0.002), (0.035, 0.008, 0.026), mats["ink"], open_mouth, segments=20, rings=12)
    ellipsoid("Tongue", (0, -0.012, -0.012), (0.02, 0.004, 0.008), mats["blush"], open_mouth, segments=14, rings=8)


def build_hair(head, mats, style):
    # Keep the cap inside the face silhouette.  A wide full sphere reads like a
    # plastic helmet from the follow camera, especially on the player whose
    # back faces the camera for most conversations.
    cap_scale = (0.265, 0.187, 0.236) if style == "spiky" else (0.278, 0.21, 0.25)
    ellipsoid("HairCap", (0, 0.03, 0.08), cap_scale, mats["hair"], head, segments=40, rings=26)
    fringe_specs = (
        (-0.19, -0.15, 0.205, 0.036),
        (-0.12, -0.085, 0.18, 0.04),
        (-0.045, -0.018, 0.158, 0.041),
        (0.04, 0.018, 0.166, 0.041),
        (0.12, 0.085, 0.188, 0.039),
        (0.19, 0.15, 0.21, 0.035),
    )
    for index, (root_x, tip_x, tip_z, root_radius) in enumerate(fringe_specs):
        tapered_lock(
            f"Fringe_{index + 1}",
            [
                (root_x, -0.13, 0.235 - abs(root_x) * 0.08),
                ((root_x * 3 + tip_x) / 4, -0.18, 0.205),
                ((root_x + tip_x) / 2, -0.208, 0.172),
                ((root_x + tip_x * 3) / 4, -0.223, 0.148),
                (tip_x, -0.229, tip_z),
            ],
            (root_radius * 0.9, root_radius * 1.04, root_radius * 0.88, root_radius * 0.58, 0.006),
            mats["hair_highlight"] if index in (1, 4) else mats["hair"],
            head,
            sides=10,
        )
    for side in (-1, 1):
        side_height = 0.125 if style == "spiky" else 0.17
        side_z = -0.035 if style == "spiky" else -0.07
        tapered_lock(
            f"SideHair_{side}",
            [
                (side * 0.19, 0.105, 0.19),
                (side * 0.245, 0.055, 0.11),
                (side * 0.262, -0.005, side_z + side_height * 0.18),
                (side * 0.23, -0.052, side_z - side_height * 0.55),
            ],
            (0.062, 0.069, 0.052, 0.009),
            mats["hair"],
            head,
            sides=14,
        )

    if style == "spiky":
        # Use one asymmetrical swept ridge instead of paired crown spikes.
        # Symmetrical points read as cat ears from the gameplay camera.
        for index, (x, tip_x, tip_z) in enumerate(((-0.17, -0.12, 0.29), (-0.05, 0.015, 0.31), (0.08, 0.17, 0.285))):
            tapered_lock(
                f"HairSpike_{index + 1}",
                [
                    (x, 0.07, 0.19),
                    ((x * 2 + tip_x) / 3, 0.052, 0.245),
                    ((x + tip_x * 2) / 3, 0.028, tip_z - 0.018),
                    (tip_x, 0.005, tip_z),
                ],
                (0.048, 0.043, 0.026, 0.005),
                mats["hair_highlight"] if index == 1 else mats["hair"],
                head,
                sides=14,
            )
        # Break the rear silhouette into swept clumps.  These overlap the cap
        # at their roots, so the gameplay camera sees one authored hairstyle
        # rather than a sphere with a few decorative spikes on top.
        for index, (root_x, tip_x, tip_z) in enumerate((
            (-0.2, -0.24, 0.08),
            (-0.1, -0.15, 0.015),
            (0.0, 0.02, -0.04),
            (0.1, 0.16, 0.01),
            (0.2, 0.25, 0.085),
        )):
            tapered_lock(
                f"BackHairLock_{index + 1}",
                [
                    (root_x, 0.125, 0.185 - abs(root_x) * 0.14),
                    ((root_x * 2 + tip_x) / 3, 0.195, 0.13 - abs(root_x) * 0.08),
                    ((root_x + tip_x * 2) / 3, 0.228, tip_z + 0.045),
                    (tip_x, 0.215, tip_z),
                ],
                (0.044, 0.042, 0.027, 0.006),
                mats["hair_highlight"] if index in (1, 3) else mats["hair"],
                head,
                sides=14,
            )
    elif style == "coral_ponytail":
        ellipsoid("HairBun", (0.19, 0.12, 0.18), (0.15, 0.13, 0.16), mats["hair"], head, segments=24, rings=14)
        ponytail = empty("PonytailPivot", head, (0.2, 0.12, 0.15))
        tapered_lock(
            "Ponytail_Main",
            [
                (0, 0, 0),
                (0.055, 0.01, -0.11),
                (0.085, 0.005, -0.25),
                (0.1, -0.005, -0.4),
                (0.09, -0.02, -0.55),
                (0.05, -0.035, -0.69),
            ],
            (0.13, 0.135, 0.125, 0.112, 0.088, 0.018),
            mats["hair"],
            ponytail,
            sides=14,
        )
    elif style == "braided_bob":
        for index, x in enumerate((-0.22, -0.11, 0, 0.11, 0.22)):
            side = -1 if x < 0 else 1
            tapered_lock(
                f"BraidKnot_{index + 1}",
                [
                    (x * 0.72, 0.015, 0.245 - abs(x) * 0.2),
                    (x, -0.02, 0.205 - abs(x) * 0.28),
                    (x + side * 0.025, -0.055, 0.155 - abs(x) * 0.36),
                ],
                (0.052, 0.048, 0.012),
                mats["hair_highlight"] if index in (1, 3) else mats["hair"],
                head,
                sides=12,
            )


def build_cap(head, mats):
    ellipsoid("CapCrown", (0, -0.005, 0.255), (0.29, 0.22, 0.12), mats["top"], head, segments=28, rings=14)
    rounded_box("CapBrim", (0.28, 0.19, 0.035), (0, -0.24, 0.215), mats["top"], head, radius=0.025, rotation=(math.radians(8), 0, 0))
    torus("CapBadge", 0.035, 0.012, (0.09, -0.226, 0.286), mats["accent"], head, rotation=(math.pi / 2, 0, 0), major_segments=20)


def build_body(role, config, mats, visual):
    torso = ellipsoid("Torso", (0, 0, 1.0), (0.25, 0.155, 0.32), mats["top"], visual, segments=28, rings=18)
    # Sculpt the base torso into a soft shoulder-to-waist taper.  Keeping the
    # authored volume in one mesh avoids the ball-jointed toy silhouette while
    # preserving the inexpensive shared-pivot animation contract.
    for vertex in torso.data.vertices:
        x, y, z = vertex.co
        normalized = max(-1.0, min(1.0, z / 0.32))
        shoulder = max(0.0, min(1.0, (normalized - 0.2) / 0.8))
        waist = max(0.0, 1.0 - abs(normalized + 0.48) / 0.52)
        vertex.co.x *= 1.0 + shoulder * 0.09 - waist * 0.11
        vertex.co.y *= 1.0 - waist * 0.06
    cylinder("Neck", 0.09, 0.085, 0.12, (0, 0, 1.33), mats["skin"], visual, vertices=20)
    rounded_box("WaistBand", (0.39, 0.245, 0.055), (0, -0.005, 0.775), mats["accent"], visual, radius=0.026)

    left_arm = empty("LeftArmPivot", visual, (-0.238, 0, 1.2))
    right_arm = empty("RightArmPivot", visual, (0.238, 0, 1.2))
    left_elbow = empty("LeftElbowPivot", left_arm, (0, 0, -0.235))
    right_elbow = empty("RightElbowPivot", right_arm, (0, 0, -0.235))
    left_leg = empty("LeftLegPivot", visual, (-0.135, 0, 0.73))
    right_leg = empty("RightLegPivot", visual, (0.135, 0, 0.73))
    left_knee = empty("LeftKneePivot", left_leg, (0, 0, -0.285))
    right_knee = empty("RightKneePivot", right_leg, (0, 0, -0.285))

    sleeve_mat = mats["outer"] if config["costume"] in ("traveler", "facilitator", "mediator") else mats["top"]
    for side, pivot, elbow in ((-1, left_arm, left_elbow), (1, right_arm, right_elbow)):
        # The upper-arm topology now carries its own rounded shoulder. A
        # separate sphere made white coats read like ball-jointed dolls.
        organic_limb(
            f"UpperArm_{side}",
            0.31,
            (
                (0.56, 0.036, 0.034),
                (0.42, 0.067, 0.063),
                (0.24, 0.071, 0.066),
                (0.02, 0.062, 0.058),
                (-0.28, 0.055, 0.052),
                (-0.5, 0.051, 0.049),
            ),
            (0, 0, -0.15),
            sleeve_mat,
            pivot,
        )
        ellipsoid(f"ElbowBridge_{side}", (0, 0, 0.002), (0.05, 0.048, 0.054), sleeve_mat, elbow, segments=18, rings=10)
        organic_limb(
            f"Forearm_{side}",
            0.265,
            (
                (0.5, 0.058, 0.055),
                (0.23, 0.061, 0.057),
                (-0.08, 0.055, 0.052),
                (-0.34, 0.048, 0.046),
                (-0.5, 0.045, 0.043),
            ),
            (0, 0, -0.132),
            sleeve_mat,
            elbow,
        )
        cylinder(f"Cuff_{side}", 0.06, 0.056, 0.052, (0, 0, -0.236), mats["accent"], elbow, vertices=20)
        sculpted_hand(
            f"Hand_{side}",
            (0, -0.008, -0.319),
            mats["skin"],
            mats["skin_shadow"],
            elbow,
            side=side,
        )
        ellipsoid(f"Thumb_{side}", (-side * 0.045, -0.038, -0.32), (0.019, 0.015, 0.04), mats["skin"], elbow, rotation=(0.12, side * 0.38, side * 0.42), segments=16, rings=10)

    for side, pivot, knee in ((-1, left_leg, left_knee), (1, right_leg, right_knee)):
        organic_limb(
            f"Thigh_{side}",
            0.34,
            (
                (0.5, 0.089, 0.082),
                (0.25, 0.09, 0.084),
                (0.0, 0.084, 0.08),
                (-0.3, 0.075, 0.071),
                (-0.5, 0.069, 0.066),
            ),
            (0, 0, -0.15),
            mats["lower"],
            pivot,
        )
        ellipsoid(f"KneeBridge_{side}", (0, 0, 0.002), (0.06, 0.056, 0.06), mats["lower"], knee, segments=18, rings=10)
        organic_limb(
            f"Shin_{side}",
            0.33,
            (
                (0.5, 0.071, 0.067),
                (0.28, 0.078, 0.073),
                (0.04, 0.083, 0.077),
                (-0.3, 0.068, 0.064),
                (-0.5, 0.06, 0.058),
            ),
            (0, 0, -0.155),
            mats["lower"],
            knee,
        )
        # Two shallow same-material ribbons catch the warm key light like cloth
        # tension instead of reading as cords glued onto the trousers.
        for fold_index, fold_x in enumerate((-0.035, 0.035)):
            cloth_fold_ribbon(
                f"TrouserFold_{side}_{fold_index + 1}",
                [(fold_x, -0.087, -0.035), (fold_x * 0.55, -0.095, -0.14), (fold_x * 0.8, -0.087, -0.235)],
                (0.002, 0.008, 0.002),
                mats["lower"],
                knee,
                depth=0.006,
            )
        cylinder(f"TrouserCuff_{side}", 0.088, 0.082, 0.082, (0, 0, -0.25), mats["accent"], knee, vertices=18)
        ellipsoid(f"Shoe_{side}", (0, -0.055, -0.35), (0.082, 0.126, 0.064), mats["shoe"], knee, segments=22, rings=14)
        rounded_box(f"Sole_{side}", (0.17, 0.255, 0.024), (0, -0.04, -0.411), mats["sole"], knee, radius=0.01, segments=2)
        curve_tube(f"Lace_{side}", [(-0.046, -0.199, -0.33), (0, -0.205, -0.316), (0.046, -0.199, -0.33)], 0.007, mats["sole"], knee)

    return torso, left_arm, right_arm, left_elbow, right_elbow, left_leg, right_leg, left_knee, right_knee


def build_costume(role, config, mats, visual, left_arm, right_arm, left_elbow, right_elbow):
    costume = config["costume"]
    if costume == "traveler":
        for side in (-1, 1):
            tailored_panel(
                f"Vest_{side}",
                0.13,
                0.104,
                0.118,
                0.335,
                0.038,
                (side * 0.073, -0.165, 1.045),
                mats["outer"],
                visual,
                radius=0.018,
                rotation=(0, side * 0.025, side * 0.065),
            )
            rounded_box(
                f"VestPocket_{side}",
                (0.105, 0.035, 0.12),
                (side * 0.12, -0.206, 0.93),
                mats["accent"],
                visual,
                radius=0.018,
                rotation=(0.02, side * 0.02, side * 0.045),
            )
            cloth_fold_ribbon(
                f"VestDrape_{side}",
                [
                    (side * 0.055, -0.208, 1.215),
                    (side * 0.075, -0.218, 1.06),
                    (side * 0.09, -0.211, 0.86),
                ],
                (0.002, 0.011, 0.002),
                mats["outer"],
                visual,
                depth=0.008,
            )
        curve_tube("VestCenterSeam", [(0, -0.207, 0.83), (0, -0.215, 1.05), (0, -0.205, 1.24)], 0.006, mats["accent"], visual, resolution=2)
        curve_tube("TravelerCollar", [(-0.17, -0.12, 1.25), (0, -0.205, 1.2), (0.17, -0.12, 1.25)], 0.026, mats["outer"], visual)
        backpack = empty("BackpackPivot", visual, (0, 0.155, 1.0))
        # A rounded volume avoids the large rectangular block that dominates
        # the default follow-camera view from behind the player.
        ellipsoid("Backpack", (0, 0, 0), (0.205, 0.105, 0.235), mats["accent"], backpack, segments=28, rings=18)
        rounded_box("BackpackFlap", (0.29, 0.04, 0.13), (0, 0.097, 0.105), mats["shoe"], backpack, radius=0.03)
        rounded_box("BackpackPocket", (0.23, 0.04, 0.14), (0, 0.097, -0.09), mats["outer"], backpack, radius=0.035)
        curve_tube("BackpackHandle", [(-0.08, 0.02, 0.225), (0, 0.07, 0.26), (0.08, 0.02, 0.225)], 0.014, mats["shoe"], backpack, resolution=2)
        cloth_fold_ribbon(
            "BackpackCenterDrape",
            [(0, 0.106, 0.08), (0.012, 0.112, -0.02), (0, 0.106, -0.16)],
            (0.002, 0.012, 0.002),
            mats["accent"],
            backpack,
            depth=0.007,
        )
        for side in (-1, 1):
            rounded_box(f"BackpackSidePocket_{side}", (0.075, 0.12, 0.16), (side * 0.205, 0.018, -0.08), mats["outer"], backpack, radius=0.025)
            curve_tube(
                f"BackpackStrap_{side}",
                [(side * 0.16, 0.105, 0.25), (side * 0.2, 0.145, 0.02), (side * 0.16, 0.11, -0.22)],
                0.018,
                mats["shoe"],
                backpack,
            )
            rounded_box(f"BackpackBuckle_{side}", (0.055, 0.025, 0.065), (side * 0.16, 0.125, -0.04), mats["metal"], backpack, radius=0.012)
        curve_tube("Scarf", [(-0.16, -0.005, 1.275), (0, -0.105, 1.255), (0.16, -0.005, 1.275)], 0.027, mats["accent"], visual)
    elif costume == "listener":
        curve_tube("Hood", [(-0.19, 0.02, 1.27), (0, 0.11, 1.34), (0.19, 0.02, 1.27)], 0.055, mats["outer"], visual)
        curve_tube("JacketCenterSeam", [(0, -0.205, 0.83), (0, -0.216, 1.04), (0, -0.205, 1.24)], 0.006, mats["outer"], visual, resolution=2)
        curve_tube("JacketHem", [(-0.2, -0.13, 0.79), (0, -0.205, 0.77), (0.2, -0.13, 0.79)], 0.008, mats["outer"], visual, resolution=2)
        for side in (-1, 1):
            cloth_fold_ribbon(
                f"JacketTensionFold_{side}",
                [
                    (side * 0.17, -0.186, 1.2),
                    (side * 0.105, -0.215, 1.04),
                    (side * 0.14, -0.2, 0.84),
                ],
                (0.002, 0.012, 0.002),
                mats["top"],
                visual,
                depth=0.008,
            )
        rounded_box("Satchel", (0.34, 0.14, 0.27), (0.31, 0.08, 0.78), mats["accent"], visual, radius=0.065)
        rounded_box("SatchelFlap", (0.27, 0.035, 0.09), (0.31, -0.002, 0.84), mats["shoe"], visual, radius=0.02)
        rounded_box("SatchelClasp", (0.055, 0.025, 0.065), (0.31, -0.023, 0.8), mats["metal"], visual, radius=0.012)
        curve_tube("CrossBodyStrap", [(-0.2, -0.17, 1.23), (0.02, -0.19, 1.0), (0.25, -0.12, 0.78)], 0.018, mats["outer"], visual)
        for side in (-1, 1):
            rounded_box(f"CargoPocket_{side}", (0.14, 0.055, 0.17), (side * 0.14, -0.095, 0.52), mats["accent"], visual, radius=0.025)
    elif costume in ("facilitator", "mediator"):
        # Keep the skirt on its own waist pivot so the runtime can add a small
        # amount of delayed cloth follow-through without deforming the torso.
        # Coordinates below are local to the 0.94 m waist pivot.
        skirt_pivot = empty("SkirtPivot", visual, (0, 0, 0.94))
        pleated_skirt("Skirt", 0.21, 0.29, 0.5, (0, 0, -0.22), mats["lower"], skirt_pivot, pleats=10, segments=40)
        curve_tube("SkirtHem", [(-0.27, -0.08, -0.46), (0, -0.285, -0.48), (0.27, -0.08, -0.46)], 0.008, mats["accent"], skirt_pivot, resolution=2)
        for pleat_index, pleat_x in enumerate((-0.1, 0, 0.1)):
            cloth_fold_ribbon(
                f"SkirtPleat_{pleat_index + 1}",
                [(pleat_x * 0.72, -0.215, 0), (pleat_x * 0.9, -0.25, -0.21), (pleat_x, -0.275, -0.44)],
                (0.002, 0.012 if pleat_x else 0.016, 0.002),
                mats["lower"],
                skirt_pivot,
                depth=0.008,
            )
        for side in (-1, 1):
            tailored_panel(
                f"CoatPanel_{side}",
                0.19,
                0.155,
                0.18,
                0.46,
                0.052,
                (side * 0.095, -0.17, 1.01),
                mats["outer"],
                visual,
                radius=0.018,
                rotation=(0, side * 0.022, side * 0.028),
            )
            tailored_panel(
                f"Lapel_{side}",
                0.08,
                0.105,
                0.065,
                0.28,
                0.026,
                (side * 0.07, -0.212, 1.12),
                mats["outer"],
                visual,
                radius=0.012,
                rotation=(0, side * 0.08, side * 0.45),
            )
            curve_tube(
                f"CoatHem_{side}",
                [(side * 0.02, -0.214, 0.79), (side * 0.1, -0.222, 0.8), (side * 0.19, -0.18, 0.81)],
                0.006,
                mats["accent"],
                visual,
                resolution=2,
            )
            cloth_fold_ribbon(
                f"CoatDrape_{side}",
                [
                    (side * 0.155, -0.211, 1.18),
                    (side * 0.125, -0.225, 1.0),
                    (side * 0.16, -0.204, 0.82),
                ],
                (0.002, 0.012, 0.002),
                mats["outer"],
                visual,
                depth=0.008,
            )
        for index in range(3):
            ellipsoid(f"CoatButton_{index + 1}", (0, -0.236, 1.1 - index * 0.12), (0.014, 0.008, 0.014), mats["accent"], visual, segments=12, rings=8)
        if costume == "facilitator":
            rounded_box("StoryNotebook", (0.22, 0.05, 0.3), (0.085, -0.07, -0.24), mats["accent"], left_elbow, radius=0.035, rotation=(0.08, -0.18, -0.08))
            rounded_box("NotebookPaper", (0.19, 0.012, 0.27), (0.085, -0.101, -0.24), mats["paper"], left_elbow, radius=0.025, rotation=(0.08, -0.18, -0.08))
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

    torso, left_arm, right_arm, left_elbow, right_elbow, left_leg, right_leg, left_knee, right_knee = build_body(role, config, mats, root)
    head = empty("HeadPivot", root, (0, 0, 1.47))
    # The reference uses a composed 1:3.5 silhouette. The previous head was
    # closer to a toy-like 1:3 and overwhelmed hands, clothing and acting.
    head.scale = (0.9, 0.9, 0.9)
    build_face(head, mats, role)
    build_hair(head, mats, config["hair_style"])
    if config["hair_style"] == "cap":
        build_cap(head, mats)
    build_costume(role, config, mats, root, left_arm, right_arm, left_elbow, right_elbow)

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
        "sculptContract": "mirrorlife-civic-sculpt-v5",
        "animationContract": {
            "version": "mirrorlife-civic-clips-v2",
            "runtime": "authored-keyframe-blend",
            "clips": ["idle", "walk", "run", "listen", "gesture", "jump", "fall"],
        },
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
