"""Small hand-held original props, authored at metre scale with closed surfaces."""
import bpy,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/assets/atrium';SOURCE=ROOT/'models/atrium'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
def mat(name,color,rough):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    s=m.node_tree.nodes.get('Principled BSDF');s.inputs['Base Color'].default_value=(*color,1);s.inputs['Roughness'].default_value=rough;return m
mint=mat('Enamel mint',(.17,.42,.36),.36);cream=mat('Warm ceramic',(.82,.73,.58),.35);dark=mat('Tea',(.1,.046,.012),.25)
def part(name,obj,parent,material):
    obj.name=name;obj.data.materials.append(material);obj.parent=parent
    for p in obj.data.polygons:p.use_smooth=True
    return obj
def curve(name,points,parent,material,r=.013):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=3
    sp=c.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
    for b,p in zip(sp.bezier_points,points):b.co=p;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    ob=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(ob);ob.parent=parent;ob.data.materials.append(material);return ob
for name in ['WateringCan','TeaCup']:
    root=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(root)
    if name=='WateringCan':
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=(0,0,0));ob=part('Can body',bpy.context.object,root,mint);ob.scale=(.095,.072,.12)
        curve('Can handle',[(.03,.07,.08),(.12,.07,.1),(.14,.07,-.03),(.05,.07,-.07)],root,cream)
        curve('Can spout',[(-.06,0,-.02),(-.17,0,.035),(-.21,0,.09)],root,mint,.019)
        bpy.ops.mesh.primitive_torus_add(major_segments=32,minor_segments=10,location=(0,0,.105),major_radius=.043,minor_radius=.007);part('Can lip',bpy.context.object,root,cream)
    else:
        # Lathed cup with visible inside and rim; a sealed bottom, not an open cylinder.
        profile=[(.001,-.06),(.042,-.06),(.057,.047),(.052,.055),(.046,.045),(.033,-.047),(.001,-.047)]
        verts=[];faces=[]
        for i in range(48):
            a=i*math.tau/48
            for r,z in profile:verts.append((r*math.cos(a),r*math.sin(a),z))
        for i in range(48):
            for j in range(len(profile)-1):faces.append((i*7+j,((i+1)%48)*7+j,((i+1)%48)*7+j+1,i*7+j+1))
        m=bpy.data.meshes.new('Cup vessel');m.from_pydata(verts,[],faces);m.update();ob=bpy.data.objects.new('Cup vessel',m);bpy.context.collection.objects.link(ob);part('Cup vessel',ob,root,cream)
        curve('Cup handle',[(.048,0,.033),(.091,0,.027),(.096,0,-.026),(.041,0,-.039)],root,cream,.009)
        bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.041,depth=.003,location=(0,0,.018));part('Tea surface',bpy.context.object,root,dark)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'life-props.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'life-props.glb'),export_format='GLB',export_apply=True,export_draco_mesh_compression_enable=True)
