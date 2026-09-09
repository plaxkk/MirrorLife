"""Original metre-authored atrium kit. Run with Blender --background --python.

Coordinates passed to helpers are game (x, height, z); Blender stores (x,-z,height).
The .blend retains semantic objects; runtime exports merge static geometry by material.
"""
import bpy
import math
import json
import random
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/atrium'
SOURCE = ROOT / 'models/atrium'
random.seed(1937)
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
bpy.context.preferences.filepaths.save_version = 0
COLLIDERS = []

def linear(v):
    return v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4

def material(name, color, rough=.7, metal=0, textured=False):
    m = bpy.data.materials.new(name)
    rgb = tuple(linear(int(color[i:i+2],16)/255) for i in (1,3,5))
    m.diffuse_color = (*rgb,1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*rgb,1)
    bs.inputs['Roughness'].default_value = rough
    bs.inputs['Metallic'].default_value = metal
    if textured:
        size=256
        im=bpy.data.images.new(name+'-surface', width=size, height=size)
        pixels=[]
        for y in range(size):
            for x in range(size):
                grain = random.uniform(-.018,.018)
                if name == 'Fabric': grain += .015 * math.sin(x*math.pi/2)*math.sin(y*math.pi/2)
                if name == 'Oak': grain += .025*math.sin(y*.17+math.sin(x*.04))
                pixels.extend([linear(max(0,min(1,c+grain))) for c in tuple(int(color[i:i+2],16)/255 for i in (1,3,5))]+[1])
        im.pixels.foreach_set(pixels)
        im.filepath_raw=str(OUT / (name.lower()+'-basecolor.png'))
        im.file_format='PNG'; im.save(); im.pack()
        tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=im
        m.node_tree.links.new(tex.outputs['Color'], bs.inputs['Base Color'])
    return m

M = {
    'ivory':material('Ivory','#eee4d2',.78, textured=True),
    'navy':material('Navy','#233444',.47),
    'mint':material('Mint','#71aaa0',.48),
    'yellow':material('Saffron','#eab847',.42),
    'coral':material('Coral','#d87860',.53),
    'floor':material('Terrazzo','#e0d7c6',.62, textured=True),
    'oak':material('Oak','#b99060',.67, textured=True),
    'fabric':material('Fabric','#d2ae65',.95, textured=True),
    'green':material('Leaf','#386c48',.83),
    'leaflight':material('YoungLeaf','#7d9f4b',.8),
    'brass':material('Brass','#c69b50',.33,.65),
    'soil':material('Soil','#4b382c',1),
    'white':material('Ceramic','#faf2de',.35),
    'skyblue':material('CityBlue','#94b4c4',.9),
    'skyrose':material('CityRose','#c19f90',.9),
    'window':material('CityWindow','#7899ac',.65),
}
M['light']=material('OpalLight','#fff0d5',.5)
bs=M['light'].node_tree.nodes.get('Principled BSDF')
bs.inputs['Emission Color'].default_value=(1,.77,.48,1)
bs.inputs['Emission Strength'].default_value=.8

def p(v): return (v[0],-v[2],v[1])

def setup(obj, name, mat):
    obj.name=name
    obj.data.materials.append(M[mat] if isinstance(mat,str) else mat)
    obj['semantic_part']=name
    return obj

