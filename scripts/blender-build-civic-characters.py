import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector


ROLE_CONFIGS = {
    "player": {
        "skin": "#e9aa7d",
        "hair": "#454452",
        # Keep the clump separation inside the near-charcoal family. The
        # previous pale lavender highlight resolved as hard plastic panels
        # across the player's crown under the portal key.
        "hair_highlight": "#666775",
        "eye": "#3f342d",
        "eye_ring": "#776153",
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
        "skin": "#e6a478",
        "hair": "#303744",
        "hair_highlight": "#465869",
        "eye": "#3a312b",
        "eye_ring": "#716153",
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
        "skin": "#ebaa7e",
        "hair": "#d45f52",
        "hair_highlight": "#e27063",
        # Keep role tint in the iris, but anchor it in the same near-charcoal
        # value family as the reference cast. The lighter green read as glass
        # beads once the face was reduced to gameplay size.
        "eye": "#294c43",
        "eye_ring": "#45685f",
        "top": "#eadfce",
        # A warmer oatmeal cardigan preserves the source's cloth hierarchy
        # under the strong portal key; near-white previously clipped into flat
        # vertical bars beside the green dress.
        "outer": "#c9b397",
        "lower": "#356e58",
        "accent": "#d98769",
        "shoe": "#5c4031",
        "sole": "#332722",
        "hair_style": "coral_ponytail",
        "costume": "facilitator",
    },
    "mediator": {
        "skin": "#e7a477",
        "hair": "#6b4a3c",
        "hair_highlight": "#7b5c50",
        "eye": "#354334",
        "eye_ring": "#4f654d",
        "top": "#e9decd",
        "outer": "#ccb79a",
        "lower": "#47745d",
        "accent": "#c69455",
        "shoe": "#503b31",
        "sole": "#302520",
        "hair_style": "braided_bob",
        "costume": "mediator",
    },
}

# Four social roles share one animation vocabulary, not one mannequin body.
# These metre-space profiles keep every actor inside the same authoritative
# capsule while authoring different shoulder, waist, limb and head rhythms.
# The variation is intentionally modest: identity should survive silhouette
# and orbit without making collision or authored hand poses dishonest.
BODY_PROFILES = {
    "player": {
        "torso_width": 1.01,
        "torso_depth": 0.97,
        "shoulder_x": 0.205,
        "hip_x": 0.118,
        # Keep a softly weighted sleeve without losing the reference's long,
        # editorial 1:3.5 silhouette. The previous v145 correction fixed the
        # tube read but over-expanded the shoulder-to-hand column in the
        # equal-scale actor crop.
        "arm_width": 0.76,
        "arm_depth": 0.79,
        # Preserve the reference's loose cargo thigh while the authored ring
        # stack still tapers decisively into the ankle.
        "leg_width": 0.96,
        "leg_depth": 0.94,
        "waist_width": 1.0,
        "hand_scale": 0.82,
        "foot_scale": 1.04,
        "toe_out": 0.075,
        # The normalized story-camera comparison measures the source cast at
        # roughly 46 cm across the complete skull/hair silhouette. Widen the
        # authored head without raising the 1.75 m top height; the former
        # 42 cm face made the 2D identity features unreadable at gameplay
        # distance even though the body and camera scale were correct.
        "head_scale": (1.015, 0.96, 0.95),
        "head_z": 1.496,
    },
    "listener": {
        "torso_width": 0.99,
        "torso_depth": 0.95,
        "shoulder_x": 0.198,
        "hip_x": 0.118,
        "arm_width": 0.77,
        "arm_depth": 0.8,
        "leg_width": 0.94,
        "leg_depth": 0.93,
        "waist_width": 0.98,
        "hand_scale": 0.82,
        "foot_scale": 1.02,
        "toe_out": 0.065,
        "head_scale": (1.005, 0.955, 0.95),
        "head_z": 1.491,
    },
    "facilitator": {
        "torso_width": 0.93,
        "torso_depth": 0.92,
        "shoulder_x": 0.19,
        "hip_x": 0.106,
        "arm_width": 0.71,
        "arm_depth": 0.74,
        "leg_width": 0.8,
        "leg_depth": 0.85,
        "waist_width": 0.92,
        "hand_scale": 0.79,
        "foot_scale": 0.96,
        "toe_out": 0.055,
        "head_scale": (1.0, 0.955, 0.95),
        "head_z": 1.501,
    },
    "mediator": {
        "torso_width": 0.95,
        "torso_depth": 0.93,
        "shoulder_x": 0.194,
        "hip_x": 0.108,
        "arm_width": 0.72,
        "arm_depth": 0.75,
        "leg_width": 0.81,
        "leg_depth": 0.86,
        "waist_width": 0.93,
        "hand_scale": 0.79,
        "foot_scale": 0.96,
        "toe_out": 0.055,
        "head_scale": (1.0, 0.955, 0.95),
        "head_z": 1.491,
    },
}


