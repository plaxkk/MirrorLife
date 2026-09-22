"""Reject GLBs whose textured primitives lack the requested UV coordinates."""
import json
import struct
import sys
from pathlib import Path


def texture_coordinates(value):
    if not isinstance(value, dict):
        return
    for key, item in value.items():
        if key.endswith('Texture') and isinstance(item, dict) and 'index' in item:
            transform=item.get('extensions', {}).get('KHR_texture_transform', {})
            yield transform.get('texCoord', item.get('texCoord', 0))
        elif isinstance(item, dict):
            yield from texture_coordinates(item)


def verify(path):
    data=Path(path).read_bytes()
    assert data[:4]==b'glTF', f'Not a GLB: {path}'
    length=struct.unpack_from('<I', data, 12)[0]
    gltf=json.loads(data[20:20+length])
    checked=0
    for mesh in gltf.get('meshes', []):
        for primitive in mesh['primitives']:
            if 'material' not in primitive:
                continue
            material=gltf['materials'][primitive['material']]
            for index in set(texture_coordinates(material)):
                semantic=f'TEXCOORD_{index}'
                assert semantic in primitive['attributes'], f"{path}: {mesh.get('name')} / {material.get('name')} missing {semantic}"
                uv=gltf['accessors'][primitive['attributes'][semantic]]
                position=gltf['accessors'][primitive['attributes']['POSITION']]
                assert uv['type']=='VEC2' and uv['count']==position['count'], f'{path}: incompatible UV accessor'
                checked+=1
    return checked


if __name__=='__main__':
    assert len(sys.argv)>1, 'Provide GLB files to verify'
    for path in sys.argv[1:]:
        print(path, 'TEXTURED_UV_OK', verify(path))