def mesh(name, verts, faces, mat, smooth=False):
    data=bpy.data.meshes.new(name)
    data.from_pydata([p(v) for v in verts],[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
    setup(obj,name,mat)
    uv=data.uv_layers.new(name='UVMap')
    for poly in data.polygons:
        poly.use_smooth=smooth
        n=poly.normal
        axes=(0,1) if abs(n.z)>.5 else ((0,2) if abs(n.y)>.5 else (1,2))
        for li in poly.loop_indices:
            co=data.vertices[data.loops[li].vertex_index].co
            uv.data[li].uv=(co[axes[0]],co[axes[1]])
    return obj

def bevel(obj, amount=.035, segments=3):
    mod=obj.modifiers.new('Crafted edge radius','BEVEL');mod.width=amount;mod.segments=segments
    normal=obj.modifiers.new('Surface normals','WEIGHTED_NORMAL');normal.keep_sharp=True
    return obj

def box(name, pos, size, mat, radius=.025, collision=False):
    bpy.ops.mesh.primitive_cube_add(size=1, location=p(pos))
    obj=bpy.context.object;obj.dimensions=(size[0],size[2],size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    setup(obj,name,mat)
    if radius: bevel(obj,min(radius,min(size)/3))
    if collision: COLLIDERS.append({'type':'box','name':name,'position':pos,'size':size})
    return obj

def tube(name, points, radius, mat, cyclic=False, resolution=3):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=resolution
    s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for b,co in zip(s.bezier_points,points):
        b.co=p(co);b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    s.use_cyclic_u=cyclic
    c.bevel_depth=radius;c.bevel_resolution=2
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);setup(o,name,mat)
    return o

def rounded(w,h,r,n=8):
    pts=[]
    for cx,cy,start in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
        for i in range(n):
            a=math.radians(start+i*90/n)
            pts.append((cx+r*math.cos(a),cy+r*math.sin(a)))
    return pts

def portal(name,x,y,z,w,h,mat='ivory',side=False):
    # Open-bottom masonry arch, not a window sunk through the walking floor.
    def outline(width,height,r):
        points=[(-width/2,0),(-width/2,height-r)]
        for i in range(17):
            a=math.pi-i*math.pi/32
            points.append((-width/2+r+r*math.cos(a),height-r+r*math.sin(a)))
        for i in range(17):
            a=math.pi/2-i*math.pi/32
            points.append((width/2-r+r*math.cos(a),height-r+r*math.sin(a)))
        return points+[(width/2,0)]
    outer=outline(w,h,.85);inner=outline(w-.54,h-.27,.64);n=len(outer);verts=[]
    for depth in [-.24,.24]:
        for shape in [outer,inner]:
            for u,v in shape:verts.append((x+depth,y+v,z+u) if side else (x+u,y+v,z+depth))
    faces=[]
    for i in range(n-1):
        j=i+1
        faces.extend([(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)])
    bevel(mesh(name,verts,faces,mat),.035,3)
    for sign in [-1,1]:
        pos=[x,y+h/2,z];pos[2 if side else 0]+=sign*(w/2-.135)
        COLLIDERS.append({'type':'box','name':name+' jamb','position':pos,'size':[.48,h,.27] if side else [.27,h,.48]})
    pos=[x,y+h-.18,z]
    COLLIDERS.append({'type':'box','name':name+' lintel','position':pos,'size':[.48,.36,w] if side else [w,.36,.48]})

def ring(name, center, outer, inner, depth, mat, orientation='wall'):
    # Closed extruded rounded aperture: actual hole, all four surfaces included.
    a=rounded(*outer);b=rounded(*inner);n=len(a);verts=[]
    for d in [-depth/2,depth/2]:
        for shape in [a,b]:
            for u,v in shape:
                if orientation=='floor': local=(u,d,v)
                elif orientation=='side':local=(d,v,u)
                else:local=(u,v,d)
                verts.append(tuple(center[j]+local[j] for j in range(3)))
    faces=[]
    for i in range(n):
        j=(i+1)%n
        faces.extend([(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),
                      (i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)])
    o=mesh(name,verts,faces,mat);bevel(o,.022,2)
    return o

def cylinder(name, pos, radius, height, mat, radius_top=None, scale=(1,1), vertices=48):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=radius,radius2=radius if radius_top is None else radius_top,depth=height,location=p(pos))
    o=bpy.context.object;o.scale=(scale[0],scale[1],1)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    setup(o,name,mat);bevel(o,.02,2)
    for f in o.data.polygons:f.use_smooth=len(f.vertices)==4
    return o

def orb(name,pos,size,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=1,location=p(pos))
    o=bpy.context.object;o.scale=(size[0],size[2],size[1]);setup(o,name,mat)
    for f in o.data.polygons:f.use_smooth=True
    return o

def plant(name,x,y,z,scale=1):
    cylinder(name+' pot',(x,y+.23*scale,z),.27*scale,.46*scale,'white',.34*scale)
    cylinder(name+' soil',(x,y+.46*scale,z),.29*scale,.025,'soil')
    for k in range(9):
        a=k*2.4;h=random.uniform(.55,1.35)*scale;r=random.uniform(.28,.62)*scale
        tip=(x+math.cos(a)*r,y+.4*scale+h,z+math.sin(a)*r)
        tube(name+' stem',[(x,y+.44*scale,z),(x+math.cos(a)*r*.25,y+.5*scale+h*.55,z+math.sin(a)*r*.25),tip],.012*scale,'green')
        base=(tip[0]-math.cos(a)*.17*scale,tip[1]-.2*scale,tip[2]-math.sin(a)*.17*scale)
        end=(tip[0]+math.cos(a)*.3*scale,tip[1]+.16*scale,tip[2]+math.sin(a)*.3*scale)
        width=.16*scale
        verts=[base,(tip[0]+math.sin(a)*width,tip[1],tip[2]-math.cos(a)*width),end,
               (tip[0]-math.sin(a)*width,tip[1],tip[2]+math.cos(a)*width),(tip[0],tip[1]+.055*scale,tip[2])]
        o=mesh(name+' leaf',verts,[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],'green' if k%3 else 'leaflight',True)
        solid=o.modifiers.new('Leaf thickness','SOLIDIFY');solid.thickness=.004

def shelf(name,x,y,z,w=2.2):
    box(name+' back',(x,y+1.15,z+.19),(w,2.3,.12),'navy')
    for xx in [x-w/2,x+w/2]:box(name+' upright',(xx,y+1.15,z),(.09,2.3,.5),'oak')
    for h in [0,.52,1.08,1.65,2.22]:
        box(name+' shelf',(x,y+h,z),(w+.12,.08,.54),'oak')
        if h<2:
            cursor=x-w/2+.12
            for j in range(9):
                wid=random.uniform(.065,.14);ht=random.uniform(.24,.43)
                if cursor>x+w/2-.5: break
                book=box(name+' book',(cursor+wid/2,y+h+.055+ht/2,z-.01),(wid,ht,.22),random.choice(['mint','ivory','coral','yellow','navy']),.008)
                box(name+' spine label',(cursor+wid/2,y+h+.15,z-.125),(wid*.75,.025,.008),'ivory',.001)
                cursor+=wid+.035
    plant(name+' plant',x+w/2-.35,y+1.7,z,.32)
    COLLIDERS.append({'type':'box','name':name,'position':[x,y+1.15,z],'size':[w,2.3,.5]})

def seat(name,x,y,z,mat='mint',angle=0):
    # A curved upholstered back, rounded seat and four tapered legs.
    parts=[]
    parts.append(box(name+' cushion',(x,y+.47,z),(.76,.18,.7),mat,.075))
    for dx in [-.26,.26]:
        for dz in [-.22,.22]:parts.append(cylinder(name+' leg',(x+dx,y+.2,z+dz),.045,.4,'oak',.032))
    points=[(x+math.sin(a)*.43,y+.93,z+math.cos(a)*.36) for a in [math.pi*.6,math.pi*.8,math.pi,math.pi*1.2,math.pi*1.4]]
    parts.append(tube(name+' back',points,.1,mat))
    for dx in [-.32,.32]:parts.append(tube(name+' support',[(x+dx,y+.49,z-.2),(x+dx,y+.86,z-.23)],.033,'brass'))
    if angle:
        root=bpy.data.objects.new(name+' rotation',None);bpy.context.collection.objects.link(root);root.location=p((x,y,z))
        bpy.context.view_layer.update()
        for o in parts:
            transform=o.matrix_world.copy();o.parent=root;o.matrix_world=transform
        root.rotation_euler.z=-angle

# Ground, upper deck and skylight are separate load-bearing geometry.
box('Ground slab',(0,-.16,0),(22,.32,16),'floor',.03,True)
for name,pos,size in [('Back gallery',(0,3.34,-6.35),(22,.32,3.3)),('West gallery',(-7.85,3.34,1.05),(2.3,.32,11.5)),('West stair landing',(-9.2,3.34,6.3),(3.6,.32,1.45)),('East gallery',(9.25,3.34,1.05),(3.5,.32,11.5))]:
    box(name,pos,size,'ivory',.12,True)
    box(name+' fascia',(pos[0],3.17,pos[2]),(size[0],.32,size[2]),'navy',.1)
ring('Roof with open oculus',(0,7.45,0),(22.4,16.4,.5),(9,7,3.49),.3,'ivory','floor')
for i,(outer,inner,mat) in enumerate([((10.4,8.4,4.19),(9.6,7.6,3.79),'yellow'),((9.6,7.6,3.79),(9,7,3.49),'navy'),((9.15,7.15,3.56),(8.85,6.85,3.41),'ivory')]):
    ring('Oculus layer '+str(i),(0,7.22-i*.12,0),outer,inner,.2,mat,'floor')
for i in range(16):
    a=i*math.pi/8
    xx,zz=math.cos(a)*4.55,math.sin(a)*3.55
    plant('Oculus hanging garden',xx,7.03,zz,.36)
    tube('Hanging vine',[(xx,7.17,zz),(xx*.95,6.85,zz*.95),(xx*.98,6.46,zz*.98)],.012,'green')
    orb('Trailing leaf',(xx*.96,6.73,zz*.96),(.1,.2,.08),'leaflight')

# Layered inhabited edges: the inner arcade separates rooms from the social centre.
for x in [-4.65,0,4.65]:portal('Ground rear arcade',x,0,-4.68,4.6,3.12,'yellow')
for y in [0,3.5]:
    for z in [-2.2,2.6]:
        portal('East room opening',7.5,y,z,4.6,3.14,'ivory',True)
        portal('East room colour reveal',7.62,y,z,4.15,2.94,'mint' if y else 'coral',True)
portal('Reading and tea threshold',-6.7,0,-.5,4.4,3.15,'yellow',True)

# A continuous floor graphic uses authored curved ribbons, not a photo plane.
for index,(cx,mat,width) in enumerate([(-5.5,'navy',1.25),(-4.35,'yellow',.65),(-3.45,'mint',1.05),(5.7,'coral',.7)]):
    verts=[]
    for i in range(100):
        z=-7.95+i*15.9/99;x=cx+1.1*math.sin(z*.43)+.2*math.sin(z)
        verts.extend([(x-width/2,.006+index*.0005,z),(x+width/2,.006+index*.0005,z)])
    mesh('Inlaid floor ribbon '+mat,verts,[(2*i,2*i+1,2*i+3,2*i+2) for i in range(99)],mat)

def facade(name,center,w=4.4,h=3.5,side=False,door=False):
    orient='side' if side else 'wall'
    inner=(w-.82,h-.76,.65)
    ring(name+' wall',center,(w,h,.03),inner,.38,'navy',orient)
    for idx,(offset,mat) in enumerate([(.0,'ivory'),(.15,'coral'),(.28,'mint')]):
        a=(inner[0]-offset,inner[1]-offset,.63-offset/2)
        b=(a[0]-.16,a[1]-.16,a[2]-.075)
        ring(name+' reveal '+str(idx),center,a,b,.46+idx*.12,mat,orient)
    # Analytic collision tiles leave a real opening; exterior openings have glass barriers.
    if not door:
        COLLIDERS.append({'type':'box','name':name+' glazing','position':center,'size':[.15,h,w] if side else [w,h,.15]})

for floor in [0,3.5]:
    for i in range(5):facade('Rear window '+str((floor,i)),(-8.8+i*4.4,floor+1.75,-8),h=3.5)
    for side in [-1,1]:
        for j in range(4):facade('Side window '+str((floor,side,j)),(side*11,floor+1.75,-6+j*4),w=4,h=3.5,side=True)
    for i,x in enumerate([-8.8,-4.4,0,4.4,8.8]):
        if floor==0 and i==1:
            # Entry is a real open doorway surrounded by authored wall sections.
            box('Entry left pier',(-6.2,1.6,8),(.8,3.2,.42),'yellow',.16,True)
            box('Entry right pier',(-2.6,1.6,8),(.8,3.2,.42),'yellow',.16,True)
            box('Entry lintel',(-4.4,3.25,8),(4.4,.5,.42),'ivory',.16,True)
            box('Entry threshold',(-4.4,.012,7.6),(2.8,.022,.8),'navy',.01)
        else:facade('Front window '+str((floor,i)),(x,floor+1.75,8),h=3.5)

# Physical stairs: 22 steps, 159mm risers, broad main flight, a separate west return.
for name,x,w in [('Main stair',5.8,2.65),('Return stair',-9.9,1.7)]:
    n=22;start=4.8;end=-4.7;run=(start-end)/n
    for i in range(n):
        h=3.5*(i+1)/n;z=start-run*(i+.5)
        zz=z if name=='Main stair' else -z+.9
        box(name+' tread '+str(i),(x,h/2,zz),(w,h,run+.014),'navy',.018,True)
        box(name+' tread surface '+str(i),(x,h+.004,zz),(w-.08,.015,run-.02),'ivory',.006)
        box(name+' nosing '+str(i),(x,h+.009,zz+(run*.36 if name=='Main stair' else -run*.36)),(w-.08,.018,run*.2),'yellow',.006)
    for sign in [-1,1]:
        xx=x+sign*(w/2+.1)
        # Swept side slab with a soft curved starting return.
        points=[(xx,.23,5.12),(xx,.38,4.65),(xx,1.25,2),(xx,2.36,-1),(xx,3.77,-4.75)]
        if name=='Main stair':
            verts=[]
            for i in range(34):
                z=5.12-i*9.87/33;h=max(.18,min(3.76,(4.8-z)/9.5*3.5+.3))
                for dx,dh in [(-.09,-.22),(.09,-.22),(.09,.22),(-.09,.22)]:verts.append((xx+dx,h+dh,z))
            faces=[(0,3,2,1)]
            for i in range(33):
                for j in range(4):faces.append((4*i+j,4*i+(j+1)%4,4*(i+1)+(j+1)%4,4*(i+1)+j))
            faces.append(tuple(range(132,136)))
            bevel(mesh(name+' curved side '+str(sign),verts,faces,'mint' if sign==1 else 'yellow'),.06,4)
        rail=[(xx,.95,4.9),(xx,1.12,4.45),(xx,2.24,1.4),(xx,3.55,-2.2),(xx,4.55,-4.85)]
        if name=='Return stair':rail=[(a,b,-c+.9) for a,b,c in rail]
        tube(name+' handrail '+str(sign),rail,.038,'brass')
        for i in range(7):
            z=4.45-i*9.15/6;h=(4.8-z)/9.5*3.5
            cylinder(name+' baluster',(xx,h+.49,z if name=='Main stair' else -z+.9),.018,.96,'brass',vertices=12)
        # Thin continuous slope collider, not an invisible shortcut through the stairs.
        COLLIDERS.append({'type':'stairRail','name':name,'x':xx,'z0':4.9 if name=='Main stair' else -4.0,'z1':-4.8 if name=='Main stair' else 5.7,'rise':3.5,'width':.12,'height':1.05})

# Mezzanine guard rails, segmented around both flight landings.
for x0,x1,z in [(-6.7,4.35,-4.68),(7.3,10.8,-4.68)]:
    tube('Gallery handrail',[(x0,4.52,z),(x1,4.52,z)],.032,'brass')
    for i in range(int((x1-x0)/.8)+1):
        xx=x0+i*(x1-x0)/max(1,int((x1-x0)/.8));cylinder('Gallery post',(xx,4.02,z),.019,1.04,'mint',vertices=12)
    COLLIDERS.append({'type':'box','name':'Gallery rail','position':[(x0+x1)/2,4.01,z],'size':[x1-x0,1.03,.12]})
for sign in [-1,1]:
    x=-6.7 if sign==-1 else 7.5
    tube('Side gallery rail',[(x,4.52,-4.65),(x,4.52,6.75)],.032,'brass')
    for i in range(14):cylinder('Side gallery post',(x,4.01,-4.6+i*.87),.019,1.02,'mint',vertices=12)
    COLLIDERS.append({'type':'box','name':'Side guard','position':[x,4.01,1.02],'size':[.12,1.02,11.45]})
    box('Gallery end guard',(sign*9.25,4.0,6.8),(3.5,1,.14),'mint',.03,True)

# Central landmark. Elliptical tabletop, inset annular print, articulated storage bays.
tx,tz=-.65,.1
cylinder('Shared table plinth',(tx,.3,tz),2.13,.58,'navy',scale=(1,.65))
cylinder('Shared table inner carcass',(tx,.55,tz),1.8,.6,'navy',scale=(1,.65))
cylinder('Shared table lower shelf',(tx,.2,tz),2.17,.1,'oak',scale=(1,.65))
cylinder('Shared table edge',(tx,.84,tz),2.45,.16,'navy',scale=(1,.68))
cylinder('Shared table surface',(tx,.927,tz),2.37,.027,'ivory',scale=(1,.68))
for a,mat in [(0,'mint'),(2.1,'coral'),(4.2,'yellow')]:
    verts=[]
    for i in range(28):
        angle=a+i*1.5/27
        for rad in [.76,2.28]:verts.append((tx+math.cos(angle)*rad,.945,tz+math.sin(angle)*rad*.68))
    mesh('Table inlay '+mat,verts,[(2*i,2*i+1,2*i+3,2*i+2) for i in range(27)],mat)
for i in range(7):
    x=tx-1.8+i*.58
    box('Table cubby back',(x,.45,tz+.92),(.51,.48,.09),'navy',.025)
    box('Table cubby divider',(x-.26,.45,tz+1.08),(.045,.5,.39),'oak',.014)
    if i%2:
        box('Table drawer',(x,.45,tz+1.14),(.46,.36,.09),['mint','coral','yellow'][i%3],.035)
        box('Drawer pull',(x,.46,tz+1.199),(.14,.022,.022),'brass',.008)
    else:
        for j in range(3):box('Table stored book',(x,.26+j*.07,tz+1.13),(.4,.055,.21),['ivory','mint','coral'][j],.012)
plant('Shared table plant',tx,.95,tz,.5)
for x,z,mat in [(-1.6,.65,'navy'),(.35,.6,'coral'),(-.6,-.9,'mint')]:
    box('Community notebook',(x,.96,z),(.36,.04,.25),mat,.018)
    cylinder('Tea cup',(x+.35,1.015,z),.06,.12,'white',.072,vertices=24)
COLLIDERS.append({'type':'box','name':'Shared table','position':[tx,.46,tz],'size':[4.65,.92,2.95]})
for x,z,a in [(-2.2,-1.95,0),(-.55,-1.95,0),(1.1,-1.95,0),(-3.65,.15,-math.pi/2),(2.4,.15,math.pi/2),(-1.1,2.3,math.pi)]:seat('Communal chair',x,0,z,'yellow' if x<0 else 'mint',a)

# Human-scale niches with belongings, benches and books.
for floor in [0,3.5]:
    for x in [-8.7,8.7]:
        shelf('Living library',x,floor,-7.35,2.5)
        box('Window bench base',(x,floor+.23,-5.75),(2.7,.46,.75),'navy',.16,True)
        box('Window bench cushion',(x,floor+.54,-5.75),(2.56,.2,.74),'fabric',.095)
        box('Window bench back',(x,floor+.88,-6.03),(2.58,.6,.16),'mint',.075)
        plant('Corner plant',x+(-1.4 if x>0 else 1.4),floor,-7.05,.7)
for x,z,s in [(-7.7,3,1.5),(9.7,3,1.1),(-3.6,-4.1,1.4),(3.9,-6.7,.9),(-7.8,6.2,.8),(10,6,.8)]:plant('Living greenery',x,0,z,s)
for x,z in [(-8,3.9),(9.7,1.5),(-2.5,-6.85),(3,-6.85)]:plant('Gallery garden',x,3.5,z,.8)

box('Tea kitchen cabinet',(-7.45,.5,-.2),(2.3,1,1.15),'mint',.08,True)
box('Tea kitchen counter',(-7.45,1.04,-.2),(2.45,.13,1.27),'ivory',.04)
for x in [-8.15,-7.45,-6.75]:
    box('Kitchen door',(x,.51,.397),(.6,.8,.05),'yellow',.045)
    cylinder('Cup on tea counter',(x,1.17,-.1),.085,.19,'white',.096)
cylinder('Tea kettle',(-7.7,1.33,-.5),.2,.42,'coral',.13)
tube('Kettle handle',[(-7.94,1.22,-.5),(-8.02,1.5,-.5),(-7.91,1.59,-.5)],.025,'navy')
box('Community records console',(0,.56,-6.9),(2.25,1.12,.72),'coral',.12,True)
box('Pinboard frame',(0,1.96,-7.74),(2.4,1.42,.15),'oak',.12)
box('Pinboard felt',(0,1.96,-7.64),(2.2,1.2,.06),'ivory',.08)
for i in range(8):box('Pinned note',(-.85+(i%4)*.55,1.65+(i//4)*.5,-7.59),(.36,.34,.01),['mint','coral','yellow'][i%3],.008)

# Upstairs activity zones: quiet table, story artifact, telescope-like viewing instrument.
cylinder('Quiet table',(-7.9,4.1,1.3),.55,.1,'oak')
cylinder('Quiet table pedestal',(-7.9,3.8,1.3),.13,.55,'navy')
seat('Quiet chair',-7.9,3.5,2.4,'coral',math.pi)
box('Listening record player',(-7.9,4.2,1.3),(.46,.15,.36),'navy',.04)
cylinder('Record disk',(-7.9,4.281,1.3),.14,.012,'coral')
seat('Observation seat',9.4,3.5,4.6,'mint',math.pi/2)
box('Small story shelf',(9.7,4.18,3.2),(1.3,.16,.7),'oak',.04)
box('Unfinished journal',(9.7,4.3,3.2),(.42,.08,.31),'coral',.02)

# Pendant lamps hang from authored canopy, no unbounded dynamic lights.
for i,(x,z,drop) in enumerate([(-2.1,-.1,2.8),(-.3,-.8,3.2),(1.4,-.2,2.6),(.3,1.1,3.5)]):
    y=7.2-drop
    cylinder('Pendant wire',(x,(7.2+y)/2,z),.012,7.2-y,'navy',vertices=12)
    cylinder('Pendant shade',(x,y,z),.23,.4,['mint','coral','yellow'][i%3],.09)
    orb('Pendant diffuser',(x,y-.22,z),(.22,.22,.22),'light')
for x in [-9,9]:
    for z in [-3,3]:orb('Gallery wall lamp',(x,6.9,z),(.17,.2,.17),'light')

# Modular outside city geometry provides parallax through every window.
for side in [-1,1]:
    for i in range(15):
        x=-27+i*4.1;z=side*random.uniform(24,40);h=random.uniform(7,20);w=random.uniform(2.6,3.8)
        box('City building',(x,h/2-4,z),(w,h,3.5),['skyblue','skyrose','ivory'][i%3],.05)
        for yy in range(0,int(h)-1,2):
            for xx in [-.7,.7]:box('City glazing',(x+xx,yy-2.8,z-side*1.78),(.72,.95,.05),'window',.025)
for side in [-1,1]:
    for i in range(10):
        x=side*random.uniform(24,34);z=-21+i*4.7;h=random.uniform(9,21)
        box('Side skyline',(x,h/2-4,z),(3,h,3.6),['skyblue','skyrose'][i%2],.05)

# Inspectable source, source camera and named gameplay anchors.
for name,pos in {'Spawn':[-4.3,0,6.3],'SharedDecision':[-.6,0,2.4],'Tea':[-7.9,0,1.3],'Records':[0,0,-5.95],'Quiet':[-7.9,3.5,2.2],'Lookout':[9.4,3.5,4.7]}.items():
    o=bpy.data.objects.new('Anchor_'+name,None);bpy.context.collection.objects.link(o);o.location=p(pos)
bpy.ops.object.camera_add(location=p((-6.8,2.65,6.7)))
cam=bpy.context.object;cam.location=p((-3.4,2.65,6.8));cam.name='Reference calibration camera';target=Vector(p((1.0,2.8,-2)))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=22.8
bpy.context.scene.camera=cam
bpy.context.scene['collision_manifest']=json.dumps(COLLIDERS)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'atrium-master.blend'))

# Export evaluated authored mesh. Merge per material keeps calls bounded without deleting detail.
bpy.ops.object.select_all(action='DESELECT')
for o in list(bpy.context.scene.objects):
    if o.type=='CURVE' and any(token in o.name.lower() for token in [' stem','vine']):
        # Sub-centimetre stems do not need the source's hero-curve tessellation.
        # Leaf blades, window reveals, stair and table silhouettes stay untouched.
        o.data.resolution_u=2;o.data.bevel_resolution=1
    if o.type in {'MESH','CURVE'}:o.select_set(True);bpy.context.view_layer.objects.active=o
bpy.ops.object.convert(target='MESH')
buckets={}
for o in bpy.context.scene.objects:
    if o.type=='MESH':
        zone='interior'
        if o.name.startswith(('City ','Side skyline')):
            x,z=o.matrix_world.translation.x,-o.matrix_world.translation.y
            zone=('south' if z>16 else 'north') if abs(z)>16 else ('east' if x>0 else 'west')
        buckets.setdefault((o.data.materials[0].name,zone),[]).append(o)
for mat,objects in buckets.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:bpy.ops.object.join()
    objects[0].name='Atrium_'+mat[0]+'_'+mat[1]
    # Join leaves duplicate material slots; consolidate them by identity.
    mats=list(objects[0].data.materials)
    for poly in objects[0].data.polygons:poly.material_index=0
    objects[0].data.materials.clear();objects[0].data.materials.append(mats[0])

def export(path):
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_apply=True,export_extras=True,export_cameras=False,export_lights=False,export_animations=False,export_draco_mesh_compression_enable=path.parent==OUT)

export(SOURCE/'atrium-master.glb')
triangles=sum(len(o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH')
for o in bpy.context.scene.objects:
    if o.type=='MESH':
        material_name=o.data.materials[0].name
        d=o.modifiers.new('Desktop silhouette LOD','DECIMATE');d.ratio={'Soil':.1,'Ceramic':.3,'CityWindow':.08}.get(material_name,.5);d.use_collapse_triangulate=True
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=d.name)
        o.data.validate(verbose=False)
export(OUT/'atrium-desktop.glb')
for o in bpy.context.scene.objects:
    if o.type=='MESH':
        d=o.modifiers.new('Mobile LOD','DECIMATE');d.ratio=.6;d.use_collapse_triangulate=True
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=d.name)
        o.data.validate(verbose=False)
export(OUT/'atrium-mobile.glb')
(OUT/'collision.json').write_text(json.dumps(COLLIDERS,ensure_ascii=False,indent=2))
(OUT/'manifest.json').write_text(json.dumps({'version':1,'units':'metres','levelHeight':3.5,'floorAreaApproxM2':470,'source':'models/atrium/atrium-master.blend','master':'models/atrium/atrium-master.glb','desktop':'atrium-desktop.glb','mobile':'atrium-mobile.glb','materials':list(buckets),'sourceFaces':triangles,'collisionCount':len(COLLIDERS),'license':'Original project-authored geometry; existing MirrorLife authored character pipeline separately credited.','reference':'design/references/atrium-visual-target.png','inferred':['rear and front façades','left return stair','upstairs side rooms','precise dimensions'],'reviewStatus':'development: runtime and visual verification required'},ensure_ascii=False,indent=2))
print('ATRIUM_ASSETS_READY',len(COLLIDERS),triangles,flush=True)
