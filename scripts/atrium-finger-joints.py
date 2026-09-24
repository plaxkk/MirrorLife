"""Source-only, editable per-digit joint pose; baked into existing grip keys."""
import bpy, math
from mathutils import Matrix, Vector

def prepare(hand):
    lengths=[.057,.068,.064,.052]
    controls=[]
    for digit,length in enumerate(lengths,1):
        pivot=bpy.data.objects[f'FingerPivot_1_{digit}']
        transform=hand.matrix_world.inverted()@pivot.matrix_world
        # Hand authoring compresses Y after evaluating the original primitives.
        transform=Matrix.Diagonal((1,.82,1,1))@transform
        digit_controls=[]
        for label,t,angle,width in [('MCP',0,.45,.024),('PIP',length*.45,.90,.022),('DIP',length*.75,.50,.018)]:
            name=f'GripJoint_{digit}_{label}'
            control=bpy.data.objects.get(name)
            if control is None:
                control=bpy.data.objects.new(name,None)
                bpy.context.collection.objects.link(control);control.parent=hand
                control.matrix_local=transform@Matrix.Translation((0,0,-t))
                control.empty_display_type='ARROWS';control.empty_display_size=.008
                control['flexionRadians']=angle;control['restDistance']=t
                control['blendWidth']=width
                control['contract']='Source parameters read by prepare(); transform alone does not drive a runtime joint'
            digit_controls.append(control)
        controls.append((transform,transform.inverted(),digit_controls))
    def smooth(value):
        value=max(0,min(1,value));return value*value*(3-2*value)
    def deform(p,strength=1):
        # Blend only across narrow interdigital boundaries, preserving continuity
        # at web triangles. Each digit uses its own rest frame and segment lengths.
        coordinate=max(0,min(3,(p.x+.033)/.022))
        lo=min(2,int(coordinate));mix=smooth((coordinate-lo-.36)/.28)
        results=[]
        for index in [lo,lo+1]:
            transform,inverse,joints=controls[index];q=inverse@p;t=-q.z
            for control in reversed(joints):
                distance=control['restDistance'];width=control['blendWidth']
                start=distance if distance==0 else distance-width*.5
                weight=smooth((t-start)/width)
                origin=Vector((0,0,-distance))
                q=origin+Matrix.Rotation(-control['flexionRadians']*weight*strength,3,'X')@(q-origin)
            results.append(transform@q)
        result=results[0].lerp(results[1],mix)
        # Keep the thumb territory outside the four-digit control bank.
        q=p.lerp(result,smooth((p.x+.060)/.025))
        if p.x<-.042:
            for _ in range(32):
                weight=smooth((-q.x-.042)/.025)
                q.x+=.022*weight*strength/32;q.y-=.012*weight*strength/32
        return q
    return deform
