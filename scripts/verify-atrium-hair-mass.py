"""Compare haircut mass source and opaque surface samples against actual scalp."""
import bpy, hashlib, json, os
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
source = Path(os.environ['ATRIUM_HAIR_SOURCE']).resolve()
baseline = Path(os.environ['ATRIUM_HAIR_BASELINE']).resolve()
def read(path):
    bpy.ops.wm.open_mainfile(filepath=str(path));bpy.context.view_layer.update()
    ob=bpy.data.objects['HairAuthored_short01'];m=ob.data;m.calc_loop_triangles()
    head=bpy.data.objects['Head'];mat=m.materials[0]
    skin=BVHTree.FromPolygons([v.co for v in head.data.vertices],[tuple(p.vertices) for p in head.data.polygons])
    image=next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE')
    pixels=list(image.pixels);width,height=image.size
    matrix=head.matrix_world.inverted()@ob.matrix_world
    bad={};samples=0;minimum=1.;tris=[]
    for j,t in enumerate(m.loop_triangles):
        tris.append((tuple(t.vertices),t.polygon_index))
        ps=[matrix@m.vertices[i].co for i in t.vertices]
        uv=[m.uv_layers['UVMap'].data[i].uv.copy() for i in t.loops]
        for k,weights in enumerate(((1,0,0),(0,1,0),(0,0,1),(.5,.5,0),(.5,0,.5),(0,.5,.5),(1/3,1/3,1/3))):
            p=sum((v*w for v,w in zip(ps,weights)),Vector());u=sum((v*w for v,w in zip(uv,weights)),Vector((0,0)))
            px=max(0,min(width-1,int(u.x*width)));py=max(0,min(height-1,int(u.y*height)))
            if pixels[(py*width+px)*4+3]<.4:continue
            hit,n,_,distance=skin.find_nearest(p)
            gap=distance if (p-hit).dot(n)>=0 else -distance
            samples+=1;minimum=min(minimum,gap)
            if gap<-.0005:bad[j*7+k]=gap
    return dict(vertices=[tuple(v.co) for v in m.vertices],faces=[tuple(f.vertices) for f in m.polygons],
        triangles=tris,uv=[tuple(v.uv) for v in m.uv_layers['UVMap'].data],
        imageSize=list(image.size),imageHash=hashlib.sha256(bytes(round(max(0,min(1,v))*255) for v in pixels)).hexdigest(),
        keys={k.name:[tuple(v.co) for v in k.data] for k in head.data.shape_keys.key_blocks},
        transform=[tuple(row) for row in ob.matrix_world],parent=ob.parent.name,
        roughness=mat.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value,
        cutoff=next(n.inputs[1].default_value for n in mat.node_tree.nodes if n.type=='MATH' and n.operation=='GREATER_THAN'),
        clearance=dict(samples=samples,minGap=minimum,penetrations=bad))
a=read(source);b=read(baseline)
for key in a:
    if key not in ('vertices','triangles','clearance'):assert a[key]==b[key],key
assert len(a['vertices'])==len(b['vertices'])
changes=[(Vector(p)-Vector(q)).length for p,q in zip(a['vertices'],b['vertices'])]
changed_tris={i for i,(p,q) in enumerate(zip(a['triangles'],b['triangles'])) if p!=q}
changed_triangle_bad=[i for i in a['clearance']['penetrations'] if i//7 in changed_tris]
new=[i for i in a['clearance']['penetrations'] if i//7 not in changed_tris and i not in b['clearance']['penetrations']]
report=dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),baselineSha256=hashlib.sha256(baseline.read_bytes()).hexdigest(),
    changedVertices=sum(x>1e-8 for x in changes),maxDisplacement=max(changes),changedTriangles=sorted(changed_tris),
    baseline=b['clearance'],candidate=a['clearance'],newOnUnchangedTriangles=new,penetrationsOnChangedTriangles=changed_triangle_bad,
    boundsBefore=[(min(p[i] for p in b['vertices']),max(p[i] for p in b['vertices'])) for i in range(3)],
    boundsAfter=[(min(p[i] for p in a['vertices']),max(p[i] for p in a['vertices'])) for i in range(3)],
    scope='Neutral source, actual triangulated opaque vertex/edge/centroid samples against head. IDs compared only on unchanged triangles; changed triangles need independent inspection. Not continuous collision or animation proof.')
out=Path(os.environ['ATRIUM_HAIR_REPORT']);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2))
assert not new,'New scalp penetration samples on unchanged triangles'
assert not changed_triangle_bad,'Scalp penetration samples on changed triangles'
assert a['clearance']['minGap']>=b['clearance']['minGap']-.0001,'Worse deepest scalp sample'
print('HAIR_MASS_SOURCE_PASS',report['changedVertices'],len(changed_tris))
