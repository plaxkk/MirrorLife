"""Extract reusable, origin-normalized authored modules without changing the level source."""
import bpy,json
from pathlib import Path
from mathutils import Matrix,Vector
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'models/atrium';OUT=ROOT/'public/assets/atrium/kit'
OUT.mkdir(parents=True,exist_ok=True);(SOURCE/'kit').mkdir(exist_ok=True)
specs=[
    ('window-wall',(-8.8,0,-8),('Rear window (0, 0)',),None),
    ('entry-portal',(-4.4,0,8),('Entry ',),None),
    ('main-stair',(5.8,0,0),('Main stair',),None),
    ('gallery-rail',(0,3.5,-4.68),('Gallery handrail','Gallery post'),None),
    ('bookcase',(-8.7,0,-7.35),('Living library',),(-10.2,-7.2,-8,-6.8,0,2.8)),
    ('chair',(-2.2,0,-1.95),('Communal chair',),(-2.8,-1.6,-2.5,-1.35,0,1.2)),
    ('shared-table',(-.65,0,.1),('Shared table','Table ','Drawer pull','Community notebook','Tea cup'),None),
    ('pendant',(-2.1,7.2,-.1),('Pendant',),(-2.5,-1.7,-.5,.3,3.8,7.3)),
    ('plant',(-.65,.95,.1),('Shared table plant',),None),
]
manifest=[]
for name,origin,prefixes,region in specs:
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
    bpy.context.preferences.filepaths.save_version=0
    definitions=json.loads(bpy.context.scene['collision_manifest'])
    bpy.context.view_layer.update();selected=[]
    for ob in bpy.context.scene.objects:
        if ob.type not in {'MESH','CURVE'} or not ob.name.startswith(prefixes):continue
        if region:
            center=sum((ob.matrix_world@Vector(c) for c in ob.bound_box),Vector())/8
            x,z,y=center.x,-center.y,center.z
            if not(region[0]<=x<=region[1] and region[2]<=z<=region[3] and region[4]<=y<=region[5]):continue
        selected.append(ob)
    if not selected:raise RuntimeError('Empty kit '+name)
    offset=Matrix.Translation(Vector((-origin[0],origin[2],-origin[1])))
    for ob in selected:
        transform=ob.matrix_world.copy();ob.parent=None;ob.matrix_world=offset@transform
    keep=set(selected)
    for ob in list(bpy.context.scene.objects):
        if ob not in keep:bpy.data.objects.remove(ob,do_unlink=True)
    root=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(root)
    root['units']='metres';root['source_origin']=list(origin);root['original_asset']=True
    bpy.context.view_layer.update()
    for ob in selected:
        transform=ob.matrix_world.copy();ob.parent=root;ob.matrix_world=transform
    local_colliders=[]
    for d in definitions:
        if not(d['name'].startswith(prefixes) or name=='gallery-rail' and d['name']=='Gallery rail'):continue
        if region and 'position' in d:
            x,y,z=d['position']
            if not(region[0]<=x<=region[1] and region[2]<=z<=region[3] and region[4]<=y<=region[5]):continue
        d=dict(d)
        if d['type']=='box':d['position']=[v-origin[i] for i,v in enumerate(d['position'])]
        elif d['type']=='stairRail':d['x']-=origin[0];d['z0']-=origin[2];d['z1']-=origin[2]
        local_colliders.append(d)
    if name=='chair':local_colliders=[{'type':'box','name':'chair core','position':[0,.53,0],'size':[.76,1.06,.7]}]
    if name=='plant':local_colliders=[{'type':'box','name':'plant pot','position':[0,.115,0],'size':[.34,.23,.34]}]
    bpy.context.scene['collision_manifest']=json.dumps(local_colliders)
    (OUT/(name+'-collision.json')).write_text(json.dumps(local_colliders,indent=2))
    if name in ('shared-table','chair','plant'):
        anchor=bpy.data.objects.new('InteractionAnchor',None);bpy.context.collection.objects.link(anchor);anchor.parent=root
        anchor.location=(0,-2.1,0) if name=='shared-table' else (0,-.8,0)
    bpy.context.scene['module']=name
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'kit'/(name+'.blend')),compress=True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',export_apply=True,export_extras=True,export_cameras=False,export_animations=False,export_draco_mesh_compression_enable=True)
    manifest.append({'id':name,'units':'metres','sourceOriginInLevel':origin,'originMeaning':'ceiling suspension' if name=='pendant' else 'base centre','parts':len(selected),'source':f'models/atrium/kit/{name}.blend','glb':f'public/assets/atrium/kit/{name}.glb','collision':f'public/assets/atrium/kit/{name}-collision.json','placementNote':'Local-space collider definitions must be transformed along with the module when reused.','license':'Original MirrorLife project-authored geometry'})
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('KIT_READY',len(manifest),flush=True)
