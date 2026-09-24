"""Scope, planted sole and control checks for an isolated shoe study."""
import bpy,os,json,hashlib
from pathlib import Path

def capture(path):
    bpy.ops.wm.open_mainfile(filepath=str(path));bpy.context.view_layer.update()
    core=bpy.data.objects['SkinnedArticulationCore']
    groups={core.vertex_groups[n].index for n in ['SkinLeftFoot','SkinRightFoot']}
    outside=sorted(tuple(v.co) for v in core.data.vertices if not any(g.group in groups and g.weight>.999 for g in v.groups))
    feet=[]
    for side,name in [(-1,'SkinLeftFoot'),(1,'SkinRightFoot')]:
        root=bpy.data.objects[f'ShoeUpper_{side}Pivot'];group=core.vertex_groups[name].index
        matrix=root.matrix_world.inverted()@core.matrix_world
        points=[matrix@v.co for v in core.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups)]
        feet.append(dict(side=side,minLocalZ=min(p.z for p in points),pivot=[list(row) for row in root.matrix_local],vertices=len(points),study=root['shoe_form_study'].to_dict() if 'shoe_form_study' in root else None))
    other={}
    for ob in bpy.data.objects:
        if ob.type!='MESH' or ob==core:continue
        positions=[tuple(v.co) for v in ob.data.vertices]
        faces=[];uv_faces=[]
        for poly in ob.data.polygons:
            corners=[(positions[ob.data.loops[i].vertex_index],tuple(tuple(layer.data[i].uv) for layer in ob.data.uv_layers)) for i in poly.loop_indices]
            canonical=min(tuple(corners[i:]+corners[:i]) for i in range(len(corners)))
            uv_faces.append(canonical)
            coordinates=[corner[0] for corner in corners]
            face=min(tuple(coordinates[i:]+coordinates[:i]) for i in range(len(coordinates)))
            faces.append((poly.material_index,poly.use_smooth,face))
        data={'positions':sorted(positions),'faces':sorted(faces),'transform':[list(row) for row in ob.matrix_world]}
        if ob.data.shape_keys:data['keys']=sorted((positions[i],tuple((k.name,tuple(k.data[i].co)) for k in ob.data.shape_keys.key_blocks)) for i in range(len(positions)))
        uv_used=any(node.type in {'TEX_IMAGE','UVMAP','ATTRIBUTE'} or (node.type=='TEX_COORD' and node.outputs['UV'].is_linked) for material in ob.data.materials if material and material.use_nodes for node in material.node_tree.nodes)
        other[ob.name]={'geometry':hashlib.sha256(json.dumps(data,sort_keys=True).encode()).hexdigest(),'uv':hashlib.sha256(json.dumps(sorted(uv_faces)).encode()).hexdigest(),'uvUsed':uv_used}
    return outside,feet,other

base=Path(os.environ['ATRIUM_SHOE_BASELINE']);source=Path(os.environ['ATRIUM_SHOE_SOURCE'])
a,feet_a,other_a=capture(base);b,feet_b,other_b=capture(source)
geometry_exact=set(other_a)==set(other_b) and all(other_a[n]['geometry']==other_b[n]['geometry'] for n in other_a)
uv_differences=[name for name in sorted(set(other_a)&set(other_b)) if other_a[name]['uv']!=other_b[name]['uv']]
unused_eye_uv_only=all(name in ['EyeWhite_-1','EyeWhite_1'] and not other_a[name]['uvUsed'] and not other_b[name]['uvUsed'] for name in uv_differences)
report=dict(sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),outsideFeetExact=a==b,otherGeometryExact=geometry_exact,uvDifferences=uv_differences,unusedEyeUVOnly=unused_eye_uv_only,baselineFeet=feet_a,candidateFeet=feet_b,scope='Source geometry scope with index-independent exact positions, oriented polygon corners, smooth flags and shape-key correspondence; pivot and sole minimum. UVs are compared separately; only unused eye-white UV differences are accepted. Not full lace clearance, gait collision or performance proof.')
out=Path(os.environ['ATRIUM_SHOE_REPORT']);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2))
assert a==b and geometry_exact and unused_eye_uv_only, 'Changes outside shoe geometry scope or used UVs'
for old,new in zip(feet_a,feet_b):
    assert old['pivot']==new['pivot'] and abs(old['minLocalZ']-new['minLocalZ'])<1e-6
    assert len(new['study']['laceSamples'])==9
print('SHOE_SOURCE_SCOPE_PASS',[(f['side'],f['minLocalZ']) for f in feet_b])
