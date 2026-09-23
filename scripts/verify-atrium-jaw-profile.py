"""Measure actual head profiles and collar-root sections for a jaw candidate."""
import bpy,os,json,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
source=Path(os.environ['ATRIUM_HEAD_SOURCE']);baseline=Path(os.environ['ATRIUM_HEAD_BASELINE'])
def read(path):
 bpy.ops.wm.open_mainfile(filepath=str(path));bpy.context.view_layer.update()
 head=bpy.data.objects['Head'];m=head.data;m.calc_loop_triangles()
 bvh=BVHTree.FromPolygons([v.co for v in m.vertices],[tuple(f.vertices) for f in m.polygons])
 profiles=[]
 for z in [-.12,-.14,-.16,-.18,-.20,-.22,-.24,-.26,-.28]:
  row={'z':z,'front':[],'back':[]}
  for x in [-.07,0,.07]:
   for side in ['front','back']:
    y,direction=(-1,1) if side=='front' else (1,-1)
    hit=bvh.ray_cast(Vector((x,y,z)),Vector((0,direction,0)))[0]
    row[side].append(None if hit is None else hit.y)
  profiles.append(row)
 edges={}
 for f in m.polygons:
  ids=list(f.vertices)
  for a,b in zip(ids,ids[1:]+ids[:1]):
   e=tuple(sorted((a,b)));edges[e]=edges.get(e,0)+1
 boundary={i for e,n in edges.items() if n==1 for i in e}
 bottom=min(v.co.z for v in m.vertices)
 root=sorted(tuple(m.vertices[i].co) for i in boundary if m.vertices[i].co.z<bottom+.001)
 root_edges=sorted(tuple(sorted((tuple(m.vertices[a].co),tuple(m.vertices[b].co)))) for (a,b),n in edges.items() if n==1 and m.vertices[a].co.z<bottom+.001 and m.vertices[b].co.z<bottom+.001)
 return dict(profiles=profiles,collarRoot=root,collarRootEdges=root_edges,triangles=len(m.loop_triangles),vertices=len(m.vertices),keys=list(head.data.shape_keys.key_blocks.keys()),sha256=hashlib.sha256(path.read_bytes()).hexdigest())
a=read(source);b=read(baseline)
assert a['keys']==b['keys']==['Basis','Blink','Talk']
root_equal=a['collarRoot']==b['collarRoot'] and a['collarRootEdges']==b['collarRootEdges']
root_dist=max(min((Vector(p)-Vector(q)).length for q in b['collarRoot']) for p in a['collarRoot']) if a['collarRoot'] and b['collarRoot'] else None
print('ROOT_DIAGNOSTIC',len(a['collarRoot']),len(b['collarRoot']),root_equal,root_dist,flush=True)
report=dict(candidate=a,baseline=b,collarRootExact=root_equal,rootCandidateToBaselineMaxDistance=root_dist,scope='Neutral source rays at three horizontal positions and nine heights; root boundary comparison. Not complete neck contact, animation or visual proof.')
out=Path(os.environ['ATRIUM_HEAD_PROFILE_REPORT']);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2))
assert len(a['collarRoot'])>10 and root_equal,'Collar cut ring changed'
print('JAW_PROFILE_PASS',len(a['collarRoot']))
