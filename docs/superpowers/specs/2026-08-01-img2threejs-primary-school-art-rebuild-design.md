# MirrorLife 初学堂 img2threejs 美术重构设计规格

**日期：** 2026-08-01  
**状态：** 已确认，等待实施  
**试点：** `primary-school-learning-loop-v4`  
**基线：** `ea9e7c82acb806ad83959e443265d5c97df29b68`（PR #25 merge）

## 1. 决策

本轮只重构“初学堂共学教室”这一栋建筑的室内垂直切片，建立一条可复制的
专业美术生产链。最终结果必须同时满足：

1. 玩家首先感到房间和人物好看、统一、值得接近；
2. 3D 场景保持可移动、可旋转、可环绕和真实碰撞；
3. “慢答共学”形成可理解的选择、动作和空间后果；
4. 桌面与移动浏览器在事先定义的预算内流畅运行。

本轮不批量扩展其余 25 个房间，不部署 Production，不通过降低门禁或使用
billboard、单张截图假面、隐藏真实空间来宣称完成。

## 2. 玩家承诺与非目标

### 玩家承诺

玩家进入初学堂后，应在 10 秒内理解当前目标，在 3–5 分钟内完成一次
“观察证据 → 邀请伙伴 → 共同动作 → 看见后果”的完整循环，并清楚解释：

> 因为我选择了某种共学方式，某个人改变了回应，问题墙也留下了可见证据。

### 非目标

- 不重建地图建筑精灵、道路或城市导航；
- 不清除全部 41 个室内模型的全局 release 欠账；
- 不把 img2threejs 尚未发布的环境、GLB、自动蒙皮或动画路线图能力视为现成功能；
- 不使用 MakeHuman、Mixamo 默认人物或现有积木角色继续堆装饰作为最终方案；
- 不自动部署 Production。

## 3. 选定工具链

| 阶段 | 工具 | 权威输出 |
| --- | --- | --- |
| 空间约束 | Blender 4.3.2 灰盒 | 固定尺寸、相机、深度、法线、对象遮罩 |
| 美术图片 | ComfyUI + FLUX.2 klein 4B + Krita paint-over | 经人工批准的 Art Target Pack |
| 程序化原型 | img2threejs v1.4.3，提交 `acd252c182ee3c48154f5f112d731a62aea2dea6` | assessment、detail inventory、sculpt spec、`THREE.Group` 候选 |
| 正式资产 | Blender 4.3.2、Geometry Nodes、Rigify、Python | editable `.blend`、母版 GLB、Web LOD、骨架、动作 |
| Web 优化 | glTF Transform、Meshoptimizer | Meshopt GLB、受控纹理和动画关键帧 |
| 运行时 | Three.js 0.185.1、GLTFLoader、AnimationMixer、Rapier 0.19.3 | 可行走场景、碰撞、动作、交互和渐进加载 |
| 真实门禁 | Puppeteer Core + 本机 Chrome | 四向截图、动作录像、加载和帧时间报告 |

ComfyUI 与 FLUX 工作流、模型哈希、seed、prompt、相机、参考文件哈希都要进入
provenance。img2threejs 工具本体下载到 `dist` 工作区，项目只提交固定版本、配置、
生成规格和批准证据，不把整个上游仓库复制进产品代码。

## 4. 美术图片生产

### 4.1 几何真值

现有 V3 运行时截图只用于记录问题和性能基线，不作为风格输入。先用真实
`primary-school` Blueprint 在 Blender 中建立简洁灰盒，输出固定相机的：

- 英雄视角；
- yaw 0/90/180/270；
- 俯视布局；
- 深度、法线、线稿、对象 ID 和材质 ID 图。

AI 只能在这些控制图上改变造型、材质和氛围，不能擅自改变房间边界、门宽、
主通道、交互净空和人物站位。

### 4.2 Art Target Pack

必须生产并批准以下图片：

- 1 张 16:9 室内英雄图；
- 4 张四向房间图；
- 1 张俯视构图图；
- 阅读角、共学桌、问题墙 3 张局部图；
- 阅读角、共学桌、课桌、低讲台、问题墙、分享角六类陈设的七视图；
- `player/listener/facilitator/mediator` 四名人物的正、侧、背、四分之三、A-pose、
  头手放大、表情和服装材质页；
- 1 张环境与四名人物同框的最终质量标杆图。

ComfyUI 生成后必须经过 Krita paint-over，清除透视错误、重复结构、融化边缘、
错误手指、无意义装饰和视图身份漂移。最终图片不能保留明显 AI 瑕疵。

### 4.3 图片美术门禁

Art Target 使用百分制：空间构图 20、造型统一 20、材质色彩灯光 20、人物吸引力
20、动作与接触设计 10、移动端可读性 10。总分必须不低于 85，任何单项不低于
75，并由用户完成最终方向批准。未通过时不得进入 img2threejs。

