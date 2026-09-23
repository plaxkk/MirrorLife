"""Audit candidate clump source, roots, underlayer and sampled card clearance."""
import bpy, json, os, hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
source = Path(os.environ['ATRIUM_HAIR_SOURCE']).resolve()
baseline = Path(os.environ['ATRIUM_HAIR_BASELINE']).resolve()
def read(path):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    bpy.context.view_layer.update()
    ob = bpy.data.objects['HairAuthored_short01']; m = ob.data; m.calc_loop_triangles()
    mat = m.materials[0]
    image = next(n.image for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE')
    return dict(vertices=[tuple(v.co) for v in m.vertices], faces=[tuple(f.vertices) for f in m.polygons],
        uv=[tuple(v.uv) for v in m.uv_layers['UVMap'].data],
        triangles=[tuple(t.vertices) for t in m.loop_triangles],
        parent=ob.parent.name, transform=[tuple(row) for row in ob.matrix_world],
        shapes={k.name:[tuple(v.co) for v in k.data] for k in bpy.data.objects['Head'].data.shape_keys.key_blocks},
        imageSize=list(image.size), imageHash=hashlib.sha256(bytes(round(max(0,min(1,v))*255) for v in image.pixels)).hexdigest(),
        roughness=mat.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value,
        cutoff=next(n.inputs[1].default_value for n in mat.node_tree.nodes if n.type=='MATH' and n.operation=='GREATER_THAN'),
        audit=json.loads(ob.get('clump_study_audit','null')))
a=read(source); b=read(baseline)
for key in a:
    if key not in ('vertices','triangles','audit'):
        assert a[key]==b[key],key
assert len(a['vertices'])==len(b['vertices'])
parent=list(range(len(b['vertices'])))
def find(i):
    while parent[i]!=i:
        parent[i]=parent[parent[i]];i=parent[i]
    return i
for f in b['faces']:
    for i in f[1:]:parent[find(i)]=find(f[0])
groups={}
for i in range(len(parent)):groups.setdefault(find(i),[]).append(i)
base=max(groups,key=lambda k:len(groups[k]))
assert all(a['vertices'][i]==b['vertices'][i] for i in groups[base])
roots=[i for strip in a['audit']['taperedStrips'] for i in strip['root']]
assert all(a['vertices'][i]==b['vertices'][i] for i in roots)
allowed={strip['component'] for strip in a['audit']['taperedStrips']}
changed=[]
for i,(p,q) in enumerate(zip(a['vertices'],b['vertices'])):
    delta=(Vector(p)-Vector(q)).length
    if delta>1e-8:
        assert find(i) in allowed
        changed.append(delta)
surface=BVHTree.FromPolygons([Vector(v) for v in b['vertices']],[f for f in b['faces'] if find(f[0])==base])
def clearance(data, actual=False):
    samples=[];bad=[]
    # Use baseline triangle connectivity for corresponding samples after deformation.
    for j,tri in enumerate(data['triangles'] if actual else b['triangles']):
        if find(tri[0]) not in allowed:continue
        points=[Vector(data['vertices'][i]) for i in tri]
        for k,ws in enumerate(((1,0,0),(0,1,0),(0,0,1),(.5,.5,0),(.5,0,.5),(0,.5,.5),(1/3,1/3,1/3))):
            p=sum((v*w for v,w in zip(points,ws)),Vector())
            hit,n,_,distance=surface.find_nearest(p)
            signed=distance if (p-hit).dot(n)>=0 else -distance
            samples.append(signed)
            if signed<-.0005:bad.append(j*7+k)
    return dict(samples=len(samples),minSignedGap=min(samples),penetrationIds=bad)
before=clearance(b);after=clearance(a);actual=clearance(a, actual=True)
new=sorted(set(after['penetrationIds'])-set(before['penetrationIds']))
report=dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),baselineSha256=hashlib.sha256(baseline.read_bytes()).hexdigest(),
    changedVertices=len(changed),maxDisplacement=max(changed),baseVerticesUnchanged=len(groups[base]),rootsUnchanged=len(roots),
    stripCount=len(allowed),before=before,after=after,actualCandidate=actual,newPenetrationIds=new,
    changedTriangulations=sum(x!=y for x,y in zip(a['triangles'],b['triangles'])),
    scope='All selected card triangle vertices, edge midpoints and centroids against base underlayer. Includes transparent samples; not continuous collision or runtime deformation.')
out=Path(os.environ['ATRIUM_HAIR_REPORT']);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2))
assert changed and not new, 'New underlayer penetration samples'
print('HAIR_CLUMP_PASS',len(changed),len(allowed))
