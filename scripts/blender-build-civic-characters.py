import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector


ROLE_CONFIGS = {
    "player": {
        "skin": "#f2bf9d",
        "hair": "#3b3947",
        "hair_highlight": "#504c5a",
        "eye": "#3f342d",
        "top": "#e6dbc9",
        "outer": "#71825a",
        # Lift the trousers out of near-black so folds, cargo pockets and knee
        # articulation remain readable in the warm civic grade.
        "lower": "#667376",
        "accent": "#996c48",
        # A deep mineral teal and warm sole separate the player's feet from
        # near-black trousers in the follow camera, echoing the reference's
        # grounded hiking-sneaker silhouette.
        "shoe": "#315653",
        "sole": "#d6c5aa",
        "hair_style": "spiky",
        "costume": "traveler",
    },
    "listener": {
        "skin": "#efb994",
        "hair": "#303744",
        "hair_highlight": "#536070",
        "eye": "#3a312b",
        "top": "#258b82",
        "outer": "#eee4d3",
        "lower": "#aa9270",
        "accent": "#d1a04c",
        "shoe": "#2d4948",
        "sole": "#e5ddcf",
        "hair_style": "cap",
        "costume": "listener",
    },
    "facilitator": {
        "skin": "#f4c4a2",
        "hair": "#d45f52",
        "hair_highlight": "#ec796b",
        "eye": "#3d6d5d",
        "top": "#f2eadc",
        "outer": "#eee5d8",
        "lower": "#356e58",
        "accent": "#d98769",
        "shoe": "#5c4031",
        "sole": "#332722",
        "hair_style": "coral_ponytail",
        "costume": "facilitator",
    },
    "mediator": {
        "skin": "#f2c09d",
        "hair": "#6b4a3c",
        "hair_highlight": "#876457",
        "eye": "#4f6149",
        "top": "#f1e8da",
        "outer": "#f4ebdd",
        "lower": "#47745d",
        "accent": "#c69455",
        "shoe": "#503b31",
        "sole": "#302520",
        "hair_style": "braided_bob",
        "costume": "mediator",
    },
}


