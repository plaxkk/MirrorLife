"""Reference-led cloth volumes; all parts are real, orbitable rig geometry."""
import bpy, bmesh, math, os
from mathutils import Vector


def sculpt_cloth(garment):
    """Tailoring ease and restrained compression, on the existing skinned shell."""
    for vertex in garment.data.vertices:
        p=vertex.co
        torso=max(0,min(1,(.245-abs(p.x))/.07))
        front=max(0,min(1,(-p.y-.025)/.065))
        # Broad release below the chest avoids a corseted waist.
        ease=math.exp(-((p.z-1.00)/.15)**2)*torso
        p.x*=1+.055*ease;p.y*=1+.075*ease
        # Diagonal folds originate at sewn pockets / side seams and fade out.
        fold=0
        for height,slope,amplitude in [(.895,.30,.0038),(.938,-.24,.0030),(1.02,.48,.0024)]:
            d=p.z-height-slope*(abs(p.x)-.11)
            fold+=amplitude*(math.exp(-(d/.018)**2)-.4*math.exp(-((d-.021)/.019)**2))
        fade=math.exp(-((abs(p.x)-.13)/.095)**4)
        p.y-=fold*torso*front*fade
        # Slightly irregular elbow compression travels with the existing weights.
        sleeve=max(0,min(1,(abs(p.x)-.265)/.06))
        radial=math.exp(-((p.z-1.00)/.072)**2)*sleeve
        p.y+=.0035*math.sin((p.z-.96)*85+abs(p.x)*12)*radial
    garment.data.update()


