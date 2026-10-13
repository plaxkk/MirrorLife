"""Authored dialogue cast finish; used by the shipping resident build.
Geometry stays on existing skin/controllers. No runtime replacement or view-dependent mesh.
"""
import bpy, math
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def cloth(ob):
    for v in ob.data.vertices:
        x,y,z=v.co
        torso=max(0,min(1,(.235-abs(x))/.045))
        # Three restrained compression folds fall into the rib, rather than
        # uniform sine waves across the chest. Asymmetry avoids mirrored stamps.
        fold=0
        for height,amp,width,slope in [(.883,.004,.017,.09),(.926,-.003,.021,-.10),(.974,.002,.025,.06)]:
            fold+=amp*math.exp(-((z-height-slope*x)/width)**2)
        v.co.y+=math.copysign(fold*torso*min(1,abs(y)/.08),y)
        if abs(x)>.245:
            elbow=math.exp(-((z-1.00)/.065)**2)
            v.co.y+=.0035*math.sin((z-.94)*62+x*8)*elbow
    ob.data.update()
    ob['dialogue_finish']='Integrated waist compression and elbow folds; source geometry, shared skin'

def bob(head):
    old=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.name.startswith('Hair')]
    material=old[0].data.materials[0]
    material.diffuse_color=(.038,.024,.021,1)
    material.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=material.diffuse_color
    material.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.53
    for o in old:bpy.data.objects.remove(o,do_unlink=True)
    tree=BVHTree.FromPolygons([v.co for v in head.data.vertices],[tuple(f.vertices) for f in head.data.polygons])
    centre=Vector((0,0,.04));verts=[];faces=[];sides=64;rows=22
    for row in range(rows+1):
        t=row/rows
        for j in range(sides):
            az=j*math.tau/sides
            front=max(0,math.cos(az))**2
            end=2.10-1.05*front+.07*math.sin(az*3)
            theta=.015+t*end
            direction=Vector((math.sin(theta)*math.sin(az),-math.sin(theta)*math.cos(az),math.cos(theta)))
            hit=tree.ray_cast(centre+direction*2,-direction)[0]
            if hit is None:hit=centre+direction*.20
            flow=az+.20*math.sin(theta)+.15*theta
            lift=.013+.010*math.sin(theta)**2
            lift+=.0035*math.cos(flow*13)*math.sin(theta)**.7
            p=hit+direction*lift
            # Hanging side/back locks retain air around the jaw instead of
            # hugging the skull; the ends turn inward like a short bob.
            hanging=max(0,(theta-1.35)/.75)*(1-front)
            p.x+=math.copysign(.024*hanging*(1-.25*t),p.x)
            p.y+=.014*hanging
            p.z-=.028*hanging
            verts.append(p)
    for row in range(rows):
        for j in range(sides):
            a=row*sides+j;b=row*sides+(j+1)%sides
            faces.append((a,b,b+sides,a+sides))
    faces.append(tuple(reversed(range(sides))))
    mesh=bpy.data.meshes.new('Lin side-part bob continuous groom');mesh.from_pydata(verts,[],faces);mesh.materials.append(material);mesh.update()
    ob=bpy.data.objects.new('Hair lin shaped bob',mesh);bpy.context.collection.objects.link(ob);ob.parent=head.parent
    for f in mesh.polygons:f.use_smooth=True
    solid=ob.modifiers.new('Turned hairline edge','SOLIDIFY');solid.thickness=.003;solid.offset=-1
    ob['dialogue_finish']='Skull-fitted asymmetric bob with hanging side volume and directional lock relief'
