"""Render geometry-controlled Art Target inputs for the primary-school V4 pilot.

This script consumes the runtime Blueprint contract emitted by
prepare-primary-school-art-target.mjs. It intentionally produces a strict
graybox, not a replacement art asset: room boundary, door, props, actors and
camera guides remain in runtime metre space while six conditioning passes are
rendered from six fixed cameras.
"""

import argparse
import colorsys
import json
import math
import os
import sys

import bpy
from mathutils import Vector


EXPECTED_VERTICES = [
    (-6.75, -5.25),
    (6.75, -5.25),
    (6.75, 1.25),
    (2.2, 1.25),
    (2.2, 5.25),
    (-6.75, 5.25),
]
ROOM_HEIGHT = 3.9
DOOR_WIDTH = 1.35
PASS_NAMES = ["beauty-gray", "depth", "normal", "line", "object-id", "material-id"]
VIEW_SPECS = {
    "hero": {"location": (10.8, 12.6, 7.8), "target": (-0.35, -0.45, 1.0), "lens": 52.0},
    "yaw-0": {"location": (0.0, 15.8, 6.8), "target": (0.0, -0.2, 1.0), "lens": 56.0},
    "yaw-90": {"location": (16.0, 0.0, 6.8), "target": (0.0, -0.2, 1.0), "lens": 56.0},
    "yaw-180": {"location": (0.0, -15.8, 6.8), "target": (0.0, -0.2, 1.0), "lens": 56.0},
    "yaw-270": {"location": (-16.0, 0.0, 6.8), "target": (0.0, -0.2, 1.0), "lens": 56.0},
    "top": {"location": (0.0, 0.0, 22.0), "target": (0.0, 0.0, 0.0), "orthographic": 17.0},
}
BEAUTY_COLORS = {
    "floor": (0.88, 0.84, 0.75, 1.0),
    "wall": (0.74, 0.74, 0.72, 1.0),
    "oak": (0.52, 0.36, 0.24, 1.0),
    "textile": (0.32, 0.58, 0.56, 1.0),
    "paper": (0.95, 0.83, 0.42, 1.0),
    "cork": (0.67, 0.43, 0.25, 1.0),
    "metal": (0.28, 0.31, 0.38, 1.0),
    "actor": (0.39, 0.55, 0.76, 1.0),
    "guide": (0.91, 0.38, 0.31, 1.0),
}
MATERIAL_IDS = {
    "floor": 1,
    "wall": 2,
    "oak": 3,
    "textile": 4,
    "paper": 5,
    "cork": 6,
    "metal": 7,
    "actor": 8,
    "guide": 9,
}


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--size", type=int, default=1024)
    return parser.parse_args(argv)


def assert_close(actual, expected, label, epsilon=1e-6):
    if not math.isfinite(float(actual)) or abs(float(actual) - expected) > epsilon:
        raise RuntimeError(f"{label} drifted: expected {expected}, received {actual}")


def validate_contract(contract):
    geometry = contract["geometry"]
    shell = geometry["shell"]
    assert shell["shape"] == "polygon"
    assert_close(shell["width"], 13.5, "room width")
    assert_close(shell["depth"], 10.5, "room depth")
    assert_close(shell["height"], ROOM_HEIGHT, "room height")
    assert_close(shell["door"]["width"], DOOR_WIDTH, "door width")
    vertices = [(point["x"], point["z"]) for point in shell["vertices"]]
    if vertices != EXPECTED_VERTICES:
        raise RuntimeError(f"runtime polygon drifted: {vertices}")
    if len(geometry["props"]) != 6 or len(geometry["actorStagingPoints"]) != 3:
        raise RuntimeError("runtime prop or actor staging count drifted")
    return geometry


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.materials, bpy.data.meshes, bpy.data.curves, bpy.data.cameras, bpy.data.lights):
        for item in list(collection):
            collection.remove(item)


