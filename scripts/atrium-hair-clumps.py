"""Taper authored quad-strip tips while retaining roots and the connected base."""
from collections import Counter, defaultdict
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def taper(vertices, faces):
    parent = list(range(len(vertices)))
    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    for face in faces:
        for i in face[1:]:
            parent[find(i)] = find(face[0])
    groups = defaultdict(list)
    for i in range(len(vertices)):
        groups[find(i)].append(i)
    base = max(groups, key=lambda k: len(groups[k]))
    points = [Vector(v) for v in vertices]
    surface = BVHTree.FromPolygons(points, [f for f in faces if find(f[0]) == base])
    modified = []
    for group, ids in groups.items():
        if group == base or len(ids) not in (8, 10, 12):
            continue
        if sum(points[i].z for i in ids) / len(ids) < .16:
            continue
        strips = [f for f in faces if find(f[0]) == group]
        if any(len(f) != 4 for f in strips):
            continue
        edges = [[tuple(sorted((f[j], f[(j+1)%4]))) for j in range(4)] for f in strips]
        counts = Counter(e for row in edges for e in row)
        ends = []
        for row in edges:
            shared = [j for j, e in enumerate(row) if counts[e] == 2]
            if len(shared) == 1:
                ends.append(row[(shared[0]+2)%4])
        if len(ends) != 2:
            continue
        # Root is the end nearest the real underlayer, not an arbitrary UV axis.
        root = min(ends, key=lambda edge: sum(surface.find_nearest(points[i])[3] for i in edge))
        rows = [root]
        remaining = set(range(len(strips)))
        while remaining:
            options = [j for j in remaining if rows[-1] in edges[j]]
            if len(options) != 1:
                break
            j = options[0]
            rows.append(edges[j][(edges[j].index(rows[-1])+2)%4])
            remaining.remove(j)
        if remaining or len(set(i for row in rows for i in row)) != len(ids):
            continue
        for row_index, row in enumerate(rows[1:], 1):
            t = row_index / (len(rows)-1)
            smooth = t*t*(3-2*t)
            center = sum((points[i] for i in row), Vector()) / 2
            for i in row:
                p = center + (points[i]-center)*(1-.70*smooth)
                hit, normal, _, distance = surface.find_nearest(p)
                if hit is not None:
                    direction = (p-hit).normalized() if (p-hit).dot(normal)>0 else normal
                    # Flow rises through the middle and lands towards the tip.
                    target = .004 + .006 * (4*t*(1-t))
                    p = hit + direction * min(max(distance, .004), target)
                vertices[i] = tuple(p)
        modified.append(dict(component=group, vertices=len(ids), root=list(root), tip=list(rows[-1])))
    return dict(baseVertices=len(groups[base]), taperedStrips=modified)
