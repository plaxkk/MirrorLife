"""Shape the whole authored haircut into a swept top with closer sides."""
import math
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def shape(vertices, head, controller, mode=1):
    assert mode in (1, 2)
    bpy.context.view_layer.update()
    skin = BVHTree.FromPolygons([v.co for v in head.data.vertices], [tuple(p.vertices) for p in head.data.polygons])
    to_head = head.matrix_world.inverted() @ controller.matrix_world
    to_hair = to_head.inverted()
    def smooth(a, b, x):
        t = max(0., min(1., (x-a)/(b-a)))
        return t*t*(3-2*t)
    changed = 0
    clearance_fixes = 0
    for i, vertex in enumerate(vertices):
        p = to_head @ Vector(vertex)
        x, y, z = p
        top = smooth(.19, .285, z)
        # A lifted swept front and a shallower side part establish broad masses.
        front_lift = (.030 if mode==1 else .019) * math.exp(-((x+.067)/.070)**2-((y+.080)/.100)**2)
        rear_lift = (.010 if mode==1 else .006) * math.exp(-((x+.040)/.085)**2-((y-.095)/.085)**2)
        part_x = .038 + .25*(y+.035)
        part = (.019 if mode==1 else .011) * math.exp(-((x-part_x)/(.025 if mode==1 else .040))**2) * math.exp(-((y+.010)/.155)**4)
        p.z += top*(front_lift + rear_lift - part)
        p.x -= .008 * top * math.exp(-((x+.06)/.10)**2-((y+.06)/.15)**2)
        # Temple and back transitions stay broad; the lower hairline is retained.
        side = smooth(.10,.185,abs(x))*smooth(.06,.16,z)*(1-smooth(.235,.30,z))
        p.x -= (.012 if x>0 else -.012)*side
        back = smooth(.11,.22,y)*smooth(.04,.13,z)*(1-smooth(.24,.30,z))
        p.y -= .010*back
        if (p-to_head@Vector(vertex)).length < 1e-8:
            continue
        hit, normal, _, distance = skin.find_nearest(p)
        if hit is not None:
            signed = (p-hit).dot(normal)
            if signed < .004:
                p = hit+normal*.004
                clearance_fixes += 1
        vertices[i] = tuple(to_hair@p)
        changed += 1
    print('HAIR_MASS_APPLIED', changed, 'skin_clearance_fixes', clearance_fixes, flush=True)
