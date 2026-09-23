"""Compare sweep geometry and sample opaque frontal hair against actual skin."""
import bpy,json,os,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
source=Path(os.environ['ATRIUM_SWEEP_SOURCE']).resolve()
baseline=Path('models/atrium/residents/you.blend').resolve()
def read(path):
    bpy.ops.wm.open_mainfile(filepath=str(path));bpy.context.view_layer.update()
    ob=bpy.data.objects['HairAuthored_short01'];mesh=ob.data;mesh.calc_loop_triangles()
    head=bpy.data.objects['Head'];skin=BVHTree.FromPolygons([v.co for v in head.data.vertices],[tuple(p.vertices) for p in head.data.polygons])
    matrix=head.matrix_world.inverted()@ob.matrix_world
    image=next(n.image for n in mesh.materials[0].node_tree.nodes if n.type=='TEX_IMAGE')
    pixels=list(image.pixels);width,height=image.size;gaps=[];penetration_ids=[]
    for triangle_index,tri in enumerate(mesh.loop_triangles):
        points=[matrix@mesh.vertices[i].co for i in tri.vertices]
        uvs=[mesh.uv_layers['UVMap'].data[i].uv.copy() for i in tri.loops]
        for sample_index,weights in enumerate([(1,0,0),(0,1,0),(0,0,1),(.5,.5,0),(.5,0,.5),(0,.5,.5),(1/3,1/3,1/3)]):
            p=sum((p*w for p,w in zip(points,weights)),Vector())
            if not (p.y<-.07 and .07<p.z<.25):continue
            uv=sum((uv*w for uv,w in zip(uvs,weights)),Vector((0,0)))
            x=max(0,min(width-1,int(uv.x*width)));y=max(0,min(height-1,int(uv.y*height)))
            if pixels[(y*width+x)*4+3]<.4:continue
            hit=skin.ray_cast(Vector((p.x,-1,p.z)),Vector((0,1,0)))[0]
            if hit is not None:
                gap=hit.y-p.y;gaps.append(gap)
                if gap<-.0005:penetration_ids.append(triangle_index*7+sample_index)
    return dict(vertices=[tuple(v.co) for v in mesh.vertices],faces=[tuple(p.vertices) for p in mesh.polygons],
        triangles=[(tuple(t.vertices),t.polygon_index) for t in mesh.loop_triangles],
        uv=[tuple(v.uv) for v in mesh.uv_layers['UVMap'].data],imageSize=list(image.size),
        keys={k.name:[tuple(v.co) for v in k.data] for k in head.data.shape_keys.key_blocks},
        clearance=dict(samples=len(gaps),penetrating=len(penetration_ids),penetrationIds=penetration_ids,minGap=min(gaps)))
a=read(source);b=read(baseline)
for field in ['faces','triangles','uv','imageSize','keys']:assert a[field]==b[field],field
assert len(a['vertices'])==len(b['vertices'])
changed=[]
for new,old in zip(a['vertices'],b['vertices']):
    delta=(Vector(new)-Vector(old)).length
    if delta<1e-8:continue
    assert old[1]<-.055 and delta<.04
    changed.append(delta)
assert changed and a['clearance']['samples']>100
out=Path(os.environ['ATRIUM_SWEEP_REPORT']);out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),baselineSha256=hashlib.sha256(baseline.read_bytes()).hexdigest(),geometry=dict(changedVertices=len(changed),maxDisplacement=max(changed)),unchanged=['topology','UV','image size','facial morphs'],before=b['clearance'],after=a['clearance'],scope='Source neutral pose; opaque vertex, edge-midpoint and centroid samples in the frontal scalp region. Not complete collision or runtime animation coverage.'),indent=2))
assert not (set(a['clearance']['penetrationIds'])-set(b['clearance']['penetrationIds'])), 'New frontal scalp penetration sample'
print('HAIR_SWEEP_PASS',a['clearance'])
