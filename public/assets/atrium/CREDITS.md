# 天井生活馆：来源与许可

- 建筑、家具、植物、生活道具、程序纹理与 9 件模块：本项目原创 Blender 建模脚本生成。可编辑源在 `models/atrium/`，脚本在 `scripts/build-atrium-*.py`、`scripts/refine-atrium-*.py` 等。适用项目根目录的 MIT License，Copyright (c) 2026 MirrorLife。
- 七名人物：派生自本项目 `scripts/blender-build-civic-characters.py` 的原创角色与骨架。角色配置、面部法线与 LOD 在 `scripts/build-atrium-residents.py`。不是从第三方角色商店下载，也不是图生 3D 服务输出。
- 九段动作：本项目 `src/civic-animation-clips.js` 的关键姿势与本试点的楼梯、坐立、生活动作扩展。运行时采样同一套姿势；另交付可编辑 Blender 动作和 GLB 动作参考。
- 参考图：用户在本任务中选定的 AI 概念图，保存在 `design/references/atrium-visual-target.png`。仅作设计及对照依据，不作为运行时背景或人物贴片；不在此另行授予参考图许可。
- Three.js：来自项目已有 npm 依赖，MIT License，完整声明见 `THREE-LICENSE.txt`。
- Draco 解码器：原样复制自项目已安装的 `three/examples/jsm/libs/draco/gltf/`。上游为 Google Draco，Apache License 2.0；完整许可见 `APACHE-2.0.txt`。来源说明：https://github.com/google/draco 与 Three.js 对应目录 README。
- Rapier：复用项目已有 `@dimforge/rapier3d-compat`，包内声明 Apache-2.0。未替换物理引擎。
- Blender 和本机 Chrome 用于制作与验证，ffmpeg 用于实际浏览器录像的转码。这些工具不作为游戏资产打包。

没有调用收费素材库、远程角色生成、语音合成或外部剧情服务。人物、音效和对话的完成程度以验收报告为准，不以资产文件存在等同于质量通过。
