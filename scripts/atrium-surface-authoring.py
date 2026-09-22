"""Editable, portable skin and strand surfaces for the cast prototype.

Shaders are baked to standard glTF PBR maps; no runtime custom shader is required.
"""
import bpy, math


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


def skin_shader(obj, portrait=False):
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
        base=tuple(material.diffuse_color[:3])
        colors=obj.data.color_attributes['Color']
        response=obj.data.color_attributes.new(name='FaceResponse',type='FLOAT_COLOR',domain='CORNER')
        for loop in obj.data.loops:
            x,y,z=obj.data.vertices[loop.vertex_index].co
            front=max(0.,min(1.,(-y-.11)/.065))
            lip=math.exp(-(x/.062)**4-((z+.106)/.016)**4)*front
            cheek=math.exp(-((abs(x)-.119)/.045)**2-((z+.025)/.060)**2)*front
            ear=math.exp(-((abs(x)-.205)/.035)**2-((z+.015)/.095)**2)
            tint=(base[0]*.96,base[1]*.59,base[2]*.64)
            prior=colors.data[loop.index].color
            warmth=(.018,-.035,-.035)
            colors.data[loop.index].color=tuple((prior[i]*(1-lip*.65)+tint[i]*lip*.65)
                *(1+(cheek*.6+ear*.8)*warmth[i]) for i in range(3))+(1.,)
            forehead=math.exp(-(x/.115)**4-((z-.125)/.10)**4)*front
            nose=math.exp(-(x/.037)**4-((z+.015)/.065)**4)*front
            rough=.68-.105*forehead-.105*nose-.14*lip
            response.data[loop.index].color=(rough,rough,rough,1.)
        rough_attr=nodes.new('ShaderNodeVertexColor');rough_attr.layer_name='FaceResponse'
        links.new(rough_attr.outputs['Color'],bs.inputs['Roughness'])
        bs.inputs['Specular IOR Level'].default_value=.35
        bump.inputs['Strength'].default_value=.065
        material['atrium_portrait_authoring']='Anatomical lip/cheek/ear tint and independent forehead/nose/lip roughness, no baked lighting'
    material['atrium_surface_authoring']='Native lip/cheek/lid colour; restrained skin microrelief, independent of cloth'
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
