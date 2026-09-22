"""Isolated CC0 MakeHuman hair study; preserve authored UVs and cutout edges."""
import bpy, json
from pathlib import Path


def build(root, head, style):
    assert style == 'short01'
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
            vertices.append((x * .255, -(z - .55) * .22, (y - 7.124) * .215))
        elif fields[0] == 'vt':
            texcoords.append(tuple(map(float, fields[1:3])))
        elif fields[0] == 'f':
            faces.append([int(v.split('/')[0]) - 1 for v in fields[1:]])
            uv_faces.append([int(v.split('/')[1]) - 1 for v in fields[1:]])
    assert len(vertices) == len(fitted), 'Hair binding must cover every source vertex'
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
    texture.image.scale(512, 512)
    texture.image.pack()
    links.new(texture.outputs['Color'], bsdf.inputs['Base Color'])
    cutoff = nodes.new('ShaderNodeMath')
    cutoff.operation = 'GREATER_THAN'
    cutoff.inputs[1].default_value = .4
    links.new(texture.outputs['Alpha'], cutoff.inputs[0])
    links.new(cutoff.outputs[0], bsdf.inputs['Alpha'])
    mesh.materials.append(mat)
    return obj
