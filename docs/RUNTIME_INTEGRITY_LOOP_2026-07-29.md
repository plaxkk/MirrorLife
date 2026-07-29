# 真实运行时完整性 Loop（2026-07-29）

## 起点与范围

- 分支：`codex/runtime-integrity-loop`
- 起点：`390e34342cd118d74d11f42354da753343164835`（PR #16 merge）
- 未部署 Production；Production 只做了全新浏览器只读导航测量。
- 证据根目录：`dist/interior-3d-work/` 与 `dist/runtime-integrity/`（本地生成，不作为产品资源提交）。

## 本轮已落地

### 真实 runtime 门禁

`verify:interior-runtime-integrity` 直接进入浏览器实际 `getInteriorBlueprint`、`getInteriorPhysicsItems`、Rapier world 与 Three scene，不再把 `createItems` 合成结果当运行时事实。每个状态记录：

- runtime Blueprint 来源、布局来源、actor staging 与静默修正；
- authored/resolved interaction anchor、主通道和交互净空；
- 实际 collider 与 GLB 世界包围盒重合度/中心漂移；
- 真实 GLB 顶点投影、三角簇遮挡、相机位置与目标身体可见度；
- draw calls、triangles、Progressive 阶段和浏览器错误；
- 逐状态 JSON 与 JPEG，以及持续写入的 partial manifest。

最终矩阵固定为 26 房间 × desktop/mobile × yaw 0/90/180/270，共 208 状态。QA 模式禁用与页面销毁并发的 `compileAsync`，修复 Three `currentProgram.isReady` 假红；正常玩家路径仍保留后台 shader warmup。

### 空间、物理与因果

- 20 个通用环形 fallback 改为 8 套按米创作的 gameplay archetype 平面契约。
- 26 房间 staging 全部显式创作；真实 runtime 站位从 42 blocked 降至 0。
- 保留 authored `extraColliders`，结构 collider 不再伪装成可交互物。
- interaction anchor 通过实际导航路径解析；最大修正 0.22m。
- 室内、剧情卡和选择 modal 持有世界时钟；退出最后一个 hold 后恢复进入前运行状态，HUD 明示原因。
- 完整 60 秒门禁：室内周次 `0 → 0 → 1`，选择 modal `1 → 1 → 2`。

### 地图、移动 UI 与统一风格

- sprite atlas 单元采用整数裁切与缓存 12px 透明安全边。
- 地图人物实时避让建筑、标签、玩家和其他人物，最小 8px；局部聚集上限 2。
- 390×844 选择按钮完整可见，实测 346.75×55.44px；文字对比 13.70:1 / 20.21:1。
- 新增 [Runtime Art Bible](./RUNTIME_ART_BIBLE.md)，统一主色、轮廓、形状、字体、灯光、空间和性能规则。
- 移动端公共空间保留展示柜、见证墙/公告语义，并用真实 3D 几何 LOD 减少亚像素倒角；住宅书架 LOD 保留框架、层板和书脊，不使用 billboard。

### 核心模型

bed、workbench、plant-zone、reading-corner 均有：

- native editable `.blend`；
- 独立高精 master GLB 与 runtime Web LOD；
- 自动 topology audit；
- 8 向 512px 正交 canonical renders；
- 实际模型与 master/runtime 几何：

| 模型 | Master tris | Runtime tris | Non-manifold / open edges |
| --- | ---: | ---: | ---: |
| bed | 12,056 | 7,460 | 0 / 0 |
| workbench | 10,936 | 6,764 | 0 / 0 |
| plant-zone | 127,540 | 48,188 | 0 / 0 |
| reading-corner | 40,420 | 27,940 | 0 / 0 |

四个 runtime 文件相较旧版合计减少约 3.9MB。canonical renders 已人工检查多向轮廓、隐藏面和语义部件，但没有独立创作参考来源与外部批准，因此仍诚实保持 `development`，未改 manifest 文案冒充 release-ready。

## 验收结果

### 通过

