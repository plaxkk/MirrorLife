"""Author continuous, flared stair cheeks; keep all 22 tread tops intact.

The reference motivates rounded massing and coloured cheeks. The exact rear
profile and underside are inferred, not reconstructed from hidden image data.
"""
import bpy,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'models/atrium';OUT=ROOT/'public/assets/atrium'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
bpy.context.preferences.filepaths.save_version=0
COLLIDERS=json.loads(bpy.context.scene['collision_manifest'])
M={k:bpy.data.materials[v] for k,v in {'ivory':'Ivory','mint':'Mint','yellow':'Saffron','brass':'Brass'}.items()}
source=(ROOT/'scripts/build-atrium-assets.py').read_text()
exec(source[source.index('def p('):source.index('# Ground, upper deck')])
def flare(z):return .27*math.exp(-((z-4.7)/1.35)**2)
# Rebuild authored cheeks deterministically; shift existing rails only once.
rails_finished=bool(bpy.context.scene.get('stair_returns_v1'))
COLLIDERS=[d for d in COLLIDERS if not d['name'].startswith(('Main stair curved side ','Main stair flowing guard '))]
# The saved source already includes a later flowing-shell pass. Replace that
# complete assembly too; leaving its crown/toe would create overlapping solids.
for ob in list(bpy.context.scene.objects):
    if ob.name.startswith(('Main stair flowing shell ','Main stair enamel crown ','Main stair rounded toe ')):
        bpy.data.objects.remove(ob,do_unlink=True)
for sign in [-1,1]:
    name='Main stair curved side '+str(sign)
    old=bpy.data.objects.get(name)
    if old:bpy.data.objects.remove(old,do_unlink=True)
    verts=[];sections=48;ring_count=16
    for i in range(sections):
        t=i/(sections-1);z=5.12-9.87*t
        # Low rounded toe grows into a fuller waist, then blends to landing.
        centre=max(.31,min(3.78,(4.8-z)/9.5*3.5+.34))
        height=.62+.22*math.sin(math.pi*t)**2
        x=5.8+sign*(1.425+flare(z));width=.32
        for dx,dy in rounded(width,height,.11,n=4):verts.append((x+dx,centre+dy,z))
    faces=[tuple(reversed(range(ring_count)))]
    for i in range(sections-1):
        for j in range(ring_count):faces.append((i*ring_count+j,i*ring_count+(j+1)%ring_count,(i+1)*ring_count+(j+1)%ring_count,(i+1)*ring_count+j))
    faces.append(tuple(range((sections-1)*ring_count,sections*ring_count)))
    faces=[tuple(reversed(f)) for f in faces]
    ob=mesh(name,verts,faces,'ivory',smooth=True)
    ob.data.materials.append(M['yellow' if sign<0 else 'mint'])
    # Enamel crown is a material region of the closed surface, with no
    # intersecting tube or additional draw primitive per station.
    for station in range(sections-1):
        for edge in range(2,6):ob.data.polygons[1+station*ring_count+edge].material_index=1
    ob.data.polygons[0].use_smooth=False;ob.data.polygons[-1].use_smooth=False
    ob['construction']='closed rounded cheek; 32cm width; flared foot; unchanged treads'
    indices=[]
    for f in faces:
        for j in range(1,len(f)-1):indices.extend([f[0],f[j],f[j+1]])
    COLLIDERS.append({'name':name,'type':'trimesh','vertices':[v for co in verts for v in co],'indices':indices})
    rail=bpy.data.objects.get('Main stair handrail '+str(sign))
    if rail and not rails_finished:
        for spline in rail.data.splines:
            for point in spline.bezier_points:
                point.co.x+=sign*flare(-point.co.y)
    # Uprights stay seated on the same swept cheek, rather than floating.
    for ob in bpy.context.scene.objects:
        if not rails_finished and ob.name.startswith('Main stair baluster') and (ob.location.x-5.8)*sign>0:
            ob.location.x+=sign*flare(-ob.location.y)
bpy.context.scene['stair_returns_v1']=True
bpy.context.scene['collision_manifest']=json.dumps(COLLIDERS)
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
exec(source[source.index('# Export evaluated authored mesh.'):])
