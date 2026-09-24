"""Source-only, editable per-digit joint pose; baked into existing grip keys."""
import bpy, math
from mathutils import Matrix, Vector

def prepare(hand,core=None):
    lengths=[.057,.068,.064,.052]
    structured='source_digit_frames' in hand
    assignments={}
    if structured:
        assert core is not None, 'Structured hand needs explicit digit groups'
        from mathutils.kdtree import KDTree
        records=hand['source_digit_vertices']
        tagged=[(row['digit'],Vector(row['positions'][i:i+3])) for row in records for i in range(0,len(row['positions']),3)]
        tree=KDTree(len(tagged))
        for index,(_,point) in enumerate(tagged):tree.insert(point,index)
        tree.balance()
        local=hand.matrix_world.inverted()@core.matrix_world
        skin=core.vertex_groups['SkinRightHand'].index
        matches={digit:[] for digit in range(5)}
        for vertex in core.data.vertices:
            if not any(g.group==skin and g.weight>.999 for g in vertex.groups):continue
            _,index,distance=tree.find(local@vertex.co)
            if distance<1e-5:matches[tagged[index][0]].append(vertex.index)
        for digit in range(5):
            group=core.vertex_groups.get(f'SourceDigit_1_{digit}')
            if group is None:
                group=core.vertex_groups.new(name=f'SourceDigit_1_{digit}')
                assert len(matches[digit])==sum(1 for tag,_ in tagged if tag==digit), 'Lost source vertex correspondence'
                group.add(matches[digit],1,'REPLACE')
            for vertex in core.data.vertices:
                if any(g.group==group.index and g.weight>.999 for g in vertex.groups):assignments[vertex.index]=digit
    controls=[]
    for digit,length in enumerate(lengths,1):
        pivot=bpy.data.objects[f'FingerPivot_1_{digit}']
        transform=hand.matrix_world.inverted()@pivot.matrix_world
        # Hand authoring compresses Y after evaluating the original primitives.
        transform=Matrix.Diagonal((1,.82,1,1))@transform
        if structured:
            frame=hand['source_digit_frames'][digit-1];length=frame['length']
            transform=Matrix.Translation(Vector(frame['origin']))@Matrix.Rotation(frame['tilt'],4,'X')
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
    def deform(p,strength=1,index=None):
        # Blend only across narrow interdigital boundaries, preserving continuity
        # at web triangles. Each digit uses its own rest frame and segment lengths.
        coordinate=max(0,min(3,(p.x+.033)/.022))
        lo=min(2,int(coordinate));mix=smooth((coordinate-lo-.36)/.28)
        results=[]
        digit=assignments.get(index)
        selection=([digit-1] if digit in [1,2,3,4] else []) if structured else [lo,lo+1]
        for selected in selection:
            transform,inverse,joints=controls[selected];q=inverse@p;t=-q.z
            for control in reversed(joints):
                distance=control['restDistance'];width=control['blendWidth']
                start=distance if distance==0 else distance-width*.5
                weight=smooth((t-start)/width)
                origin=Vector((0,0,-distance))
                q=origin+Matrix.Rotation(-control['flexionRadians']*weight*strength,3,'X')@(q-origin)
            results.append(transform@q)
        result=(results[0] if len(results)==1 else p.copy()) if structured else results[0].lerp(results[1],mix)
        # Keep the thumb territory outside the four-digit control bank.
        q=result if structured else p.lerp(result,smooth((p.x+.060)/.025))
        if p.x<-.042:
            for _ in range(32):
                weight=smooth((-q.x-.042)/.025)
                q.x+=.022*weight*strength/32;q.y-=.012*weight*strength/32
        return q
    return deform
