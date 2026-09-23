"""Isolated CC0 MakeHuman hair study; preserve authored UVs and cutout edges."""
import bpy, json, math, os
from pathlib import Path


def build(root, head, style):
    assert style in ('short01', 'short02')
    source = Path(root) / 'models/atrium/source' / ('hair-' + style)
    anchors = json.loads((source / 'head-anchors.json').read_text())
    binding = (source / (style + '.mhclo')).read_text().splitlines()
    scales = [1., 1., 1.]
    for line in binding:
        fields = line.split()
        if fields and fields[0] in ('x_scale', 'y_scale', 'z_scale'):
            axis = 'xyz'.index(fields[0][0])
            scales[axis] = abs(anchors[fields[1]][axis] - anchors[fields[2]][axis]) / float(fields[3])
    fitted = []
    for line in binding[binding.index('verts 0') + 1:]:
        fields = line.split()
        if len(fields) != 9:
            break
        fitted.append(tuple(sum(anchors[fields[k]][axis] * float(fields[k + 3]) for k in range(3))
                            + float(fields[6 + axis]) * scales[axis] for axis in range(3)))
    vertices, texcoords, faces, uv_faces = [], [], [], []
    for line in (source / (style + '.obj')).read_text().splitlines():
        fields = line.split()
        if not fields:
            continue
        if fields[0] == 'v':
            x, y, z = fitted[len(vertices)]
            x, y, z = x * .255, -(z - .55) * .22, (y - 7.124) * .215
            if style=='short01' and os.environ.get('ATRIUM_HAIR_FRINGE_STUDY','1')=='1':
                # Lower the front perimeter gradually while retaining crown
                # volume, temple coverage and the authored UV/strand flow.
                front=max(0.,min(1.,(-y-.04)/.12))
                weight=front*math.exp(-((z-.155)/.10)**2)
                z-=.038*weight
                y-=.006*weight
            vertices.append((x,y,z))
        elif fields[0] == 'vt':
            texcoords.append(tuple(map(float, fields[1:3])))
        elif fields[0] == 'f':
            faces.append([int(v.split('/')[0]) - 1 for v in fields[1:]])
            uv_faces.append([int(v.split('/')[1]) - 1 for v in fields[1:]])
    assert len(vertices) == len(fitted), 'Hair binding must cover every source vertex'
    if os.environ.get('ATRIUM_HAIR_CARD_STUDY')=='1':
        from mathutils import Vector
        from mathutils.bvhtree import BVHTree
        # Keep the connected underlayer intact. Tuck only raised loose cards
        # towards it, retaining a small stand-off instead of flattening to skin.
        parent=list(range(len(vertices)))
        def find(i):
            while parent[i]!=i:
                parent[i]=parent[parent[i]];i=parent[i]
            return i
        for face in faces:
            for i in face[1:]:parent[find(i)]=find(face[0])
        groups={}
        for i in range(len(vertices)):groups.setdefault(find(i),[]).append(i)
        base=max(groups,key=lambda k:len(groups[k]))
        surface=BVHTree.FromPolygons([Vector(v) for v in vertices],[f for f in faces if find(f[0])==base])
        for i,position in enumerate(vertices):
            if find(i)==base:continue
            point=Vector(position);hit,normal,_,distance=surface.find_nearest(point)
            if hit is not None and distance>.004 and (point-hit).dot(normal)>0:
                amount=min(.012,(distance-.004)*.65)
                vertices[i]=tuple(point+(hit-point).normalized()*amount)
    for obj in list(bpy.context.scene.objects):
        if obj.type == 'MESH' and obj.name.startswith('Hair'):
            bpy.data.objects.remove(obj, do_unlink=True)
    mesh = bpy.data.meshes.new('Authored short hair mesh')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    uv = mesh.uv_layers.new(name='UVMap')
    for poly, indices in zip(mesh.polygons, uv_faces):
        poly.use_smooth = True
        for loop, index in zip(poly.loop_indices, indices):
            uv.data[loop].uv = texcoords[index]
    obj = bpy.data.objects.new('HairAuthored_' + style, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = head.parent
    obj['atrium_authored_hair'] = True
    obj['source_license'] = 'MakeHuman system assets CC0, September 2020'
    mat = bpy.data.materials.new('Authored cutout hair')
    mat.use_nodes = True
    mat.use_backface_culling = False
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = .72
    texture = nodes.new('ShaderNodeTexImage')
    texture.image = bpy.data.images.load(str(source / (style + '_diffuse.png')))
    texture_size=int(os.environ.get('ATRIUM_HAIR_TEXTURE_STUDY','512'))
    assert texture_size in (512,1024,2048), 'Unsupported hair texture study size'
    texture.image.scale(texture_size,texture_size)
    texture.image.pack()
    links.new(texture.outputs['Color'], bsdf.inputs['Base Color'])
    cutoff = nodes.new('ShaderNodeMath')
    cutoff.operation = 'GREATER_THAN'
    cutoff.inputs[1].default_value = .4
    links.new(texture.outputs['Alpha'], cutoff.inputs[0])
    links.new(cutoff.outputs[0], bsdf.inputs['Alpha'])
    mesh.materials.append(mat)
    return obj
