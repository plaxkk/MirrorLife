# 林晓肩点内移实验：两版候选均未安装

本文记录 2026-10-14 在 `codex/dialogue-tailoring` 上做的一轮肩袖候选实验。**结论：两版候选都不安装，正式资产未改动。** 本轮的实际产出是一个量化边界条件和一个新发现的前置依赖，不是质量提升。

它与 `ATRIUM_SHOULDER_STUDY.md`（2026-09-23）、`ATRIUM_SLEEVE_CAP_STUDY.md`（2026-09-24）、`ATRIUM_GARMENT_PANEL_STUDY.md`（2026-09-24）是同一问题的延续。实验前未先检索这三份既有判决，重复走到了它们已经关闭的路径上；本文因此明确标注哪些结论是既有、哪些是本轮新增。

## 1. 已成立的既有判决（不是本轮发现）

- `ATRIUM_SHOULDER_STUDY.md`：局部缩放不能解决上胸到领口的硬壳形状，不应继续微调系数。
- `ATRIUM_SLEEVE_CAP_STUDY.md`：单改袖山无法消除开衫外壳与`SkinnedArmVolume`内层在肩部的拼装感，下一步应设计两层之间的实际连接与蒙皮。
- `ATRIUM_GARMENT_PANEL_STUDY.md`：改用可编辑四边形衣装笼后凹肩消失、抬臂拉伸改善，但腋下仍夹折、内搭过平。

本轮两版候选分别撞在上述第二、第三条上，属可预期的重复。

## 2. 量化根因（本轮新增）

林晓角色档为 `listener`（`shoulder_x .198`、`arm_width .77`、`arm_depth .80`、`body .96`）。当前正式构建里：

```
profile['shoulder_x'] = .198 × .96 × 1.08 + .07 = .2753
```

而四边形衣装笼躯干最宽一行（`scripts/atrium-garment-panels.py` 的 `sections`）半宽只有 `.217`。袖管起点因此在躯干外缘之外约 **58mm**；叠上 `arm_width=.77`，上臂处袖管 x 半径约 `.0616`。

把一个 1.75m 身高的人物按这个值展开，两臂总跨度约 0.66m —— 与实拍读到的"圆球 + 两段拼接"一致。这是缺陷的数值来源，不是主观印象。

由此得到一条硬约束：**袖管第一环必须落在袖窿边缘（x≈.217）之外**。在既有 45° 袖山倾角下要求 `shoulder_x ≥ .259`，即使把倾角压到 π/9 也仍需 `≥ .2466`。所以单靠袖山截面表无法把手臂收进躯干轮廓 —— 这条独立佐证了 2026-09-24 的结论。

另查明 `+=.07` 这一项本身是对另一个问题的补偿（绑定姿势下前臂与腰部体素并集粘连，短边被拉伸超过 16 倍）。因此不能把它当成纯粹的"肩太宽"直接抹掉：在 z=.895 处若均匀内移，袖管内缘会落到约 `.169`，而躯干半宽 `.188`，产生约 19mm 自穿。内移必须与腰身、内搭一起解。

## 3. 两版候选与拒绝理由

两版都由环境变量 `ATRIUM_LIN_SHOULDER_STUDY` 控制，只在 `tmp/` 隔离目录内生成，公开资产未受影响。

| 版本 | 改动 | 结果 |
| --- | --- | --- |
| cap-only (`=1`) | 只重排袖山前三环截面，肩点不动 | 否决。第一环必须让开 x≈.217 的袖窿边缘，被迫做成陡的两环落差，SUBSURF 读成折痕：侧视出现鼓起的泡泡袖脊线，比基线更差 |
| pivot-in25mm (`=2`) | 同时把 `shoulder_x` 补偿项由 `+.07` 改为 `+.045`，即肩点内移 25mm | 否决。侧影球状外扩明显减弱、背面轮廓更连续，方向正确；但内搭层在两侧肘部穿出开衫袖管，呈奶白色楔形 |