def make_principled_material(name, color, roughness=0.8, metallic=0.0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = color
    material.use_nodes = True
    principled = material.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = color
    principled.inputs["Roughness"].default_value = roughness
    principled.inputs["Metallic"].default_value = metallic
    return material


def make_emission_material(name, color=None, mode=None):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Strength"].default_value = 1.0
    links.new(emission.outputs["Emission"], output.inputs["Surface"])
    if mode == "depth":
        camera_data = nodes.new("ShaderNodeCameraData")
        map_range = nodes.new("ShaderNodeMapRange")
        map_range.inputs["From Min"].default_value = 0.0
        map_range.inputs["From Max"].default_value = 30.0
        map_range.inputs["To Min"].default_value = 1.0
        map_range.inputs["To Max"].default_value = 0.0
        map_range.clamp = True
        links.new(camera_data.outputs["View Z Depth"], map_range.inputs["Value"])
        links.new(map_range.outputs["Result"], emission.inputs["Color"])
    elif mode == "normal":
        geometry = nodes.new("ShaderNodeNewGeometry")
        multiply = nodes.new("ShaderNodeVectorMath")
        multiply.operation = "MULTIPLY"
        multiply.inputs[1].default_value = (0.5, 0.5, 0.5)
        add = nodes.new("ShaderNodeVectorMath")
        add.operation = "ADD"
        add.inputs[1].default_value = (0.5, 0.5, 0.5)
        links.new(geometry.outputs["Normal"], multiply.inputs[0])
        links.new(multiply.outputs["Vector"], add.inputs[0])
        links.new(add.outputs["Vector"], emission.inputs["Color"])
    else:
        emission.inputs["Color"].default_value = color or (1.0, 1.0, 1.0, 1.0)
    return material


def set_object_contract(obj, material_id, object_id):
    obj["graybox_material"] = material_id
    obj["graybox_object_id"] = int(object_id)
    obj["graybox_original_materials"] = [slot.material.name for slot in obj.material_slots if slot.material]


def add_box(name, dimensions, location, material, material_id, object_id, rotation_z=0.0):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=(0.0, 0.0, rotation_z))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    set_object_contract(obj, material_id, object_id)
    return obj


