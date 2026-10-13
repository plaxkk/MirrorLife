"""Re-export the saved editable source without rebuilding all authored objects."""
import bpy,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/atrium';SOURCE=ROOT/'models/atrium'
bpy.ops.wm.open_mainfile(filepath=str(SOURCE/'atrium-master.blend'))
COLLIDERS=json.loads(bpy.context.scene.get('collision_manifest',(OUT/'collision.json').read_text()))
source=(ROOT/'scripts/build-atrium-assets.py').read_text()
exec(source[source.index('# Export evaluated authored mesh.'):])
