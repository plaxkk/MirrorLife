"""Continuous main-stair ribbons and curved foliage, edited in the saved source.

No floor/step/room relocation. Backside shapes are authored interpretations, not
claims of measured reconstruction from the single reference image.
"""
import bpy,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'models/atrium';OUT=ROOT/'public/assets/atrium'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
bpy.context.preferences.filepaths.save_version=0
COLLIDERS=json.loads(bpy.context.scene['collision_manifest'])
names={'ivory':'Ivory','navy':'Navy','mint':'Mint','yellow':'Saffron','coral':'Coral','floor':'Terrazzo','oak':'Oak','fabric':'Fabric','green':'Leaf','leaflight':'YoungLeaf','brass':'Brass','soil':'Soil','white':'Ceramic','skyblue':'CityBlue','skyrose':'CityRose','window':'CityWindow','light':'OpalLight'}
M={k:bpy.data.materials[v] for k,v in names.items()}
source=(ROOT/'scripts/build-atrium-assets.py').read_text()
exec(source[source.index('def p('):source.index('# Ground, upper deck')])
if not bpy.context.scene.get('continuous_forms_v1'):
    for ob in list(bpy.context.scene.objects):
        if ob.name.startswith('Main stair curved side '):bpy.data.objects.remove(ob,do_unlink=True)
    def centre(t,side):
        z=5.08-9.86*t
        rise=(4.8-z)/9.5*3.5
        smooth_rise=(rise+math.sqrt(rise*rise+.018))/2
        flare=.38*math.exp(-t*9)+.065*math.sin(t*math.pi)
        return (5.8+side*(1.425+flare),smooth_rise+.31,z)
    # A closed rounded section follows one continuous path. The flared toe
    # gives the ribbon a real floor termination instead of a sliced wedge.
    section=rounded(.32,.68,.11,n=6);segments=72
    for side in [-1,1]:
        vertices=[];faces=[];n=len(section)
        for i in range(segments+1):
            t=i/segments;x,y,z=centre(t,side)
            cap=min(1,.24+min(t,1-t)*38)
            for dx,dy in section:vertices.append((x+dx*cap,y+dy*cap,z))
        for i in range(segments):
            for j in range(n):
                a=i*n+j;b=i*n+(j+1)%n;faces.append((a,b,b+n,a+n))
        faces.extend([tuple(reversed(range(n))),tuple(segments*n+j for j in range(n))])
        body=mesh('Main stair flowing shell '+str(side),vertices,faces,'ivory',True)
        body['craft_pass']='closed 72-section swept ribbon, 32cm thick, rounded toe'
        # A separate enamel inlay follows the upper contour, not a painted decal.
        top=[(x,y+.338,z) for x,y,z in [centre(i/48,side) for i in range(49)]]
        tube('Main stair enamel crown '+str(side),top,.07,'mint' if side==1 else 'yellow',resolution=3)
        x,y,z=centre(0,side)
        cylinder('Main stair rounded toe '+str(side),(x,.16,z-.06),.245,.32,'navy',scale=(.9,1.2),vertices=40)
        # Segment hulls follow the flared side wall. Existing rail colliders
        # remain and protect the upper open side; tread colliders are unchanged.
        for i in range(18):
            a=centre(i/18,side);b=centre((i+1)/18,side)
            COLLIDERS.append({'type':'box','name':'Main stair flowing guard '+str(side),
                'position':[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],
                'size':[.34+abs(a[0]-b[0]),.70+abs(a[1]-b[1]),abs(a[2]-b[2])+.02]})
    count=0
    for ob in list(bpy.context.scene.objects):
        if ob.type!='MESH' or ' leaf' not in ob.name.lower() or len(ob.data.vertices)!=5:continue
        if ob.name.startswith(('Hanging garden','Oculus hanging','Trailing leaf')):continue
        points=[v.co.copy() for v in ob.data.vertices];base,end=points[0],points[2]
        across=(points[1]-points[3])*.5;bulge=points[4]-(base+end)*.5
        normal=across.cross(end-base).normalized()
        if normal.dot(bulge)<0:normal.negate()
        vertices=[tuple(base)];faces=[];rows=5
        for i in range(1,rows+1):
            t=i/(rows+1);arch=math.sin(math.pi*t);mid=base.lerp(end,t)+bulge*arch-normal*(end-base).length*.055*t*t
            for u in [-1,0,1]:vertices.append(tuple(mid+across*(u*arch**.8*.83)-normal*(u*u*arch*.024)))
        vertices.append(tuple(end-normal*(end-base).length*.055));tip=len(vertices)-1
        faces.extend([(0,1,2),(0,2,3)])
        for i in range(rows-1):
            a=1+i*3
            for j in range(2):faces.append((a+j,a+j+3,a+j+4,a+j+1))
        a=1+(rows-1)*3;faces.extend([(a,tip,a+1),(a+1,tip,a+2)])
        original=ob.data;material=original.materials[0]
        data=bpy.data.meshes.new(ob.name+' curved blade');data.from_pydata(vertices,[],faces);data.update();data.materials.append(material)
        ob.data=data
        for modifier in list(ob.modifiers):ob.modifiers.remove(modifier)
        for polygon in data.polygons:polygon.use_smooth=True
        uv=data.uv_layers.new(name='UVMap')
        for loop in data.loops:
            v=loop.vertex_index;uv.data[loop.index].uv=(.5,0) if v==0 else ((.5,1) if v==tip else (((v-1)%3)/2,((v-1)//3+1)/(rows+1)))
        solid=ob.modifiers.new('Botanical lamina thickness','SOLIDIFY');solid.thickness=.002;solid.offset=0
        ob['craft_pass']='curved blade with midrib, tapered tip, UV and closed thin edge';count+=1
    bpy.context.scene['continuous_forms_v1']=json.dumps({'refinedLeaves':count,'mainStairSections':72,'additionalColliderHulls':36,'interpretation':'authored curvature following visible reference motifs; original walking surfaces unchanged'})
    bpy.context.scene['collision_manifest']=json.dumps(COLLIDERS)
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
    print('CONTINUOUS_FORMS',bpy.context.scene['continuous_forms_v1'],flush=True)
if not bpy.context.scene.get('roof_join_v1'):
    # Window modules end at 7m, while the roof underside is 7.3m. Close the
    # unintended open sky band with full-thickness perimeter lintels.
    for name,pos,size in [('north',(0,7.16,-8),(22.4,.36,.42)),('south',(0,7.16,8),(22.4,.36,.42)),('west',(-11,7.16,0),(.42,.36,16)),('east',(11,7.16,0),(.42,.36,16))]:
        box('Roof continuous lintel '+name,pos,size,'ivory',.025,True)
    bpy.context.scene['roof_join_v1']=True
    bpy.context.scene['collision_manifest']=json.dumps(COLLIDERS)
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
if not bpy.context.scene.get('closed_curve_ends_v1'):
    # Upholstered backs and handrails are solid objects. Open curve ends were
    # visible as holes when players approached the table from the side.
    for ob in bpy.context.scene.objects:
        if ob.type=='CURVE':ob.data.use_fill_caps=True
    bpy.context.scene['closed_curve_ends_v1']=True
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
exec(source[source.index('# Export evaluated authored mesh.'):])
