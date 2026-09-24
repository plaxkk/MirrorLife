"""Optional source-only contact fitting with triangle and fold barriers."""
import math
from mathutils import Vector

def fit(mesh, points, ids, adjacent, correction):
    mesh.calc_loop_triangles()
    triangles=[tuple(t.vertices) for t in mesh.loop_triangles if all(i in ids for i in t.vertices)]
    edge_faces={}
    for face,t in enumerate(triangles):
        for a,b in zip(t,t[1:]+t[:1]):edge_faces.setdefault(tuple(sorted((a,b))),[]).append(face)
    pairs=[tuple(f) for f in edge_faces.values() if len(f)==2]
    def crosses(p):return [(p[b]-p[a]).cross(p[c]-p[a]) for a,b,c in triangles]
    original=crosses(points);normals=[n.normalized() for n in original]
    limits=[min(math.pi,max(math.pi/2,normals[a].angle(normals[b],0)+math.radians(5))) for a,b in pairs]
    def valid(p):
        cross=crosses(p)
        # Retain at least 25% of the original oriented area. This prevents
        # inversion during this fit, not folds already present in its input.
        if any(n.dot(base)<.25*base.length_squared for n,base in zip(cross,original)):return False
        ns=[n.normalized() for n in cross]
        return all(ns[a].angle(ns[b],0)<=limit+1e-6 for (a,b),limit in zip(pairs,limits))
    offsets={i:Vector() for i in ids};steps=[]
    for _ in range(24):
        proposed={i:offsets[i]+correction(points[i]+offsets[i]) for i in ids}
        # Diffuse displacement instead of directly smoothing finger geometry.
        for _ in range(4):
            proposed={i:proposed[i]*.6+sum((proposed.get(j,Vector()) for j in adjacent[i]),Vector())*(.4/max(1,len(adjacent[i]))) for i in ids}
        scale=1.0;accepted=False
        for _ in range(12):
            candidate={i:offsets[i].lerp(proposed[i],scale) for i in ids}
            positions=[p+candidate.get(i,Vector()) for i,p in enumerate(points)]
            if valid(positions):accepted=True;break
            scale*=.5
        if not accepted:break
        change=max((candidate[i]-offsets[i]).length for i in ids)
        offsets=candidate;steps.append(scale)
        if change<1e-7:break
    remaining=[correction(points[i]+offsets[i]).length for i in ids]
    return {i:d for i,d in offsets.items() if d.length>1e-7},dict(iterations=len(steps),acceptedStepScales=steps,maxRemainingCorrection=max(remaining),scope='Source fit barriers relative to input pose; not complete contact or self-intersection proof')
