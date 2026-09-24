"""Connected cardigan sleeve/body with an actual front opening and inner shirt."""
import bpy, bmesh, os
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def author(garment, mats, visual, civic):
    tailored=os.environ.get('ATRIUM_CARDIGAN_STUDY')=='2'
    original=BVHTree.FromPolygons([v.co.copy() for v in garment.data.vertices],[tuple(p.vertices) for p in garment.data.polygons])
    def front(x,z):
        hit=original.ray_cast(Vector((x,-1,z)),Vector((0,1,0)))[0]
        assert hit is not None, ('Missing shirt support',x,z)
        return hit.y
    # Bisect retains interpolated deform weights at the front opening edges.
    bm=bmesh.new();bm.from_mesh(garment.data)
    def cut(point,normal,predicate=lambda f:True):
        faces=[f for f in bm.faces if predicate(f)]
        edges={e for f in faces for e in f.edges};verts={v for f in faces for v in f.verts}
        bmesh.ops.bisect_plane(bm,geom=list(verts)+list(edges)+faces,dist=1e-6,plane_co=point,plane_no=normal)
    # Restrict construction cuts to the panel that needs them. Cutting an
    # opening through the unrelated back and both sleeves bloats topology.
    for x in (-.036,.036):
        cut((x,0,0),(1,0,0),lambda f:not tailored or f.calc_center_median().y<0)
    cut((0,0,0),(0,1,0),lambda f:not tailored or abs(f.calc_center_median().x)<.15)
    if tailored:
        cut((0,0,.865),(0,0,1),lambda f:abs(f.calc_center_median().x)<.23)
        cut((0,0,1.18),(0,0,1),lambda f:f.calc_center_median().y<0 and abs(f.calc_center_median().x)<.18)
        for side in (-1,1):
            cut((side*.036,0,1.18),(side,0,-.45),lambda f:f.calc_center_median().y<0 and max(v.co.z for v in f.verts)>1.18 and abs(f.calc_center_median().x)<.2)
    removed=[f for f in bm.faces if abs(f.calc_center_median().x)<.036+(.45*max(0,f.calc_center_median().z-1.18) if tailored else 0)-1e-6 and f.calc_center_median().y<0]
    assert removed
    bmesh.ops.delete(bm,geom=removed,context='FACES')
    bm.to_mesh(garment.data);bm.free();garment.data.update()
    garment.data.materials.clear();garment.data.materials.append(mats['outer'])
    if tailored:garment.data.materials.append(mats['top'])
    for face in garment.data.polygons:
        centre=sum((garment.data.vertices[i].co for i in face.vertices),Vector())/len(face.vertices)
        face.material_index=1 if tailored and abs(centre.x)<.22 and centre.z<.865 else 0
        face.use_smooth=True
    bpy.ops.object.select_all(action='DESELECT');garment.select_set(True);bpy.context.view_layer.objects.active=garment
    solid=garment.modifiers.new('Sewn cardigan fabric thickness','SOLIDIFY');solid.thickness=.004;solid.offset=-1
    # Apply on the bind mesh; weighted batching intentionally reads source data.
    bpy.ops.object.modifier_move_up(modifier=solid.name)
    bpy.ops.object.modifier_apply(modifier=solid.name)
    # Actual underlayer has overlap behind both front edges, rather than a
    # contrasting colour printed on the same surface.
    rows=[.79,.80,.86,.95,1.05,1.16,1.24,1.30,1.32]
    xs=[-.09,-.06,-.03,0,.03,.06,.09];vertices=[];faces=[]
    support_widths=[]
    for z in rows:
        width=.13 if tailored else .09
        while original.ray_cast(Vector((width,-1,z)),Vector((0,1,0)))[0] is None:
            width-=.002
            assert width>.06, ('Shirt row has insufficient support',z,width)
        support_widths.append([z,width])
        for source_x in xs:
            x=source_x*width/.09
            vertices.append((x,front(x,z)+.008,z))
    for j in range(len(rows)-1):
        for i in range(len(xs)-1):
            a=j*len(xs)+i;faces.append((a,a+1,a+1+len(xs),a+len(xs)))
    mesh=bpy.data.meshes.new('Cardigan inner shirt panel');mesh.from_pydata(vertices,[],faces);mesh.materials.append(mats['top']);mesh.update()
    shirt=bpy.data.objects.new('Cardigan inner shirt',mesh);bpy.context.collection.objects.link(shirt);shirt.parent=visual
    for face in mesh.polygons:face.use_smooth=True
    for z in [.97,1.055,1.14]:
        x=.045
        civic.ellipsoid('Small wood button',(x,front(x,z)-.005,z),(.007,.004,.007),mats['accent'],visual,segments=12,rings=8)
    audit=bmesh.new();audit.from_mesh(garment.data)
    non_manifold=sum(not e.is_manifold for e in audit.edges);audit.free()
    garment.data.calc_loop_triangles()
    remaining=set(range(len(garment.data.vertices)));adj=[set() for _ in garment.data.vertices]
    for edge in garment.data.edges:
        a,b=edge.vertices;adj[a].add(b);adj[b].add(a)
    components=0
    while remaining:
        components+=1;todo=[remaining.pop()]
        while todo:
            for other in adj[todo.pop()]:
                if other in remaining:remaining.remove(other);todo.append(other)
    report={'version':2 if tailored else 1,'components':components,'construction':'Connected sleeve and body with 72 mm front opening, 4 mm inward solid thickness and overlapping inner shirt',
            'shirtSupportWidths':support_widths,'vNeck':tailored,'integratedHem':tailored,'triangles':len(garment.data.loop_triangles),'nonManifoldEdges':non_manifold,
            'weightError':max(abs(sum(g.weight for g in v.groups)-1) for v in garment.data.vertices)}
    assert non_manifold==0 and components==1,report
    assert report['weightError']<.0001,report
    garment.parent.parent['cardigan_study']=report
    garment['construction']=report['construction']
