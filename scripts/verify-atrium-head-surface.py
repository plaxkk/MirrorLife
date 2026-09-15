"""Check authored closed-lid coverage against the actual eye stack, in 3D."""
import bpy, json, hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[1]
reports=[]
for identity in ['you','lin','chen','xu','zhou','he','tang']:
    source=ROOT/('models/atrium/residents/'+identity+'.blend')
    bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update()
    head=bpy.data.objects['Head'];closed=head.data.shape_keys.key_blocks['Blink']
    lids=BVHTree.FromPolygons([v.co for v in closed.data],[tuple(p.vertices) for p in head.data.polygons])
    points=[];faces=[]
    for side in [-1,1]:
        for ob in bpy.data.objects['EyePivot_'+str(side)].children_recursive:
            if ob.type!='MESH':continue
            matrix=head.matrix_world.inverted()@ob.matrix_world;offset=len(points)
            points.extend(matrix@v.co for v in ob.data.vertices)
            faces.extend(tuple(offset+i for i in p.vertices) for p in ob.data.polygons)
    eyes=BVHTree.FromPolygons(points,faces)
    covered=0;exposed=[];clearances=[]
    for side in [-1,1]:
        for ix in range(101):
            x=side*.0785+(ix/100-.5)*.09
            for iz in range(61):
                z=.0344+(iz/60-.5)*.05;origin=Vector((x,-1,z));direction=Vector((0,1,0))
                eye=eyes.ray_cast(origin,direction)[0]
                if eye is None:continue
                lid=lids.ray_cast(origin,direction)[0]
                if lid is None or lid.y>eye.y:
                    exposed.append([x,z,None if lid is None else lid.y-eye.y])
                else:covered+=1;clearances.append(eye.y-lid.y)
    report={'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'eyeSamples':covered+len(exposed),'covered':covered,'exposed':len(exposed),'minimumClearance':min(clearances) if clearances else None,'examples':exposed[:20],
    'scope':'Blender source, neutral gaze, Blink=1. Tests actual eye stack depth coverage; runtime deformation, partial blinks and visual quality checked separately.'}
    assert covered+len(exposed)>1000,'Eye sampling region is empty or incomplete'
    report['identity']=identity
    report['coordinateSpace']='head local; runtime head scale applies'
    report['hands']=[dict(bpy.data.objects['Hand_'+str(side)]['hand_surface_audit']) for side in [-1,1]]
    assert all(h['components']==1 and h['nonManifoldEdges']==0 for h in report['hands'])
    reports.append(report)
    print('EYELID_COVERAGE',json.dumps(report));assert not exposed,'Closed eyelid exposes eye stack'
(ROOT/'evidence/atrium/facial-motion/surface-coverage.json').write_text(json.dumps({'residents':reports},indent=2))
