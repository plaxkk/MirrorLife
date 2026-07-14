import argparse
import json
import math
import os
import sys
from itertools import combinations

import bmesh
import bpy
from mathutils import Vector


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(
        description="Create a closed, browser-sized interior GLB LOD from a high-fidelity master."
    )
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--target-triangles", type=int, default=78000)
    parser.add_argument("--texture-size", type=int, default=1024)
    parser.add_argument("--merge-distance", type=float, default=0.000001)
    return parser.parse_args(argv)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        for item in list(collection):
            if item.users == 0:
                collection.remove(item)


def mesh_objects():
    return [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]


def triangulate_and_clean(obj, merge_distance):
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    if merge_distance > 0:
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=merge_distance)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=max(merge_distance, 1e-8))
    bmesh.ops.triangulate(bm, faces=list(bm.faces), quad_method="BEAUTY", ngon_method="BEAUTY")
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    mesh.validate(verbose=False, clean_customdata=False)
    mesh.update()


def topology_stats(obj):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.normal_update()
    stats = {
        "vertices": len(bm.verts),
        "edges": len(bm.edges),
        "triangles": sum(max(0, len(face.verts) - 2) for face in bm.faces),
        "boundaryEdges": sum(1 for edge in bm.edges if edge.is_boundary),
        "nonManifoldEdges": sum(1 for edge in bm.edges if not edge.is_manifold and not edge.is_boundary),
        "looseEdges": sum(1 for edge in bm.edges if edge.is_wire),
    }
    bm.free()
    return stats


def repair_small_topology_defects(obj, max_problem_edges=64):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.normal_update()
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    initial_boundary = [edge for edge in bm.edges if edge.is_boundary]
    initial_non_manifold = [edge for edge in bm.edges if not edge.is_manifold and not edge.is_boundary]
    if len(initial_boundary) + len(initial_non_manifold) > max_problem_edges:
        bm.free()
        return {
            "attempted": False,
            "reason": "problem edge limit exceeded",
            "initialBoundaryEdges": len(initial_boundary),
            "initialNonManifoldEdges": len(initial_non_manifold),
            "removedFaces": 0,
            "filledFaces": 0,
        }

    duplicate_faces = []
    face_keys = {}
    for face in bm.faces:
        key = tuple(sorted(vertex.index for vertex in face.verts))
        if key in face_keys:
            duplicate_faces.append(face)
        else:
            face_keys[key] = face

    faces_to_remove = set(duplicate_faces)
    for edge in initial_non_manifold:
        linked = [face for face in edge.link_faces if face not in faces_to_remove]
        if len(linked) <= 2:
            continue
        keep_pair = min(
            combinations(linked, 2),
            key=lambda pair: pair[0].normal.dot(pair[1].normal)
        )
        keep = set(keep_pair)
        faces_to_remove.update(face for face in linked if face not in keep)

    if faces_to_remove:
        bmesh.ops.delete(bm, geom=list(faces_to_remove), context="FACES")
    bm.edges.ensure_lookup_table()
    boundary_after_removal = [edge for edge in bm.edges if edge.is_boundary]
    fill_result = bmesh.ops.holes_fill(bm, edges=boundary_after_removal, sides=max_problem_edges)
    new_faces = list(fill_result.get("faces", []))
    if new_faces:
        bmesh.ops.triangulate(bm, faces=new_faces, quad_method="BEAUTY", ngon_method="BEAUTY")
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-8)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.validate(verbose=False, clean_customdata=False)
    obj.data.update()
    return {
        "attempted": True,
        "reason": "small local repair",
        "initialBoundaryEdges": len(initial_boundary),
        "initialNonManifoldEdges": len(initial_non_manifold),
        "removedFaces": len(faces_to_remove),
        "filledFaces": len(new_faces),
    }


def dimensions(objects):
    points = []
    for obj in objects:
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    minimum = [min(point[index] for point in points) for index in range(3)]
    maximum = [max(point[index] for point in points) for index in range(3)]
    return {
        "width": maximum[0] - minimum[0],
        "depth": maximum[1] - minimum[1],
        "height": maximum[2] - minimum[2],
    }