# The source cast does not reuse one doll face. Each role carries a slightly
# different eye aperture, brow rhythm, cheek volume and resting mouth. Keep
# those differences compact and metre-authored so they survive the same shared
# rig, collider and animation contract.
FACE_PROFILES = {
    "player": {
        "eye_width": 0.050,
        "eye_height": 0.029,
        "iris_width": 0.0255,
        "iris_height": 0.0255,
        "outer_eye_lift": 0.001,
        "brow_outer": -0.004,
        "brow_apex": 0.008,
        "brow_inner": -0.002,
        "mouth_width": 0.032,
        "mouth_corner": 0.002,
        "mouth_center": -0.003,
        "cheek_forward": 1.0,
        "muzzle_forward": 1.0,
    },
    "listener": {
        "eye_width": 0.049,
        "eye_height": 0.0285,
        "iris_width": 0.025,
        "iris_height": 0.025,
        "outer_eye_lift": -0.001,
        "brow_outer": -0.006,
        "brow_apex": 0.006,
        "brow_inner": -0.001,
        "mouth_width": 0.033,
        "mouth_corner": 0.004,
        "mouth_center": -0.002,
        "cheek_forward": 0.94,
        "muzzle_forward": 0.96,
    },
    "facilitator": {
        "eye_width": 0.050,
        "eye_height": 0.030,
        "iris_width": 0.0255,
        "iris_height": 0.0265,
        "outer_eye_lift": 0.003,
        "brow_outer": 0.001,
        "brow_apex": 0.011,
        "brow_inner": -0.003,
        "mouth_width": 0.035,
        "mouth_corner": 0.005,
        "mouth_center": -0.002,
        "cheek_forward": 1.08,
        "muzzle_forward": 1.03,
    },
    "mediator": {
        "eye_width": 0.0485,
        "eye_height": 0.0285,
        "iris_width": 0.0245,
        "iris_height": 0.025,
        "outer_eye_lift": 0.001,
        "brow_outer": -0.003,
        "brow_apex": 0.009,
        "brow_inner": 0.001,
        "mouth_width": 0.032,
        "mouth_corner": 0.002,
        "mouth_center": -0.002,
        "cheek_forward": 0.98,
        "muzzle_forward": 0.98,
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


def create_skin_armature(parent):
    """Create a compact deformation rig behind the public controller pivots.

    MirrorLife's original shared-pivot contract remains the animation API for
    props and authored staging.  These bones mirror the same shoulder/elbow
    and hip/knee locations so the visible sleeve and trouser volumes can bend
    continuously instead of separating into rigid toy pieces.
    """
    armature_data = bpy.data.armatures.new("CivicSkinRigData")
    armature = bpy.data.objects.new("CivicSkinRig", armature_data)
    bpy.context.collection.objects.link(armature)
    armature.parent = parent
    armature.location = (0, 0, 0)
    armature["rig_contract"] = "mirrorlife-civic-skin-v1"
    armature.show_in_front = False

    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    root_bone = armature_data.edit_bones.new("SkinRoot")
    root_bone.head = (0, 0, 0.02)
    root_bone.tail = (0, 0, 0.16)

    specifications = (
        ("SkinLeftArm", (-0.234, 0, 1.2), (-0.234, 0, 0.965), None),
        ("SkinLeftElbow", (-0.234, 0, 0.965), (-0.234, 0, 0.69), "SkinLeftArm"),
        ("SkinRightArm", (0.234, 0, 1.2), (0.234, 0, 0.965), None),
        ("SkinRightElbow", (0.234, 0, 0.965), (0.234, 0, 0.69), "SkinRightArm"),
        ("SkinLeftLeg", (-0.145, 0, 0.73), (-0.145, 0, 0.445), None),
        ("SkinLeftKnee", (-0.145, 0, 0.445), (-0.145, 0, 0.14), "SkinLeftLeg"),
        ("SkinRightLeg", (0.145, 0, 0.73), (0.145, 0, 0.445), None),
        ("SkinRightKnee", (0.145, 0, 0.445), (0.145, 0, 0.14), "SkinRightLeg"),
    )
    created = {"SkinRoot": root_bone}
    for name, head, tail, parent_name in specifications:
        bone = armature_data.edit_bones.new(name)
        bone.head = head
        bone.tail = tail
        bone.parent = created[parent_name] if parent_name else root_bone
        bone.use_connect = bool(parent_name)
        created[name] = bone

    bpy.ops.object.mode_set(mode="OBJECT")
    armature.select_set(False)
    return armature


def build_skinned_limb_pair(name, side_centres, rings, joint_z, material_value, armature, bone_names, sides=22):
    """Build two continuously weighted limbs in one Web-friendly skin mesh."""
    vertices = []
    faces = []
    weights = []
    blend_half = 0.075
    for limb_index, centre_x in enumerate(side_centres):
        upper_name, lower_name = bone_names[limb_index]
        vertex_start = len(vertices)
        for ring_index, ring in enumerate(rings):
            z, radius_x, radius_y = ring[:3]
            centre_y = ring[3] if len(ring) > 3 else 0
            # Cosine smoothstep across a 15 cm elbow/knee band gives the
            # illustrated soft bend missing from the former hard seam.
            lower_weight = max(0.0, min(1.0, (joint_z + blend_half - z) / (blend_half * 2)))
            lower_weight = lower_weight * lower_weight * (3.0 - 2.0 * lower_weight)
            for side_index in range(sides):
                angle = math.tau * side_index / sides
                vertices.append((
                    centre_x + math.cos(angle) * radius_x,
                    centre_y + math.sin(angle) * radius_y,
                    z,
                ))
                weights.append((upper_name, lower_name, 1.0 - lower_weight, lower_weight))
        for ring_index in range(len(rings) - 1):
            row = vertex_start + ring_index * sides
            next_row = row + sides
            for side_index in range(sides):
                following = (side_index + 1) % sides
                faces.append((row + side_index, row + following, next_row + following, next_row + side_index))
        bottom = vertex_start
        top = vertex_start + (len(rings) - 1) * sides
        faces.append(tuple(bottom + index for index in reversed(range(sides))))
        faces.append(tuple(top + index for index in range(sides)))

    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = armature
    obj.location = (0, 0, 0)
    link_material(obj, material_value)
    for bone_name in {name for pair in bone_names for name in pair}:
        obj.vertex_groups.new(name=bone_name)
    for vertex_index, (upper_name, lower_name, upper_weight, lower_weight) in enumerate(weights):
        if upper_weight > 0.0001:
            obj.vertex_groups[upper_name].add([vertex_index], upper_weight, "REPLACE")
        if lower_weight > 0.0001:
            obj.vertex_groups[lower_name].add([vertex_index], lower_weight, "REPLACE")
    modifier = obj.modifiers.new("Civic continuous skin", "ARMATURE")
    modifier.object = armature
    modifier.use_deform_preserve_volume = True
    obj["semantic_part"] = name
    obj["skin_contract"] = "mirrorlife-civic-skin-v1"
    for polygon in mesh.polygons:
        polygon.use_smooth = True
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
    from top to bottom. Optional ``offset_x`` and ``offset_y`` values let the
    centre line bow like a real forearm or calf instead of remaining a perfect
    lathed cylinder. The mesh stays inexpensive and keeps the pivot contract.
    """
    if len(profile) < 3:
        raise ValueError("organic_limb requires at least three profile rings")
    vertices = []
    faces = []
    normalized_profile = []
    for ring in profile:
        if len(ring) == 3:
            height_ratio, radius_x, radius_y = ring
            offset_x = 0
            offset_y = 0
        elif len(ring) == 5:
            height_ratio, radius_x, radius_y, offset_x, offset_y = ring
        else:
            raise ValueError("organic_limb profile rings require 3 or 5 values")
        normalized_profile.append((height_ratio, radius_x, radius_y, offset_x, offset_y))
        z = depth * height_ratio
        for side in range(sides):
            angle = math.tau * side / sides
            vertices.append((
                offset_x + math.cos(angle) * radius_x,
                offset_y + math.sin(angle) * radius_y,
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
    vertices.extend((
        (normalized_profile[0][3], normalized_profile[0][4], depth * normalized_profile[0][0]),
        (normalized_profile[-1][3], normalized_profile[-1][4], depth * normalized_profile[-1][0]),
    ))
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


def curve_tube(name, points, radius, mat, parent=None, cyclic=False, resolution=3, bevel_resolution=3):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = resolution
    curve.bevel_depth = radius
    curve.bevel_resolution = bevel_resolution
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


def morphable_mouth_curve(name, points, radius, mat, parent=None):
    """Create one lit mouth line whose corners deform with the face rig.

    Scaling a static tube made the cheek smile move underneath an unmoving
    mouth, which was the strongest mask-like cue in the story-camera crop.
    Converting the tiny curve to one mesh preserves the existing single draw
    call while giving the corners real WarmSmile/Concern deformation.
    """
    obj = curve_tube(name, points, radius, mat, parent, resolution=3, bevel_resolution=3)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.object
    obj.name = name
    obj.select_set(False)
    obj.shape_key_add(name="Basis")
    smile = obj.shape_key_add(name="WarmSmile")
    speech = obj.shape_key_add(name="SpeechJaw")
    concern = obj.shape_key_add(name="Concern")
    attentive = obj.shape_key_add(name="Attentive")
    extent = max((abs(vertex.co.x) for vertex in obj.data.vertices), default=0.03)
    for index, vertex in enumerate(obj.data.vertices):
        x = vertex.co.x
        edge = max(0.0, min(1.0, (abs(x) / max(extent, 1e-5) - 0.34) / 0.66))
        centre = max(0.0, 1.0 - abs(x) / max(extent * 0.72, 1e-5))
        smile.data[index].co.z += edge * 0.011 - centre * 0.0015
        smile.data[index].co.x *= 1.0 + edge * 0.035
        speech.data[index].co.z -= centre * 0.004
        speech.data[index].co.y -= centre * 0.0015
        concern.data[index].co.z -= edge * 0.008
        concern.data[index].co.x *= 1.0 - edge * 0.018
        attentive.data[index].co.z += edge * 0.0025
    obj["face_morph_contract"] = "mirrorlife-civic-mouth-morph-v1"
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


def sculpted_hand(name, location, mat, crease_mat, parent=None, rotation=(0, 0, 0), side=1, pose_style="relaxed"):
    """Build an overlapping palm-and-finger hand for conversational acting.

    The v9 mitten removed gaps but also erased the finger silhouette visible
    in the reference cast. A shorter continuous palm now overlaps four tapered
    finger volumes by roughly 2.5 cm. Runtime batching still collapses the
    pieces into one elbow draw, while the outer contour reads as a real hand
    from front, side and notebook-holding poses.
    """
    hand_pivot = empty(name, parent, location, rotation)
    hand_pivot["hand_contract"] = "mirrorlife-civic-hand-v1"
    hand_pivot["pose_style"] = pose_style
    hand = organic_limb(
        f"{name}Palm",
        0.118,
        (
            (0.5, 0.041, 0.031, 0, 0),
            (0.28, 0.056, 0.038, -side * 0.002, 0),
            (0.02, 0.066, 0.042, -side * 0.004, -0.003),
            (-0.26, 0.063, 0.04, -side * 0.004, -0.006),
            (-0.5, 0.055, 0.034, 0, -0.005),
        ),
        (0, 0, 0),
        mat,
        hand_pivot,
        # The hand occupies fewer than 30 px at the default story camera.
        # Sixteen radial sides keep the palm silhouette round while avoiding
        # spending full face-sculpt density on a tiny extremity.
        sides=16,
    )
    pose_profiles = {
        "relaxed": {"curl": 0.38, "splay": 1.0, "thumb": 0.34},
        "open": {"curl": 0.12, "splay": 1.28, "thumb": 0.18},
        "soft-cup": {"curl": 0.56, "splay": 0.72, "thumb": 0.5},
        "notebook-grip": {"curl": 0.86, "splay": 0.42, "thumb": 0.72},
        "thoughtful": {"curl": 0.64, "splay": 0.58, "thumb": 0.6},
    }
    profile = pose_profiles.get(pose_style, pose_profiles["relaxed"])
    finger_specs = (
        # x, length, radius, lateral splay and fingertip curl.  A small
        # fan-and-curl silhouette reads as a relaxed hand instead of four
        # parallel dowels while keeping the same four-ring finger topology.
        (-0.041, 0.058, 0.0134, -side * 0.004, 0.009),
        (-0.014, 0.069, 0.0148, -side * 0.0015, 0.012),
        (0.014, 0.066, 0.0146, side * 0.0015, 0.013),
        (0.041, 0.054, 0.0128, side * 0.0045, 0.011),
    )
    for finger_index, (finger_x, finger_length, finger_radius, splay, curl) in enumerate(finger_specs, start=1):
        finger_pivot = empty(
            f"FingerPivot_{side}_{finger_index}",
            hand_pivot,
            (
                finger_x,
                -0.006,
                -0.025,
            ),
            (
                -profile["curl"] * (0.72 + finger_index * 0.055),
                side * splay * profile["splay"] * 2.6,
                -side * splay * profile["splay"] * 1.7,
            ),
        )
        organic_limb(
            f"FingerVolume_{side}_{finger_index}",
            finger_length,
            (
                (0.5, finger_radius, finger_radius * 0.82),
                (0.12, finger_radius * 1.04, finger_radius * 0.86, splay * 0.2, curl * 0.08),
                (-0.28, finger_radius * 0.9, finger_radius * 0.76, splay * 0.58, curl * 0.42),
                (-0.5, finger_radius * 0.46, finger_radius * 0.42, splay, curl),
            ),
            (0, 0, -finger_length / 2),
            mat,
            finger_pivot,
            # Eight sides keep the fuller fingertip silhouette smooth in the
            # tighter social camera while remaining negligible in the budget.
            sides=8,
        )
    # A tapered, two-joint thumb shares the palm volume and follows the same
    # relaxed curl.  Replacing the former isolated ellipsoid fixes the
    # ball-jointed silhouette in side and notebook-holding views.
    thumb_pivot = empty(
        f"ThumbPivot_{side}",
        hand_pivot,
        (-side * 0.04, -0.022, 0.004),
        (
            -0.18 - profile["thumb"] * 0.42,
            side * (0.58 + profile["thumb"] * 0.32),
            side * (0.34 + profile["thumb"] * 0.2),
        ),
    )
    organic_limb(
        f"ThumbVolume_{side}",
        0.075,
        (
            (0.5, 0.019, 0.016),
            (0.12, 0.021, 0.017, -side * 0.004, 0.003),
            (-0.26, 0.018, 0.014, -side * 0.011, 0.009),
            (-0.5, 0.009, 0.008, -side * 0.016, 0.014),
        ),
        (0, 0, -0.032),
        mat,
        thumb_pivot,
        sides=8,
    )
    for crease_index, crease_x in enumerate((-0.025, 0.0, 0.025), start=1):
        curve_tube(
            f"FingerCrease_{side}_{crease_index}",
            [
                (crease_x, -0.039, -0.026),
                (crease_x * 0.94, -0.041, -0.052),
            ],
            0.0026,
            crease_mat,
            hand_pivot,
            resolution=1,
            bevel_resolution=1,
        )
    return hand_pivot


def sculpted_shoe(name, location, upper_mat, sole_mat, parent=None, side=1, style="sneaker"):
    """Create a compact illustrated shoe last with a tapered toe and heel.

    The old sphere-on-box construction made every foot read as an oversized
    toy capsule. Seven authored cross-sections now form a single upper whose
    toe, instep and heel remain readable in all four orbit views.
    """
    stations = (
        # y, half-width, lower surface, upper surface. The terminal toe ring
        # closes down in both width and height, producing a true rounded last
        # instead of the four-sided wedge exposed by the first v6 pass.
        (0.09, 0.059, -0.027, 0.048 if style == "ankle-boot" else 0.04),
        (0.042, 0.077, -0.038, 0.078 if style == "ankle-boot" else 0.069),
        (-0.018, 0.092, -0.046, 0.105 if style == "ankle-boot" else 0.094),
        (-0.094, 0.099, -0.048, 0.087 if style == "ankle-boot" else 0.078),
        (-0.17, 0.093, -0.046, 0.061),
        (-0.232, 0.07, -0.038, 0.039),
        (-0.255, 0.023, -0.016, 0.018),
    )
    radial_segments = 16
    vertices = []
    for y, half_width, bottom, top in stations:
        centre_z = (bottom + top) * 0.5
        half_height = (top - bottom) * 0.5
        for segment in range(radial_segments):
            angle = math.tau * segment / radial_segments
            vertices.append((
                math.cos(angle) * half_width,
                y,
                centre_z + math.sin(angle) * half_height,
            ))
    faces = []
    for station in range(len(stations) - 1):
        current = station * radial_segments
        following = (station + 1) * radial_segments
        for segment in range(radial_segments):
            next_segment = (segment + 1) % radial_segments
            faces.append((
                current + segment,
                current + next_segment,
                following + next_segment,
                following + segment,
            ))
    vertices.extend(((0, stations[0][0], (stations[0][2] + stations[0][3]) * 0.5),
                     (0, stations[-1][0], (stations[-1][2] + stations[-1][3]) * 0.5)))
    heel_center = len(vertices) - 2
    toe_center = len(vertices) - 1
    toe_ring = (len(stations) - 1) * radial_segments
    for segment in range(radial_segments):
        next_segment = (segment + 1) % radial_segments
        faces.append((heel_center, next_segment, segment))
        faces.append((toe_center, toe_ring + segment, toe_ring + next_segment))
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    shoe = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(shoe)
    shoe.parent = parent
    shoe.location = location
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    bevel = shoe.modifiers.new("Sculpted shoe edge", "BEVEL")
    bevel.width = 0.006
    bevel.segments = 2
    link_material(shoe, upper_mat)

    sole_width = max(station[1] for station in stations) * 2 + 0.014
    sole_length = abs(stations[-1][0] - stations[0][0]) + 0.022
    sole_center_y = (stations[0][0] + stations[-1][0]) * 0.5
    rounded_box(
        f"{name}Sole",
        (sole_width, sole_length, 0.024),
        (location[0], location[1] + sole_center_y, location[2] - 0.049),
        sole_mat,
        parent,
        radius=0.012,
        segments=3,
    )
    if style == "ankle-boot":
        cylinder(
            f"{name}AnkleCollar",
            0.073,
            0.067,
            0.105,
            (location[0], location[1] + 0.048, location[2] + 0.078),
            upper_mat,
            parent,
            vertices=22,
        )
    else:
        rounded_box(
            f"{name}Tongue",
            (0.105, 0.034, 0.105),
            (location[0], location[1] - 0.018, location[2] + 0.072),
            upper_mat,
            parent,
            radius=0.02,
            rotation=(math.radians(11), 0, 0),
        )
    for lace_index, lace_y in enumerate((-0.04, -0.078), start=1):
        curve_tube(
            f"{name}Lace_{lace_index}",
            [
                (-0.044, lace_y, location[2] + 0.055 - (lace_index - 1) * 0.008),
                (0, lace_y - 0.006, location[2] + 0.058 - (lace_index - 1) * 0.008),
                (0.044, lace_y, location[2] + 0.055 - (lace_index - 1) * 0.008),
            ],
            0.0045,
            sole_mat,
            parent,
            resolution=2,
        )
    return shoe


def pleated_skirt(name, waist_radius, hem_radius, depth, location, mat, parent=None, pleats=10, segments=40):
    """Create a conical skirt whose folds belong to its silhouette."""
    middle_radius = (waist_radius + hem_radius) * 0.5
    # Five rings let the fabric settle over the hip before opening into the
    # hem. The earlier three-ring cone read as a rigid lampshade, especially
    # beside the softly draped garments in the visual target.
    rings = (
        (0.5, waist_radius, 0.05),
        (0.27, waist_radius * 1.045, 0.3),
        (0.02, middle_radius * 0.94, 0.62),
        (-0.25, middle_radius * 1.08, 0.84),
        (-0.5, hem_radius, 1.0),
    )
    vertices = []
    faces = []
    for z_factor, radius, fold_strength in rings:
        for segment in range(segments):
            angle = math.tau * segment / segments
            fold = math.cos(angle * pleats) * 0.014 * fold_strength
            front_bias = max(0.0, -math.sin(angle)) * 0.009 * fold_strength
            asymmetric_drape = math.sin(angle + 0.7) * 0.009 * fold_strength
            current_radius = radius + fold + front_bias + asymmetric_drape
            hem_drop = -max(0.0, math.sin(angle + 0.42)) * 0.018 * fold_strength
            vertices.append((math.cos(angle) * current_radius, math.sin(angle) * current_radius, depth * z_factor + hem_drop))
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


def facial_lid_surface(
    name,
    width,
    inner_base,
    inner_arch,
    outer_base,
    outer_arch,
    mat,
    parent=None,
    segments=12,
):
    """Build a thin skin surface that integrates the eye into the face.

    Curve-only lids left an exposed white ellipsoid floating on top of the
    head.  Two shallow rows create a real upper/lower lid plane with a soft
    crease and enough depth to occlude the sclera from oblique orbit views.
    """
    vertices = []
    for index in range(segments + 1):
        factor = index / segments
        normalized_x = factor * 2 - 1
        arch = max(0.0, 1.0 - normalized_x * normalized_x)
        x = normalized_x * width
        vertices.extend((
            (x, -0.016, inner_base + inner_arch * arch),
            (x, -0.007, outer_base + outer_arch * arch),
        ))
    faces = []
    outer_is_above = outer_base + outer_arch >= inner_base + inner_arch
    for index in range(segments):
        current = index * 2
        following = current + 2
        faces.append(
            (current, following, following + 1, current + 1)
            if outer_is_above
            else (current + 1, following + 1, following, current)
        )
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    link_material(obj, mat)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    bevel = obj.modifiers.new("Eyelid softness", "BEVEL")
    bevel.width = 0.0018
    bevel.segments = 2
    return obj


def build_materials(role, config):
    return {
        "skin": material(f"{role} skin", config["skin"], 0.64, clearcoat=0.05),
        "skin_shadow": material(f"{role} hand crease", "#b96f66", 0.84),
        # Matte hair keeps the warm key light broad and painterly.  The older
        # clear-coated finish exposed every low-poly facet in the game camera.
        "hair": material(f"{role} hair", config["hair"], 0.68, clearcoat=0.025),
        "hair_highlight": material(f"{role} hair highlight", config["hair_highlight"], 0.64, clearcoat=0.035),
        # The reference uses a warm, softly reflective sclera and a large dark
        # iris.  Pure white with a tiny pupil read as a startled plastic doll
        # under the strong portal key.
        "eye_white": material(f"{role} eye white", "#f4eee5", 0.42, clearcoat=0.22),
        "iris": material(f"{role} iris", config["eye"], 0.31, clearcoat=0.38),
        # Warm charcoal keeps the illustrated eye and lash language while
        # avoiding the pure-black sticker effect visible in the v77 paired
        # crop. The reference uses brown-violet linework that participates in
        # the room light rather than swallowing it.
        "ink": material(f"{role} ink", "#342b30", 0.64),
        "blush": material(f"{role} blush", "#e5a096", 0.9),
        "lip": material(f"{role} lip", "#b96f68", 0.82, clearcoat=0.025),
        "top": material(f"{role} top fabric", config["top"], 0.91),
        "outer": material(f"{role} outer fabric", config["outer"], 0.9),
        "lower": material(f"{role} lower fabric", config["lower"], 0.88),
        "accent": material(f"{role} accent", config["accent"], 0.72),
        "shoe": material(f"{role} shoes", config["shoe"], 0.68),
        "sole": material(f"{role} soles", config["sole"], 0.8),
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
    face_profile = FACE_PROFILES[role]
    # Keep the face readable from the game camera without returning to the
    # oversized toy-doll head of the early assets. The narrower depth and
    # slightly slimmer jaw leave more silhouette room for hair, costume and
    # hand acting, matching the reference's editorial 1:3.5 proportion.
    face = ellipsoid("Head", (0, 0, 0), (0.244, 0.198, 0.284), mats["skin"], head, segments=48, rings=32)
    # Narrow the lower third into an illustrated jaw rather than leaving the
    # UV sphere's toy-like circular chin. The change is deliberately subtle so
    # all existing facial pivots and expression shape keys stay aligned.
    for vertex in face.data.vertices:
        x, y, z = vertex.co
        lower = max(0.0, min(1.0, (-z - 0.012) / 0.22))
        front = max(0.0, min(1.0, (-y - 0.015) / 0.17))
        vertex.co.x *= 1.0 - lower * 0.275
        if front > 0 and z < -0.02:
            vertex.co.y += lower * front * 0.006
        # Model a shallow cheek plane instead of relying on circular blush
        # stickers to imply the whole mid-face. The forward volume catches the
        # portal key and face fill differently as the camera orbits.
        cheek_height = max(0.0, min(1.0, 1.0 - abs(z + 0.035) / 0.095))
        cheek_width = max(0.0, min(1.0, 1.0 - abs(abs(x) - 0.118) / 0.075))
        if front > 0:
            vertex.co.y -= cheek_height * cheek_width * front * 0.017 * face_profile["cheek_forward"]
        # Recess the eye socket and let the upper cheek transition forward
        # underneath it. This creates a continuous brow/eye/cheek plane under
        # moving light instead of a sphere with eye pieces pasted on top.
        socket_height = max(0.0, min(1.0, 1.0 - abs(z - 0.04) / 0.075))
        socket_width = max(0.0, min(1.0, 1.0 - abs(abs(x) - 0.083) / 0.07))
        vertex.co.y += socket_height * socket_width * front * 0.01
        upper_cheek = max(0.0, min(1.0, 1.0 - abs(z + 0.018) / 0.06)) * cheek_width
        vertex.co.y -= upper_cheek * front * 0.009
        # A restrained muzzle plane connects nose, philtrum and lips. Without
        # it, even improved eyes sat on a featureless spherical mask and the
        # mouth appeared detached under three-quarter light.
        muzzle_height = max(0.0, min(1.0, 1.0 - abs(z + 0.075) / 0.065))
        muzzle_width = max(0.0, min(1.0, 1.0 - abs(x) / 0.105))
        vertex.co.y -= muzzle_height * muzzle_width * front * 0.007 * face_profile["muzzle_forward"]
        # Slightly compress the temple/forehead corners so the face reads as
        # an authored illustrated head rather than a uniformly round sphere.
        temple = max(0.0, min(1.0, (z - 0.08) / 0.16)) * max(0.0, min(1.0, (abs(x) - 0.12) / 0.1))
        vertex.co.x *= 1.0 - temple * 0.045
        chin = max(0.0, min(1.0, (-z - 0.12) / 0.13))
        vertex.co.z -= chin * front * 0.009
    # Keep the facial volume itself expressive. The previous rig swapped
    # mouth meshes but left the cheeks and jaw completely rigid, which read as
    # a toy mask in close conversational framing. These sparse, authored shape
    # keys preserve the illustrated silhouette while giving speech and warmth
    # a continuous deformation that can be driven in Three.js.
    face.shape_key_add(name="Basis")
    smile = face.shape_key_add(name="WarmSmile")
    speech = face.shape_key_add(name="SpeechJaw")
    concern = face.shape_key_add(name="Concern")
    attentive = face.shape_key_add(name="Attentive")
    for index, vertex in enumerate(face.data.vertices):
        x, y, z = vertex.co
        front = max(0.0, min(1.0, (-y - 0.035) / 0.155))
        lower = max(0.0, min(1.0, (-z + 0.015) / 0.17))
        cheek = max(0.0, min(1.0, (abs(x) - 0.045) / 0.12)) * front

        smile_co = smile.data[index].co
        smile_co.x *= 1.0 + cheek * lower * 0.032
        smile_co.y -= cheek * 0.008
        smile_co.z += cheek * lower * 0.021
        if z < -0.045:
            smile_co.z += front * lower * 0.016

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

        # Listening should alter the facial volume, not only rotate two brow
        # curves. Lift the upper cheek/lower-lid band and bring it slightly
        # forward; the runtime blends this by role while the eyes compress.
        attentive_co = attentive.data[index].co
        eye_height = max(0.0, min(1.0, 1.0 - abs(z - 0.012) / 0.085))
        eye_width = max(0.0, min(1.0, 1.0 - abs(abs(x) - 0.09) / 0.085))
        attentive_band = eye_height * eye_width * front
        attentive_co.y -= attentive_band * 0.008
        attentive_co.z += attentive_band * 0.009
        if z < -0.08:
            attentive_co.z += front * lower * 0.003
    for side in (-1, 1):
        ellipsoid(f"Ear_{side}", (side * 0.236, 0.004, -0.014), (0.038, 0.023, 0.054), mats["skin"], head, segments=20, rings=12)
        ellipsoid(f"EarInner_{side}", (side * 0.248, -0.019, -0.014), (0.012, 0.005, 0.024), mats["blush"], head, segments=12, rings=8)
        # Keep the eyes readable without letting two protruding white spheres
        # dominate the face.  A flatter corneal stack and a slightly narrower
        # sclera read much closer to the painted reference at gameplay scale.
        eye = empty(f"EyePivot_{side}", head, (side * 0.083, -0.188, 0.039))
        # At the authored story camera the v10 eyes collapsed into two dark
        # pixels. Enlarge the complete corneal stack, but let the iris occupy
        # most of the sclera so the result reads as illustrated attention
        # rather than the white toy-doll discs of the early character pass.
        # An almond aspect ratio avoids the circular doll-eye silhouette that
        # appeared when the sculpted eyes first replaced the painted atlas.
        # Width remains readable at the authored story camera while the lower
        # lid, iris and glint now sit inside a compressed, reference-like eye.
        # The previous iris filled almost the entire sclera and collapsed to a
        # black bead in the story camera. Preserve a generous almond-shaped
        # white, then layer a smaller coloured iris, pupil and two catchlights
        # so gaze remains readable from both front and three-quarter views.
        eye_width = face_profile["eye_width"]
        eye_height = face_profile["eye_height"]
        outer_lift = face_profile["outer_eye_lift"]
        eye.rotation_euler.y = side * outer_lift * 2.8
        eye.rotation_euler.z = -side * outer_lift * 3.2
        ellipsoid(f"EyeWhite_{side}", (0, -0.001, 0), (eye_width, 0.0055, eye_height), mats["eye_white"], eye, segments=32, rings=18)
        ellipsoid(
            f"Iris_{side}",
            (-side * 0.001, -0.0082, -0.002),
            (face_profile["iris_width"], 0.0036, face_profile["iris_height"]),
            mats["iris"],
            eye,
            segments=26,
            rings=14,
        )
        ellipsoid(f"Pupil_{side}", (-side * 0.001, -0.0125, -0.003), (0.0098, 0.0018, 0.0135), mats["ink"], eye, segments=18, rings=10)
        ellipsoid(f"EyeGlint_{side}", (-side * 0.008, -0.0155, 0.008), (0.0046, 0.0012, 0.0048), mats["eye_white"], eye, segments=12, rings=7)
        ellipsoid(f"EyeGlintSmall_{side}", (side * 0.004, -0.0158, -0.006), (0.0018, 0.0009, 0.002), mats["eye_white"], eye, segments=10, rings=6)
        facial_lid_surface(
            f"UpperLidSkin_{side}",
            eye_width + 0.002,
            0.015,
            0.012,
            0.029,
            0.014,
            mats["skin"],
            eye,
        )
        facial_lid_surface(
            f"LowerLidSkin_{side}",
            eye_width - 0.002,
            -0.014,
            -0.006,
            -0.026,
            -0.004,
            mats["skin"],
            eye,
        )
        curve_tube(
            f"EyeOutline_{side}",
            [
                (side * eye_width * 0.68, -0.017, -0.002),
                (side * eye_width * 0.86, -0.0175, 0.003),
                (side * eye_width, -0.017, 0.011 + side * outer_lift),
            ],
            0.00095,
            mats["skin_shadow"],
            eye,
            resolution=2,
        )
        # Upper lids/lashes preserve the drawn identity at normal gameplay
        # distance. They remain children of EyePivot, so blinking still works.
        curve_tube(
            f"UpperLid_{side}",
            [
                (-eye_width + 0.001, -0.018, 0.011 - side * outer_lift),
                (0, -0.019, eye_height - 0.001),
                (eye_width - 0.001, -0.018, 0.011 + side * outer_lift),
            ],
            0.0031 if feminine else 0.0028,
            mats["ink"],
            eye,
            resolution=2,
        )
        curve_tube(
            f"LowerLid_{side}",
            [(-eye_width * 0.66, -0.017, -0.01), (0, -0.018, -eye_height * 0.68), (eye_width * 0.66, -0.017, -0.01)],
            0.00105,
            mats["skin_shadow"],
            eye,
            resolution=2,
        )
        if feminine:
            curve_tube(
                f"OuterLash_{side}",
                [(side * 0.041, -0.012, 0.027), (side * 0.057, -0.014, 0.039)],
                0.0026,
                mats["ink"],
                eye,
                resolution=2,
            )
        curve_tube(
            f"EyelidCrease_{side}",
            [
                (-eye_width * 0.7, -0.009, eye_height * 0.82),
                (0, -0.011, eye_height * 1.25),
                (eye_width * 0.7, -0.009, eye_height * 0.82),
            ],
            0.00065,
            mats["skin_shadow"],
            eye,
            resolution=2,
            bevel_resolution=2,
        )
        brow = empty(f"BrowPivot_{side}", head, (side * 0.084, -0.204, 0.102))
        curve_tube(
            f"Brow_{side}",
            [
                (side * 0.058, 0.003, face_profile["brow_outer"]),
                (0, -0.007, face_profile["brow_apex"]),
                (-side * 0.052, 0.003, face_profile["brow_inner"]),
            ],
            0.0045 if feminine else 0.0047,
            mats["hair"],
            brow,
        )
        ellipsoid(f"Blush_{side}", (side * 0.152, -0.194, -0.047), (0.020, 0.0032, 0.0065), mats["blush"], head, segments=16, rings=8)
    ellipsoid("NoseBridge", (0, -0.19, 0.004), (0.009, 0.007, 0.025), mats["skin"], head, segments=18, rings=10)
    ellipsoid("NoseTip", (0, -0.199, -0.02), (0.013, 0.009, 0.014), mats["skin"], head, segments=18, rings=10)
    curve_tube(
        "NoseContour",
        [(0.008, -0.207, 0.006), (0.012, -0.211, -0.018), (0.003, -0.212, -0.034)],
        0.0017,
        mats["skin_shadow"],
        head,
        resolution=2,
    )
    mouth = empty("MouthPivot", head, (0, -0.207, -0.09))
    closed = empty("MouthClosedPivot", mouth)
    mouth_width = face_profile["mouth_width"]
    mouth_corner = face_profile["mouth_corner"]
    mouth_center = face_profile["mouth_center"]
    morphable_mouth_curve(
        "MouthClosed",
        [
            (-mouth_width, 0.001, mouth_corner),
            (-mouth_width * 0.48, -0.003, mouth_center * 0.6),
            (0, -0.004, mouth_center),
            (mouth_width * 0.48, -0.003, mouth_center * 0.6),
            (mouth_width, 0.001, mouth_corner),
        ],
        0.0027,
        mats["skin_shadow"],
        closed,
    )
    open_mouth = empty("MouthOpenPivot", mouth)
    ellipsoid("MouthOpen", (0, -0.004, -0.002), (0.024, 0.0055, 0.018), mats["ink"], open_mouth, segments=20, rings=12)
    ellipsoid("Tongue", (0, -0.01, -0.009), (0.013, 0.003, 0.005), mats["lip"], open_mouth, segments=14, rings=8)


def build_hair(head, mats, style):
    # Keep the cap inside the face silhouette.  A wide full sphere reads like a
    # plastic helmet from the follow camera, especially on the player whose
    # back faces the camera for most conversations.
    cap_scale = (0.258, 0.178, 0.226) if style == "spiky" else (0.272, 0.196, 0.238)
    cap = ellipsoid("HairCap", (0, 0.03, 0.08), cap_scale, mats["hair"], head, segments=40, rings=26)
    # Break the mathematically perfect helmet silhouette without adding a
    # second shell or more triangles. Five broad crown lobes reshape the same
    # cap topology, giving fringe and rear locks a volume to grow from instead
    # of looking glued to a smooth sphere.
    style_phase = {"spiky": 0.34, "coral_ponytail": 1.08, "braided_bob": 1.72}.get(style, 0.74)
    for vertex in cap.data.vertices:
        x, y, z = vertex.co
        radial = math.hypot(x, y)
        if radial < 1e-5:
            continue
        angle = math.atan2(y, x)
        crown = max(0.0, min(1.0, (z + 0.045) / 0.245))
        lobe = math.sin(angle * 5 + style_phase) * (0.005 + crown * 0.011)
        vertex.co.x += x / radial * lobe
        vertex.co.y += y / radial * lobe * 0.72
        vertex.co.z += max(0.0, math.cos(angle * 3 - style_phase)) * crown * 0.009
    # Six overlapping, wider locks replace the comb-like row of eight narrow
    # points. The silhouette reads as deliberately grouped hair at the story
    # camera while retaining complete side/back volume.
    fringe_specs = (
        (-0.19, -0.145, 0.205, 0.036),
        (-0.12, -0.058, 0.18, 0.04),
        (-0.045, 0.012, 0.16, 0.042),
        (0.035, 0.092, 0.168, 0.041),
        (0.115, 0.17, 0.19, 0.038),
        (0.19, 0.15, 0.21, 0.034),
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
        # Layered flyaway locks break the single rubber-hose ponytail into the
        # soft, authored red-hair silhouette visible in the reference.
        for index, (offset_x, offset_y, tip_x) in enumerate(((-0.045, -0.018, 0.0), (0.045, 0.012, 0.105))):
            tapered_lock(
                f"PonytailLayer_{index + 1}",
                [
                    (0.01 + offset_x, offset_y, -0.08),
                    (0.055 + offset_x, 0.015 + offset_y, -0.25),
                    (0.095 + offset_x, 0.0 + offset_y, -0.43),
                    (tip_x, -0.025 + offset_y, -0.61),
                ],
                (0.052, 0.055, 0.041, 0.007),
                mats["hair_highlight"] if index == 0 else mats["hair"],
                ponytail,
                sides=12,
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
    # The story-camera comparison showed a narrow mannequin torso even though
    # the overall height was correct. Broaden the shoulder/chest volume by a
    # few centimetres and add front/back depth while remaining inside the
    # authoritative 0.32 m capsule at the limbs.
    torso = ellipsoid("Torso", (0, 0, 1.0), (0.29, 0.177, 0.336), mats["top"], visual, segments=36, rings=24)
    # Sculpt the base torso into a soft shoulder-to-waist taper.  Keeping the
    # authored volume in one mesh avoids the ball-jointed toy silhouette while
    # preserving the inexpensive shared-pivot animation contract.
    for vertex in torso.data.vertices:
        x, y, z = vertex.co
        normalized = max(-1.0, min(1.0, z / 0.332))
        shoulder = max(0.0, min(1.0, (normalized - 0.2) / 0.8))
        waist = max(0.0, 1.0 - abs(normalized + 0.48) / 0.52)
        vertex.co.x *= 1.0 + shoulder * 0.14 - waist * 0.16
        vertex.co.y *= 1.0 - waist * 0.1
        # Put the garment volume in the mesh rather than drawing crease cords
        # on top. A shallow central drape and two diagonal tension valleys
        # catch the key light differently as the actor turns, while the back
        # and side silhouette remain unchanged.
        front = max(0.0, min(1.0, (-y - 0.008) / 0.13))
        centre_drape = max(0.0, 1.0 - abs(x) / 0.15) * max(0.0, 1.0 - abs(normalized + 0.02) / 0.86)
        diagonal_tension = max(0.0, 1.0 - abs(abs(x) - (0.09 + normalized * 0.035)) / 0.045)
        vertex.co.y -= front * centre_drape * 0.006
        vertex.co.y += front * diagonal_tension * 0.0035
    # Three tapered fabric planes turn the broad torso highlight into cloth
    # tension radiating from collar and shoulder toward the waist. They share
    # the base fabric material and fade to a two-millimetre tip, so they read as
    # garment construction rather than decorative piping in the story camera.
    for fold_index, (root_x, waist_x, depth) in enumerate((
        (-0.145, -0.085, 0.009),
        (0.0, 0.018, 0.007),
        (0.145, 0.09, 0.009),
    )):
        cloth_fold_ribbon(
            f"TorsoTensionFold_{fold_index + 1}",
            [
                (root_x, -0.153, 1.245),
                ((root_x + waist_x) * 0.52, -0.166 - depth, 1.06),
                (waist_x, -0.151, 0.82),
            ],
            (0.002, 0.011 if fold_index != 1 else 0.009, 0.002),
            mats["top"],
            visual,
            depth=depth,
        )
    cylinder("Neck", 0.083, 0.079, 0.12, (0, 0, 1.335), mats["skin"], visual, vertices=20)
    rounded_box("WaistBand", (0.42, 0.245, 0.055), (0, -0.005, 0.775), mats["accent"], visual, radius=0.025)

    left_arm = empty("LeftArmPivot", visual, (-0.234, 0, 1.2))
    right_arm = empty("RightArmPivot", visual, (0.234, 0, 1.2))
    left_elbow = empty("LeftElbowPivot", left_arm, (0, 0, -0.235))
    right_elbow = empty("RightElbowPivot", right_arm, (0, 0, -0.235))
    left_leg = empty("LeftLegPivot", visual, (-0.145, 0, 0.73))
    right_leg = empty("RightLegPivot", visual, (0.145, 0, 0.73))
    left_knee = empty("LeftKneePivot", left_leg, (0, 0, -0.285))
    right_knee = empty("RightKneePivot", right_leg, (0, 0, -0.285))

    sleeve_mat = mats["outer"] if config["costume"] in ("traveler", "facilitator", "mediator") else mats["top"]
    skin_armature = create_skin_armature(visual)
    build_skinned_limb_pair(
        "SkinnedArmVolume",
        (-0.234, 0.234),
        (
            (1.2, 0.09, 0.082, 0.002),
            (1.15, 0.099, 0.09, 0.003),
            (1.07, 0.094, 0.086, 0.004),
            (1.0, 0.084, 0.076, 0.003),
            (0.965, 0.075, 0.07, 0),
            (0.925, 0.077, 0.071, -0.002),
            (0.85, 0.074, 0.068, -0.004),
            (0.775, 0.068, 0.061, -0.004),
            (0.705, 0.058, 0.052, -0.002),
        ),
        0.965,
        sleeve_mat,
        skin_armature,
        (("SkinLeftArm", "SkinLeftElbow"), ("SkinRightArm", "SkinRightElbow")),
        sides=24,
    )
    build_skinned_limb_pair(
        "SkinnedLegVolume",
        (-0.145, 0.145),
        (
            (0.73, 0.132, 0.12, 0.002),
            (0.65, 0.135, 0.123, 0.004),
            (0.55, 0.121, 0.111, 0.006),
            (0.475, 0.101, 0.093, 0.003),
            (0.445, 0.092, 0.085, 0),
            (0.405, 0.096, 0.089, -0.002),
            (0.33, 0.105, 0.098, -0.005),
            (0.245, 0.098, 0.091, -0.005),
            (0.155, 0.076, 0.07, -0.002),
        ),
        0.445,
        mats["lower"],
        skin_armature,
        (("SkinLeftLeg", "SkinLeftKnee"), ("SkinRightLeg", "SkinRightKnee")),
        sides=24,
    )
    for side, pivot, elbow in ((-1, left_arm, left_elbow), (1, right_arm, right_elbow)):
        if config["costume"] in ("traveler", "facilitator", "mediator"):
            # Two shallow diagonal compression ridges follow the bending
            # elbow. They catch the warm key as cloth folds and disappear at
            # both ends, avoiding the hard plastic sleeve read of a plain
            # lathed tube.
            cloth_fold_ribbon(
                f"SleeveCompression_{side}_1",
                [
                    (-side * 0.036, -0.06, -0.052),
                    (-side * 0.008, -0.069, -0.116),
                    (-side * 0.028, -0.061, -0.184),
                ],
                (0.002, 0.009, 0.002),
                sleeve_mat,
                elbow,
                depth=0.007,
            )
            cloth_fold_ribbon(
                f"SleeveCompression_{side}_2",
                [
                    (side * 0.031, -0.058, -0.074),
                    (side * 0.006, -0.067, -0.136),
                    (side * 0.024, -0.059, -0.204),
                ],
                (0.002, 0.007, 0.002),
                sleeve_mat,
                elbow,
                depth=0.006,
            )
        cylinder(f"Cuff_{side}", 0.067, 0.061, 0.048, (0, 0, -0.248), mats["accent"], elbow, vertices=22)
        if config["costume"] == "facilitator":
            hand_pose = "notebook-grip"
            hand_rotation = (0.02, side * 0.2, -side * 0.2)
        elif config["costume"] == "mediator":
            hand_pose = "thoughtful" if side == 1 else "open"
            hand_rotation = (0.08 if side == 1 else -0.03, -side * 0.13, -side * 0.16)
        elif config["costume"] == "listener":
            hand_pose = "soft-cup"
            hand_rotation = (-0.04, side * 0.08, -side * 0.1)
        else:
            hand_pose = "relaxed"
            hand_rotation = (0.02, side * 0.04, -side * 0.055)
        sculpted_hand(
            f"Hand_{side}",
            (0, -0.007, -0.313),
            mats["skin"],
            mats["skin_shadow"],
            elbow,
            rotation=hand_rotation,
            side=side,
            pose_style=hand_pose,
        )

    for side, pivot, knee in ((-1, left_leg, left_knee), (1, right_leg, right_knee)):
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
        cylinder(f"TrouserCuff_{side}", 0.096, 0.087, 0.07, (0, 0, -0.265), mats["accent"], knee, vertices=20)
        sculpted_shoe(
            f"ShoeUpper_{side}",
            (0, 0, -0.365),
            mats["shoe"],
            mats["sole"],
            knee,
            side=side,
            style="ankle-boot" if config["costume"] in ("facilitator", "mediator") else "sneaker",
        )

    return torso, left_arm, right_arm, left_elbow, right_elbow, left_leg, right_leg, left_knee, right_knee


def build_costume(
    role,
    config,
    mats,
    visual,
    left_arm,
    right_arm,
    left_elbow,
    right_elbow,
    left_leg,
    right_leg,
):
    costume = config["costume"]
    if costume == "traveler":
        for side in (-1, 1):
            tailored_panel(
                f"Vest_{side}",
                0.126,
                0.102,
                0.119,
                0.315,
                0.043,
                (side * 0.071, -0.17, 1.055),
                mats["outer"],
                visual,
                radius=0.013,
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
        for side, leg in ((-1, left_leg), (1, right_leg)):
            # Cargo pockets belong to the moving thigh, not the static torso.
            # Their asymmetric flap adds the utility silhouette visible on
            # the reference player while remaining aligned during a stride.
            rounded_box(
                f"TravelerCargoPocket_{side}",
                (0.132, 0.052, 0.145),
                (0, -0.094, -0.145),
                mats["outer"],
                leg,
                radius=0.022,
                rotation=(0.01, 0, side * 0.025),
            )
            rounded_box(
                f"TravelerCargoFlap_{side}",
                (0.112, 0.026, 0.045),
                (0, -0.126, -0.095),
                mats["accent"],
                leg,
                radius=0.012,
            )
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
        for side, leg in ((-1, left_leg), (1, right_leg)):
            rounded_box(
                f"CargoPocket_{side}",
                (0.14, 0.055, 0.17),
                (0, -0.095, -0.21),
                mats["accent"],
                leg,
                radius=0.025,
            )
    elif costume in ("facilitator", "mediator"):
        # Keep the skirt on its own waist pivot so the runtime can add a small
        # amount of delayed cloth follow-through without deforming the torso.
        # Coordinates below are local to the 0.94 m waist pivot.
        skirt_pivot = empty("SkirtPivot", visual, (0, 0, 0.94))
        pleated_skirt("Skirt", 0.21, 0.335, 0.52, (0, 0, -0.23), mats["lower"], skirt_pivot, pleats=12, segments=48)
        curve_tube("SkirtHem", [(-0.31, -0.1, -0.478), (0, -0.326, -0.5), (0.31, -0.1, -0.478)], 0.007, mats["accent"], skirt_pivot, resolution=2)
        for pleat_index, pleat_x in enumerate((-0.1, 0, 0.1)):
            cloth_fold_ribbon(
                f"SkirtPleat_{pleat_index + 1}",
                [(pleat_x * 0.72, -0.215, 0), (pleat_x * 0.9, -0.25, -0.21), (pleat_x, -0.275, -0.44)],
                (0.002, 0.012 if pleat_x else 0.016, 0.002),
                mats["lower"],
                skirt_pivot,
                depth=0.008,
            )
        if costume == "mediator":
            # The reference mediator wears an unmistakable green dress under
            # a warm ivory coat. A separate fitted bodice restores that
            # readable two-layer silhouette instead of leaving one white
            # tubular torso from neck to skirt.
            tailored_panel(
                "MediatorDressBodice",
                0.3,
                0.235,
                0.272,
                0.39,
                0.058,
                (0, -0.182, 1.04),
                mats["lower"],
                visual,
                radius=0.012,
            )
        for side in (-1, 1):
            tailored_panel(
                f"CoatPanel_{side}",
                # The reference coat is fitted through the waist and releases
                # over the skirt.  A near-rectangular panel made the civic
                # women read as boxy toys from the three-quarter story camera.
                0.185,
                0.132,
                0.205,
                0.48,
                0.048,
                (side * 0.088, -0.172, 1.025),
                mats["outer"],
                visual,
                radius=0.012,
                rotation=(0, side * 0.035, side * 0.035),
            )
            tailored_panel(
                f"Lapel_{side}",
                0.073,
                0.096,
                0.058,
                0.27,
                0.022,
                (side * 0.065, -0.202, 1.12),
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
            cloth_fold_ribbon(
                f"CoatWaistRelease_{side}",
                [
                    (side * 0.105, -0.224, 1.05),
                    (side * 0.126, -0.228, 0.93),
                    (side * 0.175, -0.205, 0.79),
                ],
                (0.002, 0.01, 0.002),
                mats["outer"],
                visual,
                depth=0.007,
            )
        for index in range(3):
            ellipsoid(f"CoatButton_{index + 1}", (0, -0.236, 1.1 - index * 0.12), (0.014, 0.008, 0.014), mats["accent"], visual, segments=12, rings=8)
        if costume == "facilitator":
            # Seat the story notebook inside the authored palm volume. The old
            # centre was 12 cm from the hand and read as a floating prop in the
            # reverse/cast view. Spine, elastic and pencil give the contact a
            # believable grip silhouette without introducing a separate rig.
            notebook_location = (0.04, -0.035, -0.292)
            # The listen clip folds the elbow by roughly -1.3 rad. Counter it
            # here so the book remains upright in world space instead of
            # turning into two horizontal orange bars beside the actor.
            notebook_rotation = (1.18, -0.18, -0.08)
            notebook = empty("NotebookPivot", left_elbow, notebook_location, notebook_rotation)
            # Keep cover, paper, spine, elastic and pencil in one local frame.
            # The previous components repeated the rotation around different
            # world-space centres, which separated them into orange bars once
            # the listening elbow folded.
            rounded_box("StoryNotebook", (0.235, 0.042, 0.31), (0, 0, 0), mats["accent"], notebook, radius=0.031)
            rounded_box("NotebookPaper", (0.205, 0.012, 0.278), (0, -0.026, 0), mats["paper"], notebook, radius=0.021)
            rounded_box("NotebookSpine", (0.027, 0.052, 0.292), (-0.104, 0, 0), mats["shoe"], notebook, radius=0.008)
            rounded_box("NotebookElastic", (0.018, 0.014, 0.282), (0.083, -0.031, 0), mats["metal"], notebook, radius=0.006)
            cylinder("NotebookPencil", 0.007, 0.005, 0.238, (-0.078, -0.034, 0.008), mats["accent"], notebook, vertices=10, rotation=(0, 0, 0.03))
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
    root["skin_contract"] = "mirrorlife-civic-skin-v1"
    root["real_world_unit"] = "meter"
    root["identity_role"] = role

    torso, left_arm, right_arm, left_elbow, right_elbow, left_leg, right_leg, left_knee, right_knee = build_body(role, config, mats, root)
    # The paired story-camera crop shows that the reference head is about
    # eighty percent of shoulder width, while v77/v78a only reached roughly
    # seventy percent. Enlarge the complete authored head hierarchy and lower
    # its pivot by 3.5 cm so the silhouette becomes expressive without growing
    # beyond the existing 1.72 m capsule or exposing a long toy-like neck.
    head = empty("HeadPivot", root, (0, 0, 1.423))
    # Preserve the exact height/capsule contract while giving the face a
    # slightly broader illustrated presence in front and three-quarter views.
    head.scale = (1.06, 1.035, 0.98)
    build_face(head, mats, role)
    build_hair(head, mats, config["hair_style"])
    if config["hair_style"] == "cap":
        build_cap(head, mats)
    build_costume(
        role,
        config,
        mats,
        root,
        left_arm,
        right_arm,
        left_elbow,
        right_elbow,
        left_leg,
        right_leg,
    )

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
        # Preserve armature bind matrices. Applying object transforms during
        # glTF export can bake away the rest pose and break browser skinning.
        export_apply=False,
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
        "sculptContract": "mirrorlife-civic-sculpt-v28",
        "skinContract": {
            "version": "mirrorlife-civic-skin-v1",
            "runtime": "shared-controller-pivots+continuous-limb-skin",
            "joints": [
                "SkinLeftArm",
                "SkinLeftElbow",
                "SkinRightArm",
                "SkinRightElbow",
                "SkinLeftLeg",
                "SkinLeftKnee",
                "SkinRightLeg",
                "SkinRightKnee",
            ],
            "deformedParts": ["SkinnedArmVolume", "SkinnedLegVolume"],
        },
        "faceDecal": {
            "contract": "mirrorlife-civic-face-decal-v1",
            "path": "civic-face-decals.png",
            "grid": [2, 2],
            "mapping": ["player", "listener", "facilitator", "mediator"],
            "morphContract": "mirrorlife-civic-face-morph-v1",
            "integrationContract": "mirrorlife-civic-face-volume-v5",
            "preservedSculptParts": ["Head", "NoseBridge", "NoseTip", "NoseContour", "MouthClosed"],
            "mouthMorphContract": "mirrorlife-civic-mouth-morph-v1",
            "eyeGeometryContract": "mirrorlife-civic-eye-volume-v1",
            "eyeGeometryParts": ["EyePivot_-1", "EyePivot_1"],
            "morphs": ["WarmSmile", "SpeechJaw", "Concern", "Attentive", "Blink"],
        },
        "handContract": {
            "version": "mirrorlife-civic-hand-v1",
            "pivots": ["Hand_-1", "Hand_1"],
            "poseStyles": ["relaxed", "soft-cup", "notebook-grip", "thoughtful", "open"],
        },
        "animationContract": {
            "version": "mirrorlife-civic-clips-v7",
            "runtime": "authored-keyframe-blend+continuous-skin+facial-hand-acting",
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
