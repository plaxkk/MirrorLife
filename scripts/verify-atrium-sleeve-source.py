"""Scope audit for isolated sleeve construction; not a visual/contact approval."""
import bpy, hashlib, json, os
from pathlib import Path

def capture(path):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    core=bpy.data.objects['SkinnedArticulationCore']
    names={g.index:g.name for g in core.vertex_groups}
    protected={'Skin'+side+part for side in ('Left','Right') for part in ('Hand','Foot','Leg','Knee')}
    vertices=[]
    for v in core.data.vertices:
        weights=sorted((names[g.group],g.weight) for g in v.groups if g.weight>0)
        if any(name in protected for name,weight in weights):
            vertices.append((tuple(v.co),tuple(weights)))
    assert vertices,'No protected extremity/lower-body vertices found'
    rig=bpy.data.objects['CivicSkinRig']
    bones={b.name:[list(row) for row in b.matrix_local] for b in rig.data.bones}
    controls={o.name:[list(row) for row in o.matrix_basis] for o in bpy.data.objects if o.type=='EMPTY' and (o.name.endswith('Pivot') or o.name in ('Hand_-1','Hand_1','VisualRoot'))}
    garment=next(o['atrium_garment'].to_dict() for o in bpy.data.objects if 'atrium_garment' in o)
    cardigan=next((o['cardigan_study'].to_dict() for o in bpy.data.objects if 'cardigan_study' in o),None)
    return {'cardigan':cardigan,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'vertices':sorted(vertices),'bones':bones,'controls':controls,'garment':garment}

baseline=capture(Path(os.environ['ATRIUM_SLEEVE_BASELINE']))
candidate=capture(Path(os.environ['ATRIUM_SLEEVE_SOURCE']))
report={'scope':'Exact protected hand/foot/leg/knee core positions and weights, bind bones and named pivot local transforms. Garment source union audit. Does not prove all other source fields unchanged, deformation quality, collision or game performance.',
 'baselineSHA':baseline['sha256'],'candidateSHA':candidate['sha256'],
 'protectedVertices':len(candidate['vertices']), 'protectedExact':baseline['vertices']==candidate['vertices'],
 'bindBonesExact':baseline['bones']==candidate['bones'],'pivotTransformsExact':baseline['controls']==candidate['controls'],
 'candidateCardigan':candidate['cardigan'],'baselineGarment':baseline['garment'],'candidateGarment':candidate['garment']}
Path(os.environ['ATRIUM_SLEEVE_REPORT']).write_text(json.dumps(report,indent=2))
assert report['protectedExact'] and report['bindBonesExact'] and report['pivotTransformsExact'],report
assert candidate['garment']['components']==1 and candidate['garment']['nonManifoldEdges']==0
assert candidate['garment']['weightError']<.0001
if candidate['cardigan']:
    if 'components' in candidate['cardigan']:assert candidate['cardigan']['components']==1
    assert candidate['cardigan']['nonManifoldEdges']==0 and candidate['cardigan']['weightError']<.0001
print('SLEEVE_SOURCE_SCOPE_PASS',json.dumps(report))
