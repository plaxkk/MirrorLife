"""Editable, portable skin and strand surfaces for the cast prototype.

Shaders are baked to standard glTF PBR maps; no runtime custom shader is required.
"""
import bpy


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


def skin_shader(obj):
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
