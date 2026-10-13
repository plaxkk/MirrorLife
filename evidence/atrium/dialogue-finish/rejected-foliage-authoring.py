"""Round the real reading-area foliage in the editable scene, then export both LODs."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/assets/atrium';SOURCE=ROOT/'models/atrium'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
bpy.context.preferences.filepaths.save_version=0
collision_bytes=(OUT/'collision.json').read_bytes();COLLIDERS=json.loads(collision_bytes)
changed=[]
for ob in list(bpy.context.scene.objects):
    if ob.type!='MESH' or ' leaf' not in ob.name or len(ob.data.vertices) not in (5,17):continue
    pts=[v.co.copy() for v in ob.data.vertices]
    centre=ob.matrix_world@(sum(pts,Vector())/len(pts))
    if not(-5.5<centre.x<-2 and -4.5<-centre.y<.5 and centre.z<3):continue
    if len(pts)==5:base,right,tip,left,ridge=pts
    else:base,tip,left,ridge,right=pts[0],pts[-1],pts[7],pts[8],pts[9]
    axis=tip-base;across=(right-left)/2
    middle=(right+left)/2;lift=ridge-middle
    verts=[];faces=[]
    for row in range(9):
        t=row/8;width=max(.008,math.sin(math.pi*t)**.85)*.88
        spine=base+axis*t+lift*math.sin(math.pi*t)*.85
        for side in [-1,0,1]:
            p=spine+across*side*width
            p-=lift*abs(side)*math.sin(math.pi*t)*.75
            verts.append(p)
    for row in range(8):
        for col in range(2):
            a=row*3+col;faces.append((a,a+1,a+4,a+3))
    mesh=bpy.data.meshes.new(ob.name+' curved blade');mesh.from_pydata(verts,[],faces);mesh.update()
    for mat in ob.data.materials:mesh.materials.append(mat)
    ob.data=mesh
    for p in mesh.polygons:p.use_smooth=True
    ob['dialogue_foliage']='Curved lanceolate blade with central ridge; original stem endpoints retained'
    changed.append(ob.name)
bpy.context.scene['dialogue_foliage_version']=1
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
finished_leaves=[o.name for o in bpy.context.scene.objects if o.get('dialogue_foliage')]
assert finished_leaves, 'No dialogue foliage was refined; do not report a successful finish'
source=(ROOT/'scripts/build-atrium-assets.py').read_text()
try:exec(source[source.index('# Export evaluated authored mesh.'):])
finally:(OUT/'collision.json').write_bytes(collision_bytes)
report=ROOT/'evidence/atrium/dialogue-finish/foliage.json'
report.write_text(json.dumps({'objects':finished_leaves, 'newlyChanged':changed,'collisionBytesPreserved':True,'scope':'Reading area blades only; actual source and two runtime LODs'},indent=2))
print('DIALOGUE_FOLIAGE_READY',len(changed))
