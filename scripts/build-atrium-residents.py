"""Derive seven original residents from MirrorLife's editable shared-pivot rig.
No third-party character assets. Preserve bind matrices and authored facial volumes.
"""
import bpy, sys, json, copy, importlib.util, math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('civic',ROOT/'scripts/blender-build-civic-characters.py')
civic=importlib.util.module_from_spec(spec);spec.loader.exec_module(civic)
OUT=ROOT/'public/assets/atrium/residents';OUT.mkdir(parents=True,exist_ok=True)
SOURCE=ROOT/'models/atrium/residents';SOURCE.mkdir(parents=True,exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
# Each resident has an independently authored body profile and head/wardrobe silhouette.
PEOPLE=[
 ('you','player','spiky',1.0,'#eddfc5','#e9b34c','#283b4a'),
 ('lin','listener','braided_bob',.96,'#f0e5d0','#74aaa2','#2b4554'),
 ('chen','player','spiky',1.08,'#efe3cb','#293d52','#7ea7a0'),
 ('xu','facilitator','coral_ponytail',.99,'#efe3ce','#df8a6e','#42685e'),
 ('zhou','mediator','braided_bob',1.03,'#dfaf50','#eee3ce','#465f72'),
 ('he','listener','cap',1.06,'#79aaa1','#e7be64','#364657'),
 ('tang','player','spiky',.94,'#f0e2cb','#c77f68','#537f82'),
]
base_bodies=copy.deepcopy(civic.BODY_PROFILES)
base_faces=copy.deepcopy(civic.FACE_PROFILES)

def everyday_costume(role,config,mats,visual,left_arm,right_arm,left_elbow,right_elbow,left_leg,right_leg):
    """Soft everyday garments for this pilot, not the earlier mechanical costume kit."""
    who=config['atrium_id']
    for obj in list(bpy.context.scene.objects):
        if obj.name.startswith(('ShoulderMantle','ShoulderLoadFold','TorsoTensionFold','TravelerForearmSkin','TravelerShortSleeveHem')):
            bpy.data.objects.remove(obj,do_unlink=True)
    # The shared traveler is short-sleeved; this pilot uses long everyday jackets.
    # Its rigid bare forearm overlay intersected the continuously weighted sleeve.
    # Keep only that continuous cloth mesh and add a cuff where it meets the wrist.
    for side,elbow in [(-1,left_elbow),(1,right_elbow)]:
        if config['costume']!='listener':
            civic.contoured_elliptical_shell('EverydayCuff_'+str(side),[
                (-.301,.047,.043,0,0),(-.29,.056,.051,0,0),
                (-.266,.058,.053,0,0),(-.255,.053,.048,0,0)],mats['outer'],elbow,segments=24)
        hand=bpy.data.objects.get('Hand_'+str(side))
        grip=civic.empty('HandGripAnchor_'+str(side),hand,(0,-.045,-.038),(1.2,0,0))
        grip['contact_contract']='atrium-palm-grip-v1'
    # Fingers are anatomy, not removable detail. Renaming before the shared
    # batcher routes them into the full skinned core, including the mobile LOD.
    for obj in list(bpy.context.scene.objects):
        if obj.name.startswith(('FingerVolume_','ThumbVolume_')):
            obj.name=obj.name.replace('FingerVolume_','EssentialFinger_').replace('ThumbVolume_','EssentialThumb_')
            decimate=obj.modifiers.new('Digit silhouette LOD','DECIMATE');decimate.ratio=.6
    # These parts sit on the continuous body/skin mesh. No rigid breastplates,
    # dangling diagonal rods, oversized buckles or shell-like decorative lapels.
    civic.curve_tube('Soft neckline',[(-.145,-.09,1.255),(0,-.155,1.23),(.145,-.09,1.255)],.016,mats['outer'],visual)
    if who in ('you','tang','he'):
        civic.ellipsoid('Folded fabric hood',(0,.08,1.265),(.175,.115,.085),mats['outer'],visual,segments=32,rings=16)
        civic.curve_tube('Ribbed lower hem',[(-.2,-.07,.83),(0,-.177,.8),(.2,-.07,.83)],.014,mats['outer'],visual)
    if who in ('lin','zhou'):
        # One continuous curved garment around the body, open at the front.
        # Separate rectangular chest panels read as plates even with rounded edges.
        profile=[(.79,.174,.14),(.86,.2,.157),(1.04,.244,.18),(1.2,.281,.185),(1.29,.23,.163),(1.33,.135,.112)]
        width=civic.BODY_PROFILES[role]['torso_width'];depth=civic.BODY_PROFILES[role]['torso_depth'];verts=[];faces=[];segments=48
        for z,rx,ry in profile:
            for i in range(segments+1):
                a=.2+i*(math.tau-.4)/segments;verts.append((math.sin(a)*rx*width,-math.cos(a)*ry*depth,z))
        for j in range(len(profile)-1):
            for i in range(segments):
                a=j*(segments+1)+i;faces.append((a,a+1,a+segments+2,a+segments+1))
        mesh=bpy.data.meshes.new('Continuous knit mesh');mesh.from_pydata(verts,[],faces);mesh.update()
        ob=bpy.data.objects.new('Soft wrap cardigan',mesh);bpy.context.collection.objects.link(ob);ob.parent=visual;mesh.materials.append(mats['outer'])
        uv=mesh.uv_layers.new(name='UVMap')
        for polygon in mesh.polygons:
            polygon.use_smooth=True
            for loop in polygon.loop_indices:
                v=mesh.loops[loop].vertex_index;uv.data[loop].uv=(v%(segments+1)/segments,v//(segments+1)/(len(profile)-1))
        solid=ob.modifiers.new('Real fabric thickness','SOLIDIFY');solid.thickness=.009
        bevel=ob.modifiers.new('Soft knit edge','BEVEL');bevel.width=.004;bevel.segments=3
        for z in [.97,1.055,1.14]:
            civic.ellipsoid('Small wood button',(0,-.17,z),(.009,.006,.009),mats['accent'],visual,segments=12,rings=8)
    elif who=='xu':
        civic.tailored_panel('Cotton plant apron',.24,.3,.37,.43,.027,(0,-.177,1.005),mats['lower'],visual,radius=.025)
        civic.rounded_box('Apron soft patch pocket',(.23,.034,.105),(0,-.201,.93),mats['outer'],visual,radius=.025)
    elif who=='chen':
        civic.curve_tube('Jacket zipper',[(0,-.192,.85),(0,-.195,1.2)],.004,mats['outer'],visual)
        for side in (-1,1):
            civic.rounded_box('Jacket welt pocket_'+str(side),(.11,.022,.09),(side*.115,-.18,1.055),mats['outer'],visual,radius=.025)
    elif who=='tang':
        civic.ellipsoid('Kangaroo fabric pocket',(0,-.18,.95),(.155,.023,.082),mats['outer'],visual,segments=32,rings=16)
        for side in (-1,1):civic.curve_tube('Short cotton drawcord_'+str(side),[(side*.055,-.155,1.235),(side*.057,-.187,1.17)],.0035,mats['paper'],visual)
    else:
        for side in (-1,1):
            civic.rounded_box('Rounded patch pocket_'+str(side),(.12,.029,.12),(side*.115,-.183,.99),mats['outer'],visual,radius=.027)
        civic.curve_tube('Work jacket seam',[(0,-.18,.83),(0,-.196,1.22)],.0035,mats['outer'],visual)
    # A restrained embroidered sun ties the garments to the home's curved motifs.
    civic.ellipsoid('Embroidered sun',(-.12,-.205,1.15),(.026,.003,.026),mats['accent'],visual,segments=24,rings=12)

civic.build_costume=everyday_costume

def everyday_hair(head,mats,style):
    """A continuous scalp and broad softened locks, not floating hard spikes."""
    who=current_identity
    long_bob=who=='lin';rx,ry,rz=.241,.205,.278
    rings=14;sides=48;vertices=[(0,0,.298)];faces=[]
    for row in range(1,rings+1):
        for i in range(sides):
            a=i*math.tau/sides
            extent=1.05+(.96 if not long_bob else 1.4)*(1-math.cos(a))*.5+.26*math.sin(a)**2
            theta=row/rings*extent
            radius=1+.018*math.sin(a*5+theta*2)*math.sin(theta)
            vertices.append((rx*math.sin(theta)*math.sin(a)*radius,-ry*math.sin(theta)*math.cos(a)*radius,.02+rz*math.cos(theta)))
    for i in range(sides):faces.append((0,1+i,1+(i+1)%sides))
    for row in range(rings-1):
        for i in range(sides):
            a=1+row*sides+i;b=1+row*sides+(i+1)%sides;faces.append((a,a+sides,b+sides,b))
    mesh=bpy.data.meshes.new('Continuous scalp mesh');mesh.from_pydata(vertices,[],faces);mesh.update()
    cap=bpy.data.objects.new('Hair continuous scalp',mesh);bpy.context.collection.objects.link(cap);cap.parent=head;mesh.materials.append(mats['hair'])
    for p in mesh.polygons:p.use_smooth=True
    solid=cap.modifiers.new('Hairline thickness','SOLIDIFY');solid.thickness=.009
    def lock(name,points,radii):
        ob=civic.tapered_lock(name,points,radii,mats['hair'],head,sides=10,oval_ratio=.52)
        sub=ob.modifiers.new('Soft groomed clump','SUBSURF');sub.levels=1;sub.render_levels=1
        return ob
    for i,x in enumerate([-.175,-.108,-.04,.03,.1,.17]):
        shift=.065 if who in ('you','chen','zhou') else (-.03 if i<3 else .035)
        tip_z=(.10 if who in ('lin','xu') else .125)+abs(x)*.18
        lift=.04 if who=='chen' else (.02 if who=='tang' else 0)
        lock('Hair swept fringe '+str(i),[(x*.75,-.10,.268+lift),(x,-.172,.24+lift),(x+shift*.7,-.196,.185),(x+shift,-.181,tip_z)], [.027,.046,.032,.004])
    for side in [-1,1]:
        lock('Hair temple '+str(side),[(side*.20,-.05,.19),(side*.237,-.042,.08),(side*.231,-.025,-.045),(side*.2,-.035,-.18 if long_bob else -.065)],[.035,.044,.037,.008])
    if who=='xu':
        civic.ellipsoid('Hair ponytail tie',(0,.183,.14),(.05,.05,.045),mats['accent'],head)
        for i in [-1,0,1]:lock('Hair ponytail '+str(i),[(i*.025,.19,.15),(i*.04,.285,.08),(i*.035,.30,-.055),(i*.02,.22,-.21)],[.037,.055,.039,.007])
    if who=='zhou':civic.ellipsoid('Hair low bun',(0,.198,-.055),(.09,.072,.09),mats['hair'],head,segments=28,rings=16)

civic.build_hair=everyday_hair
reports=[]
for idx,(name,role,hair,body,top,outer,lower) in enumerate(PEOPLE):
    current_identity=name
    cfg=copy.deepcopy(civic.ROLE_CONFIGS[role]);cfg.update(hair='#272e3a',hair_highlight='#414653',hair_style=hair,top=top,outer=outer,lower=lower,accent='#e4b149',shoe='#2f4354',sole='#e6d7bb')
    cfg['atrium_id']=name
    cfg['top']={'you':'#eddfc5','lin':'#8db0a0','chen':'#344b60','xu':'#dfa47f','zhou':'#d8cbb5','he':'#8fb5ab','tang':'#c78370'}[name]
    if name=='zhou':cfg['hair']='#42362e'
    civic.BODY_PROFILES[role]=copy.deepcopy(base_bodies[role])
    profile=civic.BODY_PROFILES[role]
    profile['torso_width']*=body;profile['shoulder_x']*=body
    # Slightly less doll-like cranium, wider range of face/jaw shapes.
    profile['head_scale']=tuple(s*.76 for s in profile['head_scale'])
    profile['head_z']+=.025
    civic.FACE_PROFILES[role]=copy.deepcopy(base_faces[role])
    civic.FACE_PROFILES[role]['jaw_taper']+=((idx%3)-1)*.014
    civic.FACE_PROFILES[role]['mouth_corner']=.004+(idx%3)*.002
    civic.FACE_PROFILES[role]['eye_height']*=.82
    root=civic.build_character(role,cfg)
    root['atrium_identity']=name
    # Fit facial features to the actual sculpt, not a constant plane in front
    # of an ellipsoid. Constant Y left eyelids, lips and blush visibly floating.
    face=bpy.data.objects['Head']
    surface=BVHTree.FromPolygons([v.co for v in face.data.vertices],[p.vertices[:] for p in face.data.polygons])
    def face_y(x,z):
        hit=surface.ray_cast(Vector((x,-1,z)),Vector((0,1,0)))
        return hit[0].y if hit[0] is not None else -.18
    for side in [-1,1]:
        for prefix,offset in [('EyePivot_',.005),('BrowPivot_',.004)]:
            ob=bpy.data.objects[prefix+str(side)];ob.location.y=face_y(ob.location.x,ob.location.z)-offset
        blush=bpy.data.objects.get('Blush_'+str(side))
        if blush:bpy.data.objects.remove(blush,do_unlink=True)
    mouth=bpy.data.objects['MouthPivot'];mouth.location.y=face_y(0,mouth.location.z)-.004
    philtrum=bpy.data.objects.get('Philtrum')
    if philtrum:bpy.data.objects.remove(philtrum,do_unlink=True)
    # The shared source deliberately used a flat-shaded cranium. This pilot's
    # approachable 3D direction needs continuous facial normals, not polygonal cheeks.
    for obj in bpy.context.scene.objects:
        if obj.type=='MESH' and (obj.name=='Head' or obj.name.startswith(('Hair','Fringe','Braid'))):
            for polygon in obj.data.polygons:polygon.use_smooth=True
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/(name+'.blend')))
    # Bake material base colours into corner vertex colours and merge by rigid controller.
    # Eye and mouth parents remain independently animated; skinning batches stay intact.
    groups={}
    for obj in list(bpy.context.scene.objects):
        if obj.type not in {'MESH','CURVE'} or any(m.type=='ARMATURE' for m in obj.modifiers):continue
        if obj.type=='MESH' and obj.data.shape_keys:
            obj.shape_key_clear()
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        bpy.ops.object.convert(target='MESH')
        colors=obj.data.color_attributes.get('Color') or obj.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
        for poly in obj.data.polygons:
            mat=obj.data.materials[poly.material_index] if obj.data.materials else None
            color=mat.diffuse_color if mat else (1,1,1,1)
            for loop in poly.loop_indices:colors.data[loop].color=color
        boundary_names={'VisualRoot','HeadPivot','EyePivot_-1','EyePivot_1','MouthClosedPivot','MouthOpenPivot','LeftArmPivot','RightArmPivot','LeftElbowPivot','RightElbowPivot','LeftLegPivot','RightLegPivot','LeftKneePivot','RightKneePivot','Hand_-1','Hand_1','SleeveCompressionPivot_-1','SleeveCompressionPivot_1','TrouserCompressionPivot_-1','TrouserCompressionPivot_1','ShoeUpper_-1Pivot','ShoeUpper_1Pivot'}
        parent=obj.parent
        while parent and parent.name not in boundary_names:parent=parent.parent
        transform=obj.matrix_world.copy();obj.parent=parent;obj.matrix_world=transform
        groups.setdefault(parent,[]).append(obj)
    vertex=bpy.data.materials.new('Resident unified surface');vertex.use_nodes=True
    nodes=vertex.node_tree.nodes;bs=nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.78
    vc=nodes.new('ShaderNodeVertexColor');vc.layer_name='Color';vertex.node_tree.links.new(vc.outputs['Color'],bs.inputs['Base Color'])
    for parent,objects in groups.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:obj.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        if len(objects)>1:bpy.ops.object.join()
        merged=objects[0];merged.name=(parent.name if parent else name)+'_Surface'
        for f in merged.data.polygons:f.material_index=0
        merged.data.materials.clear();merged.data.materials.append(vertex)
        merged.data.validate(verbose=False)
    # Fine hand creases are source detail; the desktop game LOD keeps the complete core hands.
    detail=bpy.data.objects.get('SkinnedArticulationDetail')
    if detail: detail.hide_render=True
    def export(path):
        bpy.ops.object.select_all(action='DESELECT')
        for ob in bpy.context.scene.objects:
            if ob != detail:ob.select_set(True)
        bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_apply=False,export_extras=True,export_animations=False,export_yup=True,export_draco_mesh_compression_enable=path.parent==OUT)
    export(SOURCE/(name+'-master.glb'))
    for ob in bpy.context.scene.objects:
        if ob.type=='MESH' and not any(m.type=='ARMATURE' for m in ob.modifiers):
            d=ob.modifiers.new('Desktop LOD','DECIMATE');d.ratio=.55 if ob.name=='HeadPivot_Surface' else .4;d.use_collapse_triangulate=True
            bpy.context.view_layer.objects.active=ob
            bpy.ops.object.modifier_apply(modifier=d.name)
            ob.data.validate(verbose=False)
    export(OUT/(name+'.glb'))
    for ob in bpy.context.scene.objects:
        if ob.type=='MESH' and not any(m.type=='ARMATURE' for m in ob.modifiers):
            d=ob.modifiers.new('Mobile LOD','DECIMATE');d.ratio=.52
            bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=d.name)
            ob.data.validate(verbose=False)
    export(OUT/(name+'-mobile.glb'))
    reports.append({'id':name,'baseRole':role,'hair':hair,'bodyScale':body,'source':str((SOURCE/(name+'.blend')).relative_to(ROOT)),'animationSource':'src/civic-animation-clips.js','license':'Original project-authored derivative of MirrorLife civic rig','reviewStatus':'development'})
    print('RESIDENT_READY',name,flush=True)
(OUT/'manifest.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2))
