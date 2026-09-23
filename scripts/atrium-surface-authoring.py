"""Editable, portable skin and strand surfaces for the cast prototype.

Shaders are baked to standard glTF PBR maps; no runtime custom shader is required.
"""
import bpy, math, os


def colour_material(obj, family, roughness):
    previous=obj.data.materials[0]
    material=bpy.data.materials.new('Resident authored '+family)
    material.diffuse_color=previous.diffuse_color;material.use_nodes=True
    nodes=material.node_tree.nodes;links=material.node_tree.links
    bs=nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=roughness
    vc=nodes.new('ShaderNodeVertexColor');vc.layer_name='Color'
    links.new(vc.outputs['Color'],bs.inputs['Base Color'])
    material['atrium_surface_family']=family
    obj.data.materials.clear();obj.data.materials.append(material)
    return material


def portable_skin_response(obj):
    """Keep smooth authored colour on vertices; carry roughness in one tiny map."""
    material=obj.data.materials[0];nodes=material.node_tree.nodes;links=material.node_tree.links
    bs=nodes.get('Principled BSDF')
    uv=obj.data.uv_layers.new(name='FaceRoughness')
    response=obj.data.color_attributes['FaceResponse']
    for loop in obj.data.loops:
        rough=response.data[loop.index].color[0]
        uv.data[loop.index].uv=((rough*255+.5)/256,.5)
    ramp=bpy.data.images.new('Portrait roughness lookup',width=256,height=1,alpha=False)
    ramp.colorspace_settings.name='Non-Color'
    ramp.pixels=[v for i in range(256) for v in (1,i/255,0,1)];ramp.pack()
    texture=nodes.new('ShaderNodeTexImage');texture.image=ramp
    coordinate=nodes.new('ShaderNodeUVMap');coordinate.uv_map='FaceRoughness'
    split=nodes.new('ShaderNodeSeparateColor')
    links.new(coordinate.outputs['UV'],texture.inputs['Vector']);links.new(texture.outputs['Color'],split.inputs['Color'])
    links.new(split.outputs['Green'],bs.inputs['Roughness'])
    # The previous pore relief was not perceptible at gameplay scale. Preserve
    # the smooth style and avoid three large baked maps for this colour change.
    for link in list(bs.inputs['Normal'].links):links.remove(link)
    obj.data.uv_layers.active_index=obj.data.uv_layers.find('UVMap')
    obj.data.color_attributes.active_color=obj.data.color_attributes['Color']
    material['atrium_vertex_skin_response']='Anatomical vertex colour; 256x1 linear roughness lookup; no baked lighting'
    material['atrium_surface_authoring']='Native lip/cheek/ear colour; smooth skin without pore relief'
    return material


def skin_shader(obj, portrait=False, occlusion=False, source_texture=None, source_blend=.60):
    assert 0<=source_blend<=1, 'Skin source blend must be in [0, 1]'
    material=colour_material(obj,'skin',.74)
    nodes=material.node_tree.nodes;links=material.node_tree.links;bs=nodes.get('Principled BSDF')
    coordinate=nodes.new('ShaderNodeTexCoord');coordinate.object=obj
    noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=190
    noise.inputs['Detail'].default_value=2;noise.inputs['Roughness'].default_value=.55
    links.new(coordinate.outputs['Object'],noise.inputs['Vector'])
    roughness=nodes.new('ShaderNodeMapRange');roughness.inputs['To Min'].default_value=.715;roughness.inputs['To Max'].default_value=.755
    links.new(noise.outputs['Fac'],roughness.inputs['Value']);links.new(roughness.outputs['Result'],bs.inputs['Roughness'])
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.00025
    links.new(noise.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs[0],bs.inputs['Normal'])
    if portrait:
        lip_finish=os.environ.get('ATRIUM_LIP_FINISH_STUDY','0')=='1'
        base=tuple(material.diffuse_color[:3])
        response=obj.data.color_attributes.new(name='FaceResponse',type='FLOAT_COLOR',domain='CORNER')
        # Adding another mesh attribute can invalidate an earlier RNA handle.
        colors=obj.data.color_attributes['Color']
        for loop in obj.data.loops:
            x,y,z=obj.data.vertices[loop.vertex_index].co
            front=max(0.,min(1.,(-y-.11)/.065))
            lip=math.exp(-(x/.062)**4-((z+.106)/.016)**4)*front
            cheek=math.exp(-((abs(x)-.119)/.045)**2-((z+.025)/.060)**2)*front
            ear=math.exp(-((abs(x)-.205)/.035)**2-((z+.015)/.095)**2)
            tint=(base[0]*.96,base[1]*(.72 if lip_finish else .59),base[2]*(.72 if lip_finish else .64))
            prior=colors.data[loop.index].color
            warmth=(.018,-.035,-.035)
            lip_mix=.38 if lip_finish else .65
            colors.data[loop.index].color=tuple((prior[i]*(1-lip*lip_mix)+tint[i]*lip*lip_mix)
                *(1+(cheek*.6+ear*.8)*warmth[i]) for i in range(3))+(1.,)
            forehead=math.exp(-(x/.115)**4-((z-.125)/.10)**4)*front
            nose=math.exp(-(x/.037)**4-((z+.015)/.065)**4)*front
            rough=.68-.105*forehead-.105*nose-(.07 if lip_finish else .14)*lip
            response.data[loop.index].color=(rough,rough,rough,1.)
        rough_attr=nodes.new('ShaderNodeVertexColor');rough_attr.layer_name='FaceResponse'
        links.new(rough_attr.outputs['Color'],bs.inputs['Roughness'])
        bs.inputs['Specular IOR Level'].default_value=.35
        bump.inputs['Strength'].default_value=.065
        material['atrium_portrait_authoring']='Anatomical lip/cheek/ear tint and independent forehead/nose/lip roughness, no baked lighting'
        if occlusion:
            ao=nodes.new('ShaderNodeAmbientOcclusion');ao.name='Portrait local ambient occlusion'
            ao.only_local=True;ao.samples=32;ao.inputs['Distance'].default_value=.05
            material['atrium_portrait_occlusion']='Self-only ambient visibility, 0.05 world-unit range; independent from albedo'
    material['atrium_surface_authoring']='Native lip/cheek/lid colour; restrained skin microrelief, independent of cloth'
    if source_texture:
        assert portrait and obj.data.uv_layers.get('SourceUV')
        image=bpy.data.images.load(str(source_texture),check_existing=True);image.pack()
        texture=nodes.new('ShaderNodeTexImage');texture.image=image
        uv=nodes.new('ShaderNodeUVMap');uv.uv_map='SourceUV';links.new(uv.outputs['UV'],texture.inputs['Vector'])
        authored=bs.inputs['Base Color'].links[0].from_socket
        tone=nodes.new('ShaderNodeHueSaturation');tone.inputs['Saturation'].default_value=.85;tone.inputs['Value'].default_value=1.35
        links.new(texture.outputs['Color'],tone.inputs['Color'])
        blend=nodes.new('ShaderNodeMixRGB');blend.inputs[0].default_value=source_blend
        links.new(authored,blend.inputs[1]);links.new(tone.outputs['Color'],blend.inputs[2]);links.new(blend.outputs[0],bs.inputs['Base Color'])
        material['atrium_source_skin']=f'CC0 source UV skin, {source_blend*100:g} percent blend; saturation .85 and value 1.35 before mixing'
    return material


