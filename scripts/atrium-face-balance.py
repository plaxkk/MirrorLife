"""Restore coordinated nasal/oral projection after the existing face finish."""
import math
from mathutils import Vector


def apply(head, mode=1):
    assert mode == 1
    def smooth(a,b,x):
        t=max(0.,min(1.,(x-a)/(b-a)))
        return t*t*(3-2*t)
    original=[v.co.copy() for v in head.data.vertices]
    offsets=[]
    for x,y,z in original:
        mask=smooth(-.165,-.140,z)*(1-smooth(-.018,.005,z))
        mask*=1-smooth(.10,.16,abs(x))
        mask*=smooth(.105,.175,-y)
        nasal=math.exp(-(x/.060)**2-((z+.033)/.070)**2)
        oral=math.exp(-(x/.080)**4-((z+.106)/.035)**2)
        depth=(.007*nasal+.012*oral)*mask
        offsets.append(Vector((0,-depth,0)))
    for key in head.data.shape_keys.key_blocks:
        for vertex,offset in zip(key.data,offsets):vertex.co+=offset
    for vertex,point,offset in zip(head.data.vertices,original,offsets):vertex.co=point+offset
    head.data.update()