def decimate(obj, target_triangles):
    before = topology_stats(obj)["triangles"]
    if before <= target_triangles:
        return before, before, 1.0
    ratio = max(0.01, min(1.0, target_triangles / before))
    modifier = obj.modifiers.new(name="MirrorLife Web LOD", type="DECIMATE")
    modifier.decimate_type = "COLLAPSE"
    modifier.ratio = ratio
    modifier.use_collapse_triangulate = True
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.select_set(False)
    return before, topology_stats(obj)["triangles"], ratio


def resize_images(max_size):
    resized = []
    for image in bpy.data.images:
        width, height = image.size[:]
        if width <= 0 or height <= 0:
            continue
        source_size = [width, height]
        if max(width, height) > max_size:
            scale = max_size / max(width, height)
            width = max(1, round(width * scale))
            height = max(1, round(height * scale))
            image.scale(width, height)
        resized.append({"name": image.name, "sourceSize": source_size, "webSize": [width, height]})
    return resized


def main():
    args = parse_args()
    source = os.path.abspath(args.input)
    output = os.path.abspath(args.output)
    report_path = os.path.abspath(args.report)
    os.makedirs(os.path.dirname(output), exist_ok=True)
    os.makedirs(os.path.dirname(report_path), exist_ok=True)

    clear_scene()
    bpy.ops.import_scene.gltf(filepath=source, import_pack_images=True, merge_vertices=False)
    objects = mesh_objects()
    if not objects:
        raise RuntimeError("The imported GLB contains no mesh objects.")

    for obj in objects:
        triangulate_and_clean(obj, args.merge_distance)
    before_stats = [topology_stats(obj) for obj in objects]
    total_before = sum(item["triangles"] for item in before_stats)
    target_per_object = [
        max(64, math.floor(args.target_triangles * item["triangles"] / max(1, total_before)))
        for item in before_stats
    ]

    ratios = []
    repairs = []
    for obj, target in zip(objects, target_per_object):
        _, _, ratio = decimate(obj, target)
        triangulate_and_clean(obj, args.merge_distance)
        object_repairs = []
        for repair_pass in range(8):
            current = topology_stats(obj)
            if current["boundaryEdges"] == 0 and current["nonManifoldEdges"] == 0 and current["looseEdges"] == 0:
                break
            repair = repair_small_topology_defects(obj)
            repair["pass"] = repair_pass + 1
            object_repairs.append(repair)
            if not repair["attempted"]:
                break
        repairs.append(object_repairs)
        ratios.append(ratio)

    after_stats = [topology_stats(obj) for obj in objects]
    totals = {
        "triangles": sum(item["triangles"] for item in after_stats),
        "boundaryEdges": sum(item["boundaryEdges"] for item in after_stats),
        "nonManifoldEdges": sum(item["nonManifoldEdges"] for item in after_stats),
        "looseEdges": sum(item["looseEdges"] for item in after_stats),
    }
    texture_report = resize_images(args.texture_size)
    closed = totals["boundaryEdges"] == 0 and totals["nonManifoldEdges"] == 0 and totals["looseEdges"] == 0

    report = {
        "tool": f"Blender {bpy.app.version_string}",
        "source": source,
        "output": output,
        "targetTriangles": args.target_triangles,
        "textureSize": args.texture_size,
        "sourceTriangles": total_before,
        "webTriangles": totals["triangles"],
        "closedMeshes": closed,
        "boundaryEdges": totals["boundaryEdges"],
        "nonManifoldEdges": totals["nonManifoldEdges"],
        "looseEdges": totals["looseEdges"],
        "decimateRatios": ratios,
        "topologyRepairs": repairs,
        "dimensions": dimensions(objects),
        "textures": texture_report,
        "objects": [
            {"name": obj.name, "before": before, "after": after}
            for obj, before, after in zip(objects, before_stats, after_stats)
        ],
    }
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2, ensure_ascii=True)
        handle.write("\n")

    if not closed:
        raise RuntimeError(
            "LOD topology is not closed: "
            f"{totals['boundaryEdges']} boundary, {totals['nonManifoldEdges']} non-manifold, "
            f"{totals['looseEdges']} loose edges."
        )

    bpy.ops.export_scene.gltf(
        filepath=output,
        export_format="GLB",
        export_apply=True,
        export_materials="EXPORT",
        export_texcoords=True,
        export_normals=True,
        export_tangents=False,
        export_attributes=False,
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_image_format="AUTO",
        export_image_quality=90,
        export_yup=True,
    )
    print(json.dumps(report, ensure_ascii=True))


if __name__ == "__main__":
    main()