def hair_shader(material, head_frame):
    if material.get('atrium_strand_authoring'):return
    nodes=material.node_tree.nodes;links=material.node_tree.links;bs=nodes.get('Principled BSDF')
    if bs.inputs['Base Color'].is_linked:colour=bs.inputs['Base Color'].links[0].from_socket
    else:
        rgb=nodes.new('ShaderNodeRGB');rgb.outputs[0].default_value=bs.inputs['Base Color'].default_value;colour=rgb.outputs[0]
    coordinate=nodes.new('ShaderNodeTexCoord');coordinate.object=head_frame
    xyz=nodes.new('ShaderNodeSeparateXYZ');links.new(coordinate.outputs['Object'],xyz.inputs[0])
    negative_y=nodes.new('ShaderNodeMath');negative_y.operation='MULTIPLY';negative_y.inputs[1].default_value=-1;links.new(xyz.outputs['Y'],negative_y.inputs[0])
    angle=nodes.new('ShaderNodeMath');angle.operation='ARCTAN2';links.new(xyz.outputs['X'],angle.inputs[0]);links.new(negative_y.outputs[0],angle.inputs[1])
    sweep=nodes.new('ShaderNodeMath');sweep.operation='MULTIPLY_ADD';sweep.inputs[1].default_value=2.5;links.new(xyz.outputs['Z'],sweep.inputs[0]);links.new(angle.outputs[0],sweep.inputs[2])
    frequency=nodes.new('ShaderNodeMath');frequency.operation='MULTIPLY';frequency.inputs[1].default_value=95;links.new(sweep.outputs[0],frequency.inputs[0])
    strand=nodes.new('ShaderNodeMath');strand.operation='SINE';links.new(frequency.outputs[0],strand.inputs[0])
    dye=nodes.new('ShaderNodeMapRange');dye.inputs['From Min'].default_value=-1;dye.inputs['To Min'].default_value=.88;dye.inputs['To Max'].default_value=1.10
    links.new(strand.outputs[0],dye.inputs['Value'])
    tint=nodes.new('ShaderNodeMixRGB');tint.blend_type='MULTIPLY';tint.inputs[0].default_value=1
    links.new(colour,tint.inputs[1]);links.new(dye.outputs['Result'],tint.inputs[2]);links.new(tint.outputs[0],bs.inputs['Base Color'])
    roughness=nodes.new('ShaderNodeMapRange');roughness.inputs['From Min'].default_value=-1;roughness.inputs['To Min'].default_value=.59;roughness.inputs['To Max'].default_value=.65
    links.new(strand.outputs[0],roughness.inputs['Value']);links.new(roughness.outputs['Result'],bs.inputs['Roughness'])
    bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.18;bump.inputs['Distance'].default_value=.0003
    links.new(strand.outputs[0],bump.inputs['Height']);links.new(bump.outputs[0],bs.inputs['Normal'])
    material['atrium_strand_authoring']='Swept longitudinal strand response in the head frame; opaque, real 3D hair'
