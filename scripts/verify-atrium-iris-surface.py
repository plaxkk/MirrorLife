"""Audit the authored curved iris against its actual sclera, not only parameters."""
import bpy, json, os, hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/os.environ['ATRIUM_IRIS_SOURCE']
output=ROOT/os.environ['ATRIUM_IRIS_REPORT']
bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update()
rows=[]
for side in [-1,1]:
    pivot=bpy.data.objects['EyePivot_'+str(side)]
    iris=bpy.data.objects['Iris_'+str(side)];white=bpy.data.objects['EyeWhite_'+str(side)]
    def points(ob):
        matrix=pivot.matrix_world.inverted()@ob.matrix_world
        return [matrix@v.co for v in ob.data.vertices]
    sclera=BVHTree.FromPolygons(points(white),[tuple(p.vertices) for p in white.data.polygons])
    clearances=[];missing=0
    for point in points(iris):
        hit=sclera.ray_cast(Vector((point.x,-1,point.z)),Vector((0,1,0)))[0]
        if hit is None:missing+=1
        else:clearances.append(hit.y-point.y)
    row={'side':side,'vertices':len(iris.data.vertices),'missingScleraSamples':missing,
         'minimumClearance':min(clearances),'maximumClearance':max(clearances),
         'forwardFaces':sum(p.normal.y<0 for p in iris.data.polygons),'faces':len(iris.data.polygons),
         'usedColourBands':len(set(p.material_index for p in iris.data.polygons))}
    rows.append(row)
report={'source':str(source.relative_to(ROOT)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'space':'EyePivot local coordinates, before parent scale','eyes':rows,
        'scope':'Curved iris vertices lie in front of the actual polygonal sclera; front-facing normals and material bands. Visual/morph/runtime acceptance is separate.'}
report['passed']=all(r['missingScleraSamples']==0 and 0<r['minimumClearance']<=r['maximumClearance']<.002 and r['forwardFaces']==r['faces'] and r['usedColourBands']>=5 for r in rows)
output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,indent=2))
assert report['passed'],report
print('IRIS_SURFACE_PASS',json.dumps(rows))
