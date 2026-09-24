"""Inspect the saved editable garment scene, not just authoring metadata."""
import bpy,bmesh,os,json,hashlib,math
from pathlib import Path
source=Path(os.environ['ATRIUM_PANEL_CAGE'])
bpy.ops.wm.open_mainfile(filepath=str(source))
scene=bpy.data.scenes.get('Garment cage editing');assert scene is not None
assert bpy.context.scene==scene, 'Opening the file must show the editing scene, not an empty library scene'
ob=scene.objects.get('Garment panel cage');assert ob is not None and ob.type=='MESH'
rig=scene.objects.get('CivicSkinRig');assert rig is not None
assert any(m.type=='ARMATURE' and m.object==rig for m in ob.modifiers)
mesh=ob.data;bm=bmesh.new();bm.from_mesh(mesh)
seen=set();components=0
for vertex in bm.verts:
    if vertex in seen:continue
    components+=1;todo=[vertex];seen.add(vertex)
    while todo:
        current=todo.pop()
        for edge in current.link_edges:
            other=edge.other_vert(current)
            if other not in seen:seen.add(other);todo.append(other)
report={'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'scene':scene.name,'vertices':len(mesh.vertices),'polygons':len(mesh.polygons),'quads':sum(len(p.vertices)==4 for p in mesh.polygons),'components':components,'nonManifoldEdges':sum(not e.is_manifold for e in bm.edges),'zeroAreaFaces':sum(f.calc_area()<1e-10 for f in bm.faces),'signedVolume':bm.calc_volume(signed=True),'weightError':max(abs(sum(g.weight for g in v.groups)-1) for v in mesh.vertices),'scope':'Saved visible editing scene and source cage topology/binding. Does not validate cloth self-contact, pose aesthetics or runtime performance.'}
bm.free()
Path(os.environ['ATRIUM_PANEL_REPORT']).write_text(json.dumps(report,indent=2))
assert report['components']==1 and report['nonManifoldEdges']==0 and report['zeroAreaFaces']==0
assert report['signedVolume']>0 and report['weightError']<.0001
assert report['quads']/report['polygons']>.99
assert all(math.isfinite(c) for v in mesh.vertices for c in v.co)
print('EDITABLE_PANEL_CAGE_PASS',json.dumps(report))
