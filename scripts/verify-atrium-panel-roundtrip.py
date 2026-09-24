"""Compare full core geometry, weights and oriented faces across an unedited import."""
import bpy,os,json,hashlib
from pathlib import Path

def read(file):
    bpy.ops.wm.open_mainfile(filepath=str(file));ob=bpy.data.objects['SkinnedArticulationCore'];mesh=ob.data
    names={g.index:g.name for g in ob.vertex_groups};colors=mesh.color_attributes['Color']
    vertices=[(tuple(v.co),tuple(sorted((names[g.group],g.weight) for g in v.groups if g.weight>0)),tuple(colors.data[v.index].color)) for v in mesh.vertices]
    faces=[]
    for face in mesh.polygons:
        corners=[vertices[i] for i in face.vertices]
        faces.append(min(tuple(corners[i:]+corners[:i]) for i in range(len(corners))))
    provenance=next((ob['atrium_panel_input'].to_dict() for ob in bpy.data.objects if 'atrium_panel_input' in ob),None)
    return {'vertices':sorted(vertices),'faces':sorted(faces),'provenance':provenance,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
base=read(Path(os.environ['ATRIUM_PANEL_ROUNDTRIP_BASELINE']))
result=read(Path(os.environ['ATRIUM_PANEL_ROUNDTRIP_RESULT']))
report={'baselineSHA':base['sha256'],'resultSHA':result['sha256'],'vertices':len(result['vertices']),'faces':len(result['faces']),'coreVerticesWeightsColorsExact':base['vertices']==result['vertices'],'coreOrientedFacesExact':base['faces']==result['faces'],'input':result['provenance'],'scope':'Source core only; does not claim binary GLB equivalence or identity of unused eye UVs and other mesh fields.'}
Path(os.environ['ATRIUM_PANEL_ROUNDTRIP_REPORT']).write_text(json.dumps(report,indent=2))
assert report['input'] and report['coreVerticesWeightsColorsExact'] and report['coreOrientedFacesExact'],report
print('PANEL_ROUNDTRIP_CORE_PASS',json.dumps(report))
