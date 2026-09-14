"""Fit a CC0 MakeHuman head subset to the existing player rig in Blender.
Mesh provenance: models/atrium/source/README.md. No MakeHuman program code.
"""
import bpy, math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

def build_player_head(root_path):
    old=bpy.data.objects['Head'];skin=old.data.materials[0].copy();skin.name='Player anatomical skin'
    vertices=[];tex=[];faces=[];uv_faces=[]
    for line in (Path(root_path)/'models/atrium/source/makehuman-head.obj').read_text().splitlines():
        p=line.split()
        if not p:continue
        if p[0]=='v':vertices.append(tuple(map(float,p[1:4])))
        elif p[0]=='vt':tex.append(tuple(map(float,p[1:3])))
        elif p[0]=='f':
            faces.append([int(x.split('/')[0])-1 for x in p[1:]])
            uv_faces.append([int(x.split('/')[1])-1 for x in p[1:]])
    def fit(p):
        x,y,z=p[0]*.255,-(p[2]-.55)*.22,(p[1]-7.124)*.215
        # Preserve jaw volume but blend the neck cut inside the existing collar.
        t=max(0,min(1,(-z-.13)/.10));t=t*t*(3-2*t)
        angle=math.atan2(x,y-.015)
        x=x*(1-t)+.125*math.sin(angle)*t
        y=y*(1-t)+(.105*math.cos(angle)+.005)*t
        return x,y,z
    mesh=bpy.data.meshes.new('Player anatomical head mesh');mesh.from_pydata([fit(v) for v in vertices],[],faces);mesh.update();mesh.materials.append(skin)
    uv=mesh.uv_layers.new(name='UVMap')
    for poly,indices in zip(mesh.polygons,uv_faces):
        poly.use_smooth=True
        for loop,i in zip(poly.loop_indices,indices):uv.data[loop].uv=tex[i]
    old.data=mesh
    # Reduce the exposed straight neck while keeping its cut inside the collar.
    old.parent.location.z-=.018
    # Continue the native neck to a ring inside the collar; remove the second
    # neck shell. This eliminates the two independently visible cut edges.
    edges={}
    for poly in mesh.polygons:
        ids=list(poly.vertices)
        for a,b in zip(ids,ids[1:]+ids[:1]):
            key=tuple(sorted((a,b)));edges[key]=edges.get(key,0)+1
    boundary={i for edge,count in edges.items() if count==1 for i in edge}
    base_z=(1.305-old.parent.location.z)/old.parent.scale.z
    for i in boundary:mesh.vertices[i].co.z=base_z
    neck=bpy.data.objects.get('Neck')
    if neck:bpy.data.objects.remove(neck,do_unlink=True)
    bpy.ops.object.select_all(action='DESELECT');old.select_set(True);bpy.context.view_layer.objects.active=old
    dec=old.modifiers.new('Facial topology allocation','DECIMATE');dec.ratio=3000/8440;dec.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=dec.name)
    old['atrium_facial_morphs']=True
    old['source_license']='CC0-1.0; MakeHuman head subset with MirrorLife fitting'
    # Native nose, ears and lips replace the detached facial pieces.
    for ob in list(bpy.context.scene.objects):
        if ob.type not in {'MESH','CURVE'} or ob==old:continue
        p=ob.parent;mouth=False
        while p:
            if p.name=='MouthPivot':mouth=True
            p=p.parent
        if mouth or ob.name.startswith(('EarShell','EarConcha','Nasal crease','UpperLidSkin','LowerLidSkin','UpperLid_','LowerLidCrease','EyeCanthus')):
            bpy.data.objects.remove(ob,do_unlink=True)
    surface=BVHTree.FromPolygons([v.co for v in old.data.vertices],[tuple(p.vertices) for p in old.data.polygons])
    def front(x,z):
        point=surface.ray_cast(Vector((x,-1,z)),Vector((0,1,0)))[0]
        return point.y if point else -.18
    for side in [-1,1]:
        eye=bpy.data.objects['EyePivot_'+str(side)];eye.location=(side*.0785,-.181,.0344);eye.scale=(.52,.65,.48)
        brow=bpy.data.objects['BrowPivot_'+str(side)];brow.location=(side*.079,front(side*.079,.08)-.003,.08);brow.scale.x=.68
    # Groom directly on the fitted skull. Broad, overlapping flattened clumps
    # have independent lift; projecting all old vertices erased their volume.
    hair_objects=[ob for ob in bpy.context.scene.objects if ob.type=='MESH' and ob.name.startswith('Hair')]
    hair_material=hair_objects[0].data.materials[0]
    for ob in hair_objects:bpy.data.objects.remove(ob,do_unlink=True)
    centre=Vector((0,0,.04))
    def scalp(theta,azimuth,lift=0):
        direction=Vector((math.sin(theta)*math.sin(azimuth),-math.sin(theta)*math.cos(azimuth),math.cos(theta)))
        hit=surface.ray_cast(centre+direction*2,-direction)[0]
        if hit is None:hit=centre+direction*.21
        return hit+direction*(.007+lift),direction
    def hair_mesh(name,points,faces):
        mesh=bpy.data.meshes.new(name);mesh.from_pydata(points,[],faces);mesh.update();mesh.materials.append(hair_material)
        ob=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(ob);ob.parent=old.parent
        for poly in mesh.polygons:poly.use_smooth=True
        return ob
    sides=48;rings=14;points=[tuple(scalp(0,0,.014)[0])];faces=[]
    for row in range(1,rings+1):
        for i in range(sides):
            az=i*math.tau/sides
            extent=1.06+.69*(1-math.cos(az))*.5+.12*math.sin(az)**2
            # Break the hairline without exposing disconnected scalp islands.
            extent+=.025*math.sin(az*7)+.012*math.sin(az*11)
            extent-=.11*math.sin(az)**4
            theta=row/rings*extent
            point,_=scalp(theta,az,.022*max(0,math.cos(theta)))
            points.append(tuple(point))
    for i in range(sides):faces.append((0,1+i,1+(i+1)%sides))
    for row in range(rings-1):
        for i in range(sides):
            a=1+row*sides+i;b=1+row*sides+(i+1)%sides;faces.append((a,a+sides,b+sides,b))
    cap=hair_mesh('Hair fitted short undercut',points,faces)
    solid=cap.modifiers.new('Closed hairline','SOLIDIFY');solid.thickness=.004
    def groom(name,start,end,az,sweep,width,lift):
        steps=12;cross=8;centres=[];normals=[]
        for i in range(steps+1):
            t=i/steps;theta=start+(end-start)*t
            point,normal=scalp(theta,az+sweep*t,lift*math.sin(math.pi*t)**.8)
            centres.append(point);normals.append(normal)
        points=[];faces=[]
        for i,(point,normal) in enumerate(zip(centres,normals)):
            t=i/steps
            tangent=(centres[min(i+1,steps)]-centres[max(0,i-1)]).normalized()
            across=tangent.cross(normal).normalized()
            # Wide soft middle, buried root and tapered end; no round cables.
            w=width*(.35+.8*math.sin(math.pi*t))*(1-t**5)+.0004
            for j in range(cross):
                angle=j*math.tau/cross
                points.append(tuple(point+across*(w*math.cos(angle))+normal*(w*.33*math.sin(angle))))
        for i in range(steps):
            for j in range(cross):
                a=i*cross+j;b=i*cross+(j+1)%cross;faces.append((a,b,b+cross,a+cross))
        faces.extend([tuple(reversed(range(cross))),tuple(steps*cross+j for j in range(cross))])
        hair_mesh(name,points,faces)
    for i in range(8):
        groom('Hair swept top %02d'%i,.16+.035*(i%3),1.10+.13*(i%3)/2,-1.25+i*.30,.48,.033,.028+.012*math.sin(i))
    for side in [-1,1]:
        for i in range(5):
            groom('Hair short side %s %s'%(side,i),.55,1.38+.12*i/4,side*(1.1+i*.36),side*.30,.025,.012)
    for i in range(3):
        groom('Hair broken crown %s'%i,.10,.95,2.3+i*.4,.22,.031,.038)
    # Authored curved eyelid bands replace socket compression. Outer rings
    # follow the native face; inner arcs meet at the actual eye seam on closure.
    points=[tuple(v.co) for v in old.data.vertices];polys=[tuple(p.vertices) for p in old.data.polygons]
    old_uv=[tuple(v.uv) for v in old.data.uv_layers.active.data];lid_targets={};lid_uv=[]
    segments=24;rows=4
    for side in [-1,1]:
        cx=side*.0785;cz=.0344
        for upper in [True,False]:
            first=len(points)
            for i in range(segments+1):
                theta=math.pi*i/segments+(0 if upper else math.pi)
                inner=Vector((cx+.034*math.cos(theta),-.187+.006*math.cos(theta)**2,cz+(.015 if upper else .010)*math.sin(theta)))
                outer=Vector((cx+.045*math.cos(theta),0,cz+.034*math.sin(theta)))
                outer.y=front(outer.x,outer.z)-.0012
                shut=inner.copy();shut.z=cz;shut.y-=.012
                for j in range(rows+1):
                    t=j/rows;blend=t*t*(3-2*t);point=inner.lerp(outer,t)
                    point.y=inner.y*(1-blend)+(front(point.x,point.z)-.0008)*blend
                    index=len(points);points.append(tuple(point));target=shut.lerp(outer,t)
                    closed_blend=max(0,(t-.45)/.55);closed_blend=closed_blend*closed_blend*(3-2*closed_blend)
                    target.y=shut.y*(1-closed_blend)+(front(target.x,target.z)-.0008)*closed_blend;lid_targets[index]=target
            for i in range(segments):
                for j in range(rows):
                    a=first+i*(rows+1)+j
                    polys.append((a,a+1,a+rows+2,a+rows+1))
                    lid_uv.extend([(i/segments,j/rows),(i/segments,(j+1)/rows),((i+1)/segments,(j+1)/rows),((i+1)/segments,j/rows)])
    rebuilt=bpy.data.meshes.new('Player head and curved eyelids');rebuilt.from_pydata(points,[],polys);rebuilt.update();rebuilt.materials.append(skin)
    uv=rebuilt.uv_layers.new(name='UVMap')
    for loop,value in zip(uv.data,old_uv+lid_uv):loop.uv=value
    for polygon in rebuilt.polygons:polygon.use_smooth=True
    old.data=rebuilt
    # Vertex tint follows native lip volume, rather than a second mouth shell.
    colors=old.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
    base=tuple(skin.diffuse_color[:3])
    for loop in old.data.loops:
        x,y,z=old.data.vertices[loop.vertex_index].co
        lip=math.exp(-(x/.067)**4-((z+.112)/.023)**6)*max(0,min(1,(-y-.191)/.025))
        tint=(base[0]*.86,base[1]*.61,base[2]*.63)
        colors.data[loop.index].color=tuple(base[i]*(1-lip*.62)+tint[i]*lip*.62 for i in range(3))+(1,)
    nodes=skin.node_tree.nodes;bs=nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.74
    vc=nodes.new('ShaderNodeVertexColor');vc.layer_name='Color';skin.node_tree.links.new(vc.outputs['Color'],bs.inputs['Base Color']);skin['atrium_surface_family']='skin'
    old.shape_key_add(name='Basis');blink=old.shape_key_add(name='Blink');talk=old.shape_key_add(name='Talk')
    for i,vertex in enumerate(old.data.vertices):
        x,y,z=vertex.co
        if i in lid_targets:blink.data[i].co=lid_targets[i]
        jaw=max(0,min(1,(-z-.109)/.010))*max(0,min(1,(-y+.02)/.09))
        talk.data[i].co.z-=.020*jaw;talk.data[i].co.y+=.004*jaw
    old.data.calc_loop_triangles();old['facial_triangles']=len(old.data.loop_triangles)
    return old
