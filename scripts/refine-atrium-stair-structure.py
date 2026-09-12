"""Replace stacked floor-height stair blocks with a closed structural flight.

The tread heights and public circulation remain fixed. The single reference
does not show the underside: the sloped soffit is an authored interpretation.
"""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'models/atrium';OUT=ROOT/'public/assets/atrium'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
bpy.context.preferences.filepaths.save_version=0
COLLIDERS=json.loads(bpy.context.scene['collision_manifest'])
names={'ivory':'Ivory','navy':'Navy','mint':'Mint','yellow':'Saffron','coral':'Coral','floor':'Terrazzo','oak':'Oak','fabric':'Fabric','green':'Leaf','leaflight':'YoungLeaf','brass':'Brass','soil':'Soil','white':'Ceramic','skyblue':'CityBlue','skyrose':'CityRose','window':'CityWindow','light':'OpalLight'}
M={k:bpy.data.materials[v] for k,v in names.items()}
source=(ROOT/'scripts/build-atrium-assets.py').read_text()
exec(source[source.index('def p('):source.index('# Ground, upper deck')])
if not bpy.context.scene.get('structural_flight_v1'):
    for i in range(22):
        name='Main stair tread '+str(i);ob=bpy.data.objects[name]
        top=3.5*(i+1)/22;thickness=min(.18,top)
        # The original cube has applied object scale. Rescale its local height
        # and move its centre while preserving the exact walking surface.
        ratio=thickness/top
        for vertex in ob.data.vertices:vertex.co.z*=ratio
        ob.location.z=top-thickness/2
        for d in COLLIDERS:
            if d['name']==name:d['position'][1]=top-thickness/2;d['size'][1]=thickness
    # Closed 28cm inclined concrete flight, seated into the top landing.
    # In the low toe the underside terminates on the floor rather than below it.
    section=[(4.8,0),(-4.7,3.5),(-4.7,3.22),(4.04,0)]
    vertices=[(x,y,z) for x in [4.475,7.125] for z,y in section]
    faces=[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    ob=mesh('Main stair structural soffit',vertices,faces,'ivory')
    bevel(ob,.018,3)
    ob['construction']='closed 28cm inclined flight; underside inferred from structure'
    # Physical hull uses the same structural vertices, not the former solid wall.
    indices=[index for f in faces for triangle in [(f[0],f[1],f[2]),(f[0],f[2],f[3])] for index in triangle]
    COLLIDERS.append({'name':ob.name,'type':'trimesh','vertices':[c for v in vertices for c in v],'indices':indices})
    bpy.context.scene['structural_flight_v1']='22 original tread tops; closed inclined soffit; visible and physical underside'
    bpy.context.scene['collision_manifest']=json.dumps(COLLIDERS)
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
exec(source[source.index('# Export evaluated authored mesh.'):])
