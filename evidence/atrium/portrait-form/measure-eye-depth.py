import bpy,json
from pathlib import Path
out=[]
for version in ['skin-ao-v1','form-v1','form-v2']:
 bpy.ops.wm.open_mainfile(filepath=str(Path('tmp/portrait-study',version,'models/atrium/residents/you.blend').resolve()))
 bpy.context.view_layer.update()
 parts=[]
 for side in [-1,1]:
  bounds={}
  for prefix in ['EyeWhite_','Iris_','IrisCore_','Pupil_','EyeGlint_']:
   ob=bpy.data.objects[prefix+str(side)]
   bounds[prefix]=min((ob.matrix_local@v.co).y for v in ob.data.vertices)
  parts.append(dict(side=side,frontYInEyePivot=bounds,pupilProtrusion=bounds['EyeWhite_']-bounds['Pupil_']))
 out.append(dict(version=version,eyes=parts))
Path('evidence/atrium/portrait-form/eye-depth.json').write_text(json.dumps(out,indent=2))
print('EYE_DEPTH',out)
