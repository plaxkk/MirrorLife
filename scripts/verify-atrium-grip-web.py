"""Compare thumb-web edge distortion in neutral and closed grip targets."""
import bpy,os,json,hashlib
from pathlib import Path

def inspect(path):
    bpy.ops.wm.open_mainfile(filepath=str(path));bpy.context.view_layer.update()
    mesh=bpy.data.objects['SkinnedArticulationCore'];hand=bpy.data.objects['Hand_1']
    matrix=hand.matrix_world.inverted()@mesh.matrix_world
    keys=mesh.data.shape_keys.key_blocks
    a=[matrix@v.co for v in keys['Basis'].data];b=[matrix@v.co for v in keys['GripRight'].data]
    group=mesh.vertex_groups['SkinRightHand'].index
    ids={v.index for v in mesh.data.vertices if any(g.group==group and g.weight>.999 for g in v.groups)}
    edges=[]
    for edge in mesh.data.edges:
        i,j=edge.vertices
        if i not in ids or j not in ids:continue
        midpoint=(a[i]+a[j])*.5
        if not (-.065<midpoint.x<-.025 and midpoint.z<-.027):continue
        before=(a[i]-a[j]).length
        if before<.002:continue
        edges.append((b[i]-b[j]).length/before)
    assert len(edges)>10
    edges.sort()
    return dict(sourceSha256=hashlib.sha256(path.read_bytes()).hexdigest(),edges=len(edges),maxStretch=edges[-1],p95Stretch=edges[int(.95*(len(edges)-1))],above2=sum(x>2 for x in edges),above3=sum(x>3 for x in edges))

report=dict(baseline=inspect(Path(os.environ['ATRIUM_GRIP_BASELINE'])),candidate=inspect(Path(os.environ['ATRIUM_GRIP_SOURCE'])),scope='Right-hand thumb-web edges over 2mm, local x (-65,-25)mm and z below -27mm. Closed/neutral length ratio, not self-intersection or contact proof.')
out=Path(os.environ['ATRIUM_GRIP_REPORT']);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2));print(json.dumps(report))