- `npm run check`
- `npm run build`
- `verify:interior-physics`：26 zones / 10 archetypes
- `verify:interior-character-exploration`：行走 2.85m、旋转 65.3°、体积眼睑 blink
- `verify:interior-transitions`：78 次，0 失败、0 runtime error，阶段仅 `loading → ready`
- `verify:interior-scene-flow`：desktop/mobile
- `verify:characters:civic`：4 roles，真实 skin/weights/GLB 通过
- `verify:borderless:interior-entry-race`：真实 physics/Three chunk 均被拦截并正确恢复，输入移动 0.023m
- 世界时钟 60 秒因果门禁
- 地图 sprite、10 秒动态避让、移动选择人体工学门禁
- Preview 全新浏览器 10/10：FCP P50/P95 480/784ms；DOM Complete P50/P95 1269.8/1598.3ms
- Production 全新浏览器 10/10 可导航（只读）：FCP P50/P95 1820/5416ms；DOM Complete P50/P95 4314.2/14468.5ms

### 最终 208 状态

最终 build 生成 208/208 状态：175 通过、33 失败、0 warning、0 browser error。33 项全部是 player/current-target 身体可见度未达 85%；没有状态执行超时，也没有空间、碰撞、锚点、通道或性能预算失败。相较本轮首个完整矩阵的 107 failing states，以及结构修正中间矩阵的 59 failing states，最终降至 33。

已确认的空间/资源边界（完整矩阵可执行状态）：

- blocked staging：0
- 最大静默站位修正：0m
- 最大 anchor 修正：0.22m
- 最小交互净空：0.9479m
- 最小主通道：2.0609m
- desktop 最大：374,003 triangles / 137 draws
- mobile 最大：约 196k triangles / 91 draws（低于 225k 软预算）

### 未通过 / 阻塞

1. **四向人物可见度**
   完整矩阵仍有跨房间的侧/后视人物裁切；三轮镜头结构尝试后，极端 desktop yaw180 有明显改善，但移动窄视场仍未稳定达到 player + current target ≥85%。继续偏移焦点会使玩家遮挡硬轴下降，按停止规则已回退该偏移并停止扩展。

2. **核心模型 release gate**
   四个优先模型已具备真实几何、editable master、topology 与 canonical renders，但缺少独立参考 provenance 和外部批准。其余 37 个 exact GLB 类型仍有大量 placeholder/master/reference 缺口，counter/shelf 的历史 non-manifold 也未在本轮扩展。因此 `verify:interior-3d:release` 仍 exit 1；没有放宽规则。

3. **入口 warm cache / Full Ready**
   `verify:interior-entry-performance` 在首个 desktop 样本中发现 warm cache 被驱逐：资源估算 28.6MB，但冷进入后 JS heap 增量约 262MB，超过 160MB runtime 阈值。未抬高阈值。冷/暖 P95 与 Full Ready 10 样本硬门禁因此未完成。

4. **帧时间**
   实际 Chrome/AMD 测量：desktop 337,263 tris / 137 draws，mobile 195,939 tris / 90 draws；但 desktop frame P95 100ms、mobile P95 50ms，desktop 最长 Long Task 3.686s，未达到 20/25ms 与 200ms 门禁。

5. **角色 64 段录像证据**
   现有 runtime 门禁验证真实行走、转向、blink、footPlant/接触/连续形变契约和四向静态可见性；尚未生成每个核心角色 4 动作 × 4 方向 × 6 秒的完整 64 段发布录像及脚滑/面光逐段报告。

6. **Production 网络长尾**
   Production 10/10 能导航，但 FCP/DOM P95 超 1.8s/3s。Preview 同代码本地样本通过，Production 只读测量出现 5.416s FCP、14.469s DOM 最大值；本轮未获授权、也未执行 Production 部署。

## 停止规则与交接

- care、factory、commerce 分别保留三轮内的最好安全状态；public 四向保持 8/8。
- 对同类镜头结构已完成三轮尝试，未继续通过扩大 FOV、隐藏家具或牺牲可走/可旋转能力追单张截图。
- 下一轮应先解决人物 staging/动态目标与窄屏相机的联合 fit，以及公共空间 shader/GPU Long Task；在此之前不应把 release gate 或性能阈值改松。
