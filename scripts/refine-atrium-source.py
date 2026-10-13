"""Author finishing passes on the saved editable kit, then export its LODs."""
import bpy,json,math,random
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/assets/atrium';SOURCE=ROOT/'models/atrium'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
bpy.context.preferences.filepaths.save_version=0
COLLIDERS=json.loads(bpy.context.scene.get('collision_manifest',(OUT/'collision.json').read_text()))
names={'ivory':'Ivory','navy':'Navy','mint':'Mint','yellow':'Saffron','coral':'Coral','floor':'Terrazzo','oak':'Oak','fabric':'Fabric','green':'Leaf','leaflight':'YoungLeaf','brass':'Brass','soil':'Soil','white':'Ceramic','skyblue':'CityBlue','skyrose':'CityRose','window':'CityWindow','light':'OpalLight'}
M={k:bpy.data.materials[v] for k,v in names.items()};random.seed(17)
source=(ROOT/'scripts/build-atrium-assets.py').read_text()
exec(source[source.index('def p('):source.index('# Ground, upper deck')])
if not bpy.context.scene.get('finish_pass_v1'):
    tube('West outer gallery rail',[(-9,4.52,-4.6),(-9,4.52,5.45)],.035,'brass')
    for i in range(13):cylinder('West outer post',(-9,4,-4.5+i*.82),.02,1,'mint',vertices=12)
    COLLIDERS.append({'type':'box','name':'West outer guard','position':[-9,4.02,.4],'size':[.12,1.05,10.05]})
    for name,pos,size in [('Roof north',[0,7.45,-5.85],[22.4,.3,4.7]),('Roof south',[0,7.45,5.85],[22.4,.3,4.7]),('Roof west',[-7.85,7.45,0],[6.7,.3,7]),('Roof east',[7.85,7.45,0],[6.7,.3,7])]:
        COLLIDERS.append({'type':'box','name':name,'position':pos,'size':size})
    COLLIDERS.append({'type':'box','name':'Quiet table','position':[-7.9,3.85,1.3],'size':[1.1,.7,1.1]})
    # Glass stays restrained; it is never an image-based replacement for the city.
    glass=bpy.data.materials.new('Window glass');glass.use_nodes=True
    bs=glass.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.45,.7,.72,.09)
    bs.inputs['Roughness'].default_value=.13;bs.inputs['Metallic'].default_value=.18;bs.inputs['Alpha'].default_value=.09
    glass.surface_render_method='DITHERED';glass.diffuse_color=(.45,.7,.72,.09)
    for floor in [0,3.5]:
        for i in range(5):box('Rear glazing',(-8.8+i*4.4,floor+1.75,-8.04),(3.22,2.36,.018),glass,.0)
    # Second-tier library and foliage establish deeper occupied room silhouettes.
    shelf('Quiet room library',9.85,3.5,-.2,1.45)
    shelf('Reading room library',-5.2,0,-7.35,1.8)
    plant('Reading ficus',-4.15,0,-3.2,1.4)
    # Larger leaf clusters with branching rather than oversized oval hanging fruit.
    for ob in list(bpy.context.scene.objects):
        if ob.name.startswith('Trailing leaf'):
            ob.scale.z*=.38;ob.scale.x*=.6
    for i in range(12):
        a=i*math.pi/6;x=4.25*math.cos(a);z=3.2*math.sin(a)
        for j in range(3):
            plant('Hanging garden cascade',x,6.28+j*.26,z,.16)
    bpy.context.scene['finish_pass_v1']=True
    bpy.context.scene['collision_manifest']=json.dumps(COLLIDERS)
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
exec(source[source.index('# Export evaluated authored mesh.'):])