def hood_and_details(civic,mats,visual,cloth_y,cloth_back_y):
    """A hollow, lined hood resting on the upper back, with sewn front opening."""
    segments=56;rows=9;points=[];faces=[]
    # The rim surrounds the neck; the back drops into a rounded pouch.
    # Open at the face, closed at the inner bottom. No overlapping ellipsoid.
    for row in range(rows+1):
        t=row/rows
        for i in range(segments+1):
            a=1.02+(math.tau-2.04)*i/segments
            rear=(1-math.cos(a))*.5
            width=.105*(1-t)+.062*math.sin(math.pi*t)+.008*t
            depth=.080*(1-t)+.060*math.sin(math.pi*t)+.010*t
            x=width*math.sin(a)
            y=-depth*math.cos(a)+.155*t
            z=1.343-.225*t-.020*math.sin(math.pi*t)*rear
            z+=.008*math.sin(3*a+.4)*math.sin(math.pi*t)*rear
            # Let the bag hang vertically; derive clearance from the actual
            # jacket rather than pushing the whole hood out into a rigid beak.
            back=cloth_back_y(x,z)
            if back is not None and rear>.65 and t>.2:
                y=max(y,back+.012)
            points.append((x,y,z))
    for row in range(rows):
        for i in range(segments):
            a=row*(segments+1)+i;faces.append((a,a+1,a+segments+2,a+segments+1))
    mesh=bpy.data.meshes.new('Tailored hood outer and lining');mesh.from_pydata(points,[],faces);mesh.update()
    ob=bpy.data.objects.new('Tailored draped hood',mesh);bpy.context.collection.objects.link(ob);ob.parent=visual
    mesh.materials.append(mats['top']);mesh.materials.append(mats['outer'])
    uv=mesh.uv_layers.new(name='UVMap')
    for poly in mesh.polygons:
        poly.use_smooth=True
        for loop in poly.loop_indices:
            index=mesh.loops[loop].vertex_index
            uv.data[loop].uv=(index%(segments+1)/segments,index//(segments+1)/rows)
    solid=ob.modifiers.new('Sewn hood lining thickness','SOLIDIFY');solid.thickness=.005;solid.offset=0;solid.material_offset=1
    civic.contoured_elliptical_shell('Hood rib neck facing',[(1.297,.102,.077,0,0),(1.308,.105,.080,0,0),(1.318,.103,.079,0,0)],mats['outer'],visual,segments=32)
    # The visible bound edge has a separate narrow folded tape, not a fat tube.
    for row in [0,rows]:
        civic.curve_tube('Hood bound edge '+str(row),points[row*(segments+1):(row+1)*(segments+1)],.0028,mats['outer'],visual,resolution=1)
    for side in [-1,1]:
        # Front opening and short cotton cords follow the chest's true surface.
        cord=[]
        profile=[(.095,1.29),(.10,1.255),(.092,1.20),(.095,1.174)] if os.environ.get('ATRIUM_OPEN_NECK_STUDY')=='1' else [(.065,1.31),(.070,1.255),(.058,1.20),(.061,1.174)]
        for offset,z in profile:
            x=side*offset
            cord.append((x,cloth_y(x,z)-.007,z))
        civic.curve_tube('Hood cotton drawcord '+str(side),cord,.0022,mats['paper'],visual,resolution=1)
        civic.ellipsoid('Drawcord bound end '+str(side),cord[-1],(.003,.003,.010),mats['accent'],visual,segments=10,rings=6)
        # Twin welt stitching sits on the fabric instead of floating in space.
        for offset in [-.006,.006]:
            line=[]
            for i in range(9):
                t=i/8;x=side*(.103+.058*t)+offset;z=.882+.085*t
                line.append((x,cloth_y(x,z)-.0035,z))
            civic.curve_tube('Pocket topstitch %s %s'%(side,offset),line,.0011,mats['outer'],visual,resolution=1)
    ob['construction']='Open lined hood, continuous sewn surface; reference-led navy/ochre everyday outerwear'
    return ob


def relax_shoulders(garment, strength=.48, width=.10, iterations=3):
    # Relax the hard shoulder ridge on the continuous surface, keeping
    # sleeve/waist clearance and the existing bind weights intact.
    neighbours=[set() for _ in garment.data.vertices]
    for edge in garment.data.edges:
        a,b=edge.vertices;neighbours[a].add(b);neighbours[b].add(a)
    for _ in range(iterations):
        positions=[v.co.copy() for v in garment.data.vertices]
        for vertex in garment.data.vertices:
            p=positions[vertex.index];adjacent=neighbours[vertex.index]
            weight=strength*math.exp(-((abs(p.x)-.28)/width)**2-((p.z-1.22)/.065)**2)
            if adjacent:
                average=sum((positions[i] for i in adjacent),Vector())/len(adjacent)
                vertex.co=p.lerp(average,weight)


def open_neckline(garment,mats):
    """Recessed shirt inset bounded by actual edges in the weighted cloth.

    The hidden shirt/jacket join stays closed: no floating triangular decal,
    removed skin weights or camera-dependent cutout.
    """
    bm=bmesh.new();bm.from_mesh(garment.data)
    for side in [0,-1,1]:
        faces=[f for f in bm.faces if all(v.co.y<-.015 for v in f.verts) and max(v.co.z for v in f.verts)>1.16]
        if side==0:faces=[f for f in faces if min(v.co.x for v in f.verts)<.04 and max(v.co.x for v in f.verts)>-.04]
        edges={e for f in faces for e in f.edges};verts={v for f in faces for v in f.verts}
        bmesh.ops.bisect_plane(bm,geom=list(verts)+list(edges)+faces,dist=.000001,
            plane_co=Vector((side*.014,0,1.17)),plane_no=Vector((side,0,-.42)) if side else Vector((0,0,1)),clear_inner=False,clear_outer=False)
    bm.to_mesh(garment.data);bm.free()
    shirt_index=len(garment.data.materials);garment.data.materials.append(mats['paper'])
    for v in garment.data.vertices:
        p=v.co
        if p.y<-.015 and p.z>1.17:
            width=.014+.42*(p.z-1.17)
            inset=max(0,min(1,(width-abs(p.x))/.025))
            p.y+=.008*inset*inset*(3-2*inset)
    for f in garment.data.polygons:
        c=sum((garment.data.vertices[i].co for i in f.vertices),Vector())/len(f.vertices)
        if c.y<-.015 and c.z>1.17 and abs(c.x)<.014+.42*(c.z-1.17):f.material_index=shirt_index
    garment.data.update();garment.data.calc_loop_triangles()
    audit=bmesh.new();audit.from_mesh(garment.data)
    nonmanifold=sum(not e.is_manifold for e in audit.edges);audit.free()
    weights=max(abs(sum(g.weight for g in v.groups)-1) for v in garment.data.vertices)
    assert not nonmanifold and weights<.0001,'Neckline lost closed topology or skin weights'
    assert len(garment.data.loop_triangles)<=2400,'Neckline exceeds garment allocation'
    report=dict(garment.parent.parent['atrium_garment']);report.update(triangles=len(garment.data.loop_triangles),nonManifoldEdges=nonmanifold,weightError=weights)
    garment.parent.parent['atrium_garment']=report
    garment['neckline_study']='Recessed cream inner shirt, V zipper opening; continuous weighted seam'