## 5. 统一美术语言

### 5.1 造型与色彩

- 方向为“温暖绘本电影感”，不是三头身玩具、塑料积木或半写实写实；
- 形体采用柔和梯形、圆角矩形和轻微不对称曲线；
- 大/中/小细节面积约 70/20/10；
- 家具真实倒角半径约 0.02–0.06m，不允许全场同一夸张圆角；
- 配色为 60% 暖纸与木色、30% teal/cornflower、10% coral/gold；
- 单画面只允许一个高饱和行动色；
- 不使用 inverted-hull；通过形体转折、明度差、接触阴影和少量 ink 五金建立轮廓。

### 5.2 材质与灯光

核心表面限制为哑光灰泥、温润橡木、编织布、软木、纸张、陶瓷和少量磨砂金属。
材质必须在 roughness、微表面、边缘响应和尺度上可区分，禁止用不同纯色共享同一
塑料响应。

白天以大窗柔光为主，暖色实用灯为辅，角色脸部保留独立柔光；四向脸部亮度中位数
不得低于场景 0.75 倍。灯光不能把人物和房间压成同一层黄褐色。

## 6. 初学堂空间与陈设

保留现有 L 形可走空间和四个功能区，但重新建立视觉层级：

- 入口准备区：木框玻璃门、低储物柜、换鞋凳和当天问题提示；
- 阅读慢答区：窗边阅读榻、书架、织物座椅和落地灯；
- 中央共学区：低矮椭圆桌，具有四个清晰站位和答案卡插槽；
- 问题发现区：软木、纸张、木轨和可变化卡片构成的故事墙；
- 低讲桌位于侧面，教师也属于共学圆环；
- 顶部增加木梁、吸音软板和柔和吊灯；
- 地面用地毯、木材方向和局部嵌条分区，取消大片青绿色墙裙。

房间由建筑套件和独立互动件组装，不烘成一个不可维护的单体网格。门、抽屉、
卡片槽、椅子和手持物保留独立 pivot/socket，碰撞使用低复杂度代理。

## 7. 人物、骨骼与动作

- 成人约 5.25 头身，儿童约 4.25 头身；
- 四名核心角色共享一套正式 deform skeleton；
- 面部具有额头、眉弓、鼻梁、嘴唇和下颌连续体积；
- 头发由大块发型、方向性发束和少量轮廓碎发组成，禁止球壳头发；
- 肩、胸、骨盆、肘膝和手脚使用连续拓扑；
- 服装包含领口、门襟、袖口、褶皱方向和受力关系；
- 每名角色输出 LOD0/LOD1/LOD2，三角面上限为 35k/12k/3k，最多四套材质；
- 标准动作是 `idle`、`walk`、`listen`、`respond`，玩法动作是 `place-card`；
- 动作原地播放，根节点负责世界移动；GLB 使用 AnimationMixer 交叉淡化；
- 保留并扩展手部接触锚点：`CardGrip_L`、`CardGrip_R`、`DeskWrite`、
  `ListenerFocus`。

四个核心角色 × 四个核心动作 × 四个 yaw × 每段 6 秒，共 64 段发布证据。

## 8. “慢答共学”玩法

状态流固定为：

```text
ARRIVAL → DISCOVERY → INVITATION → CHOICE → SHARED_ACTION → CONSEQUENCE → COMPLETE
```

1. 玩家进入后看到问题墙和中央空答案卡；
2. 在阅读角、课桌和低讲台发现三段关于“害怕答错”的证据；
3. 邀请学习伙伴，选择“示范不完整答案”“邀请对方慢慢说”或“拼出第三种答案”；
4. 两名角色执行 listen/respond/place-card；
5. 问题墙新增对应结果卡，角色信任、记忆和回应发生可见变化；
6. 玩家可以解释自己的动作与世界变化之间的因果。

阅读、剧情卡和选择期间继续持有世界时钟；返回实时探索才恢复。

## 9. 数据与运行时接口

### `ArtDirectionProfile`

```js
{
  version: 1,
  styleId: "mirrorlife-storybook-cinematic-v1",
  palette: { paper, ink, teal, coral, gold, cornflower, oak },
  shapeRules: { bevelMeters: [0.02, 0.06], detailRatio: [70, 20, 10] },
  materials: { plaster, oak, textile, cork, paper, ceramic, metal },
  lighting: { faceSceneMedianRatio: 0.75 },
  characters: { adultHeads: 5.25, childHeads: 4.25 },
  forbidden: ["billboard", "inverted-hull", "generic-plastic", "shell-hair"]
}
```

### `InteriorPilotAssetManifest`