# The source cast does not reuse one doll face. Each role carries a slightly
# different eye aperture, brow rhythm, cheek volume and resting mouth. Keep
# those differences compact and metre-authored so they survive the same shared
# rig, collider and animation contract.
FACE_PROFILES = {
    "player": {
        "eye_width": 0.066,
        "eye_height": 0.04,
        "iris_width": 0.034,
        "iris_height": 0.031,
        "outer_eye_lift": 0.001,
        "brow_outer": -0.004,
        "brow_apex": 0.008,
        "brow_inner": -0.002,
        "mouth_width": 0.0435,
        "mouth_corner": 0.002,
        "mouth_center": -0.003,
        "cheek_forward": 1.0,
        "muzzle_forward": 1.0,
        "jaw_taper": 0.262,
        "chin_length": 0.008,
        "cheek_spread": 0.98,
        "temple_taper": 0.024,
    },
    "listener": {
        "eye_width": 0.065,
        "eye_height": 0.0395,
        "iris_width": 0.0335,
        "iris_height": 0.0305,
        "outer_eye_lift": -0.001,
        "brow_outer": -0.006,
        "brow_apex": 0.006,
        "brow_inner": -0.001,
        "mouth_width": 0.0445,
        "mouth_corner": 0.004,
        "mouth_center": -0.002,
        "cheek_forward": 0.94,
        "muzzle_forward": 0.96,
        "jaw_taper": 0.274,
        "chin_length": 0.006,
        "cheek_spread": 0.95,
        "temple_taper": 0.027,
    },
    "facilitator": {
        "eye_width": 0.068,
        "eye_height": 0.0415,
        "iris_width": 0.036,
        "iris_height": 0.0325,
        "outer_eye_lift": 0.003,
        "brow_outer": 0.001,
        "brow_apex": 0.011,
        "brow_inner": -0.003,
        "mouth_width": 0.0455,
        "mouth_corner": 0.005,
        "mouth_center": -0.002,
        "cheek_forward": 1.08,
        "muzzle_forward": 1.03,
        "jaw_taper": 0.304,
        "chin_length": 0.013,
        "cheek_spread": 1.06,
        "temple_taper": 0.032,
    },
    "mediator": {
        "eye_width": 0.067,
        "eye_height": 0.041,
        "iris_width": 0.035,
        "iris_height": 0.032,
        "outer_eye_lift": 0.001,
        "brow_outer": -0.003,
        "brow_apex": 0.009,
        "brow_inner": 0.001,
        "mouth_width": 0.0435,
        "mouth_corner": 0.002,
        "mouth_center": -0.002,
        "cheek_forward": 0.98,
        "muzzle_forward": 0.98,
        "jaw_taper": 0.29,
        "chin_length": 0.01,
        "cheek_spread": 1.015,
        "temple_taper": 0.029,
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


def create_skin_armature(parent, shoulder_x=0.216, hip_x=0.115):
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

    skin_shoulder_x = shoulder_x * 0.95
    specifications = (
        ("SkinLeftArm", (-skin_shoulder_x, 0, 1.23), (-skin_shoulder_x, 0, 0.995), None),
        ("SkinLeftElbow", (-skin_shoulder_x, 0, 0.995), (-skin_shoulder_x, 0, 0.705), "SkinLeftArm"),
        ("SkinRightArm", (skin_shoulder_x, 0, 1.23), (skin_shoulder_x, 0, 0.995), None),
        ("SkinRightElbow", (skin_shoulder_x, 0, 0.995), (skin_shoulder_x, 0, 0.705), "SkinRightArm"),
        ("SkinLeftLeg", (-hip_x, 0, 0.78), (-hip_x, 0, 0.46), None),
        ("SkinLeftKnee", (-hip_x, 0, 0.46), (-hip_x, 0, 0.135), "SkinLeftLeg"),
        ("SkinRightLeg", (hip_x, 0, 0.78), (hip_x, 0, 0.46), None),
        ("SkinRightKnee", (hip_x, 0, 0.46), (hip_x, 0, 0.135), "SkinRightLeg"),
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
    """Build two continuously weighted limbs in one Web-friendly skin mesh.

    Civic clothes should not inherit the perfectly lathed cross-section of a
    mannequin.  The authored ring positions still define the reliable skin
    weights, while the final cross-section adds a restrained pressed front,
    side seam and centre crease.  These details therefore bend with the real
    skeleton instead of floating above it as decoration.
    """
    vertices = []
    faces = []
    weights = []
    is_leg = name == "SkinnedLegVolume"
    is_arm = name == "SkinnedArmVolume"
    # The elbow needs a broader deformation falloff than the knee.  A narrow
    # 15 cm blend made the two arm bones technically continuous, but the
    # quarter-view silhouette still collapsed into a hard hinge.  Spreading
    # the weights across 21 cm lets the deltoid/bicep and forearm rings carry
    # the bend together, preserving the soft illustrated S-curve.
    blend_half = 0.105 if is_arm else 0.075
    for limb_index, centre_x in enumerate(side_centres):
        upper_name, lower_name = bone_names[limb_index]
        vertex_start = len(vertices)
        for ring_index, ring in enumerate(rings):
            z, radius_x, radius_y = ring[:3]
            centre_y = ring[3] if len(ring) > 3 else 0
            inward_offset = ring[4] if len(ring) > 4 else 0
            ring_centre_x = centre_x + (-1 if centre_x > 0 else 1) * inward_offset
            # Cosine smoothstep across a 15 cm elbow/knee band gives the
            # illustrated soft bend missing from the former hard seam.
            lower_weight = max(0.0, min(1.0, (joint_z + blend_half - z) / (blend_half * 2)))
            lower_weight = lower_weight * lower_weight * (3.0 - 2.0 * lower_weight)
            for side_index in range(sides):
                angle = math.tau * side_index / sides
                cosine = math.cos(angle)
                sine = math.sin(angle)
                if is_leg:
                    # A rounded superellipse gives trousers a cut-cloth
                    # section rather than the toy-like drinking-straw section
                    # of a cylinder. The central front crease and restrained
                    # outer seam are modelled into the silhouette itself.
                    shaped_x = math.copysign(abs(cosine) ** 0.86, cosine)
                    shaped_y = math.copysign(abs(sine) ** 0.9, sine)
                    side_seam = abs(cosine) ** 10
                    flow_turn = math.sin(max(0.0, min(1.0, (z - 0.13) / 0.65)) * math.pi) * 0.16
                    crease_direction = -math.pi / 2 + math.copysign(flow_turn, centre_x)
                    crease = max(0.0, math.cos(angle - crease_direction)) ** 12
                    local_x = shaped_x * radius_x + math.copysign(side_seam * 0.0025, cosine)
                    local_y = shaped_y * radius_y - crease * 0.0055
                elif is_arm:
                    # Sleeves keep a softer section, but a shallow rear fall
                    # and front press stop the full arm from reading as bare
                    # rubber when the actor turns in profile.
                    shaped_x = math.copysign(abs(cosine) ** 0.94, cosine)
                    shaped_y = math.copysign(abs(sine) ** 0.96, sine)
                    rear = max(0.0, sine)
                    flow_turn = math.sin(max(0.0, min(1.0, (z - 0.705) / 0.525)) * math.pi) * 0.11
                    press_direction = -math.pi / 2 - math.copysign(flow_turn, centre_x)
                    front_press = max(0.0, math.cos(angle - press_direction)) ** 10
                    local_x = shaped_x * radius_x
                    local_y = shaped_y * radius_y - front_press * 0.0025 + rear ** 5 * 0.0015
                else:
                    local_x = cosine * radius_x
                    local_y = sine * radius_y
                vertices.append((
                    ring_centre_x + local_x,
                    centre_y + local_y,
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
    obj["garment_topology_contract"] = "mirrorlife-civic-garment-topology-v5"
    if name == "SkinnedArmVolume":
        obj["shoulder_contract"] = "mirrorlife-civic-shoulder-continuity-v3"
        obj["arm_anatomy_contract"] = "mirrorlife-civic-arm-anatomy-v1"
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
    strips for every fold. Seven height rings and nine width samples now bow
    the cloth over the chest, pinch it at the waist, release it over the hip
    and roll the opening edge. The result reads as one garment from every
    orbit angle while retaining one inexpensive mesh and the existing rig.
    """
    ring_factors = (0.0, 0.14, 0.3, 0.5, 0.68, 0.84, 1.0)
    column_factors = (-1.0, -0.76, -0.5, -0.24, 0.0, 0.24, 0.5, 0.76, 1.0)
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
            # Combine vertical drape with a diagonal pull from shoulder/opening
            # to waist. The previous perfectly repeated cosine read as piping
            # laid on top of a flat panel; this displacement changes the
            # silhouette itself and lets the key light reveal cloth tension.
            diagonal_pull = math.sin((column * 1.7 + height_factor * 1.35) * math.pi) * depth * 0.052 * body_roll
            broad_fold = (
                math.cos(column * math.pi * 2.35) * depth * 0.064
                + math.cos(column * math.pi * 4.4 + height_factor * 2.1) * depth * 0.024
            ) * body_roll
            centre_bow = (1.0 - abs(column)) * depth * 0.12 * body_roll
            edge_roll = max(0.0, abs(column) - 0.7) / 0.3 * depth * 0.06
            waist_tension = math.sin(column * math.pi) * depth * 0.045 * max(0.0, 1.0 - abs(height_factor - 0.5) * 4.0)
            vertices.append((x, -depth / 2 - broad_fold - diagonal_pull - centre_bow - edge_roll - waist_tension, z))
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
    # Three bevel segments keep the soft tailored highlight while leaving
    # enough of the per-role triangle budget for visible construction details
    # such as real ribs, buttonholes and hand contact.
    bevel.segments = 3
    smooth = obj.modifiers.new("Tailored cloth normals", "WEIGHTED_NORMAL")
    smooth.keep_sharp = True
    link_material(obj, mat)
    return obj


def contoured_elliptical_shell(
    name,
    rings,
    mat,
    parent=None,
    segments=36,
    contract=None,
):
    """Build one authored torso/pelvis shell from asymmetric elliptical rings.

    A scaled UV sphere collapses to a point at the neck and pelvis and gives
    every role the same rubber-capsule silhouette. These rings keep a real
    shoulder shelf, rib cage, waist and pelvis while allowing the chest and
    back to carry different depth. The closed shell remains one inexpensive,
    orbit-safe mesh and can still be merged into the runtime vertex-colour
    batch.
    """
    if len(rings) < 3:
        raise ValueError("contoured_elliptical_shell requires at least three rings")
    vertices = []
    faces = []
    for z, radius_x, radius_y, front_bulge, back_bulge in rings:
        for segment in range(segments):
            angle = math.tau * segment / segments
            cosine = math.cos(angle)
            sine = math.sin(angle)
            front = max(0.0, -sine) ** 1.65
            back = max(0.0, sine) ** 1.8
            vertices.append((
                cosine * radius_x,
                sine * radius_y - front * front_bulge + back * back_bulge,
                z,
            ))
    for ring_index in range(len(rings) - 1):
        row = ring_index * segments
        following_row = row + segments
        for segment in range(segments):
            following = (segment + 1) % segments
            faces.append((
                row + segment,
                row + following,
                following_row + following,
                following_row + segment,
            ))
    bottom_center = len(vertices)
    top_center = bottom_center + 1
    vertices.extend((
        (0, 0, rings[0][0]),
        (0, 0, rings[-1][0]),
    ))
    top_row = (len(rings) - 1) * segments
    for segment in range(segments):
        following = (segment + 1) % segments
        faces.append((bottom_center, following, segment))
        faces.append((top_center, top_row + segment, top_row + following))
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    link_material(obj, mat)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    bevel = obj.modifiers.new("Anatomical shell softness", "BEVEL")
    bevel.width = 0.0045
    bevel.segments = 2
    if contract:
        obj["body_contract"] = contract
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


def morphable_mouth_surface(name, width, corner_height, centre_height, mat, parent=None, segments=14):
    """Create one concave, morphable upper/lower lip surface.

    The former tube plus separate lower-lip bead consumed two draw calls and
    still read as a line pasted onto a spherical face. Four authored rows form
    a shallow cupid bow, recessed mouth seam and lower-lip shelf in one mesh.
    The same vertices carry every expression, so the lips remain attached to
    the cheek/jaw morphs while talking and orbiting.
    """
    vertices = []
    for index in range(segments + 1):
        factor = index / segments
        normalized_x = factor * 2 - 1
        edge = abs(normalized_x)
        volume = max(0.0, 1.0 - edge ** 2) ** 0.54
        centre_line = centre_height + (corner_height - centre_height) * edge ** 1.55
        cupid = max(0.0, 1.0 - abs(normalized_x) / 0.42)
        x = normalized_x * width
        vertices.extend((
            (x, 0.0005, centre_line + volume * 0.0072 + cupid * 0.0015),
            (x, -0.0044, centre_line + volume * 0.001),
            (x, -0.0055, centre_line - volume * 0.0014),
            (x, -0.0004, centre_line - volume * 0.0076),
        ))
    faces = []
    for index in range(segments):
        current = index * 4
        following = current + 4
        faces.extend((
            (current, following, following + 1, current + 1),
            (current + 1, following + 1, following + 2, current + 2),
            (current + 2, following + 2, following + 3, current + 3),
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
    bevel = obj.modifiers.new("Lip edge softness", "BEVEL")
    bevel.width = 0.0008
    bevel.segments = 2
    obj.shape_key_add(name="Basis")
    smile = obj.shape_key_add(name="WarmSmile")
    speech = obj.shape_key_add(name="SpeechJaw")
    concern = obj.shape_key_add(name="Concern")
    attentive = obj.shape_key_add(name="Attentive")
    asymmetry = obj.shape_key_add(name="SocialAsymmetry")
    extent = max((abs(vertex.co.x) for vertex in obj.data.vertices), default=0.03)
    for index, vertex in enumerate(obj.data.vertices):
        x = vertex.co.x
        edge = max(0.0, min(1.0, (abs(x) / max(extent, 1e-5) - 0.34) / 0.66))
        centre = max(0.0, 1.0 - abs(x) / max(extent * 0.72, 1e-5))
        row = index % 4
        lower_weight = 1.0 if row >= 2 else 0.26
        smile.data[index].co.z += edge * 0.011 - centre * 0.0012 * lower_weight
        smile.data[index].co.x *= 1.0 + edge * 0.035
        speech.data[index].co.z -= centre * (0.003 + lower_weight * 0.007)
        speech.data[index].co.y -= centre * (0.001 + lower_weight * 0.002)
        concern.data[index].co.z -= edge * 0.008
        concern.data[index].co.x *= 1.0 - edge * 0.018
        attentive.data[index].co.z += edge * 0.0025
        # One corner carries slightly more intention than the other. The
        # reference avoids perfectly mirrored emoji smiles; this authored
        # delta lets listening and speaking keep a human, role-specific bias.
        side = max(-1.0, min(1.0, x / max(extent, 1e-5)))
        asymmetry.data[index].co.z += edge * side * 0.006
        asymmetry.data[index].co.x *= 1.0 + edge * side * 0.012
        asymmetry.data[index].co.y -= centre * (1.0 - side) * 0.0007
    obj["face_morph_contract"] = "mirrorlife-civic-mouth-morph-v4"
    return obj


def tapered_lock(name, points, radii, mat, parent=None, sides=10, oval_ratio=0.72):
    """Build a broad, turning sculpted hair clump instead of a round tube.

    Hair in the source is designed as grouped planes: a wide illuminated face,
    a narrow shadow side and a pinched tip.  A regular ellipse remains round
    even when flattened, which made fringe read as sausages and rear hair as a
    bead chain.  This swept superellipse keeps real volume for a full orbit but
    gives every lock a dominant plane and a restrained twist along its path.
    """
    if len(points) != len(radii) or len(points) < 2:
        raise ValueError("tapered_lock requires matching point/radius arrays")
    vertices = []
    faces = []
    vectors = [Vector(point) for point in points]
    ring_sides = max(6, min(12, sides))
    for index, (point, radius) in enumerate(zip(vectors, radii)):
        before = vectors[max(0, index - 1)]
        after = vectors[min(len(vectors) - 1, index + 1)]
        tangent = (after - before).normalized()
        reference = Vector((0, 1, 0)) if abs(tangent.dot(Vector((0, 1, 0)))) < 0.9 else Vector((1, 0, 0))
        normal = tangent.cross(reference).normalized()
        binormal = tangent.cross(normal).normalized()
        path_factor = index / max(1, len(vectors) - 1)
        roll = (path_factor - 0.5) * 0.16
        rolled_normal = normal * math.cos(roll) + binormal * math.sin(roll)
        rolled_binormal = binormal * math.cos(roll) - normal * math.sin(roll)
        thickness = radius * oval_ratio * 0.76
        for side in range(ring_sides):
            angle = math.tau * side / ring_sides
            cosine = math.cos(angle)
            sine = math.sin(angle)
            # A superellipse produces broad front/back planes and narrow side
            # planes.  The slight asymmetric crown moves a clean highlight
            # across the clump without adding a painted strand or extra mesh.
            width_coordinate = math.copysign(abs(cosine) ** 0.62, cosine) * radius
            depth_coordinate = math.copysign(abs(sine) ** 0.78, sine) * thickness
            crown = max(0.0, sine) * radius * 0.055 * (1.0 - path_factor * 0.35)
            coordinate = point + rolled_normal * (width_coordinate + crown) + rolled_binormal * depth_coordinate
            vertices.append(tuple(coordinate))
    for ring in range(len(points) - 1):
        base = ring * ring_sides
        next_base = (ring + 1) * ring_sides
        for side in range(ring_sides):
            following = (side + 1) % ring_sides
            faces.append((base + side, base + following, next_base + following, next_base + side))
    vertices.extend([tuple(vectors[0]), tuple(vectors[-1])])
    start_center = len(vertices) - 2
    end_center = len(vertices) - 1
    for side in range(ring_sides):
        following = (side + 1) % ring_sides
        faces.append((start_center, following, side))
        last = (len(points) - 1) * ring_sides
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
    obj["hair_clump_contract"] = "mirrorlife-civic-hair-clump-v1"
    return obj


def hand_web_surface(name, mat, parent=None):
    """Create a watertight metacarpal fan between palm and finger roots.

    The animated digits remain independent deformation islands, but their
    proximal rings now disappear into one real skin volume. This is the
    illustrated equivalent of a connected dorsal plate and interdigital webs,
    eliminating the four-dowels-in-a-mitten silhouette without increasing the
    runtime draw-call count.
    """
    x_positions = (-0.052, -0.043, -0.033, -0.022, -0.011, 0.0, 0.011, 0.022, 0.033, 0.043, 0.052)
    outer_z = (-0.04, -0.048, -0.054, -0.043, -0.058, -0.045, -0.056, -0.042, -0.053, -0.046, -0.038)
    front_y = -0.039
    back_y = 0.025
    inner_z = -0.008
    vertices = []
    # Two z rows on both palm faces give the bridge real thickness. The
    # variable distal edge rises between fingers and falls beneath each root.
    for y in (front_y, back_y):
        for row in range(2):
            for index, x in enumerate(x_positions):
                z = inner_z if row == 0 else outer_z[index]
                crown = max(0.0, 1.0 - abs(x) / 0.055)
                vertices.append((x, y + (0.0025 * crown if y > 0 else -0.0015 * crown), z))
    count = len(x_positions)
    faces = []
    front_inner = 0
    front_outer = count
    back_inner = count * 2
    back_outer = count * 3
    for index in range(count - 1):
        following = index + 1
        faces.extend((
            (front_inner + index, front_inner + following, front_outer + following, front_outer + index),
            (back_inner + index, back_outer + index, back_outer + following, back_inner + following),
            (front_outer + index, front_outer + following, back_outer + following, back_outer + index),
            (front_inner + index, back_inner + index, back_inner + following, front_inner + following),
        ))
    faces.extend((
        (front_inner, front_outer, back_outer, back_inner),
        (front_inner + count - 1, back_inner + count - 1, back_outer + count - 1, front_outer + count - 1),
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
    bevel = obj.modifiers.new("Interdigital softness", "BEVEL")
    bevel.width = 0.0022
    # One bevel segment is sufficient at a 2.2 mm radius and prevents the
    # connected web from spending more triangles than the articulated digits.
    bevel.segments = 1
    obj["hand_continuity_contract"] = "mirrorlife-civic-hand-continuity-v1"
    return obj


def sculpted_hand(name, location, mat, crease_mat, parent=None, rotation=(0, 0, 0), side=1, pose_style="relaxed"):
    """Build a compact illustrated hand that stays legible at story distance.

    The previous thin, splayed fingers turned into a dark wire fan once the
    actor occupied fewer than thirty screen pixels. Keep four real volumes for
    orbit and contact poses, but cluster them into the calm rounded silhouette
    used by the reference cast.
    """
    hand_pivot = empty(name, parent, location, rotation)
    hand_pivot["hand_contract"] = "mirrorlife-civic-hand-v11"
    hand_pivot["hand_continuity_contract"] = "mirrorlife-civic-hand-continuity-v1"
    hand_pivot["pose_style"] = pose_style
    hand = organic_limb(
        f"{name}Palm",
        0.112,
        (
            # A defined wrist heel keeps the cuff-to-palm transition from
            # collapsing into a peg when the hand turns edge-on.
            (0.5, 0.041, 0.029, 0, 0.002),
            (0.39, 0.047, 0.033, -side * 0.001, 0.002),
            (0.27, 0.053, 0.037, -side * 0.002, 0.001),
            (0.11, 0.059, 0.041, -side * 0.004, -0.002),
            (-0.08, 0.061, 0.042, -side * 0.005, -0.004),
            (-0.27, 0.059, 0.039, -side * 0.004, -0.006),
            (-0.41, 0.055, 0.035, -side * 0.002, -0.006),
            (-0.5, 0.05, 0.031, 0, -0.005),
        ),
        (0, 0, 0),
        mat,
        hand_pivot,
        # The hand occupies fewer than 30 px at the default story camera.
        # Sixteen radial sides keep the palm silhouette round while avoiding
        # spending full face-sculpt density on a tiny extremity.
        sides=16,
    )
    hand_web_surface(f"HandWebSurface_{side}", mat, hand_pivot)
    pose_profiles = {
        "relaxed": {"curl": (0.29, 0.34, 0.39, 0.45), "splay": 1.12, "thumb": 0.34},
        "open": {"curl": (0.07, 0.09, 0.12, 0.17), "splay": 1.42, "thumb": 0.18},
        "soft-cup": {"curl": (0.4, 0.5, 0.59, 0.67), "splay": 0.82, "thumb": 0.5},
        # The notebook hand now has a supporting palm and a separate guiding
        # hand instead of mirroring one generic fist on both wrists.
        "notebook-support": {"curl": (0.72, 0.82, 0.9, 0.95), "splay": 0.3, "thumb": 0.9},
        "notebook-guide": {"curl": (0.36, 0.5, 0.64, 0.76), "splay": 0.44, "thumb": 0.84},
        "thoughtful": {"curl": (0.48, 0.61, 0.69, 0.77), "splay": 0.58, "thumb": 0.6},
    }
    profile = pose_profiles.get(pose_style, pose_profiles["relaxed"])
    finger_specs = (
        # x, length, radius, lateral splay and fingertip curl.  A small
        # fan-and-curl silhouette reads as a relaxed hand instead of four
        # parallel dowels while keeping one compact merged finger topology.
        # Keep the four real digits, but overlap their root silhouettes like
        # the reference's soft illustrated hands. The earlier 26 mm spacing
        # and 16 mm radii resolved as four separate wires at the story camera;
        # these fuller, closer roots read as one palm with finger articulation.
        (-0.033, 0.057, 0.0168, -side * 0.0018, 0.006),
        (-0.011, 0.068, 0.0182, -side * 0.0006, 0.008),
        (0.011, 0.064, 0.0179, side * 0.0006, 0.008),
        (0.033, 0.052, 0.0162, side * 0.0019, 0.006),
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
                -profile["curl"][finger_index - 1],
                side * splay * profile["splay"] * 1.35,
                -side * splay * profile["splay"] * 0.9,
            ),
        )
        organic_limb(
            f"FingerVolume_{side}_{finger_index}",
            finger_length,
            (
                (0.5, finger_radius * 1.08, finger_radius * 0.9),
                (0.3, finger_radius * 1.08, finger_radius * 0.92, splay * 0.08, curl * 0.03),
                (0.08, finger_radius, finger_radius * 0.86, splay * 0.24, curl * 0.16),
                (-0.14, finger_radius * 0.92, finger_radius * 0.79, splay * 0.42, curl * 0.36),
                (-0.34, finger_radius * 0.76, finger_radius * 0.66, splay * 0.64, curl * 0.64),
                (-0.5, finger_radius * 0.48, finger_radius * 0.44, splay * 0.82, curl * 0.92),
            ),
            (0, 0, -finger_length / 2),
            mat,
            finger_pivot,
            # Ten sides and a six-ring profile retain distinct knuckles and a
            # tapered pad after the four digits are merged into the animated
            # hand batch. This is still far cheaper than four runtime finger
            # draw calls, but no longer resolves as one round mitten.
            sides=10,
        )
        # A single shallow knuckle crescent gives each real digit a readable
        # articulation cue at the gameplay camera. It is parented to the same
        # finger pivot and merged into the one-hand runtime batch, so the line
        # follows shader-driven curl instead of floating over the skin.
        curve_tube(
            f"FingerCrease_{side}_{finger_index}",
            [
                (-finger_radius * 0.52, -finger_radius * 0.78, -finger_length * 0.45),
                (0, -finger_radius * 0.96, -finger_length * 0.49),
                (finger_radius * 0.52, -finger_radius * 0.78, -finger_length * 0.45),
            ],
            0.00115,
            crease_mat,
            finger_pivot,
            resolution=1,
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
    curve_tube(
        f"ThumbCrease_{side}",
        [
            (-0.008, -0.014, -0.029),
            (0, -0.018, -0.035),
            (0.008, -0.014, -0.029),
        ],
        0.0012,
        crease_mat,
        thumb_pivot,
        resolution=1,
    )
    # Two shallow creases restore hand scale and orientation in close social
    # shots. They sit on the palm surface and merge into the hand draw call,
    # so the detail survives orbit without becoming a floating line.
    curve_tube(
        f"PalmLifeLine_{side}",
        [
            (-side * 0.026, -0.043, 0.026),
            (-side * 0.036, -0.046, 0.0),
            (-side * 0.027, -0.043, -0.025),
        ],
        0.0017,
        crease_mat,
        hand_pivot,
        resolution=2,
    )
    curve_tube(
        f"PalmHeartLine_{side}",
        [
            (-side * 0.034, -0.043, -0.035),
            (0, -0.046, -0.044),
            (side * 0.03, -0.042, -0.036),
        ],
        0.0014,
        crease_mat,
        hand_pivot,
        resolution=2,
    )
    return hand_pivot


def sculpted_shoe(
    name,
    location,
    upper_mat,
    sole_mat,
    parent=None,
    side=1,
    style="sneaker",
    scale=1.0,
    toe_out=0.0,
):
    """Create a compact illustrated shoe last with a tapered toe and heel.

    The old sphere-on-box construction made every foot read as an oversized
    toy capsule. Seven authored cross-sections now form a single upper whose
    toe, instep and heel remain readable in all four orbit views.
    """
    shoe_pivot = empty(
        f"{name}Pivot",
        parent,
        location,
        (0, 0, -side * toe_out),
    )
    shoe_pivot.scale = (scale, scale, scale)

    stations = (
        # y, half-width, lower surface, upper surface. The terminal toe ring
        # closes down in both width and height, producing a true rounded last
        # instead of the four-sided wedge exposed by the first v6 pass.
        (0.08, 0.052, -0.027, 0.045 if style == "ankle-boot" else 0.037),
        (0.038, 0.068, -0.038, 0.072 if style == "ankle-boot" else 0.064),
        (-0.015, 0.082, -0.046, 0.096 if style == "ankle-boot" else 0.086),
        (-0.082, 0.088, -0.048, 0.08 if style == "ankle-boot" else 0.072),
        (-0.148, 0.082, -0.046, 0.057),
        (-0.205, 0.062, -0.038, 0.036),
        (-0.225, 0.02, -0.016, 0.016),
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
    shoe.parent = shoe_pivot
    shoe.location = (0, 0, 0)
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
        (0, sole_center_y, -0.049),
        sole_mat,
        shoe_pivot,
        radius=0.012,
        segments=3,
    )
    # A separate welt and heel counter make the foot read as constructed
    # footwear, not one dark capsule. Both follow the same knee pivot so their
    # contact remains exact through walk/run/jump clips.
    rounded_box(
        f"{name}Midsole",
        (sole_width * 0.94, sole_length * 0.97, 0.018),
        (0, sole_center_y - 0.002, -0.035),
        sole_mat,
        shoe_pivot,
        radius=0.009,
        segments=2,
    )
    rounded_box(
        f"{name}HeelCounter",
        (0.108, 0.032, 0.085 if style == "ankle-boot" else 0.07),
        (0, 0.064, 0.04),
        upper_mat,
        shoe_pivot,
        radius=0.014,
        rotation=(math.radians(-8), 0, 0),
        segments=3,
    )
    rounded_box(
        f"{name}OuterQuarterPanel",
        (0.018, 0.126, 0.074),
        (side * 0.071, -0.054, 0.034),
        upper_mat,
        shoe_pivot,
        radius=0.008,
        rotation=(0, side * 0.04, -side * 0.075),
        segments=3,
    )
    rounded_box(
        f"{name}ToeBumper",
        (0.122, 0.042, 0.034),
        (0, -0.205, -0.006),
        sole_mat,
        shoe_pivot,
        radius=0.014,
        rotation=(math.radians(4), 0, 0),
        segments=3,
    )
    curve_tube(
        f"{name}ToeCapSeam",
        [
            (-0.064, -0.142, 0.014),
            (0, -0.166, 0.023),
            (0.064, -0.142, 0.014),
        ],
        0.0035,
        sole_mat,
        shoe_pivot,
        resolution=2,
    )
    if style == "ankle-boot":
        cylinder(
            f"{name}AnkleCollar",
            0.064,
            0.059,
            0.098,
            (0, 0.048, 0.078),
            upper_mat,
            shoe_pivot,
            vertices=22,
        )
        torus(
            f"{name}AnkleCollarEdge",
            0.057,
            0.006,
            (0, 0.048, 0.128),
            sole_mat,
            shoe_pivot,
            major_segments=24,
        )
        curve_tube(
            f"{name}PullTab",
            [
                (-0.018, 0.068, 0.122),
                (0, 0.078, 0.164),
                (0.018, 0.068, 0.122),
            ],
            0.0045,
            sole_mat,
            shoe_pivot,
            resolution=2,
        )
    else:
        rounded_box(
            f"{name}Tongue",
            (0.094, 0.032, 0.098),
            (0, -0.018, 0.072),
            upper_mat,
            shoe_pivot,
            radius=0.02,
            rotation=(math.radians(11), 0, 0),
        )
    for lace_index, lace_y in enumerate((-0.035, -0.068, -0.101), start=1):
        curve_tube(
            f"{name}Lace_{lace_index}",
            [
                (-0.038, lace_y, 0.052 - (lace_index - 1) * 0.008),
                (0, lace_y - 0.006, 0.058 - (lace_index - 1) * 0.008),
                (0.038, lace_y, 0.052 - (lace_index - 1) * 0.008),
            ],
            0.0045,
            sole_mat,
            shoe_pivot,
            resolution=2,
        )
    return shoe_pivot


def pleated_skirt(name, waist_radius, hem_radius, depth, location, mat, parent=None, pleats=10, segments=40):
    """Create a conical skirt whose folds belong to its silhouette."""
    middle_radius = (waist_radius + hem_radius) * 0.5
    # Seven rings let the fabric settle over the hip, hang under gravity and
    # only then release into an asymmetric hem. This avoids the rigid
    # lampshade read visible in the earlier five-ring silhouette.
    rings = (
        (0.5, waist_radius, 0.05),
        (0.36, waist_radius * 1.025, 0.16),
        (0.2, waist_radius * 1.08, 0.36),
        (0.02, middle_radius * 0.93, 0.58),
        (-0.16, middle_radius * 1.0, 0.74),
        (-0.34, middle_radius * 1.1, 0.9),
        (-0.5, hem_radius, 1.0),
    )
    vertices = []
    faces = []
    for z_factor, radius, fold_strength in rings:
        for segment in range(segments):
            angle = math.tau * segment / segments
            # Alternate deep and shallow channels so the hem does not repeat
            # like a procedural cog wheel.
            fold = (
                math.cos(angle * pleats) * 0.012
                + math.cos(angle * (pleats // 2) + 0.48) * 0.006
            ) * fold_strength
            front_bias = max(0.0, -math.sin(angle)) * 0.009 * fold_strength
            asymmetric_drape = (
                math.sin(angle + 0.7) * 0.008
                + math.sin(angle * 2.0 - 0.35) * 0.004
            ) * fold_strength
            current_radius = radius + fold + front_bias + asymmetric_drape
            hem_drop = (
                -max(0.0, math.sin(angle + 0.42)) * 0.018
                -max(0.0, math.cos(angle * 2.0 - 0.2)) * 0.007
            ) * fold_strength
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
    obj["garment_topology_contract"] = "mirrorlife-civic-garment-topology-v5"
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


def embroidered_flower(name, location, mat, parent=None, radius=0.021):
    """Build one low-profile four-petal dress motif as a single mesh.

    Keeping each embroidered flower in one tiny mesh preserves the garment
    identity cue without paying four glTF object/material records per petal.
    """
    vertices = []
    faces = []
    for petal_index in range(4):
        angle = petal_index * math.pi * 0.5
        direction_x = math.cos(angle)
        direction_z = math.sin(angle)
        tangent_x = -direction_z
        tangent_z = direction_x
        inner = radius * 0.18
        outer = radius
        half_width = radius * 0.42
        base = len(vertices)
        vertices.extend((
            (direction_x * inner - tangent_x * half_width, 0, direction_z * inner - tangent_z * half_width),
            (direction_x * outer, -0.003, direction_z * outer),
            (direction_x * inner + tangent_x * half_width, 0, direction_z * inner + tangent_z * half_width),
            (0, -0.0015, 0),
        ))
        faces.append((base, base + 1, base + 2, base + 3))
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    link_material(obj, mat)
    bevel = obj.modifiers.new("Embroidery softness", "BEVEL")
    bevel.width = 0.002
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


def sculpted_ear_shell(name, location, skin_mat, concha_mat, parent=None, side=1, segments=24):
    """Create an inset helix/concha ear instead of two stacked ellipsoids.

    The old ear read as a bead glued to the head in three-quarter views.  This
    single authored shell has a raised outer helix, a recessed bowl and real
    back thickness, so the silhouette and shadow survive a full camera orbit.
    """
    width = 0.041
    height = 0.058
    vertices = []
    for index in range(segments):
        angle = math.tau * index / segments
        cosine = math.cos(angle)
        sine = math.sin(angle)
        # Four elliptical rings: front helix, inset concha lip and their back
        # surfaces.  Slight asymmetry at the lobe avoids a perfect torus read.
        lobe = max(0.0, -sine) * 0.004
        vertices.extend((
            (side * cosine * width, -0.004, sine * height - lobe),
            (side * cosine * width * 0.54, -0.022, sine * height * 0.61 - lobe * 0.35),
            (side * cosine * width, 0.018, sine * height - lobe),
            (side * cosine * width * 0.5, 0.008, sine * height * 0.58 - lobe * 0.3),
        ))
    front_center = len(vertices)
    vertices.append((side * 0.004, 0.002, -0.006))
    back_center = len(vertices)
    vertices.append((0, 0.019, -0.004))
    faces = []
    for index in range(segments):
        following = (index + 1) % segments
        outer_front = index * 4
        inner_front = outer_front + 1
        outer_back = outer_front + 2
        inner_back = outer_front + 3
        next_outer_front = following * 4
        next_inner_front = next_outer_front + 1
        next_outer_back = next_outer_front + 2
        next_inner_back = next_outer_front + 3
        faces.extend((
            (outer_front, next_outer_front, next_inner_front, inner_front),
            (outer_back, inner_back, next_inner_back, next_outer_back),
            (outer_front, outer_back, next_outer_back, next_outer_front),
            (inner_front, next_inner_front, front_center),
            (inner_back, back_center, next_inner_back),
        ))
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    link_material(obj, skin_mat)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    bevel = obj.modifiers.new("Ear helix softness", "BEVEL")
    bevel.width = 0.0026
    bevel.segments = 2

    # A short curved antihelix gives the inset bowl a readable warm shadow at
    # gameplay distance without returning to a painted, camera-facing decal.
    curve_tube(
        f"EarConcha_{side}",
        [
            (location[0] - side * 0.006, location[1] - 0.024, location[2] + 0.025),
            (location[0] + side * 0.011, location[1] - 0.028, location[2] + 0.006),
            (location[0] + side * 0.006, location[1] - 0.026, location[2] - 0.023),
        ],
        0.0032,
        concha_mat,
        parent,
        resolution=2,
    )
    return obj


def build_materials(role, config):
    costume = config["costume"]
    outer_surface = (
        "waxed canvas fabric"
        if costume == "traveler"
        else "weathered shell fabric"
        if costume == "listener"
        else "cardigan knit fabric"
    )
    top_surface = "fine poplin fabric" if costume in ("traveler", "facilitator", "mediator") else "jersey knit fabric"
    lower_surface = "pleated twill fabric" if costume in ("facilitator", "mediator") else "utility twill fabric"
    return {
        # Warm, high-roughness skin holds the target's peach value under the
        # portal key without becoming a pale clear-coated toy surface. Runtime
        # adds a restrained velvet wrap to the same real head geometry.
        "skin": material(f"{role} skin", config["skin"], 0.74, clearcoat=0.006),
        "skin_shadow": material(f"{role} hand crease", "#a96f67", 0.87),
        # Matte hair keeps the warm key light broad and painterly.  The older
        # clear-coated finish exposed every low-poly facet in the game camera.
        "hair": material(f"{role} hair", config["hair"], 0.67, clearcoat=0.008),
        "hair_highlight": material(f"{role} hair highlight", config["hair_highlight"], 0.63, clearcoat=0.011),
        # The reference uses a warm, softly reflective sclera and a large dark
        # iris.  Pure white with a tiny pupil read as a startled plastic doll
        # under the strong portal key.
        "eye_white": material(f"{role} eye white", "#f8eadf", 0.54, clearcoat=0.06),
        "eye_ring": material(f"{role} iris ring", config["eye_ring"], 0.43, clearcoat=0.11),
        "iris": material(f"{role} iris", config["eye"], 0.38, clearcoat=0.2),
        # Warm charcoal keeps the illustrated eye and lash language while
        # avoiding the pure-black sticker effect visible in the v77 paired
        # crop. The reference uses brown-violet linework that participates in
        # the room light rather than swallowing it.
        "ink": material(f"{role} ink", "#44343a", 0.62),
        "blush": material(f"{role} blush", "#dc9b91", 0.94),
        "lip": material(f"{role} lip", "#ad716c", 0.86, clearcoat=0.018),
        # Material names are part of the runtime surface contract. The
        # vertex-colour batcher keeps these authored categories as masks, so
        # poplin, knit, canvas and twill retain different micro-normal and
        # grazing-light responses after the source draw calls are merged.
        "top": material(f"{role} {top_surface}", config["top"], 0.91),
        "outer": material(f"{role} {outer_surface}", config["outer"], 0.9),
        "lower": material(f"{role} {lower_surface}", config["lower"], 0.88),
        "accent": material(f"{role} trim textile", config["accent"], 0.76),
        "shoe": material(f"{role} shoes", config["shoe"], 0.68),
        "sole": material(f"{role} soles", config["sole"], 0.8),
        "metal": material(f"{role} metal", "#c69b4a", 0.34, metallic=0.62),
        "paper": material(f"{role} paper", "#f5ead6", 0.93),
        "notebook_cover": material(f"{role} notebook leather", config["accent"], 0.64, clearcoat=0.012),
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
    # Five facial morph targets multiply every head vertex in the exported
    # GLB. A 44×30 surface remains visually smooth at the 46 cm gameplay head
    # scale while keeping all four roles inside the strict 2 MiB asset gate.
    face = ellipsoid("Head", (0, 0, 0), (0.228, 0.188, 0.27), mats["skin"], head, segments=44, rings=30)
    # Narrow the lower third into an illustrated jaw rather than leaving the
    # UV sphere's toy-like circular chin. The change is deliberately subtle so
    # all existing facial pivots and expression shape keys stay aligned.
    for vertex in face.data.vertices:
        x, y, z = vertex.co
        lower = max(0.0, min(1.0, (-z - 0.006) / 0.225))
        front = max(0.0, min(1.0, (-y - 0.015) / 0.17))
        # The previous taper was visible in profile but still resolved as a
        # circular doll face in the story camera. Pull the jaw in more firmly
        # while keeping the cheek band broad, matching the reference's soft
        # triangular lower face instead of shrinking the complete head.
        vertex.co.x *= 1.0 - lower * face_profile["jaw_taper"]
        if front > 0 and z < -0.02:
            vertex.co.y += lower * front * 0.006
        # Model a shallow cheek plane instead of relying on circular blush
        # stickers to imply the whole mid-face. The forward volume catches the
        # portal key and face fill differently as the camera orbits.
        cheek_height = max(0.0, min(1.0, 1.0 - abs(z + 0.035) / 0.095))
        cheek_centre = 0.118 * face_profile["cheek_spread"]
        cheek_width = max(0.0, min(1.0, 1.0 - abs(abs(x) - cheek_centre) / 0.075))
        if front > 0:
            vertex.co.y -= cheek_height * cheek_width * front * 0.0195 * face_profile["cheek_forward"]
        # Recess the eye socket and let the upper cheek transition forward
        # underneath it. This creates a continuous brow/eye/cheek plane under
        # moving light instead of a sphere with eye pieces pasted on top.
        socket_height = max(0.0, min(1.0, 1.0 - abs(z - 0.04) / 0.075))
        socket_width = max(0.0, min(1.0, 1.0 - abs(abs(x) - 0.083) / 0.07))
        vertex.co.y += socket_height * socket_width * front * 0.01
        # Build the eyelid root into the head topology. The visible lid meshes
        # still provide the clean illustrated edge, but this soft orbital ring
        # means they grow out of a continuous brow/cheek plane instead of
        # hovering over a spherical mask when seen in profile.
        eye_dx = abs(abs(x) - 0.081)
        eye_dz = abs(z - 0.04)
        orbital_radius = math.sqrt((eye_dx / 0.072) ** 2 + (eye_dz / 0.058) ** 2)
        orbital_rim = max(0.0, 1.0 - abs(orbital_radius - 0.78) / 0.3) * front
        upper_lid_root = max(0.0, min(1.0, (z - 0.018) / 0.07))
        lower_lid_root = max(0.0, min(1.0, (0.058 - z) / 0.07))
        vertex.co.y -= orbital_rim * (0.0045 + upper_lid_root * 0.002 + lower_lid_root * 0.001)
        upper_cheek = max(0.0, min(1.0, 1.0 - abs(z + 0.018) / 0.06)) * cheek_width
        vertex.co.y -= upper_cheek * front * 0.009
        # A restrained muzzle plane connects nose, philtrum and lips. Without
        # it, even improved eyes sat on a featureless spherical mask and the
        # mouth appeared detached under three-quarter light.
        muzzle_height = max(0.0, min(1.0, 1.0 - abs(z + 0.075) / 0.065))
        muzzle_width = max(0.0, min(1.0, 1.0 - abs(x) / 0.105))
        vertex.co.y -= muzzle_height * muzzle_width * front * 0.007 * face_profile["muzzle_forward"]
        # Give the lip surface a real vermilion bed in the same head mesh.
        # This shallow forward shelf disappears into the cheeks at the corners
        # and into the chin below, eliminating the sticker-like shadow gap that
        # appeared during speech and quarter-orbit captures.
        lip_height = max(0.0, min(1.0, 1.0 - abs(z + 0.09) / 0.042))
        lip_width = max(0.0, min(1.0, 1.0 - abs(x) / 0.082))
        lip_bed = lip_height * lip_width * front
        vertex.co.y -= lip_bed * 0.0048
        # Slightly compress the temple/forehead corners so the face reads as
        # an authored illustrated head rather than a uniformly round sphere.
        temple = max(0.0, min(1.0, (z - 0.08) / 0.16)) * max(0.0, min(1.0, (abs(x) - 0.12) / 0.1))
        vertex.co.x *= 1.0 - temple * face_profile["temple_taper"]
        chin = max(0.0, min(1.0, (-z - 0.115) / 0.135))
        vertex.co.z -= chin * front * face_profile["chin_length"]
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
    asymmetry = face.shape_key_add(name="SocialAsymmetry")
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

        # Human social expressions rarely resolve as two perfectly mirrored
        # cheeks. Lift one cheek/eye band while relaxing the opposite mouth
        # corner; runtime blends this gently by role and conversation phase.
        asymmetry_co = asymmetry.data[index].co
        side_bias = max(-1.0, min(1.0, x / 0.18))
        asymmetric_cheek = cheek * front * (0.35 + abs(side_bias) * 0.65)
        asymmetry_co.y -= asymmetric_cheek * side_bias * 0.006
        asymmetry_co.z += asymmetric_cheek * side_bias * 0.009
        if z < -0.035:
            asymmetry_co.z += front * lower * side_bias * 0.0055
            asymmetry_co.x *= 1.0 + front * lower * side_bias * 0.006
    for side in (-1, 1):
        sculpted_ear_shell(
            f"EarShell_{side}",
            (side * 0.231, 0.004, -0.014),
            mats["skin"],
            mats["blush"],
            head,
            side,
        )
        # Keep the eyes readable without letting two protruding white spheres
        # dominate the face.  A flatter corneal stack and a slightly narrower
        # sclera read much closer to the painted reference at gameplay scale.
        # The sculpted face reaches roughly 20 cm forward at the orbital band.
        # The former -0.186 m pivot left most of the real cornea behind the
        # morphable head surface; once the duplicate painted eye was correctly
        # removed, only a dark slit remained. Seat the eye stack at the actual
        # facial plane so sclera, iris and gaze remain volumetric and visible.
        eye = empty(f"EyePivot_{side}", head, (side * 0.081, -0.202, 0.044))
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
        # white, then layer a smaller coloured iris, pupil and one restrained
        # catchlight so gaze remains readable without the sparkly toy-eye look.
        eye_width = face_profile["eye_width"]
        eye_height = face_profile["eye_height"]
        outer_lift = face_profile["outer_eye_lift"]
        eye.rotation_euler.y = side * outer_lift * 2.8
        eye.rotation_euler.z = -side * outer_lift * 3.2
        ellipsoid(f"EyeWhite_{side}", (0, -0.001, 0), (eye_width, 0.0092, eye_height), mats["eye_white"], eye, segments=30, rings=18)
        ellipsoid(
            f"Iris_{side}",
            (-side * 0.001, -0.0095, -0.001),
            (face_profile["iris_width"], 0.0052, face_profile["iris_height"]),
            mats["eye_ring"],
            eye,
            segments=24,
            rings=14,
        )
        # A lighter outer iris and darker core retain role colour while keeping
        # the pupil distinct at the gameplay camera. The former single dark
        # ellipse collapsed into a black slit once lids and shadows were
        # composited.
        ellipsoid(
            f"IrisCore_{side}",
            (-side * 0.001, -0.014, -0.002),
            (face_profile["iris_width"] * 0.72, 0.0028, face_profile["iris_height"] * 0.76),
            mats["iris"],
            eye,
            segments=18,
            rings=10,
        )
        ellipsoid(f"Pupil_{side}", (-side * 0.001, -0.0162, -0.003), (0.0078, 0.0018, 0.0102), mats["ink"], eye, segments=16, rings=10)
        ellipsoid(f"EyeGlint_{side}", (-side * 0.0058, -0.0181, 0.0064), (0.0035, 0.0009, 0.0037), mats["eye_white"], eye, segments=10, rings=6)
        # A warm inner canthus connects the sclera to the nose/cheek plane and
        # removes the synthetic appearance of two ellipsoids pasted on skin.
        ellipsoid(
            f"EyeCanthus_{side}",
            (-side * (eye_width - 0.004), -0.0176, -0.002),
            (0.0062, 0.0015, 0.0044),
            mats["blush"],
            eye,
            segments=12,
            rings=8,
        )
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
        # One clean upper contour carries the expression at gameplay distance.
        # The former lower line, outer outline and crease stacked into three
        # dark stripes after shadowing and made every face look tired.
        curve_tube(
            f"UpperLid_{side}",
            [
                (-eye_width + 0.001, -0.018, 0.011 - side * outer_lift),
                (0, -0.019, eye_height - 0.001),
                (eye_width - 0.001, -0.018, 0.011 + side * outer_lift),
            ],
            # Strong illustrated linework is a defining part of the source.
            # The former sub-two-millimetre tube vanished after perspective
            # projection and left two bead-like irises floating on the face.
            0.00205 if feminine else 0.0019,
            mats["ink"],
            eye,
            resolution=2,
        )
        if feminine:
            curve_tube(
                f"OuterLash_{side}",
                [(side * 0.041, -0.012, 0.027), (side * 0.057, -0.014, 0.039)],
                0.0016,
                mats["ink"],
                eye,
                resolution=2,
            )
        # A short, skin-toned lower-orbit crease gives the eye a socket and a
        # cheek transition without adding the dark circular outline that made
        # the previous face read as a plastic doll.
        curve_tube(
            f"LowerLidCrease_{side}",
            [
                (-side * eye_width * 0.06, -0.014, -eye_height * 0.82),
                (side * eye_width * 0.38, -0.0145, -eye_height * 0.96),
                (side * eye_width * 0.72, -0.013, -eye_height * 0.72),
            ],
            0.00115,
            mats["skin_shadow"],
            eye,
            resolution=2,
        )
        brow = empty(f"BrowPivot_{side}", head, (side * 0.081, -0.204, 0.102))
        curve_tube(
            f"Brow_{side}",
            [
                (side * 0.058, 0.003, face_profile["brow_outer"]),
                (0, -0.007, face_profile["brow_apex"]),
                (-side * 0.052, 0.003, face_profile["brow_inner"]),
            ],
            0.0039 if feminine else 0.0041,
            mats["hair"],
            brow,
        )
        # Blush is a low-contrast cheek tint, not a graphic face sticker.
        ellipsoid(f"Blush_{side}", (side * 0.14, -0.194, -0.047), (0.022, 0.0017, 0.006), mats["blush"], head, segments=16, rings=8)
    # The gameplay camera sees the nose at only a few pixels.  Keep genuine
    # volume for three-quarter lighting, but reduce the former bead-like tip
    # and red underline that made the face feel assembled from primitives.
    ellipsoid("NoseBridge", (0, -0.183, 0.002), (0.0065, 0.0052, 0.019), mats["skin"], head, segments=18, rings=10)
    ellipsoid("NoseTip", (0, -0.1905, -0.019), (0.0095, 0.0065, 0.0095), mats["skin"], head, segments=18, rings=10)
    # One off-centre wing shadow reads as a softly turned nose. The previous
    # centred horizontal bead aligned with the philtrum and lip and became a
    # moustache-like bar at the gameplay camera.
    ellipsoid(
        "NoseWingShadow",
        (0.0042, -0.1975, -0.029),
        (0.0038, 0.0009, 0.00155),
        mats["skin_shadow"],
        head,
        rotation=(0, 0.06, -0.08),
        segments=12,
        rings=8,
    )
    curve_tube(
        "Philtrum",
        [(0, -0.1965, -0.038), (0, -0.199, -0.056), (0, -0.2, -0.071)],
        0.00075,
        mats["skin_shadow"],
        head,
        resolution=2,
    )
    mouth = empty("MouthPivot", head, (0, -0.201, -0.09))
    closed = empty("MouthClosedPivot", mouth)
    mouth_width = face_profile["mouth_width"]
    mouth_corner = face_profile["mouth_corner"]
    mouth_center = face_profile["mouth_center"]
    morphable_mouth_surface(
        "MouthClosed",
        mouth_width,
        mouth_corner,
        mouth_center,
        mats["lip"],
        closed,
    )
    open_mouth = empty("MouthOpenPivot", mouth)
    ellipsoid("MouthOpen", (0, -0.004, -0.002), (0.021, 0.0048, 0.014), mats["ink"], open_mouth, segments=20, rings=12)
    ellipsoid("Tongue", (0, -0.0087, -0.008), (0.0115, 0.0026, 0.0042), mats["lip"], open_mouth, segments=14, rings=8)
    # A real upper and lower lip rim preserves the reference's warm mouth
    # colour during speech. A naked charcoal ellipsoid looked like a punched
    # hole whenever the open-mouth swap happened to coincide with a capture.
    curve_tube(
        "MouthOpenUpperRim",
        [(-0.021, -0.009, 0), (0, -0.011, 0.011), (0.021, -0.009, 0)],
        0.00215,
        mats["lip"],
        open_mouth,
        resolution=2,
        bevel_resolution=2,
    )
    curve_tube(
        "MouthOpenLowerRim",
        [(-0.019, -0.009, -0.002), (0, -0.011, -0.013), (0.019, -0.009, -0.002)],
        0.00205,
        mats["lip"],
        open_mouth,
        resolution=2,
        bevel_resolution=2,
    )


def build_hair(head, mats, style):
    # Keep the cap inside the face silhouette.  A wide full sphere reads like a
    # plastic helmet from the follow camera, especially on the player whose
    # back faces the camera for most conversations.
    cap_scale = {
        # The source cast keeps the skull readable beneath grouped hair. The
        # former cap widths overhung the jaw by almost four centimetres per
        # side and turned every rear view into one toy helmet.
        "spiky": (0.239, 0.169, 0.219),
        "cap": (0.245, 0.178, 0.223),
        "coral_ponytail": (0.241, 0.179, 0.224),
        "braided_bob": (0.244, 0.18, 0.222),
    }.get(style, (0.244, 0.18, 0.224))
    cap = ellipsoid("HairCap", (0, 0.03, 0.08), cap_scale, mats["hair"], head, segments=50, rings=32)
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
    # Fine, low-relief flow ridges make the cap read as grouped hair rather
    # than a single glossy helmet. They follow the same head pivot and are
    # batched with the cap at runtime, so the richer orbit silhouette does not
    # add live draw calls.
    flow_specs = (
        (-0.15, -0.12),
        (-0.075, -0.055),
        (0.0, 0.012),
        (0.075, 0.08),
        (0.15, 0.145),
    )
    for index, (front_x, rear_x) in enumerate(flow_specs):
        curve_tube(
            f"HairFlowRidge_{index + 1}",
            [
                (front_x, -0.184, 0.185 - abs(front_x) * 0.08),
                ((front_x * 2 + rear_x) / 3, -0.105, 0.255 - abs(front_x) * 0.03),
                ((front_x + rear_x * 2) / 3, 0.025, 0.292 - abs(rear_x) * 0.045),
                (rear_x, 0.15, 0.185 - abs(rear_x) * 0.08),
            ],
            0.0028,
            mats["hair_highlight"],
            head,
            resolution=2,
        )
    # Broad, shallow ribbons create actual grouped strand planes rather than
    # relying on hair-colour noise in the runtime shader. They stay attached
    # to the same head pivot and are explicitly removed by the phone LOD,
    # where their projected width would be sub-pixel.
    ribbon_specs = (
        (-0.17, -0.13, 0.006),
        (-0.06, -0.035, 0.009),
        (0.055, 0.08, 0.008),
        (0.17, 0.145, 0.005),
    )
    for index, (front_x, rear_x, drift) in enumerate(ribbon_specs):
        tapered_lock(
            f"HairRibbon_{index + 1}",
            [
                (front_x, -0.178, 0.19 - abs(front_x) * 0.05),
                (front_x + drift, -0.11, 0.255 - abs(front_x) * 0.025),
                ((front_x + rear_x) * 0.5, 0.015, 0.286 - abs(rear_x) * 0.035),
                (rear_x, 0.132, 0.19 - abs(rear_x) * 0.065),
            ],
            (0.026, 0.023, 0.017, 0.003),
            mats["hair_highlight"],
            head,
            sides=8,
            oval_ratio=0.26,
        )
    # Six overlapping, wider locks replace the comb-like row of eight narrow
    # points. The silhouette reads as deliberately grouped hair at the story
    # camera while retaining complete side/back volume.
    fringe_specs = (
        (-0.19, -0.145, 0.205, 0.031),
        (-0.12, -0.058, 0.18, 0.035),
        (-0.045, 0.012, 0.16, 0.036),
        (0.035, 0.092, 0.168, 0.035),
        (0.115, 0.17, 0.19, 0.033),
        (0.19, 0.15, 0.21, 0.03),
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
            (root_radius * 0.82, root_radius * 0.96, root_radius * 0.72, root_radius * 0.42, 0.0032),
            mats["hair_highlight"] if index in (1, 4) else mats["hair"],
            head,
            sides=10,
            oval_ratio=0.31,
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
            (0.054, 0.058, 0.041, 0.006),
            mats["hair"],
            head,
            sides=10,
            oval_ratio=0.34,
        )
        # A broad front-to-temple lock bridges the crown, fringe and side
        # volume. Without it, the large cap remained a helmet with decorative
        # spikes attached; the reference frames each face with two readable
        # clumps that continue naturally into the side silhouette.
        frame_tip_z = {
            "spiky": -0.005,
            "cap": -0.035,
            # Preserve the source's face-framing red lock without letting it
            # cross the painted iris at the authored three-quarter camera.
            # The former chin-length strip made the facilitator read as a
            # faceless hair column whenever she turned toward the player.
            "coral_ponytail": -0.045,
            "braided_bob": -0.085,
        }.get(style, -0.04)
        frame_drift = {
            "spiky": 0.015,
            "cap": 0.008,
            "coral_ponytail": 0.038,
            "braided_bob": 0.018,
        }.get(style, 0.012)
        frame_root_x = 0.15 if style == "coral_ponytail" else 0.125
        frame_radii = (
            (0.03, 0.033, 0.023, 0.0035)
            if style == "coral_ponytail"
            else (0.038, 0.041, 0.028, 0.004)
        )
        tapered_lock(
            f"FaceFrameLock_{side}",
            [
                (side * frame_root_x, -0.105, 0.238),
                (side * (0.19 if style == "coral_ponytail" else 0.178), -0.165, 0.175),
                (side * (0.215 + frame_drift), -0.202, 0.085),
                (side * (0.218 + frame_drift), -0.194, frame_tip_z),
            ],
            frame_radii,
            mats["hair_highlight"] if side == -1 else mats["hair"],
            head,
            sides=10,
            oval_ratio=0.3,
        )
        # A fine secondary wisp gives the face frame an intentional taper and
        # catches one restrained highlight beside the cheek. This is genuine
        # head-attached geometry, not a camera-facing painted strand.
        wisp_tip_z = {
            "spiky": 0.018,
            "cap": -0.008,
            "coral_ponytail": -0.028,
            "braided_bob": -0.062,
        }.get(style, -0.02)
        tapered_lock(
            f"HairTempleWisp_{side}",
            [
                (side * 0.173, -0.155, 0.17),
                (side * 0.206, -0.205, 0.11),
                (side * 0.218, -0.221, 0.045),
                (side * 0.205, -0.218, wisp_tip_z),
            ],
            (0.014, 0.012, 0.007, 0.0022),
            mats["hair_highlight"],
            head,
            sides=8,
            oval_ratio=0.26,
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
                sides=10,
                oval_ratio=0.27,
            )
        # Four broad, flattened overlapping ribbons build one continuous rear
        # hair mass. The previous five round tubes produced a broccoli/bead
        # silhouette from the follow camera even though their roots touched.
        # Alternating sweeps now expose large painterly planes and one clean
        # asymmetrical contour through a complete 360-degree orbit.
        for index, (root_x, shoulder_x, tip_x, tip_z) in enumerate((
            (-0.205, -0.225, -0.265, 0.055),
            (-0.072, -0.12, -0.145, -0.055),
            (0.07, 0.125, 0.155, -0.045),
            (0.205, 0.23, 0.27, 0.072),
        )):
            tapered_lock(
                f"BackHairLock_{index + 1}",
                [
                    (root_x, 0.105, 0.198 - abs(root_x) * 0.1),
                    (shoulder_x, 0.174, 0.145 - abs(root_x) * 0.06),
                    ((shoulder_x + tip_x) * 0.5, 0.224, tip_z + 0.065),
                    (tip_x, 0.205, tip_z),
                ],
                (0.052, 0.055, 0.038, 0.006),
                mats["hair_highlight"] if index in (1, 2) else mats["hair"],
                head,
                sides=10,
                oval_ratio=0.22,
            )
    elif style == "coral_ponytail":
        # Keep a visible tied crown without the oversized spherical mass that
        # previously read as a second plastic head in the story camera.
        ellipsoid("HairBun", (0.185, 0.115, 0.18), (0.116, 0.098, 0.122), mats["hair"], head, segments=24, rings=14)
        ponytail = empty("PonytailPivot", head, (0.19, 0.115, 0.15))
        torus(
            "PonytailBand",
            0.102,
            0.012,
            (0.01, 0.0, -0.018),
            mats["accent"],
            ponytail,
            rotation=(math.pi / 2, 0, 0),
            major_segments=28,
        )
        tapered_lock(
            "Ponytail_Main",
            [
                (0, 0, 0),
                (0.07, 0.012, -0.1),
                (0.115, 0.004, -0.22),
                (0.08, -0.006, -0.37),
                (0.12, -0.022, -0.52),
                (0.06, -0.04, -0.66),
            ],
            # A narrower S-curve exposes the layered locks and reads as tied
            # hair rather than the single vertical rubber hose visible in the
            # v97 cast comparison.
            (0.075, 0.081, 0.071, 0.06, 0.045, 0.01),
            mats["hair"],
            ponytail,
            sides=10,
            oval_ratio=0.38,
        )
        # Layered flyaway locks break the single rubber-hose ponytail into the
        # soft, authored red-hair silhouette visible in the reference.
        for index, (offset_x, offset_y, tip_x) in enumerate((
            (-0.065, -0.018, -0.015),
            (0.012, 0.014, 0.072),
            (0.075, -0.006, 0.14),
        )):
            tapered_lock(
                f"PonytailLayer_{index + 1}",
                [
                    (0.01 + offset_x, offset_y, -0.08),
                    (0.07 + offset_x, 0.018 + offset_y, -0.22),
                    (0.045 + offset_x, -0.002 + offset_y, -0.4),
                    (tip_x, -0.03 + offset_y, -0.6),
                ],
                (0.041, 0.043, 0.032, 0.005),
                mats["hair_highlight"] if index != 1 else mats["hair"],
                ponytail,
                sides=10,
                oval_ratio=0.3,
            )
    elif style == "braided_bob":
        # Build one continuous interwoven crown. The former five pointed
        # vertical knots resolved as a row of brown teeth; these overlapping
        # horizontal locks follow the skull arc and alternate depth/material,
        # preserving a readable braid through front, side and reverse orbit.
        crown_centres = (-0.175, -0.0875, 0.0, 0.0875, 0.175)
        for index, centre_x in enumerate(crown_centres):
            arch = max(0.0, 1.0 - (centre_x / 0.225) ** 2)
            crown_z = 0.172 + arch * 0.076
            weave = -1 if index % 2 == 0 else 1
            tapered_lock(
                f"BraidedCrownLock_{index + 1}",
                [
                    (centre_x - 0.061, -0.058 + weave * 0.007, crown_z - 0.014),
                    (centre_x - 0.027, -0.104 - weave * 0.006, crown_z + 0.019),
                    (centre_x + 0.027, -0.108 + weave * 0.006, crown_z - 0.013),
                    (centre_x + 0.061, -0.061 - weave * 0.007, crown_z + 0.006),
                ],
                (0.045, 0.051, 0.044, 0.008),
                mats["hair_highlight"] if index % 2 else mats["hair"],
                head,
                sides=10,
                oval_ratio=0.25,
            )
        # Layered side locks replace the bead stack that made the bob look
        # assembled from toy balls. Each lock has a distinct sweep and tapered
        # end, while remaining fully volumetric and head-attached.
        for side in (-1, 1):
            for layer_index, (root_x, drift, tip_z) in enumerate((
                (0.16, 0.048, -0.04),
                (0.19, 0.056, -0.085),
                (0.215, 0.038, -0.12),
            )):
                tapered_lock(
                    f"BobSideLock_{side}_{layer_index + 1}",
                    [
                        (side * root_x, -0.045 + layer_index * 0.012, 0.175 - layer_index * 0.025),
                        (side * (root_x + drift), -0.086, 0.105 - layer_index * 0.03),
                        (side * (root_x + drift + 0.012), -0.082, 0.02 - layer_index * 0.025),
                        (side * (root_x + 0.018), -0.046, tip_z),
                    ],
                    (0.044, 0.052, 0.039, 0.007),
                    mats["hair_highlight"] if layer_index == 1 else mats["hair"],
                    head,
                    sides=10,
                    oval_ratio=0.32,
                )
            tapered_lock(
                f"TempleWave_{side}",
                [
                    (side * 0.185, -0.055, 0.17),
                    (side * 0.235, -0.09, 0.105),
                    (side * 0.248, -0.065, 0.025),
                    (side * 0.22, -0.025, -0.075),
                ],
                (0.046, 0.052, 0.039, 0.007),
                mats["hair_highlight"],
                head,
                sides=10,
                oval_ratio=0.3,
            )
        # A bob needs a continuous nape silhouette as well as decorative
        # crown knots. These overlapping rear locks bridge the cap to the neck
        # and remove the bowl-cut gap exposed by the follow camera.
        for index, (root_x, tip_x) in enumerate((
            (-0.18, -0.2),
            (-0.09, -0.105),
            (0.0, 0.0),
            (0.09, 0.105),
            (0.18, 0.2),
        )):
            tapered_lock(
                f"BobNapeLock_{index + 1}",
                [
                    (root_x, 0.13, 0.13 - abs(root_x) * 0.18),
                    ((root_x + tip_x) * 0.5, 0.2, 0.06 - abs(root_x) * 0.1),
                    (tip_x, 0.21, -0.055 - abs(tip_x) * 0.08),
                ],
                (0.044, 0.04, 0.008),
                mats["hair_highlight"] if index in (1, 3) else mats["hair"],
                head,
                sides=10,
                oval_ratio=0.28,
            )


def build_cap(head, mats):
    ellipsoid("CapCrown", (0, -0.005, 0.255), (0.29, 0.22, 0.12), mats["top"], head, segments=28, rings=14)
    rounded_box("CapBrim", (0.28, 0.19, 0.035), (0, -0.24, 0.215), mats["top"], head, radius=0.025, rotation=(math.radians(8), 0, 0))
    torus("CapBadge", 0.035, 0.012, (0.09, -0.226, 0.286), mats["accent"], head, rotation=(math.pi / 2, 0, 0), major_segments=20)


def build_body(role, config, mats, visual):
    profile = BODY_PROFILES[role]
    # The body now owns explicit neck, shoulder, rib, waist and lower-abdomen
    # rings. The former scaled sphere tapered to points at both ends and made
    # the shoulders read like disconnected toy arms under a floating head.
    torso_width = profile["torso_width"]
    torso_depth = profile["torso_depth"]
    torso = contoured_elliptical_shell(
        "Torso",
        (
            (0.76, 0.152 * profile["waist_width"], 0.108 * torso_depth, 0.005, 0.004),
            (0.81, 0.18 * profile["waist_width"], 0.126 * torso_depth, 0.008, 0.005),
            (0.9, 0.194 * torso_width, 0.139 * torso_depth, 0.012, 0.006),
            (1.02, 0.218 * torso_width, 0.151 * torso_depth, 0.018, 0.008),
            (1.13, 0.242 * torso_width, 0.157 * torso_depth, 0.021, 0.009),
            (1.22, 0.266 * torso_width, 0.153 * torso_depth, 0.016, 0.008),
            (1.285, 0.218 * torso_width, 0.137 * torso_depth, 0.01, 0.006),
            (1.34, 0.128 * torso_width, 0.096 * torso_depth, 0.004, 0.004),
            (1.38, 0.071, 0.066, 0.001, 0.001),
        ),
        mats["top"],
        visual,
        segments=40,
        contract="mirrorlife-civic-body-identity-v6",
    )
    # A garment-level shoulder mantle bridges the clavicle shelf and the real
    # arm deformation volume. It is deliberately shallow and asymmetric in
    # depth: from three-quarter and reverse views this reads as a tailored
    # shoulder plane, not a sphere glued to a tube.
    for side in (-1, 1):
        tailored_panel(
            f"ShoulderMantle_{side}",
            0.196 * torso_width,
            0.158 * torso_width,
            0.112 * torso_width,
            0.18,
            0.052 * torso_depth,
            (side * 0.168 * torso_width, -0.114 * torso_depth, 1.216),
            mats["top"],
            visual,
            radius=0.014,
            rotation=(0.035, side * 0.075, side * 0.12),
        )
        cloth_fold_ribbon(
            f"ShoulderLoadFold_{side}",
            [
                (side * 0.245 * torso_width, -0.151 * torso_depth, 1.252),
                (side * 0.192 * torso_width, -0.171 * torso_depth, 1.17),
                (side * 0.135 * torso_width, -0.169 * torso_depth, 1.07),
            ],
            (0.002, 0.01, 0.002),
            mats["top"],
            visual,
            depth=0.007,
        )
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
    # Keep the neck subordinate to the face and collar. The previous 15 cm
    # diameter cylinder remained visible as a toy peg whenever the actor
    # turned three-quarter; a slimmer, shorter volume gives the jaw and
    # shoulder line a continuous illustrated transition.
    # A four-ring neck/clavicle transition replaces the old straight
    # cylinder. Its lower ring overlaps the tailored shoulder plane, the middle
    # ring carries the visible neck, and the upper ring disappears under the
    # jaw. This keeps the silhouette continuous while the head turns.
    contoured_elliptical_shell(
        "Neck",
        (
            (1.335, 0.092, 0.074, 0.0, 0.004),
            (1.37, 0.071, 0.062, 0.0, 0.002),
            (1.43, 0.062, 0.057, 0.0, 0.0),
            (1.465, 0.068, 0.061, 0.0, -0.001),
        ),
        mats["skin"],
        visual,
        # Sixteen sides are visually smooth at a 6–9 cm radius and keep the
        # mobile scene under its strict 250k triangle budget.
        segments=16,
        contract="mirrorlife-civic-neck-continuity-v2",
    )
    rounded_box(
        "WaistBand",
        (0.35 * profile["waist_width"], 0.21 * profile["torso_depth"], 0.046),
        (0, -0.005, 0.79),
        mats["accent"],
        visual,
        radius=0.021,
    )

    shoulder_x = profile["shoulder_x"]
    hip_x = profile["hip_x"]
    left_arm = empty("LeftArmPivot", visual, (-shoulder_x, 0, 1.23))
    right_arm = empty("RightArmPivot", visual, (shoulder_x, 0, 1.23))
    left_elbow = empty("LeftElbowPivot", left_arm, (0, 0, -0.235))
    right_elbow = empty("RightElbowPivot", right_arm, (0, 0, -0.235))
    left_leg = empty("LeftLegPivot", visual, (-hip_x, 0, 0.78))
    right_leg = empty("RightLegPivot", visual, (hip_x, 0, 0.78))
    left_knee = empty("LeftKneePivot", left_leg, (0, 0, -0.32))
    right_knee = empty("RightKneePivot", right_leg, (0, 0, -0.32))

    # The reference player's cream short-sleeve shirt is a defining identity
    # cue around the green vest.  Building the whole arm from the vest material
    # turned the player into a green long-sleeve toy and broke the 2D-to-3D
    # costume mapping. Keep the continuous deformation mesh cream for the
    # traveler; a real skin forearm below covers its lower section.
    sleeve_mat = mats["outer"] if config["costume"] in ("facilitator", "mediator") else mats["top"]
    # Every costume now owns a pelvis foundation. The skirted roles previously
    # depended on the skirt cone alone, so the waist appeared to float above
    # two legs whenever the hem moved. The shared foundation creates a real
    # load-bearing hip plane while remaining hidden beneath each outer layer.
    pelvis_name = "TrouserSeat" if config["costume"] in ("traveler", "listener") else "SkirtHipFoundation"
    pelvis_material = mats["lower"]
    trouser_seat = contoured_elliptical_shell(
            pelvis_name,
            (
                (0.655, 0.154 * profile["waist_width"], 0.105 * profile["torso_depth"], 0.004, 0.008),
                (0.695, 0.186 * profile["waist_width"], 0.124 * profile["torso_depth"], 0.008, 0.013),
                (0.745, 0.215 * profile["waist_width"], 0.143 * profile["torso_depth"], 0.012, 0.017),
                (0.79, 0.224 * profile["waist_width"], 0.149 * profile["torso_depth"], 0.013, 0.019),
                (0.825, 0.205 * profile["waist_width"], 0.136 * profile["torso_depth"], 0.008, 0.014),
                (0.852, 0.176 * profile["waist_width"], 0.116 * profile["torso_depth"], 0.004, 0.008),
            ),
            pelvis_material,
            visual,
            segments=30,
            contract="mirrorlife-civic-pelvis-continuity-v3",
        )
    trouser_seat["garment_contract"] = "mirrorlife-civic-pelvis-continuity-v3"
    for side in (-1, 1):
        cloth_fold_ribbon(
            f"HipLoadFold_{side}",
            [
                (side * 0.115, -0.145, 0.825),
                (side * 0.158, -0.162, 0.765),
                (side * 0.142, -0.15, 0.69),
            ],
            (0.002, 0.009, 0.002),
            pelvis_material,
            visual,
            depth=0.006,
        )

    skin_armature = create_skin_armature(visual, shoulder_x, hip_x)
    arm_width = profile["arm_width"]
    arm_depth = profile["arm_depth"]
    leg_width = profile["leg_width"]
    leg_depth = profile["leg_depth"]
    build_skinned_limb_pair(
        "SkinnedArmVolume",
        (-shoulder_x, shoulder_x),
        tuple(
            (z, radius_x * arm_width, radius_y * arm_depth, centre_y, inward_offset)
            for z, radius_x, radius_y, centre_y, inward_offset in (
                # Pull the upper rings into the shoulder line before releasing
                # them toward the elbow. A perfectly vertical tube exposed
                # the rig as a mannequin at three-quarter angles; this
                # centimetre-scale S profile gives the sleeve a believable
                # deltoid-to-bicep transition while preserving the collider.
                # The two high rings overlap the contoured torso shoulder
                # shelf and are weighted to the same real shoulder bone. This
                # closes the toy ball-joint seam without adding eight runtime
                # draw calls for separate cap objects.
                # A real shoulder is not the narrow end of a tube.  The first
                # three rings form a shallow deltoid cap that overlaps the
                # clavicle mantle, then the bicep turns slightly forward before
                # narrowing into the elbow.  Below the hinge, a second small
                # flare carries the forearm flexor mass into the wrist.
                (1.315, 0.116, 0.106, 0.001, 0.029),
                (1.286, 0.119, 0.109, 0.001, 0.025),
                (1.252, 0.112, 0.102, 0.0, 0.019),
                (1.205, 0.101, 0.092, -0.002, 0.013),
                (1.145, 0.092, 0.084, -0.005, 0.008),
                (1.085, 0.086, 0.078, -0.007, 0.004),
                (1.035, 0.079, 0.073, -0.008, 0.001),
                (1.005, 0.073, 0.068, -0.006, 0),
                (0.982, 0.069, 0.065, -0.004, 0),
                (0.945, 0.071, 0.067, -0.002, 0),
                (0.895, 0.073, 0.068, 0.001, 0),
                (0.83, 0.069, 0.064, 0.003, 0),
                (0.76, 0.061, 0.057, 0.004, 0),
                (0.705, 0.053, 0.049, 0.002, 0),
            )
        ),
        0.995,
        sleeve_mat,
        skin_armature,
        (("SkinLeftArm", "SkinLeftElbow"), ("SkinRightArm", "SkinRightElbow")),
        sides=18,
    )
    build_skinned_limb_pair(
        "SkinnedLegVolume",
        (-hip_x, hip_x),
        tuple(
            (z, radius_x * leg_width, radius_y * leg_depth, centre_y)
            for z, radius_x, radius_y, centre_y in (
                (0.78, 0.106, 0.1, 0.002),
                (0.695, 0.109, 0.103, 0.004),
                (0.59, 0.102, 0.096, 0.006),
                (0.505, 0.089, 0.084, 0.003),
                (0.46, 0.082, 0.077, 0),
                (0.415, 0.084, 0.08, -0.002),
                (0.335, 0.089, 0.084, -0.005),
                (0.245, 0.084, 0.079, -0.005),
                (0.135, 0.067, 0.063, -0.002),
            )
        ),
        0.46,
        mats["lower"],
        skin_armature,
        (("SkinLeftLeg", "SkinLeftKnee"), ("SkinRightLeg", "SkinRightKnee")),
        sides=24,
    )
    for side, pivot, elbow in ((-1, left_arm, left_elbow), (1, right_arm, right_elbow)):
        sleeve_compression = empty(f"SleeveCompressionPivot_{side}", elbow)
        sleeve_compression["corrective_contract"] = "mirrorlife-civic-cloth-correctives-v1"
        # This lower-bone corrective occupies the elbow's collapsing volume.
        # It is mostly hidden inside the continuous skin while straight, then
        # the runtime broadens it with bend angle so linear skinning cannot
        # pinch the sleeve into a narrow drinking straw.
        organic_limb(
            f"ElbowCorrectiveVolume_{side}",
            0.15,
            (
                (0.5, 0.061 * arm_width, 0.057 * arm_depth, 0, 0.002),
                (0.18, 0.071 * arm_width, 0.068 * arm_depth, -side * 0.0015, -0.004),
                (-0.18, 0.071 * arm_width, 0.068 * arm_depth, side * 0.0015, -0.004),
                (-0.5, 0.06 * arm_width, 0.056 * arm_depth, 0, 0.001),
            ),
            (0, 0, 0),
            sleeve_mat,
            sleeve_compression,
            sides=14,
        )
        if config["costume"] == "traveler":
            # A separately surfaced forearm remains parented to the elbow, so
            # it follows the real walk/listen/gesture rig rather than becoming
            # a static colour patch. It sits a few millimetres above the
            # continuous cream deformation volume and therefore preserves a
            # gap-free elbow while restoring the source's bare-arm read.
            organic_limb(
                f"TravelerForearmSkin_{side}",
                0.245,
                (
                    (0.5, 0.075 * arm_width, 0.069 * arm_depth, side * 0.001, -0.002),
                    (0.31, 0.074 * arm_width, 0.068 * arm_depth, -side * 0.001, -0.003),
                    (0.08, 0.071 * arm_width, 0.065 * arm_depth, -side * 0.002, -0.004),
                    (-0.16, 0.066 * arm_width, 0.061 * arm_depth, -side * 0.0025, -0.003),
                    (-0.36, 0.061 * arm_width, 0.057 * arm_depth, -side * 0.0015, -0.001),
                    (-0.5, 0.056 * arm_width, 0.052 * arm_depth, 0, 0),
                ),
                (0, -0.001, -0.145),
                mats["skin"],
                elbow,
                sides=18,
            )
            contoured_elliptical_shell(
                f"TravelerShortSleeveHem_{side}",
                (
                    (-0.056, 0.065 * arm_width, 0.059 * arm_depth, side * 0.001, 0),
                    (-0.037, 0.072 * arm_width, 0.065 * arm_depth, side * 0.002, -0.002),
                    (-0.012, 0.074 * arm_width, 0.067 * arm_depth, -side * 0.001, -0.003),
                    (0.01, 0.068 * arm_width, 0.061 * arm_depth, -side * 0.002, -0.001),
                ),
                mats["outer"],
                elbow,
                segments=16,
                contract="mirrorlife-civic-garment-topology-v5",
            )
        if config["costume"] in ("traveler", "listener", "facilitator", "mediator"):
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
                sleeve_compression,
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
                sleeve_compression,
                depth=0.006,
            )
            # A soft inner elbow fold and a broader outside tension plane make
            # the bend legible without a hard seam.  Both live on the lower
            # controller and are scaled by the existing bend corrective, so
            # they appear only when the arm actually flexes.
            cloth_fold_ribbon(
                f"ArmInnerElbowFold_{side}",
                [
                    (-side * 0.044, -0.069, -0.058),
                    (-side * 0.012, -0.078, -0.094),
                    (side * 0.032, -0.067, -0.132),
                ],
                (0.002, 0.011, 0.002),
                mats["skin"] if config["costume"] == "traveler" else sleeve_mat,
                sleeve_compression,
                depth=0.008,
            )
            cloth_fold_ribbon(
                f"ArmOuterTensionPlane_{side}",
                [
                    (side * 0.052, 0.048, -0.04),
                    (side * 0.062, 0.055, -0.108),
                    (side * 0.046, 0.045, -0.176),
                ],
                (0.002, 0.009, 0.002),
                sleeve_mat,
                sleeve_compression,
                depth=0.006,
            )
        if config["costume"] == "listener":
            # The weather shell owns a soft, tapered cuff. The old perfectly
            # round bracelet severed the forearm from the hand and remained
            # visible as a hard toy ring from every orbit.
            contoured_elliptical_shell(
                f"ListenerCuff_{side}",
                (
                    (-0.296, 0.052 * arm_width, 0.048 * arm_depth, 0, 0),
                    (-0.278, 0.059 * arm_width, 0.054 * arm_depth, 0, -0.001),
                    (-0.252, 0.062 * arm_width, 0.057 * arm_depth, 0, -0.001),
                    (-0.232, 0.057 * arm_width, 0.052 * arm_depth, 0, 0),
                ),
                mats["accent"],
                elbow,
                segments=16,
                contract="mirrorlife-civic-garment-topology-v5",
            )
        if config["costume"] == "facilitator":
            hand_pose = "notebook-support" if side == -1 else "notebook-guide"
            hand_rotation = (
                0.035 if side == -1 else -0.025,
                side * (0.17 if side == -1 else 0.23),
                -side * (0.18 if side == -1 else 0.28),
            )
        elif config["costume"] == "mediator":
            hand_pose = "thoughtful" if side == 1 else "open"
            hand_rotation = (0.08 if side == 1 else -0.03, -side * 0.13, -side * 0.16)
        elif config["costume"] == "listener":
            hand_pose = "soft-cup"
            hand_rotation = (-0.04, side * 0.08, -side * 0.1)
        else:
            hand_pose = "relaxed"
            hand_rotation = (0.02, side * 0.04, -side * 0.055)
        hand = sculpted_hand(
            f"Hand_{side}",
            (0, -0.007, -0.305),
            mats["skin"],
            mats["skin_shadow"],
            elbow,
            rotation=hand_rotation,
            side=side,
            pose_style=hand_pose,
        )
        hand.scale = (
            profile["hand_scale"],
            profile["hand_scale"],
            profile["hand_scale"],
        )
        # A real child transform at the fingertip gives the runtime a stable
        # effector for prop contact. Solving against the wrist pivot made the
        # entire palm disappear into the notebook because the renderer had no
        # authored knowledge of where the curled fingers actually end.
        hand_contact = empty(
            f"HandContactAnchor_{side}",
            hand,
            (0, -0.002, -0.078 if config["costume"] == "facilitator" else -0.072),
        )
        hand_contact["contact_contract"] = "mirrorlife-civic-contact-anchor-v1"

    for side, pivot, knee in ((-1, left_leg, left_knee), (1, right_leg, right_knee)):
        trouser_compression = empty(f"TrouserCompressionPivot_{side}", knee)
        trouser_compression["corrective_contract"] = "mirrorlife-civic-cloth-correctives-v1"
        organic_limb(
            f"KneeCorrectiveVolume_{side}",
            0.17,
            (
                (0.5, 0.076 * leg_width, 0.071 * leg_depth, 0, 0.001),
                (0.17, 0.088 * leg_width, 0.084 * leg_depth, -side * 0.001, -0.005),
                (-0.17, 0.088 * leg_width, 0.084 * leg_depth, side * 0.001, -0.005),
                (-0.5, 0.073 * leg_width, 0.068 * leg_depth, 0, 0.001),
            ),
            (0, 0, 0),
            mats["lower"],
            trouser_compression,
            sides=16,
        )
        # Two shallow same-material ribbons catch the warm key light like cloth
        # tension instead of reading as cords glued onto the trousers.
        for fold_index, fold_x in enumerate((-0.035, 0.035)):
            cloth_fold_ribbon(
                f"TrouserFold_{side}_{fold_index + 1}",
                [(fold_x, -0.078, -0.035), (fold_x * 0.55, -0.086, -0.155), (fold_x * 0.8, -0.078, -0.265)],
                (0.002, 0.008, 0.002),
                mats["lower"],
                trouser_compression,
                depth=0.006,
            )
        # A folded, asymmetric ankle transition connects trouser/skirt leg to
        # the shoe collar. Four rings replace the uniform cylinder that read as
        # a plastic bracelet around every ankle.
        contoured_elliptical_shell(
            f"TrouserCuff_{side}",
            (
                (-0.332, 0.063 * leg_width, 0.057 * leg_depth, side * 0.001, 0),
                (-0.31, 0.076 * leg_width, 0.068 * leg_depth, side * 0.002, -0.002),
                (-0.278, 0.079 * leg_width, 0.071 * leg_depth, -side * 0.001, -0.003),
                (-0.252, 0.07 * leg_width, 0.063 * leg_depth, -side * 0.002, -0.001),
            ),
            mats["accent"],
            knee,
            segments=16,
            contract="mirrorlife-civic-garment-topology-v5",
        )
        sculpted_shoe(
            f"ShoeUpper_{side}",
            (0, 0, -0.395),
            mats["shoe"],
            mats["sole"],
            knee,
            side=side,
            style="ankle-boot" if config["costume"] in ("facilitator", "mediator") else "sneaker",
            scale=profile["foot_scale"],
            toe_out=profile["toe_out"],
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
                0.151,
                0.116,
                0.142,
                0.315,
                0.043,
                (side * 0.081, -0.184, 1.055),
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
        backpack = empty("BackpackPivot", visual, (0, 0.148, 1.02))
        # A rounded volume avoids the large rectangular block that dominates
        # the default follow-camera view from behind the player.
        ellipsoid("Backpack", (0, 0, 0), (0.163, 0.086, 0.202), mats["accent"], backpack, segments=28, rings=18)
        rounded_box("BackpackFlap", (0.232, 0.034, 0.108), (0, 0.08, 0.086), mats["shoe"], backpack, radius=0.025)
        rounded_box("BackpackPocket", (0.184, 0.034, 0.116), (0, 0.08, -0.081), mats["outer"], backpack, radius=0.028)
        curve_tube("BackpackHandle", [(-0.072, 0.02, 0.21), (0, 0.064, 0.244), (0.072, 0.02, 0.21)], 0.012, mats["shoe"], backpack, resolution=2)
        cloth_fold_ribbon(
            "BackpackCenterDrape",
            [(0, 0.106, 0.08), (0.012, 0.112, -0.02), (0, 0.106, -0.16)],
            (0.002, 0.012, 0.002),
            mats["accent"],
            backpack,
            depth=0.007,
        )
        for side in (-1, 1):
            rounded_box(f"BackpackSidePocket_{side}", (0.058, 0.096, 0.132), (side * 0.163, 0.014, -0.07), mats["outer"], backpack, radius=0.02)
            curve_tube(
                f"BackpackStrap_{side}",
                [(side * 0.132, 0.087, 0.216), (side * 0.16, 0.118, 0.018), (side * 0.132, 0.091, -0.188)],
                0.016,
                mats["shoe"],
                backpack,
            )
            rounded_box(f"BackpackBuckle_{side}", (0.05, 0.023, 0.058), (side * 0.148, 0.115, -0.036), mats["metal"], backpack, radius=0.011)
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
        # Construction details belong to the teal shell, not the ivory hood.
        # The old white seam, hem, drawstrings and cross-body strap intersected
        # as a bright X and made the jacket read like an exposed mannequin rig.
        curve_tube("JacketCenterSeam", [(0, -0.205, 0.83), (0, -0.216, 1.04), (0, -0.205, 1.24)], 0.005, mats["shoe"], visual, resolution=2)
        curve_tube("JacketHem", [(-0.2, -0.13, 0.79), (0, -0.205, 0.77), (0.2, -0.13, 0.79)], 0.006, mats["shoe"], visual, resolution=2)
        # Give the teal jacket a believable opening, drawstrings and working
        # pockets. These small construction cues survive the social camera and
        # replace the former uninterrupted plastic torso.
        for side in (-1, 1):
            tailored_panel(
                f"ListenerCollar_{side}",
                0.12,
                0.09,
                0.045,
                0.17,
                0.026,
                (side * 0.057, -0.202, 1.19),
                mats["outer"],
                visual,
                radius=0.01,
                rotation=(0, side * 0.05, side * 0.5),
            )
            curve_tube(
                f"HoodDrawstring_{side}",
                [
                    (side * 0.095, -0.21, 1.22),
                    (side * 0.1, -0.224, 1.09),
                    (side * 0.11, -0.223, 0.995),
                ],
                0.0048,
                mats["shoe"],
                visual,
                resolution=2,
            )
            cylinder(
                f"HoodDrawstringTip_{side}",
                0.011,
                0.009,
                0.035,
                (side * 0.11, -0.223, 0.975),
                mats["metal"],
                visual,
                vertices=10,
            )
            rounded_box(
                f"ListenerPocketWelt_{side}",
                (0.12, 0.026, 0.045),
                (side * 0.125, -0.218, 0.9),
                mats["shoe"],
                visual,
                radius=0.009,
                rotation=(0.04, side * 0.03, side * 0.12),
            )
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
        rounded_box("Satchel", (0.29, 0.125, 0.235), (0.28, 0.075, 0.8), mats["accent"], visual, radius=0.057)
        rounded_box("SatchelFlap", (0.23, 0.032, 0.08), (0.28, -0.002, 0.855), mats["shoe"], visual, radius=0.018)
        rounded_box("SatchelClasp", (0.05, 0.022, 0.058), (0.28, -0.023, 0.82), mats["metal"], visual, radius=0.011)
        curve_tube("CrossBodyStrap", [(-0.2, -0.17, 1.23), (0.02, -0.19, 1.0), (0.25, -0.12, 0.78)], 0.015, mats["shoe"], visual)
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
        is_facilitator = costume == "facilitator"
        # Keep the skirt on its own waist pivot so the runtime can add a small
        # amount of delayed cloth follow-through without deforming the torso.
        # Coordinates below are local to the 0.94 m waist pivot.
        skirt_pivot = empty("SkirtPivot", visual, (0, 0, 0.94))
        # The reference hem finishes below the knee and exposes a complete
        # boot/leg rhythm. The former half-metre cone reached toward the ankle
        # and turned both civic roles into one broad green cylinder.
        skirt_waist = 0.184 if is_facilitator else 0.19
        skirt_hem = 0.268 if is_facilitator else 0.262
        skirt_depth = 0.44 if is_facilitator else 0.42
        pleated_skirt("Skirt", skirt_waist, skirt_hem, skirt_depth, (0, 0, -0.18), mats["lower"], skirt_pivot, pleats=12, segments=48)
        torus(
            "SkirtWaistband",
            skirt_waist * 0.985,
            0.012,
            (0, 0, 0.038),
            mats["accent"],
            skirt_pivot,
            major_segments=32,
        )
        hem_x = skirt_hem * 0.93
        curve_tube(
            "SkirtHem",
            [
                (-hem_x, -0.075, -0.382),
                (-hem_x * 0.54, -skirt_hem * 0.78, -0.405),
                (0, -skirt_hem * 0.98, -0.394),
                (hem_x * 0.52, -skirt_hem * 0.8, -0.414),
                (hem_x, -0.07, -0.386),
            ],
            0.007,
            mats["accent"],
            skirt_pivot,
            resolution=2,
        )
        # The rear hem is authored separately so the garment remains
        # constructed during a complete orbit instead of revealing a single
        # front-facing curve. Its restrained height difference communicates
        # cloth weight without changing the physical capsule or floor contact.
        curve_tube(
            "SkirtBackHem",
            [
                (-hem_x, 0.07, -0.382),
                (-hem_x * 0.5, skirt_hem * 0.72, -0.397),
                (0, skirt_hem * 0.9, -0.405),
                (hem_x * 0.52, skirt_hem * 0.74, -0.391),
                (hem_x, 0.068, -0.386),
            ],
            0.0065,
            mats["accent"],
            skirt_pivot,
            resolution=2,
        )
        for pleat_index, pleat_x in enumerate((-0.1, 0, 0.1)):
            cloth_fold_ribbon(
                f"SkirtPleat_{pleat_index + 1}",
                [(pleat_x * 0.72, -0.19, 0), (pleat_x * 0.9, -0.225, -0.17), (pleat_x, -0.246, -0.365)],
                (0.002, 0.012 if pleat_x else 0.016, 0.002),
                mats["lower"],
                skirt_pivot,
                depth=0.008,
            )
        for side in (-1, 1):
            cloth_fold_ribbon(
                f"SkirtSideRelease_{side}",
                [
                    (side * 0.165, -0.13, -0.04),
                    (side * 0.205, -0.165, -0.2),
                    (side * 0.248, -0.13, -0.388),
                ],
                (0.002, 0.01, 0.002),
                mats["lower"],
                skirt_pivot,
                depth=0.007,
            )
        # Both civic women wear a coloured dress under an open warm-ivory
        # cardigan in the reference. Keeping the fitted bodice visible through
        # a real centre opening removes the former white rectangular torso and
        # gives the coat, dress and waist three readable depth layers.
        tailored_panel(
            "CivicDressBodice",
            0.31,
            0.235,
            0.275,
            0.39,
            0.05,
            (0, -0.178, 1.04),
            mats["lower"],
            visual,
            radius=0.012,
        )
        # The reference gives each civic role a small garment-level identity
        # cue rather than relying on hair colour alone. Three shallow petals
        # sit on the actual dress surface and survive orbit/lighting while
        # remaining far below collider scale.
        if costume == "mediator":
            for flower_index, (flower_x, flower_z) in enumerate(((-0.07, 1.13), (0.055, 1.04), (-0.015, 0.94))):
                embroidered_flower(
                    f"DressFlower_{flower_index + 1}",
                    (flower_x, -0.243, flower_z),
                    mats["metal"],
                    visual,
                    radius=0.021,
                )
        for side in (-1, 1):
            coat_height = 0.44 if is_facilitator else 0.4
            coat_z = 1.045 if is_facilitator else 1.085
            tailored_panel(
                f"CoatPanel_{side}",
                # The reference coat is fitted through the waist and releases
                # over the skirt.  A near-rectangular panel made the civic
                # women read as boxy toys from the three-quarter story camera.
                0.116 if is_facilitator else 0.114,
                0.064 if is_facilitator else 0.074,
                0.124 if is_facilitator else 0.114,
                coat_height,
                0.036,
                (side * (0.124 if is_facilitator else 0.12), -0.17, coat_z),
                mats["outer"],
                visual,
                radius=0.012,
                rotation=(0, side * 0.035, side * 0.035),
            )
            tailored_panel(
                f"Lapel_{side}",
                0.062,
                0.078,
                0.052,
                0.27,
                0.022,
                (side * 0.092, -0.202, 1.12),
                mats["outer"],
                visual,
                radius=0.012,
                rotation=(0, side * 0.08, side * 0.45),
            )
            curve_tube(
                f"CoatHem_{side}",
                [
                    (side * 0.02, -0.214, 0.838 if is_facilitator else 0.85),
                    (side * 0.088, -0.226, 0.829 if side < 0 else 0.842),
                    (side * 0.142, -0.21, 0.836 if is_facilitator else 0.846),
                    (side * 0.178, -0.18, 0.847 if side < 0 else 0.835),
                ],
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
                    (side * 0.15, -0.204, 0.845),
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
                    (side * 0.16, -0.205, 0.84),
                ],
                (0.002, 0.01, 0.002),
                mats["outer"],
                visual,
                depth=0.007,
            )
            curve_tube(
                f"CoatOpeningEdge_{side}",
                [
                    (side * 0.037, -0.229, 1.245),
                    (side * 0.042, -0.235, 1.055),
                    (side * 0.052, -0.228, 0.84),
                ],
                0.005,
                mats["accent"],
                visual,
                resolution=2,
            )
            rounded_box(
                f"CoatPocketWelt_{side}",
                (0.13, 0.026, 0.046),
                (side * 0.13, -0.224, 0.91),
                mats["accent"],
                visual,
                radius=0.009,
                rotation=(0.03, side * 0.025, side * 0.09),
            )
        curve_tube(
            "CardiganNeckRib",
            [
                (-0.145, -0.188, 1.25),
                (-0.078, -0.225, 1.205),
                (0, -0.235, 1.17),
                (0.078, -0.225, 1.205),
                (0.145, -0.188, 1.25),
            ],
            0.008,
            mats["outer"],
            visual,
            resolution=2,
        )
        for side in (-1, 1):
            cloth_fold_ribbon(
                f"CardiganFrontRib_{side}",
                [
                    (side * 0.055, -0.235, 1.18),
                    (side * 0.06, -0.242, 1.02),
                    (side * 0.068, -0.232, 0.85),
                ],
                (0.003, 0.009, 0.003),
                mats["outer"],
                visual,
                depth=0.006,
            )
        for index in range(3):
            ellipsoid(f"CoatButton_{index + 1}", (-0.067, -0.236, 1.1 - index * 0.12), (0.014, 0.008, 0.014), mats["accent"], visual, segments=12, rings=8)
            # A button without a receiving opening read like three dots glued
            # to a plastic panel. These recessed, horizontal cloth slots sit
            # on the opposite cardigan edge and establish an actual fastening
            # rhythm at the gameplay camera.
            rounded_box(
                f"CoatButtonhole_{index + 1}",
                (0.038, 0.008, 0.009),
                (0.052, -0.242, 1.1 - index * 0.12),
                mats["accent"],
                visual,
                radius=0.004,
                segments=1,
            )
        for side, elbow in ((-1, left_elbow), (1, right_elbow)):
            contoured_elliptical_shell(
                f"CoatCuff_{side}",
                (
                    (-0.314, 0.049, 0.045, side * 0.001, 0),
                    (-0.296, 0.056, 0.051, side * 0.002, -0.002),
                    (-0.272, 0.059, 0.054, -side * 0.001, -0.003),
                    (-0.25, 0.053, 0.049, -side * 0.002, -0.001),
                ),
                mats["accent"],
                elbow,
                segments=16,
                contract="mirrorlife-civic-garment-topology-v5",
            )
            # A real raised knit rib breaks the uninterrupted cylindrical cuff
            # and holds a believable thickness where cardigan meets hand.
            # They stay parented to the animated lower arm and therefore keep
            # their contact through listen and gesture poses.
            for rib_index, rib_z in enumerate((-0.282,), start=1):
                torus(
                    f"CoatCuffRib_{side}_{rib_index}",
                    0.052,
                    0.0028,
                    (side * 0.001, -0.001, rib_z),
                    mats["outer"],
                    elbow,
                    major_segments=12,
                )
        if costume == "facilitator":
            # A shallow shoulder yoke gives the long cardigan a tailored
            # upper silhouette distinct from the mediator's cropped jacket.
            curve_tube(
                "FacilitatorShoulderYoke",
                [(-0.19, -0.145, 1.25), (0, -0.205, 1.28), (0.19, -0.145, 1.25)],
                0.009,
                mats["accent"],
                visual,
                resolution=2,
            )
            # Seat the story notebook inside the authored palm volume. The old
            # centre was 12 cm from the hand and read as a floating prop in the
            # reverse/cast view. Spine, elastic and pencil give the contact a
            # believable grip silhouette without introducing a separate rig.
            notebook_location = (0.018, -0.031, -0.274)
            # The listen clip folds the elbow by roughly -1.3 rad. Counter it
            # here so the book remains upright in world space instead of
            # turning into two horizontal orange bars beside the actor.
            notebook_rotation = (1.18, -0.18, -0.08)
            notebook = empty("NotebookPivot", left_elbow, notebook_location, notebook_rotation)
            # Keep cover, paper, spine, elastic and pencil in one local frame.
            # The previous components repeated the rotation around different
            # world-space centres, which separated them into orange bars once
            # the listening elbow folded.
            rounded_box("StoryNotebook", (0.19, 0.038, 0.24), (0, 0, 0), mats["notebook_cover"], notebook, radius=0.026)
            rounded_box("NotebookPaper", (0.164, 0.011, 0.214), (0, -0.024, 0), mats["paper"], notebook, radius=0.017)
            rounded_box("NotebookSpine", (0.023, 0.048, 0.225), (-0.083, 0, 0), mats["notebook_cover"], notebook, radius=0.007)
            rounded_box("NotebookElastic", (0.016, 0.013, 0.218), (0.066, -0.029, 0), mats["metal"], notebook, radius=0.005)
            cylinder("NotebookPencil", 0.006, 0.004, 0.19, (-0.062, -0.031, 0.008), mats["accent"], notebook, vertices=10, rotation=(0, 0, 0.03))
            # A curved thumb now wraps from the book edge onto the cover. The
            # former ellipsoid looked like an orange sticker and could not
            # communicate which side of the prop carried the grip.
            curve_tube(
                "NotebookGripContact",
                [
                    (0.091, 0.012, 0.014),
                    (0.083, -0.031, 0.025),
                    (0.058, -0.046, 0.048),
                ],
                0.011,
                mats["skin"],
                notebook,
                resolution=2,
                bevel_resolution=1,
            )
            # A shallow palm ledge links the two compressed fingertip pads.
            # It is deliberately skin-coloured and sits behind the cover edge,
            # so the book reads as resting in a hand rather than suspended
            # between two unrelated orange marks.
            rounded_box(
                "NotebookPalmSupport",
                (0.128, 0.018, 0.032),
                (0.002, -0.041, -0.105),
                mats["skin"],
                notebook,
                radius=0.009,
                rotation=(0.05, 0, -0.035),
                segments=2,
            )
            # Three compact support fingers curl around the lower cover edge.
            # They share the notebook pivot, so their front/back relationship
            # remains correct throughout the elbow animation and through a
            # full camera orbit.
            for contact_index, contact_x in enumerate((-0.041, -0.006, 0.029), start=1):
                curve_tube(
                    f"NotebookSupportFinger_{contact_index}",
                    [
                        (contact_x, 0.014, -0.118),
                        (contact_x + 0.002, -0.026, -0.116),
                        (contact_x + 0.004, -0.033, -0.108),
                    ],
                    0.0068,
                    mats["skin"],
                    notebook,
                    resolution=2,
                    bevel_resolution=1,
                )
            # The guiding index finger wraps around the opposite long edge
            # instead of appearing as a second unrelated fingertip decal.
            curve_tube(
                "NotebookGuideContact",
                [
                    (-0.095, 0.011, -0.046),
                    (-0.087, -0.029, -0.038),
                    (-0.082, -0.033, -0.024),
                ],
                0.008,
                mats["skin"],
                notebook,
                resolution=2,
                bevel_resolution=1,
            )
            notebook["contact_contract"] = "mirrorlife-civic-notebook-contact-v3"
            notebook_support_target = empty(
                "NotebookSupportTarget",
                notebook,
                (0.058, -0.046, 0.048),
            )
            notebook_guide_target = empty(
                "NotebookGuideTarget",
                notebook,
                (-0.082, -0.033, -0.024),
            )
            notebook_support_target["contact_contract"] = "mirrorlife-civic-contact-anchor-v1"
            notebook_guide_target["contact_contract"] = "mirrorlife-civic-contact-anchor-v1"
        else:
            # A fitted sash and offset knot make the mediator readable as a
            # distinct civic role even when her face is in profile.
            rounded_box(
                "MediatorWaistSash",
                (0.34, 0.045, 0.07),
                (0, -0.205, 0.91),
                mats["accent"],
                visual,
                radius=0.02,
                rotation=(0.02, 0, -0.025),
            )
            ellipsoid(
                "MediatorSashKnot",
                (0.15, -0.232, 0.91),
                (0.045, 0.025, 0.04),
                mats["metal"],
                visual,
                # This is a sub-five-centimetre accent at gameplay distance;
                # keep its silhouette but avoid spending the final kilobytes
                # of the Web LOD0 budget on invisible curvature.
                segments=12,
                rings=8,
            )
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
    root["body_contract"] = "mirrorlife-civic-body-identity-v9"
    root["garment_topology_contract"] = "mirrorlife-civic-garment-topology-v5"
    root["shoulder_contract"] = "mirrorlife-civic-shoulder-continuity-v3"
    root["arm_anatomy_contract"] = "mirrorlife-civic-arm-anatomy-v1"
    root["pelvis_contract"] = "mirrorlife-civic-pelvis-continuity-v3"
    root["real_world_unit"] = "meter"
    root["identity_role"] = role

    torso, left_arm, right_arm, left_elbow, right_elbow, left_leg, right_leg, left_knee, right_knee = build_body(role, config, mats, root)
    # The normalized same-canvas crop puts the complete reference skull/hair
    # silhouette slightly wider than the tailored shoulder core. Keep that
    # measured 1:3.5 editorial proportion here; earlier 42 cm heads preserved
    # total height but made eyes and expression disappear at the story lens.
    body_profile = BODY_PROFILES[role]
    head = empty("HeadPivot", root, (0, 0, body_profile["head_z"]))
    # This resolves to roughly 0.46 m wide and 0.51 m tall including the hair
    # hierarchy. The pivot moves down with the scale change, preserving the
    # same top height, eye line, capsule and metre-space interaction anchors.
    head.scale = body_profile["head_scale"]
    if role == "mediator":
        # A head-attached target gives the thoughtful hand a semantic place to
        # land even while social look-at rotates the face. The target sits just
        # outside the jaw volume, so the solved fingers read as a listening
        # gesture instead of clipping through the mouth.
        thoughtful_target = empty(
            "ThoughtfulJawTarget",
            head,
            (0.145, -0.195, -0.075),
        )
        thoughtful_target["contact_contract"] = "mirrorlife-civic-contact-anchor-v2"
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
        "sculptContract": "mirrorlife-civic-sculpt-v83",
        "hairConstructionContract": {
            "version": "mirrorlife-civic-hair-construction-v7",
            "runtime": "role-authored-swept-superellipse-planes+temple-wisps+restrained-anisotropic-sheen",
            "parts": ["HairCap", "HairFlowRidge", "HairRibbon", "FaceFrameLock", "HairTempleWisp"],
        },
        "bodyIdentityContract": {
            "version": "mirrorlife-civic-body-identity-v10",
            "roles": ["player", "listener", "facilitator", "mediator"],
            "dimensions": ["torso", "shoulder", "neck", "waist", "pelvis", "limb", "head", "garment-silhouette"],
            "continuityParts": ["Torso", "ShoulderMantle", "Neck", "SkinnedArmVolume", "TrouserSeat", "SkirtHipFoundation"],
            "shoulderContract": "mirrorlife-civic-shoulder-continuity-v3",
            "armAnatomyContract": "mirrorlife-civic-arm-anatomy-v1",
            "neckContract": "mirrorlife-civic-neck-continuity-v2",
            "pelvisContract": "mirrorlife-civic-pelvis-continuity-v3",
            "runtime": "contoured-shell+tailored-shoulder-plane+reference-head-ratio+contoured-neck-clavicle-transition+deltoid-bicep-forearm-ring-flow+wide-elbow-skin-weights+bone-weighted-shoulder-overlap+load-bearing-pelvis+continuous-limb-skin",
        },
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
        "garmentTopologyContract": {
            "version": "mirrorlife-civic-garment-topology-v6",
            "runtime": "bone-weighted-superellipse+reference-slimmed-limb-silhouette+diagonal-tension-topology+asymmetric-drape+constructed-ribs+layered-asymmetric-hems+contoured-cuffs",
            "garments": ["sleeve", "trouser", "skirt", "vest", "cardigan"],
            "standingParts": [
                "SkinnedArmVolume",
                "SkinnedLegVolume",
                "Skirt",
                "CoatPanel",
            ],
            "deformingParts": ["SkinnedArmVolume", "SkinnedLegVolume", "Skirt"],
        },
        "garmentMaterialContract": {
            "version": "mirrorlife-civic-garment-material-v1",
            "runtime": "role-authored-poplin+knit+canvas+twill",
            "surfaces": [
                "fine-poplin",
                "jersey-knit",
                "cardigan-knit",
                "waxed-canvas",
                "weathered-shell",
                "utility-twill",
                "pleated-twill",
            ],
        },
        "clothCorrectiveContract": {
            "version": "mirrorlife-civic-cloth-correctives-v1",
            "runtime": "bend-angle-driven-volume+compression-folds",
            "pivots": [
                "SleeveCompressionPivot_-1",
                "SleeveCompressionPivot_1",
                "TrouserCompressionPivot_-1",
                "TrouserCompressionPivot_1",
            ],
            "volumes": ["ElbowCorrectiveVolume", "KneeCorrectiveVolume"],
        },
        "faceDecal": {
            "contract": "mirrorlife-civic-face-decal-v1",
            "path": "civic-face-decals.png",
            "textureContract": "mirrorlife-civic-face-texture-v2",
            "textureDirection": "soft-premium-sculpted-portrait",
            "grid": [2, 2],
            "mapping": ["player", "listener", "facilitator", "mediator"],
            "morphContract": "mirrorlife-civic-face-morph-v2",
            "integrationContract": "mirrorlife-civic-face-identity-v9",
            "productionFaceMode": "sculpted-volume-desktop+curved-atlas-mobile",
            "productionIntegrationContract": "mirrorlife-civic-face-identity-v9",
            "corneaContract": "mirrorlife-civic-cornea-v2",
            "uvContract": "mirrorlife-civic-head-uv-v3",
            "uvMatteContract": "mirrorlife-civic-head-uv-matte-v3",
            "preservedSculptParts": ["Head", "NoseBridge", "NoseTip", "EyePivot_-1", "EyePivot_1"],
            "mouthMorphContract": "mirrorlife-civic-mouth-morph-v4",
            "lipVolumeContract": "mirrorlife-civic-lip-volume-v3",
            "eyeGeometryContract": "mirrorlife-civic-eye-volume-v6",
            "eyelidDeformationContract": "mirrorlife-civic-eyelid-vertex-v2",
            "facialContinuityContract": "mirrorlife-civic-orbital-lip-bed-v1",
            "eyeGeometryParts": ["EyePivot_-1", "EyePivot_1"],
            "morphs": ["WarmSmile", "SpeechJaw", "Concern", "Attentive", "SocialAsymmetry", "Blink"],
        },
        "handContract": {
            "version": "mirrorlife-civic-hand-v11",
            "continuityContract": "mirrorlife-civic-hand-continuity-v1",
            "pivots": ["Hand_-1", "Hand_1"],
            "poseStyles": ["relaxed", "soft-cup", "notebook-support", "notebook-guide", "thoughtful", "open"],
            "surfaceParts": ["HandWebSurface", "PalmLifeLine", "PalmHeartLine", "FingerCrease", "ThumbCrease", "six-ring-tapered-digits"],
        },
        "notebookContactContract": {
            "version": "mirrorlife-civic-notebook-contact-v3",
            "parts": ["NotebookGripContact", "NotebookGuideContact", "NotebookPalmSupport", "NotebookSupportFinger"],
            "parent": "NotebookPivot",
        },
        "contactConstraintContract": {
            "version": "mirrorlife-civic-contact-constraint-v2",
            "effectors": ["HandContactAnchor_-1", "HandContactAnchor_1"],
            "targets": ["NotebookSupportTarget", "NotebookGuideTarget", "ThoughtfulJawTarget"],
            "runtime": "frame-observed-two-bone-ccd+deformation-rig-mirroring",
        },
        "footwearContract": {
            "version": "mirrorlife-civic-footwear-v4",
            "parts": ["Pivot", "Midsole", "HeelCounter", "OuterQuarterPanel", "ToeBumper", "ToeCapSeam", "AnkleCollarEdge"],
            "styles": ["sneaker", "ankle-boot"],
        },
        "animationContract": {
            "version": "mirrorlife-civic-clips-v19",
            "runtime": "authored-keyframe-blend+role-contact-poses+continuous-skin+wide-elbow-volume+asymmetric-weight-transfer+skirt-flex+facial-hand-acting",
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
