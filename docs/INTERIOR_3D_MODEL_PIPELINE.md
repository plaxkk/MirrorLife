# MirrorLife Interior 2D-to-3D Pipeline

目标：把 `dist/assets/interior-props-image2` 里的陈设物图片转成浏览器可加载的 `.glb`，替换当前 `public/assets/interiors/glb` 下的程序化室内陈设模型。

当前游戏运行时只需要 17 个 GLB 槽位，不需要一次把 55 张图片全部做成独立模型。黑客松版本先替换这 17 个槽位，就能明显改变室内陈设风格。

## Runtime Slots

配置文件：`config/interior-3d-model-map.json`

运行时目录：`public/assets/interiors/glb`

必需模型：

- `bed.glb`
- `counter.glb`
- `shelf.glb`
- `seating.glb`
- `wall-board.glb`
- `desk.glb`
- `round-table.glb`
- `table.glb`
- `market-stall.glb`
- `plant-zone.glb`
- `workbench.glb`
- `easel.glb`
- `sink.glb`
- `altar.glb`
- `fountain.glb`
- `bench.glb`
- `toy-corner.glb`

## Recommended Strategy

### 1. TripoAI first

Use TripoAI free credits for the highest-impact 17 slots.

Prepare the upload queue:

```bash
npm run prepare:interior-3d -- --provider tripo
```

This creates:

- `dist/interior-3d-work/tripo/input-images/`
- `dist/interior-3d-work/tripo/generated-glb/`
- `dist/interior-3d-work/tripo/tasks.json`
- `dist/interior-3d-work/tripo/tripo-upload-queue.md`

Workflow:

1. Open `dist/interior-3d-work/tripo/tripo-upload-queue.md`.
2. For each slot, upload the listed `input-images/*.png` to TripoAI image-to-3D.
3. Paste the prompt from the same queue item.
4. Download as GLB.
5. Save as the exact target filename, for example:

```text
dist/interior-3d-work/tripo/generated-glb/bed.glb
dist/interior-3d-work/tripo/generated-glb/counter.glb
dist/interior-3d-work/tripo/generated-glb/shelf.glb
```

Import the generated models:

```bash
npm run import:interior-3d -- --provider tripo
```

If all 17 are ready and you want a strict gate:

```bash
npm run import:interior-3d -- --provider tripo --require-all
```

Verify runtime assets:

```bash
npm run verify:interior-3d
```

### 2. Hunyuan3D fallback

When TripoAI credits run out, prepare the same queue for Hunyuan3D:

```bash
npm run prepare:interior-3d -- --provider hunyuan
```

This creates:

- `dist/interior-3d-work/hunyuan/input-images/`
- `dist/interior-3d-work/hunyuan/generated-glb/`
- `dist/interior-3d-work/hunyuan/hunyuan-jobs.jsonl`

Use either:

- Tencent Hunyuan3D web/demo/Space if available.
- Local or cloud GPU inference from the official Hunyuan3D repository.

If you have a local Hunyuan3D API server running, process the generated JSONL queue:

```bash
npm run generate:interior-3d-hunyuan
```

Defaults:

- Jobs: `dist/interior-3d-work/hunyuan/hunyuan-jobs.jsonl`
- Endpoint: `http://localhost:8080/generate`

Useful options:

```bash
npm run generate:interior-3d-hunyuan -- --limit 3
npm run generate:interior-3d-hunyuan -- --endpoint http://localhost:7860/generate
npm run generate:interior-3d-hunyuan -- --force
```

For every completed slot, save the downloaded/exported GLB as:

```text
dist/interior-3d-work/hunyuan/generated-glb/<slot>.glb
```

Then import:

```bash
npm run import:interior-3d -- --provider hunyuan
npm run verify:interior-3d
```

## Quality Rules

Each model should be:

- GLB, binary glTF 2.0.
- One centered object only.
- Origin near bottom center.
- No large floor plane unless it is part of the furniture or diorama.
- Low-poly/browser friendly.
- Visually close to the input sprite: dopamine cel-shading, thick outline feeling, toy-like isometric prop.
- Clear silhouette at small size.

Avoid:

- Photorealistic materials.
- Huge scenes with walls, floor, lighting rigs, labels, or people.
- Extremely thin geometry that disappears in orthographic view.
- Draco compression unless the runtime adds a Draco loader.

## Import Behavior

`npm run import:interior-3d` will:

1. Read `config/interior-3d-model-map.json`.
2. Look for GLBs in `dist/interior-3d-work/<provider>/generated-glb`.
3. Back up replaced runtime models to `dist/interior-3d-work/backups/<timestamp>/`.
4. Copy generated GLBs into `public/assets/interiors/glb`.
5. Write `public/assets/interiors/glb/model-source-manifest.json`.

Partial imports are allowed by default. This lets TripoAI and Hunyuan3D share the workload:

```bash
npm run import:interior-3d -- --provider tripo
npm run import:interior-3d -- --provider hunyuan
```

Use `--require-all` only when the whole 17-slot set is ready.

## Current Source Images

The source images are generated game sprites in:

```text
dist/assets/interior-props-image2/
```

The PicGo URLs are stored in:

```text
dist/assets/interior-props-image2/remote-manifest.json
```

Those URLs are included in the Tripo upload queue, but local file upload is usually more reliable than remote URL import.
