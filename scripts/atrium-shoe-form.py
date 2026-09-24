"""Opt-in forefoot sculpt and surface-authored lace placement."""
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def author(root,prefix):
    def smooth(value):
        value=max(0,min(1,value));return value*value*(3-2*value)
    upper=bpy.data.objects[prefix];changed=0
    for vertex in upper.data.vertices:
        p=vertex.co
        weight=smooth((-p.y-.030)/.130)*smooth((p.z+.025)/.080)
        if weight:
            p.z-=.018*weight;p.x*=1-.05*weight;changed+=1
    bpy.context.view_layer.update()
    points=[];faces=[];inverse=root.matrix_world.inverted()
    targets=[upper]+[ob for ob in root.children_recursive if ob.name==prefix+'Tongue']
    deps=bpy.context.evaluated_depsgraph_get()
    for ob in targets:
        evaluated=ob.evaluated_get(deps);mesh=evaluated.to_mesh();matrix=inverse@ob.matrix_world;start=len(points)
        points.extend(matrix@v.co for v in mesh.vertices)
        faces.extend(tuple(start+i for i in p.vertices) for p in mesh.polygons)
        evaluated.to_mesh_clear()
    tree=BVHTree.FromPolygons(points,faces);samples=[]
    for lace in [ob for ob in root.children_recursive if ob.name.startswith(prefix+'Lace_')]:
        assert lace.type=='CURVE'
        transform=inverse@lace.matrix_world;back=transform.inverted()
        lace.data.bevel_depth=.0018
        for spline in lace.data.splines:
            for point in spline.bezier_points if spline.type=='BEZIER' else spline.points:
                p=transform@Vector(point.co[:3]);original=p.copy()
                hit,normal,face,distance=tree.ray_cast(Vector((p.x,p.y,.3)),Vector((0,0,-1)),.5)
                assert hit is not None, 'Lace missed upper surface'
                p=hit+Vector((0,0,.0022));q=back@p
                if spline.type=='BEZIER':
                    delta=q-point.co;point.co=q;point.handle_left+=delta;point.handle_right+=delta
                else:point.co=(*q,point.co.w)
                samples.append({'before':list(original),'after':list(p),'surfaceZ':hit.z})
    assert len(samples)==9
    root['shoe_form_study']={'upperVerticesChanged':changed,'laceSamples':samples,'laceRadius':.0018,'status':'candidate; curve spans and runtime foot contact need review'}
