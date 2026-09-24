"""Edit the saved quad cage's lower armscye rows, preserving topology and weights."""
import bpy,os,json,hashlib
from pathlib import Path
source=Path(os.environ['ATRIUM_PANEL_EDIT_INPUT']).resolve();target=Path(os.environ['ATRIUM_PANEL_EDIT_OUTPUT']).resolve()
assert target.is_relative_to(Path(__file__).resolve().parents[1]/'tmp') and target!=source
bpy.ops.wm.open_mainfile(filepath=str(source));ob=bpy.data.objects['Garment panel cage']
mesh=ob.data
before_faces=[tuple(p.vertices) for p in mesh.polygons]
before_weights=[[(g.group,g.weight) for g in v.groups] for v in mesh.vertices]
rows=[(1.09,1.125),(1.135,1.16125),(1.18,1.1975),(1.225,1.23375)]
changed=[]
for v in mesh.vertices:
    if abs(v.co.x)>.23:continue
    for old,new in rows:
        if abs(v.co.z-old)<1e-6:
            previous=tuple(v.co);v.co.z=new;changed.append({'vertex':v.index,'before':previous,'after':tuple(v.co)});break
assert changed
assert before_faces==[tuple(p.vertices) for p in mesh.polygons]
assert before_weights==[[(g.group,g.weight) for g in v.groups] for v in mesh.vertices]
mesh.update();target.parent.mkdir(parents=True,exist_ok=True)
ob['panel_source_edit']='Raise lower armscye rows; remove the upward turn into the first sleeve loop'
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(target))
report={'input':str(source),'inputSHA':hashlib.sha256(source.read_bytes()).hexdigest(),'output':str(target),'outputSHA':hashlib.sha256(target.read_bytes()).hexdigest(),'rows':rows,'changedVertices':len(changed),'changes':changed,'topologyExact':True,'weightsExact':True,'scope':'Source cage edit only; visual/pose validation required after importing into the full character build.'}
Path(os.environ['ATRIUM_PANEL_EDIT_REPORT']).write_text(json.dumps(report,indent=2))
print('ARMSCYE_SOURCE_EDIT_SAVED',len(changed))
