# MirrorLife 2D 头像到 3D 社会分身管线

## 设计判断

MirrorLife 不应把每张 2D 头像交给单图生成器直接产出一个彼此不兼容的 3D 模型。那种做法正面视角可能相似，但侧脸、背面、骨架、服装分层、表情和碰撞尺寸不可控，进入同一房间后会产生明显的“AI 拼装感”。

推荐方案是“共享骨架 + AvatarDNA + 少量英雄级定制件”：

- 2D 头像仍是身份来源，用于提取脸型、肤色、发型轮廓、主服装、身份配件和配色。
- 所有人共享同一套 1.72m 米制骨架、动作状态机和胶囊碰撞体。
- `AvatarDNA` 只组合经过美术验收的头型、五官、发型、服装和配件模块。
- 只有剧情主角、关键 NPC 和高传播角色使用独立雕刻的英雄级头发、服装与表情修型。
- 2D UI 肖像由同一 3D 角色在固定灯光、镜头和表情下反向渲染，保证 UI 与世界中的角色永远是同一个人。

## 身份保真优先级

玩家通常按以下顺序认人，制作预算也应按此排序：

1. 发型外轮廓和头部比例。
2. 服装主色块与职业配件。
3. 肤色、眼型、眉形和嘴型。
4. 体型、站姿和动作节奏。
5. 细小纹理与饰品。

当前 Web 版本已完成两个阶段：

- `ACTOR_STYLE_PROFILES` 仍为普通居民提供 8 个头像帧到不同发型、脸部、服装、背包和随身物的兼容映射。
- 议事厅纵切已使用四个真实 GLB：玩家、倾听者、引导者和调解者。它们由 `scripts/blender-build-civic-characters.py` 从同一米制模板生成，遵守 `mirrorlife-shared-pivot-v1`，并由 `public/assets/characters/civic/manifest.json` 记录三角面与角色契约。

运行时会懒加载 GLB、校验头部与四肢枢轴，加载完成前不揭示最终房间；异常时才退回程序化角色。四个角色已经进入真实灯光、遮挡、阴影、碰撞、WASD 移动、跳跃和环绕镜头系统。它们是可玩的共享骨架资产基线，但仍未达到最终的面部变形、手部拓扑、布料褶皱和手工动作质量。

## AvatarDNA 合同

后续应把帧索引升级成版本化数据，而不是继续写死在渲染器中：

```ts
type AvatarDNA = {
  version: 1;
  sourcePortraitId: string;
  bodyPreset: "slim" | "regular" | "soft" | "broad";
  headPreset: string;
  skinTone: string;
  hair: { meshId: string; color: string; accessoryIds: string[] };
  face: { eyePreset: string; browPreset: string; mouthPreset: string };
  outfit: { topId: string; bottomId: string; shoeId: string; palette: string[] };
  identityProps: string[];
  motionProfile: "reserved" | "open" | "precise" | "energetic";
};
```

`AvatarDNA` 只描述身份，不拥有世界位置、关系或剧情裁决权。角色位置仍由物理世界控制，社会行为仍由 Agent/世界裁决器控制。

## 生产流程

1. **头像归一化**：统一正面角度、裁切、光照和色彩，人工确认发型遮挡与配件。
2. **特征提取**：模型只生成 AvatarDNA proposal；美术规则负责把结果限制到批准的模块库。
3. **模块装配**：在 Blender 中使用同一骨架、脚底基准、材质通道和命名规范批量装配。
4. **风格化修型**：保留插画夸张点，避免追求照片写实；重点修正侧脸、后脑、刘海和服装轮廓。
5. **动作验收**：idle、walk、run、jump、land、push、interact、listen、sit 全部检查穿插与脚滑。
6. **运行时优化**：导出 glTF/GLB，Meshopt 压缩，纹理合图；同一骨架共享动画，远处使用 LOD。
7. **肖像回渲**：从最终模型生成 UI 头像和分享卡肖像，替换旧的独立 2D 身份源。

## 质量与性能门槛

- 普通角色 20k–35k 三角面，英雄角色 45k–70k；移动 LOD 8k–15k。
- 单角色 1 套骨架、1–2 张 1K 合图，材质不超过 3 个 draw calls。
- 正面、45°、侧面和背面都能由 5 名测试者中至少 4 人认出对应头像。
- 头发、袖口、背包与身体在完整动作集中不发生持续穿插。
- 脚底漂移小于 0.03m，角色身高和碰撞体不得因外观模块改变。
- 肤色和服装色在室内全部灯光预设下保持可辨认，不依赖 UI 名牌认人。

## 推荐迭代顺序

1. 先制作玩家、社会分身、议事厅三名关键居民共 5 个英雄角色。
2. 用这 5 个角色验证“头像识别—3D 行走—对话特写—分享卡回渲”的完整闭环。
3. 再扩展 12 种发型、4 种体型和职业服装模块，覆盖普通 NPC。
4. 最后接入受约束的单图特征提取；生成模型只能提出 AvatarDNA，不可直接上传未经验证的网格到正式世界。