```js
{
  version: 1,
  pilotId: "primary-school-v4",
  styleId: "mirrorlife-storybook-cinematic-v1",
  sourceTool: { name: "img2threejs", version: "1.4.3", commit: "acd252c182ee3c48154f5f112d731a62aea2dea6" },
  artTargetHash: createSha256(approvedArtTargetFiles),
  masterFile: "assets/interior-masters/primary-school-v4/primary-school-v4.blend",
  lods: {
    desktop: "public/assets/interiors/pilots/primary-school-v4/architecture-desktop.glb",
    mobile: "public/assets/interiors/pilots/primary-school-v4/architecture-mobile.glb"
  },
  colliders: [],
  sockets: [],
  reviews: { art: "approved", geometry: "passed", runtime: "passed", performance: "passed" }
}
```

`artTargetHash` 在实施时由批准图片确定；清单不得使用空值进入 `promote`。

### `PrimarySchoolScenarioStateV1`

```js
{
  version: 1,
  step: "arrival|discovery|invitation|choice|shared-action|consequence|complete",
  evidenceIds: [],
  choiceId: "",
  consequenceId: "",
  completedAt: 0
}
```

旧存档缺少该字段时安全初始化。候选通过 `?interiorScene=primary-school-v4` 进入；
任何资源、骨骼或场景初始化失败时原子回退 V3，不能出现新旧混装。

## 10. 性能与浏览器门禁

性能是 `promote` 前的硬门禁：

| 指标 | 桌面 | 移动 |
| --- | ---: | ---: |
| Interactive Ready P95 | ≤2.5s | ≤4s |
| 暖进入 P95 | ≤800ms | ≤1.2s |
| Full Ready P95 | ≤6s | ≤8s |
| Interactive 后新增传输 | ≤8MB | ≤6MB |
| 完整场景 triangles | ≤400k | 软预算≤225k，硬上限≤250k |
| draw calls | ≤145 | ≤110 |
| 帧时间 P95 | ≤20ms | ≤25ms |
| >33ms 帧 | <1% | <1% |
| 单 Long Task | ≤200ms | ≤200ms |
| Interactive 前总阻塞 | ≤500ms | ≤500ms |

真实 Chrome 连续运行 10 分钟，完成移动、四向旋转、阅读、选择和全部核心动作；
浏览器错误、WebGL context loss、持续内存增长和阶段反复替换均为 0。

优化顺序固定为：不可见细分/内部面 → 材质和纹理合并 → InstancedMesh →
Meshopt → 分阶段加载 → 语义 LOD → GPU 上传调度。不得先删除有玩法意义的物件、
人物身份或自由旋转能力。

## 11. 分层验收

1. **Art Gate：** 图片总分 ≥85、单项 ≥75、用户批准；
2. **Asset Gate：** editable master、七视图、360°、0 non-manifold、0 open boundary；
3. **Character Gate：** 64 段录像，脚滑 ≤2cm、鞋底离地 ≤1.5cm、手物穿插 0；
4. **Spatial Gate：** 8 个试点状态 + 208 状态回归，0 blocked，站位修正 ≤0.15m，
   anchor 修正 ≤0.25m，主通道 ≥1.4m，交互净空 ≥0.9m；
5. **Performance Gate：** 第 10 节全部通过；
6. **Gameplay Gate：** 5/5 首次玩家 10 秒内指出目标，4/5 能解释因果，3/5 愿意重试；
7. **Release Gate：** check、build、physics、character exploration、scene flow、
   78 transitions、characters civic、runtime integrity 全绿。

V3/V4 匿名对照中至少 4/5 更愿意探索 V4、认为环境人物统一并更愿意接近角色；
不得出现“积木拼装”“塑料玩具”或“空旷样板房”的多数结论。

## 12. 交叉评审与停止规则

- 玩家/产品反方：美术提升可能掩盖目标不清；用首次玩家目标识别和因果复述证伪；
- 游戏设计反方：选择可能只是换文案；用动作、人物状态和问题墙永久变化证伪；
- 美术反方：AI 图片多视图会身份漂移；用固定灰盒、paint-over 和七视图审核证伪；
- 工程反方：高质量模型可能延后 Interactive；用分阶段资源和真实 P95 证伪；
- QA 反方：候选失败后可能出现新旧混装；用原子 profile 和失败注入测试证伪。

同一结构方向连续三次不能同时满足美术、空间和性能条件时停止扩展，保留最佳
安全候选和量化阻塞报告。任何既有硬门禁或玩家体验轴下降时回退 V3，不通过修改
文案、阈值或单张截图继续循环。

## 13. 发布边界

本里程碑结束于：Art Target、初学堂 V4 候选、四名角色、玩法、8/208 状态证据、
64 段动作证据、性能报告和面向 main 的 Preview PR。未通过用户美术审核前保持
候选入口；不部署 Production。通过试点后，care、work、commerce 和其余房间分别
进入后续独立目标。
