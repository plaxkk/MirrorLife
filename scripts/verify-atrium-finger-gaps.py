"""Measure projected distal finger separation in actual source hand geometry."""
import bpy,os,json,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def inspect(path):
    bpy.ops.wm.open_mainfile(filepath=str(path));bpy.context.view_layer.update()
    mesh=bpy.data.objects['SkinnedArticulationCore'];results=[]
    for side,label in [(-1,'Left'),(1,'Right')]:
        hand=bpy.data.objects['Hand_'+str(side)];group=mesh.vertex_groups['Skin'+label+'Hand'].index
        selected={v.index for v in mesh.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups)}
        matrix=hand.matrix_world.inverted()@mesh.matrix_world
        vertices=[matrix@v.co for v in mesh.data.vertices]
        faces=[tuple(p.vertices) for p in mesh.data.polygons if all(i in selected for i in p.vertices)]
        assert len(faces)>100,'Missing hand surface'
        tree=BVHTree.FromPolygons(vertices,faces);slices=[]
        for z in [-.060,-.065,-.070,-.075]:
            occupied=[]
            for i in range(209):
                x=-.052+i*.0005
                hit=tree.ray_cast(Vector((x,-.15,z)),Vector((0,1,0)),.3)[0]
                occupied.append(hit is not None)
            spans=[];start=None
            for i,on in enumerate(occupied+[False]):
                if on and start is None:start=i
                if not on and start is not None:
                    if (i-start)*.0005>=.0025:spans.append([-.052+start*.0005,-.052+(i-1)*.0005])
                    start=None
            slices.append(dict(z=z,visibleSpans=spans,count=len(spans)))
        results.append(dict(side=side,sourceHandAudit=dict(hand['hand_surface_audit']),slices=slices))
    return dict(sha256=hashlib.sha256(path.read_bytes()).hexdigest(),hands=results)
base=Path(os.environ['ATRIUM_HAND_BASELINE']);source=Path(os.environ['ATRIUM_HAND_SOURCE'])
a=inspect(base);b=inspect(source)
require_gain=os.environ.get('ATRIUM_HAND_REQUIRE_GAP_GAIN','1')=='1'
report=dict(comparison='increase' if require_gain else 'retain',baseline=a,candidate=b,scope='Hand-bone-filtered source triangles; orthographic Y rays at four local Z slices. Connected projected spans wider than 2.5mm, not anatomical quality, complete gap topology or runtime collision proof.')
out=Path(os.environ['ATRIUM_HAND_REPORT']);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2))
for old,new in zip(a['hands'],b['hands']):
    assert new['sourceHandAudit']['components']==1 and new['sourceHandAudit']['nonManifoldEdges']==0
    assert max(s['count'] for s in new['slices'])>=4,'Four distal digits not distinguishable'
    if require_gain:
        assert any(n['count']>o['count'] for n,o in zip(new['slices'],old['slices'])),'No improved projected separation'
    else:
        assert all(n['count']>=o['count'] for n,o in zip(new['slices'],old['slices'])),'Lost projected separation'
print('FINGER_GAPS_PASS')
