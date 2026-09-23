"""Sample cord surfaces, including triangle interiors, against the actual cloth."""
import bpy,json,os,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
paths=[Path(os.environ['ATRIUM_CORD_BASELINE']),Path(os.environ['ATRIUM_CORD_CANDIDATE'])]
reports=[]
cloth_baseline=None
cloth_unchanged=True
for path in paths:
    bpy.ops.wm.open_mainfile(filepath=str(path.resolve()));bpy.context.view_layer.update()
    cloth=bpy.data.objects['SkinnedArticulationCore']
    cloth_state=([tuple(v.co) for v in cloth.data.vertices],
        [tuple(p.vertices) for p in cloth.data.polygons],
        [[(g.group,g.weight) for g in v.groups] for v in cloth.data.vertices])
    if cloth_baseline is None:cloth_baseline=cloth_state
    else:cloth_unchanged=cloth_state==cloth_baseline
    surface=BVHTree.FromPolygons([v.co for v in cloth.data.vertices],[tuple(p.vertices) for p in cloth.data.polygons])
    rows=[]
    for side in [-1,1]:
        ob=bpy.data.objects['Hood cotton drawcord '+str(side)]
        evaluated=ob.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated.to_mesh();mesh.calc_loop_triangles()
        matrix=cloth.matrix_world.inverted()@ob.matrix_world
        vertices=[matrix@v.co for v in mesh.vertices]
        samples=list(vertices)
        for triangle in mesh.loop_triangles:
            a,b,c=[vertices[i] for i in triangle.vertices]
            for i in range(1,4):
                for j in range(1,5-i):
                    u=i/5;v=j/5;samples.append(a*u+b*v+c*(1-u-v))
        gaps=[];missing=0
        for p in samples:
            hit=surface.ray_cast(Vector((p.x,-1,p.z)),Vector((0,1,0)))[0]
            if hit is None:missing+=1
            else:gaps.append(hit.y-p.y)
        rows.append(dict(side=side,samples=len(samples),missing=missing,minClearance=min(gaps),penetrating=sum(g<0 for g in gaps)))
        evaluated.to_mesh_clear()
    reports.append(dict(source=str(path),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),cords=rows))
out=Path(os.environ['ATRIUM_CORD_REPORT']);out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(dict(clothGeometryWeightsUnchanged=cloth_unchanged,scope='Source neutral pose, actual evaluated cord triangle surfaces against the skinned garment mesh. Does not prove exported LOD or animated clearance; if cloth equality is false, rerun deformation on the candidate.',reports=reports),indent=2))
assert all(r['missing']==0 and r['minClearance']>.0005 for r in reports[-1]['cords']), reports[-1]
print('CORD_CLEARANCE_PASS',reports[-1]['cords'])
