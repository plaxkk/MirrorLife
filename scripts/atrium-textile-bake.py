"""Author cloth response, then bake standard glTF PBR maps on real UVs.

Source .blend retains the editable procedural materials and vertex colours.
Runtime exports use colour/roughness/tangent normal textures, without custom GLSL.
"""
import bpy, math


def bind_surface_material(obj):
    """Build an explicit colour/roughness shader for the consolidated body."""
    material=bpy.data.materials.new('Hero authored body surface');material.use_nodes=True
    nodes=material.node_tree.nodes;links=material.node_tree.links
    bs=nodes.get('Principled BSDF')
    colour=nodes.new('ShaderNodeVertexColor');colour.layer_name='Color'
    links.new(colour.outputs['Color'],bs.inputs['Base Color'])
    uv=nodes.new('ShaderNodeUVMap');uv.uv_map='SurfaceRoughness'
    xyz=nodes.new('ShaderNodeSeparateXYZ');links.new(uv.outputs['UV'],xyz.inputs[0])
    rough=nodes.new('ShaderNodeMath');rough.operation='MULTIPLY_ADD'
    rough.inputs[1].default_value=256/255;rough.inputs[2].default_value=-.5/255
    links.new(xyz.outputs['X'],rough.inputs[0]);links.new(rough.outputs[0],bs.inputs['Roughness'])
    obj.data.materials.clear();obj.data.materials.append(material)
    return material


def cloth_shader(material, mixed_surface=False):
    nodes=material.node_tree.nodes;links=material.node_tree.links
    bs=nodes.get('Principled BSDF')
    if material.get('atrium_textile_authoring'):return
    colour=bs.inputs['Base Color'].links[0].from_socket if bs.inputs['Base Color'].is_linked else None
    if colour is None:
        rgb=nodes.new('ShaderNodeRGB');rgb.outputs[0].default_value=bs.inputs['Base Color'].default_value;colour=rgb.outputs[0]
    roughness=bs.inputs['Roughness'].links[0].from_socket if bs.inputs['Roughness'].is_linked else None
    if roughness is None:
        value=nodes.new('ShaderNodeValue');value.outputs[0].default_value=bs.inputs['Roughness'].default_value;roughness=value.outputs[0]
    mask=nodes.new('ShaderNodeMath');mask.operation='GREATER_THAN';mask.inputs[1].default_value=.82 if mixed_surface else 0
    links.new(roughness,mask.inputs[0])
    position=nodes.new('ShaderNodeNewGeometry')
    noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=210;noise.inputs['Detail'].default_value=2;noise.inputs['Roughness'].default_value=.6
    links.new(position.outputs['Position'],noise.inputs['Vector'])
    warp=nodes.new('ShaderNodeTexWave');warp.wave_type='BANDS';warp.bands_direction='DIAGONAL';warp.inputs['Scale'].default_value=155;warp.inputs['Distortion'].default_value=1.2;warp.inputs['Detail Scale'].default_value=2.5
    links.new(position.outputs['Position'],warp.inputs['Vector'])
    fibres=nodes.new('ShaderNodeMixRGB');fibres.blend_type='MIX';fibres.inputs[0].default_value=.3
    links.new(noise.outputs['Fac'],fibres.inputs[1]);links.new(warp.outputs['Color'],fibres.inputs[2])
    dye=nodes.new('ShaderNodeMapRange');dye.inputs['From Min'].default_value=0;dye.inputs['From Max'].default_value=1;dye.inputs['To Min'].default_value=.955;dye.inputs['To Max'].default_value=1.025
    links.new(noise.outputs['Fac'],dye.inputs['Value'])
    tint=nodes.new('ShaderNodeMixRGB');tint.blend_type='MULTIPLY'
    links.new(mask.outputs[0],tint.inputs[0]);links.new(colour,tint.inputs[1]);links.new(dye.outputs['Result'],tint.inputs[2]);links.new(tint.outputs[0],bs.inputs['Base Color'])
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.27;bump.inputs['Distance'].default_value=.00045
    masked=nodes.new('ShaderNodeMath');masked.operation='MULTIPLY';links.new(mask.outputs[0],masked.inputs[0]);links.new(fibres.outputs[0],masked.inputs[1])
    links.new(masked.outputs[0],bump.inputs['Height']);links.new(bump.outputs[0],bs.inputs['Normal'])
    grain=nodes.new('ShaderNodeMath');grain.operation='MULTIPLY_ADD';grain.inputs[1].default_value=.07;grain.inputs[2].default_value=-.035;links.new(noise.outputs['Fac'],grain.inputs[0])
    masked_r=nodes.new('ShaderNodeMath');masked_r.operation='MULTIPLY';links.new(mask.outputs[0],masked_r.inputs[0]);links.new(grain.outputs[0],masked_r.inputs[1])
    rough=nodes.new('ShaderNodeMath');rough.operation='ADD';links.new(roughness,rough.inputs[0]);links.new(masked_r.outputs[0],rough.inputs[1]);links.new(rough.outputs[0],bs.inputs['Roughness'])
    material['atrium_textile_authoring']='Position-space dyed yarn, submillimetre normal relief, roughness mask protecting skin'


