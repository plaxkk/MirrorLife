"""Audit isolated hair resolution or card edits against the installed source."""
import bpy,os,json,hashlib
from pathlib import Path
source=Path(os.environ['ATRIUM_HAIR_SOURCE']).resolve()
baseline=Path(os.environ.get('ATRIUM_HAIR_BASELINE','models/atrium/residents/you.blend')).resolve()
def read(path):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    ob=bpy.data.objects['HairAuthored_short01'];mesh=ob.data;mat=mesh.materials[0]
    image=next(n.image for n in mat.node_tree.nodes if n.type=='TEX_IMAGE')
    return dict(vertices=[tuple(v.co) for v in mesh.vertices],faces=[tuple(p.vertices) for p in mesh.polygons],
        uv=[tuple(v.uv) for v in mesh.uv_layers['UVMap'].data],transform=[tuple(row) for row in ob.matrix_world],
        parent=ob.parent.name,roughness=mat.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value,
        cutoff=next(n.inputs[1].default_value for n in mat.node_tree.nodes if n.type=='MATH' and n.operation=='GREATER_THAN'),
        shapes={k.name:[tuple(v.co) for v in k.data] for k in bpy.data.objects['Head'].data.shape_keys.key_blocks},
        imageSize=list(image.size))
a=read(source);b=read(baseline)
card=os.environ.get('ATRIUM_HAIR_CARD_AUDIT')=='1'
for name in a:
    if name not in (['vertices'] if card else ['imageSize']):assert a[name]==b[name], 'Unexpected change: '+name
card_report=None
if card:
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
    parent=list(range(len(b['vertices'])))
    def find(i):
        while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
        return i
    for face in b['faces']:
        for i in face[1:]:parent[find(i)]=find(face[0])
    groups={}
    for i in range(len(parent)):groups.setdefault(find(i),[]).append(i)
    base=max(groups,key=lambda k:len(groups[k]))
    surface=BVHTree.FromPolygons([Vector(v) for v in b['vertices']],[f for f in b['faces'] if find(f[0])==base])
    changes=[]
    for i,(new,old) in enumerate(zip(a['vertices'],b['vertices'])):
        delta=(Vector(new)-Vector(old)).length
        if delta<1e-8:continue
        assert find(i)!=base and delta<=.012001
        old_gap=surface.find_nearest(Vector(old))[3];new_gap=surface.find_nearest(Vector(new))[3]
        assert new_gap<=old_gap+1e-7 and new_gap>.0039
        changes.append(delta)
    assert changes
    card_report=dict(changedVertices=len(changes),baseVerticesUnchanged=len(groups[base]),maxDisplacement=max(changes))
else:assert a['imageSize']==[1024,1024] and b['imageSize']==[512,512]
out=Path(os.environ['ATRIUM_HAIR_REPORT']);out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(dict(passed=True,sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),baselineSha256=hashlib.sha256(baseline.read_bytes()).hexdigest(),unchanged=[n for n in a if n not in (['vertices'] if card else ['imageSize'])],beforeSize=b['imageSize'],afterSize=a['imageSize'],card=card_report),indent=2))
print('HAIR_TEXTURE_INVARIANTS_PASS')
