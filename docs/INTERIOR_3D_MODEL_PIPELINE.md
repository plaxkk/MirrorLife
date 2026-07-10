# MirrorLife Interior 2D-to-3D Pipeline

目标：把 `dist/assets/interior-props-image2` 里的陈设物图片转成浏览器可加载的 `.glb`，替换当前 `public/assets/interiors/glb` 下的程序化室内陈设模型。

当前游戏运行时只需要 17 个 GLB 槽位，不需要一次把 55 张图片全部做成独立模型。黑客松版本先替换这 17 个槽位，就能明显改变室内陈设风格。

## Three.js 程序化模型

当外部 2D-to-3D 平台额度不足时，可以直接生成仓库内维护的精细卡通模型。生成器把参考图拆成主体结构、功能件、装饰件和轮廓线，使用 Three.js 几何体与 PBR 平涂材质重建，产物是真正可旋转观察的 GLB，不是图片裁剪或平面卡片。

默认只生成尚未由 Tripo / 混元替换的 12 个槽位：

```bash
npm run generate:interior-threejs
npm run import:interior-3d -- --provider procedural-threejs
npm run verify:interior-3d
```

产物先写入 `dist/interior-3d-work/procedural-threejs/generated-glb`，导入器会备份并合并运行时清单，不会覆盖已经完成的高优先级外部模型。也可以只生成指定槽位：

```bash
npm run generate:interior-threejs -- --slots desk,round-table,table
```

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

## Browser Export Budget

MirrorLife 的网页端室内层使用 `Three.js + GLTFLoader` 加载普通 `.glb`，当前没有接 `DracoLoader` 或 `MeshoptDecoder`。因此导出模型时优先选择“轻量、可直接加载”的 GLB，而不是影视级高面数模型。

推荐导出规格：

- 小陈设：10K-30K 面，512px 贴图，单文件尽量小于 1.5MB。
- 常用家具：30K-50K 面，512px 或 1024px 贴图，单文件 1-3MB。
- 重点物件：50K-100K 面，1024px 贴图，单文件 3-5MB。
- 混元/Tripo 若只能导出高面数源文件，可以用 500K 作为源文件上限，但不要直接放进网页运行时。

避免直接导出到运行时：

- 1M / 1.5M 面模型。
- 2K / 4K 大贴图。
- Draco 压缩模型，除非 `src/interior-three.js` 增加对应解码器。

高面数源文件下载后先优化：

```bash
npm run optimize:interior-3d -- --provider hunyuan --slot bed --texture-size 1024 --import-now
```

当前已验证的 Tripo 真 3D 模型优化后约 2MB-4MB/个，网页端可以正常校验和加载。

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

For a smaller first pass, package only the next 5 pending high-priority slots:

```bash
npm run package:interior-3d-web -- --provider tripo --limit 5
```

This creates:

- `dist/interior-3d-work/tripo/web-upload-batch-05/images/`
- `dist/interior-3d-work/tripo/web-upload-batch-05/PROMPTS.md`
- `dist/interior-3d-work/tripo/web-upload-batch-05/manifest.json`

Use this small batch when the browser automation plugin cannot control Chrome or when you want to spend free credits cautiously.

当前仓库已经用 TripoAI 完成并导入了 4 个高优先级真 3D 槽位：

- `bed`
- `counter`
- `shelf`
- `seating`

导入状态记录在：

```text
public/assets/interiors/glb/model-source-manifest.json
```

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

If the web app downloads a generic filename such as `model.glb`, place it safely with:

```bash
npm run place:interior-3d -- --slot bed --file ~/Downloads/model.glb
npm run place:interior-3d -- --slot counter --file ~/Downloads/model.glb
```

Add `--import-now` to immediately copy all currently generated Tripo models into the runtime folder:

```bash
npm run place:interior-3d -- --slot bed --file ~/Downloads/model.glb --import-now
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

只打包仍然是 `sprite-card` 占位的运行时槽位，避免重复生成已经由 Tripo 完成的模型：

```bash
npm run package:interior-3d-web -- --provider hunyuan --limit 13 --fallback-only --force
```

这会生成：

```text
dist/interior-3d-work/hunyuan/web-upload-batch-13/
```

这个批次当前只包含剩余 13 个槽位：

- `wall-board`
- `desk`
- `round-table`
- `table`
- `market-stall`
- `plant-zone`
- `workbench`
- `easel`
- `sink`
- `altar`
- `fountain`
- `bench`
- `toy-corner`

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

## Local No-GPU Fallback

If TripoAI/Hunyuan web generation is not available yet, generate local sprite-card GLB fallbacks:

```bash
npm run generate:interior-sprite-card-glb -- --import-now
npm run verify:interior-3d
```

This creates lightweight `.glb` files from the new PNG prop sprites and imports them into:

```text
public/assets/interiors/glb/
```

This is a 2.5D browser-game fallback, not the final AI mesh quality target. It is useful for replacing the old procedural prop style immediately while waiting for TripoAI/Hunyuan GLBs. Later, any downloaded TripoAI or Hunyuan model can overwrite the same slot via:

```bash
npm run place:interior-3d -- --slot bed --file ~/Downloads/model.glb --import-now
```

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
