"""Compare isolated AO exports with their exact non-AO baseline, not installed assets."""
import argparse, hashlib, io, json, struct
from pathlib import Path
from PIL import Image

def glb(path):
    raw=path.read_bytes();length=struct.unpack_from('<I',raw,12)[0]
    return json.loads(raw[20:20+length]),raw[28+length:],hashlib.sha256(raw).hexdigest()

def pixels(g,b,texture):
    image=g['images'][g['textures'][texture['index']]['source']]
    view=g['bufferViews'][image['bufferView']];start=view.get('byteOffset',0)
    return Image.open(io.BytesIO(b[start:start+view['byteLength']])).convert('RGB')

def accessor(g,b,index):
    a=g['accessors'][index]
    components={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
    width=components*{5121:1,5123:2,5125:4,5126:4}[a['componentType']]
    data=bytearray(a['count']*width)
    if 'bufferView' in a:
        view=g['bufferViews'][a['bufferView']]
        start=view.get('byteOffset',0)+a.get('byteOffset',0);stride=view.get('byteStride',width)
        data[:]=b''.join(b[start+i*stride:start+i*stride+width] for i in range(a['count']))
    if 'sparse' in a:
        sparse=a['sparse'];indices=sparse['indices'];values=sparse['values']
        iv=g['bufferViews'][indices['bufferView']];vv=g['bufferViews'][values['bufferView']]
        fmt={5121:'B',5123:'H',5125:'I'}[indices['componentType']];size=struct.calcsize(fmt)
        start=iv.get('byteOffset',0)+indices.get('byteOffset',0);value_start=vv.get('byteOffset',0)+values.get('byteOffset',0)
        for i in range(sparse['count']):
            target=struct.unpack_from('<'+fmt,b,start+i*size)[0];assert target<a['count']
            data[target*width:(target+1)*width]=b[value_start+i*width:value_start+(i+1)*width]
    return a['type'],a['componentType'],a['count'],bytes(data)

def compare(before,after):
    ga,ba,ha=glb(before);gb,bb,hb=glb(after)
    def skin(g):return next(m for m in g['materials'] if m['name']=='Resident authored skin baked PBR')
    ma,mb=skin(ga),skin(gb);pa,pb=ma['pbrMetallicRoughness'],mb['pbrMetallicRoughness']
    assert 'occlusionTexture' not in ma and 'occlusionTexture' in mb
    assert mb['occlusionTexture']['index']==pb['metallicRoughnessTexture']['index']
    for ta,tb in [(pa['baseColorTexture'],pb['baseColorTexture']),(ma['normalTexture'],mb['normalTexture'])]:
        a,c=pixels(ga,ba,ta),pixels(gb,bb,tb)
        assert a.size==c.size and a.tobytes()==c.tobytes(), 'AO changed skin colour or normal map'
    a,c=pixels(ga,ba,pa['metallicRoughnessTexture']),pixels(gb,bb,pb['metallicRoughnessTexture'])
    assert a.size==c.size and a.getchannel('G').tobytes()==c.getchannel('G').tobytes(), 'AO changed roughness'
    lo,hi=c.getchannel('R').getextrema();assert lo<hi and hi>240, 'AO export is constant or unexpectedly dark'
    return dict(beforeSha256=ha,afterSha256=hb,mapSize=c.size,aoRange=[lo,hi],unchanged=['albedo','normal','roughness'],sharedOrmTexture=True)

if __name__=='__main__':
    args=argparse.ArgumentParser();args.add_argument('baseline',type=Path);args.add_argument('candidate',type=Path);args.add_argument('output',type=Path);a=args.parse_args()
    reports={suffix:compare(a.baseline/'public/assets/atrium/residents'/suffix,a.candidate/'public/assets/atrium/residents'/suffix) for suffix in ['you.glb','you-mobile.glb']}
    ga,ba,_=glb(a.baseline/'models/atrium/residents/you-master.glb');gb,bb,_=glb(a.candidate/'models/atrium/residents/you-master.glb')
    def head(g):return next(m for m in g['meshes'] if m['name']=='Player head and curved eyelids')
    ma,mb=head(ga),head(gb);assert len(ma['primitives'])==len(mb['primitives'])
    for x,y in zip(ma['primitives'],mb['primitives']):
        assert accessor(ga,ba,x['indices'])==accessor(gb,bb,y['indices'])
        for field in x['attributes']:assert accessor(ga,ba,x['attributes'][field])==accessor(gb,bb,y['attributes'][field]),field
        assert len(x.get('targets',[]))==len(y.get('targets',[]))
        for u,v in zip(x.get('targets',[]),y.get('targets',[])):
            for field in u:assert accessor(ga,ba,u[field])==accessor(gb,bb,v[field]),field
    reports['masterHeadGeometryAndMorphsUnchanged']=True
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(reports,indent=2)+'\n');print('SKIN_OCCLUSION_EXPORT_PASS')
