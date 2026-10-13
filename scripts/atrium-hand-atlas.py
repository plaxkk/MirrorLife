"""Reserve guarded atlas regions for uniformly authored hand surfaces."""
import json


def prepare(obj):
    mesh=obj.data
    groups={obj.vertex_groups['Skin'+side+'Hand'].index:side for side in ['Left','Right']}
    owners={}
    for vertex in mesh.vertices:
        matches=[groups[g.group] for g in vertex.groups if g.group in groups and g.weight>.99999]
        if matches:owners[vertex.index]=matches[0]
    colors=mesh.color_attributes['Color'];rough=mesh.uv_layers['SurfaceRoughness']
    def color_at(loop):
        return tuple(colors.data[mesh.loops[loop].vertex_index if colors.domain=='POINT' else loop].color[:3])
    uv=mesh.uv_layers['UVMap'];tiles=[]
    for side,v0 in [('Left',.0),('Right',.5)]:
        loops=[i for p in mesh.polygons if all(owners.get(v)==side for v in p.vertices) for i in p.loop_indices]
        assert loops,'Missing hand atlas surface'
        color=color_at(loops[0])
        response=rough.data[loops[0]].uv.x*256/255-.5/255
        assert response<.82,'Cloth microrelief cannot use a uniform hand tile'
        assert all(max(abs(a-b) for a,b in zip(color_at(i),color))<1e-6 for i in loops),'Nonuniform hand color requires a dedicated bake'
        assert all(abs(rough.data[i].uv.x*256/255-.5/255-response)<1e-6 for i in loops),'Nonuniform hand roughness'
        tiles.append(dict(side=side,loopCount=len(loops),box=[0,v0,.064,v0+.5],color=color,roughness=response))
    for p in mesh.polygons:
        sides={owners.get(v) for v in p.vertices}
        assert len(sides)==1 or sides=={None},'Mixed hand/body triangle'
        side=next(iter(sides))
        for i in p.loop_indices:
            u,v=uv.data[i].uv
            uv.data[i].uv=(.016+.032*u,(.08 if side=='Left' else .58)+.34*v) if side else (.08+.92*u,v)
    obj['atrium_hand_atlas']=json.dumps(dict(tiles=tiles,bodyU=[.08,1],handU=[.016,.048],scope='Uniform source color/roughness only; guarded tiles preserve UV triangle shapes.'))
    print('HAND_ATLAS',obj['atrium_hand_atlas'],flush=True)
    return tiles


def fill(pixels,size,kind,tiles):
    grid=pixels.reshape(size,size,4)
    def srgb(x):
        return 12.92*x if x<=.0031308 else 1.055*x**(1/2.4)-.055
    for tile in tiles:
        u0,v0,u1,v1=tile['box']
        # Generated sRGB images expose encoded pixel storage here. Keep source
        # vertex colors linear and explicitly encode only the diffuse tile.
        value=tuple(srgb(x) for x in tile['color']) if kind=='DIFFUSE' else ((tile['roughness'],)*3 if kind=='ROUGHNESS' else (.5,.5,1.))
        grid[round(v0*size):round(v1*size),round(u0*size):round(u1*size),:3]=value


def prepare_cloth_slivers(obj, size):
    """Guard uniform cloth triangles too narrow to rasterize at mobile size.

    Use only the unused gutter between hand tiles and body islands. These
    subpixel faces cannot carry resolved textile detail; keep their authored
    colour/roughness and a neutral tangent normal, without extending colours
    across unrelated islands or changing any geometry/skin weights.
    """
    mesh=obj.data;uv=mesh.uv_layers['UVMap'];colors=mesh.color_attributes['Color']
    rough=mesh.uv_layers['SurfaceRoughness'];groups={}
    for face in mesh.polygons:
        if len(face.loop_indices)!=3:continue
        loops=list(face.loop_indices)
        points=[uv.data[i].uv.copy()*(size//2) for i in loops]
        edges=[(points[(i+1)%3]-points[i]).length for i in range(3)]
        a,b,c=points;twice_area=abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))
        if twice_area/max(max(edges),1e-12)>=1:continue
        palette=[tuple(colors.data[mesh.loops[i].vertex_index if colors.domain=='POINT' else i].color[:3]) for i in loops]
        response=[rough.data[i].uv.x*256/255-.5/255 for i in loops]
        if min(response)<=.82:continue
        if any(max(abs(a-b) for a,b in zip(palette[0],rgb))>1e-6 for rgb in palette[1:]):continue
        if max(response)-min(response)>1e-6:continue
        key=tuple(round(x,6) for x in (*palette[0],response[0]))
        groups.setdefault(key,[]).append(loops)
    assert len(groups)<=12,'Too many distinct cloth palettes for guarded gutter'
    tiles=[]
    for index,(key,faces) in enumerate(sorted(groups.items())):
        low=index/max(1,len(groups));high=(index+1)/max(1,len(groups))
        for loops in faces:
            # A uniform palette lookup must have zero UV gradient. Stretching
            # a whole tile over a subpixel face selects coarse mips and bleeds
            # neighbouring skin/body colours into visible pale slivers.
            # No tangents are exported; Three's zero-gradient tangent frame
            # retains the geometric normal for this neutral-normal sample.
            for loop in loops:uv.data[loop].uv=(.072,(low+high)/2)
        tiles.append(dict(box=[.064,low,.08,high],color=list(key[:3]),roughness=key[3],triangles=len(faces)))
    obj['atrium_cloth_sliver_atlas']=json.dumps({'tiles':tiles,'mobileMinimumAltitudePixels':1,'scope':'Uniform subpixel cloth faces only; no mesh or weight changes'})
    print('CLOTH_SLIVER_ATLAS',obj['atrium_cloth_sliver_atlas'],flush=True)
    return tiles