pivot 版的穿透由 4× 放大裁剪确认：同一机位下，`baseline/outer-arm-4x.png` 上臂外侧干净，`pivot-in25mm/outer-arm-penetration-4x.png` 出现浅色楔形。这是本轮唯一真正新增的数据点。

## 4. 新发现的前置依赖

既有四边形衣装笼结构下，**任何向内的肩点移动都必须同时解决内搭面板与袖管的间隙**，否则内搭（奶白）会从开衫袖管穿出。这不在前述三份文档的结论里，是继续推进肩袖必须一起处理的条件。

## 5. 本轮未声称的

- 未提升任何生产美术质量，正式林晓资产指纹未变。
- 未验证真实玩家路线下的观感（候选只在隔离光照的静态阵列机位拍摄，未走完整进出/对话路线）。
- 未解决腋下夹折、内搭过平、衣料褶皱，也未触及手、发、领口和场景。

## 6. 证据与复现

- 对照页：[肩点内移对照](../evidence/atrium/shoulder-pivot-study/index.html)（baseline / cap-only / pivot-in25mm 三向 + 4× 放大）。
- 逐张记录：`evidence/atrium/shoulder-pivot-study/{baseline,cap-only,pivot-in25mm}/report.json`。`report.json` 的 `scope` 已声明这些是隔离光照的静态阵列机位，不含真实输入、移动端与性能验证。
- 复现：`ATRIUM_RESIDENT_IDS=lin ATRIUM_BUILD_ROOT=tmp/<study> ATRIUM_GARMENT_PANELS=2 ATRIUM_CARDIGAN_STUDY=2 ATRIUM_SLEEVE_CAP_STUDY=2 ATRIUM_HAND_ATLAS_STUDY=1 ATRIUM_SHOE_FORM_STUDY=1 ATRIUM_LIN_SHOULDER_STUDY=1|2` + `Blender --background --python-exit-code 1 --python scripts/build-atrium-residents.py`，再用 `ATRIUM_CAST_CANDIDATE` 做单模型替换拍摄。

## 7. 源码状态

`scripts/atrium-garment-panels.py` 与 `scripts/build-atrium-residents.py` 中各留一个受 `ATRIUM_LIN_SHOULDER_STUDY` 闸门控制的分支，默认路径不读取该变量：`os.environ.get(...)` 在未设置时返回 `None`，`None in ('1','2')` 为假，`{'2':.045}.get(None,.07)` 取回原值 `.07`。这是按构造成立的不变式，与构建是否可复现无关。

实测确认（同配方各重建一次，仅区别在这两个脚本是否含本轮分支）：

| 产物 | 含分支 | 用 HEAD 脚本 | 当前正式资产 |
| --- | --- | --- | --- |
| `lin.glb` | 23789 面，bbox `[-0.298085,-0.333336,-0.434296]..[0.480579,1.334751,0.232284]` | 23789 面，bbox 同上 | 23789 面，bbox 同上 |
| `lin-mobile.glb` | 21393 面，bbox 同上（z min `-0.435267`） | 21393 面，bbox 同上 | 21393 面 |

保留分支是为了让下一轮可以在不重写实验脚手架的前提下接着做；如果确定不再走这条路线，可直接删除这两个分支，删除后默认行为不变。

**注意：不能用文件 SHA 判断这轮改动是否影响产物。** 同一配方连续两次重建得到的 `lin.glb` SHA 就不同（顶点数 22700 / 22704 / 22702 飘动），面数与包围盒完全一致。导出器的顶点去重不稳定，字节级比对在本仓库对这类改动无效。

## 8. 下一步

不要继续在袖山截面表上试系数。按 `ATRIUM_SLEEVE_CAP_STUDY.md` 的判决，需要的是**开衫外层与袖管的实际连接及其蒙皮**；在此之上，肩点内移必须与内搭面板间隙一起设计，否则会像本轮一样把肩部缺陷换成肘部穿透。