def add_cylinder(name, radius, depth, location, material, material_id, object_id, vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    set_object_contract(obj, material_id, object_id)
    return obj


def add_sphere(name, radius, location, material, material_id, object_id):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=radius, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    set_object_contract(obj, material_id, object_id)
    return obj


def add_polygon_floor(vertices, material, object_id):
    mesh = bpy.data.meshes.new("primary-school-floor-mesh")
    mesh.from_pydata([(x, y, 0.0) for x, y in vertices], [], [list(range(len(vertices)))])
    mesh.update()
    obj = bpy.data.objects.new("primary-school-floor", mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    set_object_contract(obj, "floor", object_id)
    solidify = obj.modifiers.new("floor-thickness", "SOLIDIFY")
    solidify.thickness = 0.12
    solidify.offset = -1.0
    return obj


def add_wall_segment(name, start, end, height, material, object_id, wall_index):
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    length = math.hypot(dx, dy)
    if length < 0.04:
        return None
    midpoint = ((start[0] + end[0]) / 2.0, (start[1] + end[1]) / 2.0)
    wall = add_box(
        name,
        (length, 0.16, height),
        (midpoint[0], midpoint[1], height / 2.0),
        material,
        "wall",
        object_id,
        math.atan2(dy, dx),
    )
    wall["graybox_wall"] = True
    wall["wall_index"] = wall_index
    wall["wall_mid_x"] = midpoint[0]
    wall["wall_mid_y"] = midpoint[1]
    return wall


def add_walls(shell, material, first_object_id):
    vertices = [(point["x"], point["z"]) for point in shell["vertices"]]
    door = shell["door"]
    object_id = first_object_id
    for index, start in enumerate(vertices):
        end = vertices[(index + 1) % len(vertices)]
        if index != door["edge"]:
            add_wall_segment(f"wall-{index}", start, end, shell["height"], material, object_id, index)
            object_id += 1
            continue
        edge_dx = end[0] - start[0]
        edge_dy = end[1] - start[1]
        edge_length = math.hypot(edge_dx, edge_dy)
        unit = (edge_dx / edge_length, edge_dy / edge_length)
        center_t = max(0.2, min(0.8, 0.5 + float(door.get("offset", 0.0)) / 2.0))
        center = (start[0] + edge_dx * center_t, start[1] + edge_dy * center_t)
        half_width = door["width"] / 2.0
        opening_start = (center[0] - unit[0] * half_width, center[1] - unit[1] * half_width)
        opening_end = (center[0] + unit[0] * half_width, center[1] + unit[1] * half_width)
        add_wall_segment(f"wall-{index}-a", start, opening_start, shell["height"], material, object_id, index)
        object_id += 1
        add_wall_segment(f"wall-{index}-b", opening_end, end, shell["height"], material, object_id, index)
        object_id += 1
        header_height = shell["height"] - door["height"]
        add_box(
            "door-header",
            (door["width"], 0.16, header_height),
            (center[0], center[1], door["height"] + header_height / 2.0),
            material,
            "wall",
            object_id,
            math.atan2(edge_dy, edge_dx),
        )
        object_id += 1
    return object_id


def add_prop_grayboxes(props, materials, first_object_id):
    labels = [
        "reading-corner",
        "low-podium",
        "student-desk-left",
        "student-desk-right",
        "question-wall",
        "sharing-corner",
    ]
    categories = ["textile", "oak", "oak", "oak", "cork", "textile"]
    object_id = first_object_id
    for index, prop in enumerate(props):
        x = float(prop["worldX"])
        y = float(prop["worldZ"])
        rotation = -float(prop.get("rotationY", 0.0))
        collider = prop.get("collider") or {}
        if collider.get("shape") == "box":
            width = max(0.4, float(collider.get("halfX", 0.5)) * 2.0)
            depth = max(0.35, float(collider.get("halfZ", 0.4)) * 2.0)
            height = max(0.5, float(collider.get("halfY", 0.5)) * 2.0)
        else:
            width, depth, height = 1.8, 1.1, 0.72
        category = categories[index]
        add_box(
            labels[index],
            (width, depth, height),
            (x, y, height / 2.0),
            materials[category],
            category,
            object_id,
            rotation,
        )
        object_id += 1
        if index == 0:
            add_box("reading-shelf", (1.9, 0.34, 1.65), (x - 0.15, y - 0.78, 0.825), materials["oak"], "oak", object_id, rotation)
            object_id += 1
        elif index in (2, 3):
            add_box(f"{labels[index]}-card-slot", (0.72, 0.12, 0.08), (x, y, height + 0.04), materials["paper"], "paper", object_id, rotation)
            object_id += 1
        elif index == 4:
            for card_index in range(3):
                add_box(
                    f"question-card-{card_index}",
                    (0.38, 0.05, 0.52),
                    (x - 0.52 + card_index * 0.52, y - 0.36, 1.35 + (card_index % 2) * 0.12),
                    materials["paper"],
                    "paper",
                    object_id,
                    rotation,
                )
                object_id += 1
    return object_id


def add_functional_zones(zones, material, first_object_id):
    object_id = first_object_id
    for zone in zones:
        marker = add_cylinder(
            f"zone-{zone['id']}",
            float(zone["radius"]),
            0.025,
            (float(zone["x"]), float(zone["z"]), 0.018),
            material,
            "guide",
            object_id,
            vertices=48,
        )
        marker.display_type = "WIRE"
        object_id += 1
    return object_id


def add_actor_guides(points, material, first_object_id):
    object_id = first_object_id
    for index, point in enumerate(points):
        x, y = float(point["x"]), float(point["z"])
        add_cylinder(f"actor-{index}-body", 0.26, 1.1, (x, y, 0.82), material, "actor", object_id, vertices=20)
        object_id += 1
        add_sphere(f"actor-{index}-head", 0.24, (x, y, 1.58), material, "actor", object_id)
        object_id += 1
    return object_id


def add_point_guides(geometry, material, first_object_id):
    object_id = first_object_id
    spawn = geometry["spawn"]
    add_cylinder("spawn-guide", 0.28, 0.035, (spawn["x"], spawn["z"], 0.025), material, "guide", object_id, vertices=4)
    object_id += 1
    for target in geometry["cameraTargets"]:
        add_cylinder(
            f"camera-target-{target['id']}",
            0.16,
            0.03,
            (target["x"], target["z"], 0.025),
            material,
            "guide",
            object_id,
            vertices=24,
        )
        object_id += 1
    return object_id


def build_scene(geometry):
    materials = {
        key: make_principled_material(
            f"beauty-{key}",
            color,
            roughness=0.82 if key not in ("metal", "paper") else 0.55,
            metallic=0.72 if key == "metal" else 0.0,
        )
        for key, color in BEAUTY_COLORS.items()
    }
    vertices = [(point["x"], point["z"]) for point in geometry["shell"]["vertices"]]
    object_id = 1
    add_polygon_floor(vertices, materials["floor"], object_id)
    object_id += 1
    object_id = add_walls(geometry["shell"], materials["wall"], object_id)
    object_id = add_functional_zones(geometry["functionalZones"], materials["guide"], object_id)
    object_id = add_prop_grayboxes(geometry["props"], materials, object_id)
    object_id = add_actor_guides(geometry["actorStagingPoints"], materials["actor"], object_id)
    add_point_guides(geometry, materials["guide"], object_id)
    return materials


def configure_scene(size):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.film_transparent = False
    scene.render.use_file_extension = True
    scene.render.use_freestyle = False
    scene.view_settings.look = "AgX - Medium High Contrast"
    world = bpy.data.worlds.new("graybox-world") if not bpy.data.worlds else bpy.data.worlds[0]
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.82, 0.87, 0.9, 1.0)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.55

    bpy.ops.object.light_add(type="AREA", location=(-2.8, 2.8, 9.0))
    key = bpy.context.object
    key.name = "graybox-key-light"
    key.data.energy = 1500
    key.data.shape = "DISK"
    key.data.size = 7.0
    key.rotation_euler = (0.0, 0.0, 0.0)
    bpy.ops.object.light_add(type="SUN", location=(0.0, 0.0, 8.0))
    sun = bpy.context.object
    sun.name = "graybox-sun"
    sun.data.energy = 1.5
    sun.rotation_euler = (math.radians(28), math.radians(-18), math.radians(24))
    return scene


def configure_camera(scene, spec):
    if scene.camera is None:
        camera_data = bpy.data.cameras.new("graybox-camera")
        scene.camera = bpy.data.objects.new("graybox-camera", camera_data)
        bpy.context.collection.objects.link(scene.camera)
    camera = scene.camera
    camera.location = spec["location"]
    if "orthographic" in spec:
        camera.data.type = "ORTHO"
        camera.data.ortho_scale = spec["orthographic"]
        camera.rotation_euler = (0.0, 0.0, 0.0)
    else:
        camera.data.type = "PERSP"
        camera.data.lens = spec["lens"]
        direction = Vector(spec["target"]) - camera.location
        camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return camera


def set_cutaway_walls(view_name, camera):
    camera_xy = Vector((camera.location.x, camera.location.y))
    for obj in bpy.context.scene.objects:
        if not obj.get("graybox_wall"):
            continue
        if view_name == "top":
            obj.hide_render = False
            continue
        midpoint = Vector((obj["wall_mid_x"], obj["wall_mid_y"]))
        obj.hide_render = midpoint.dot(camera_xy) > 2.0


def mesh_objects():
    return [obj for obj in bpy.context.scene.objects if obj.type == "MESH" and "graybox_object_id" in obj]


def restore_beauty_materials():
    for obj in mesh_objects():
        names = list(obj.get("graybox_original_materials", []))
        obj.data.materials.clear()
        for name in names:
            material = bpy.data.materials.get(name)
            if material:
                obj.data.materials.append(material)


def id_color(identifier, saturation=0.72, value=0.94):
    hue = (int(identifier) * 0.61803398875) % 1.0
    red, green, blue = colorsys.hsv_to_rgb(hue, saturation, value)
    return (red, green, blue, 1.0)


def assign_pass_materials(pass_name):
    objects = mesh_objects()
    if pass_name == "beauty-gray":
        restore_beauty_materials()
        return
    if pass_name == "depth":
        material = make_emission_material("pass-depth", mode="depth")
        assignments = [(obj, material) for obj in objects]
    elif pass_name == "normal":
        material = make_emission_material("pass-normal", mode="normal")
        assignments = [(obj, material) for obj in objects]
    elif pass_name == "line":
        material = make_emission_material("pass-line", color=(1.0, 1.0, 1.0, 1.0))
        assignments = [(obj, material) for obj in objects]
    elif pass_name == "object-id":
        assignments = []
        for obj in objects:
            identifier = int(obj["graybox_object_id"])
            material = make_emission_material(f"pass-object-{identifier}", color=id_color(identifier))
            assignments.append((obj, material))
    elif pass_name == "material-id":
        assignments = []
        for obj in objects:
            category = obj["graybox_material"]
            identifier = MATERIAL_IDS[category]
            material = make_emission_material(f"pass-material-{category}", color=id_color(identifier, 0.58, 0.9))
            assignments.append((obj, material))
    else:
        raise RuntimeError(f"unknown render pass: {pass_name}")
    for obj, material in assignments:
        obj.data.materials.clear()
        obj.data.materials.append(material)


def configure_pass(scene, pass_name):
    is_beauty = pass_name == "beauty-gray"
    scene.render.use_freestyle = pass_name == "line"
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (
        (0.82, 0.87, 0.9, 1.0) if is_beauty else (1.0, 1.0, 1.0, 1.0)
    )
    scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.55 if is_beauty else 1.0
    for obj in scene.objects:
        if obj.type == "LIGHT":
            obj.hide_render = not is_beauty
    assign_pass_materials(pass_name)


def render_views(scene, output_root):
    for view_name, spec in VIEW_SPECS.items():
        camera = configure_camera(scene, spec)
        set_cutaway_walls(view_name, camera)
        view_root = os.path.join(output_root, view_name)
        os.makedirs(view_root, exist_ok=True)
        for pass_name in PASS_NAMES:
            configure_pass(scene, pass_name)
            scene.render.filepath = os.path.join(view_root, f"{pass_name}.png")
            bpy.ops.render.render(write_still=True)


def main():
    args = parse_args()
    if args.size < 512:
        raise RuntimeError("render size must be at least 512")
    with open(args.input, "r", encoding="utf-8") as handle:
        contract = json.load(handle)
    geometry = validate_contract(contract)
    clear_scene()
    configure_scene(args.size)
    build_scene(geometry)
    render_views(bpy.context.scene, os.path.abspath(args.output))
    print(f"Rendered {len(VIEW_SPECS) * len(PASS_NAMES)} primary-school Art Target input passes.")


if __name__ == "__main__":
    main()