def bake_object(obj, size=1024):
    # Bake the authored bind surface, independent of the current pose. Restore
    # modifiers even on failure; the runtime keeps its original skinning.
    states=[(m,m.show_render,m.show_viewport) for m in obj.modifiers]
    try:
        for modifier,_,_ in states:
            modifier.show_render=False;modifier.show_viewport=False
        bpy.context.view_layer.update()
        return _bake_bind_surface(obj,size)
    finally:
        for modifier,render,viewport in states:
            modifier.show_render=render;modifier.show_viewport=viewport
        bpy.context.view_layer.update()


def _bake_bind_surface(obj, size):
    assert len(obj.data.materials)==1, 'Bake only a consolidated, single-material UV surface'
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    # One non-overlapping UV atlas for the exported batch. Source .blend keeps
    # its editable construction UVs; skin weights and shape are untouched.
    if not obj.data.uv_layers.get('UVMap'):obj.data.uv_layers.new(name='UVMap')
    obj.data.uv_layers.active_index=obj.data.uv_layers.find('UVMap')
    obj.data.uv_layers['UVMap'].active_render=True
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(70),island_margin=.012)
    bpy.ops.object.mode_set(mode='OBJECT')
    material=obj.data.materials[0];nodes=material.node_tree.nodes
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=1
    scene.render.bake.margin=6;scene.render.bake.use_selected_to_active=False
    images={}
    for kind in ['DIFFUSE','ROUGHNESS','NORMAL']:
        image=bpy.data.images.new('Hero '+obj.name+' '+kind,width=size,height=size,alpha=False)
        if kind!='DIFFUSE':image.colorspace_settings.name='Non-Color'
        target=nodes.new('ShaderNodeTexImage');target.image=image;nodes.active=target
        bpy.ops.object.bake(type=kind,uv_layer='UVMap',**({'pass_filter':{'COLOR'}} if kind=='DIFFUSE' else {}))
        import numpy as np
        pixels=np.empty(size*size*4,dtype=np.float32);image.pixels.foreach_get(pixels)
        rgb=pixels.reshape(-1,4)[:,:3]
        coverage=float(np.mean(np.max(rgb,axis=1)>.05))
        print('BAKE_RANGE',obj.name,kind,float(rgb.min()),float(rgb.max()),'coverage',coverage,flush=True)
        assert coverage>.1, 'Bake produced an empty or nearly empty texture: '+obj.name+' '+kind
        image.pack();images[kind]=image
    baked=bpy.data.materials.new(material.name+' baked PBR');baked.use_nodes=True
    nodes=baked.node_tree.nodes;links=baked.node_tree.links;bs=nodes.get('Principled BSDF')
    uv=nodes.new('ShaderNodeUVMap');uv.uv_map='UVMap'
    for kind,socket in [('DIFFUSE','Base Color'),('ROUGHNESS','Roughness'),('NORMAL','Normal')]:
        texture=nodes.new('ShaderNodeTexImage');texture.image=images[kind];links.new(uv.outputs['UV'],texture.inputs['Vector'])
        if kind=='NORMAL':
            normal=nodes.new('ShaderNodeNormalMap');normal.uv_map='UVMap';links.new(texture.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs[0],bs.inputs[socket])
        else:links.new(texture.outputs['Color'],bs.inputs[socket])
    # Colour has been baked once into the albedo; glTF must not multiply it twice.
    for attribute in list(obj.data.color_attributes):obj.data.color_attributes.remove(attribute)
    obj.data.materials.clear();obj.data.materials.append(baked)
    baked['atrium_surface_family']='textured-cloth-and-skin' if any(m.type=='ARMATURE' for m in obj.modifiers) else 'fabric'
    obj['pbr_texture_contract']='Baked colour, roughness and tangent normal; atlas UVMap; no duplicate vertex tint'
    return images
