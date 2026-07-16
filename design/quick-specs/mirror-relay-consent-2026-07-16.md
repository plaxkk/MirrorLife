# Quick Design Spec: 镜像接力 · 同意制好友分身

**Type**: New Small System

**Scope**: 在现有「双线回声」终章后增加一条无需账号或后端的双向接力：邀请者生成最小化问题链接，好友明确同意后用一次性分身回应，再把回应链接交还；邀请者二次同意后才允许好友分身进入下一集。

**Date**: 2026-07-16
**Estimated Implementation**: 3–5 days

## Overview

「镜像接力」把单人分享卡变成一个真实的人际回路。它不复制好友完整人格，不上传历史记忆，也不默认建立关系；双方每一次跨设备动作都有明确同意点。链接只携带完成这一次社会选择所需的最少字段，因此当前纯前端版本也能完成邀请、回应、回流、Agent 入场和撤回。

目标情绪：

```text
被邀请的好奇 → 看懂边界 → 自主同意 → 留下不同答案 → 被世界认真接住
```

完整循环：

```text
终章提出未解决问题
→ 邀请者生成最小化邀请链接
→ 好友阅读数据边界并同意或拒绝
→ 好友选择一个价值和一个回应
→ 好友生成回流链接
→ 邀请者再次同意“保存”或“让分身入场”
→ AI 剧情师把价值差异变成下一集任务
→ 邀请者可以随时移除好友分身
```

## Core Rules

1. **双重同意**
   - 好友打开邀请链接时，必须先看到共享字段与明确排除字段。
   - 邀请者收到回应后，必须再次选择“加入下一集”或“只保存回应”。
   - 任一方拒绝都不产生通知、Agent、长期档案或世界状态变化。

2. **最小数据**
   - 邀请链接只包含：邀请 ID、邀请者昵称、故事线、问题、两个候选回应、邀请者在此问题上的倾向。
   - 回应链接只增加：好友自定昵称、一个价值标签、一个回应、一个稳定头像帧。
   - 禁止写入：真实姓名、自由文本现实经历、长期记忆、关系历史、设备标识、定位、存档或浏览记录。

3. **一次性分身**
   - 好友回应阶段只生成这一道问题的临时分身，不创建本机长期玩家档案。
   - 邀请者同意入场后，才把回应转成一个 `mirror-relay-guest` 社会 Agent。
   - Agent 只携带昵称、价值、回应和该问题；其他人格字段由安全默认值推导。

4. **世界影响**
   - 新 Agent 进入邻里广场，并收到一条有期限的剧情师任务。
   - 邀请者与好友选择不同，剧情师优先产生“价值差异仍能共同行动”的任务；选择相同，则产生“相同答案背后的不同理由”任务。
   - 入场写入 Agent inbox、双方记忆、关系证据、社会事件与剧情师 relay 记录。

5. **撤回**
   - 剧情志和安全边界都必须显示已加入的好友分身。
   - 邀请者可随时移除；移除后 Agent 从世界、调度 inbox 和关系中消失，但保留一条“已撤回”审计状态，避免刷新后复活。

6. **链接完整性**
   - 数据使用 UTF-8 JSON + Base64URL，并附稳定校验值，拦截截断或意外篡改。
   - 校验值不是身份认证；界面不得宣称链接不可伪造。
   - 解码后的字段按白名单、长度、枚举重新归一化，所有动态文案输出前转义。

## Tuning Knobs

| Knob | Default | Range | Category | Rationale |
| --- | --- | --- | --- | --- |
| `MIRROR_RELAY_PAYLOAD_VERSION` | `1` | fixed | compatibility | 明确未来升级与拒绝未知版本 |
| `MIRROR_RELAY_URL_MAX_LENGTH` | `4200` | `1800–6000` | safety | 兼容主流分享渠道并限制滥用 |
| `MIRROR_RELAY_ALIAS_MAX` | `20` | `8–32` | privacy | 保持可读且减少意外暴露 |
| `MIRROR_RELAY_MAX_RESPONSES` | `12` | `4–24` | storage | 防止本地存档无限增长 |
| `MIRROR_RELAY_GUEST_MISSION_TURNS` | `16` | `8–32` | pacing | 足够产生 2–4 次自主行动，不永久绑架剧情师 |

这些值使用命名常量，当前规模低于独立数据文件阈值。

## Visual Specification

视觉母版：方案 2「同一个你，两种被记住的方式」。

- 同意态：[mirror-relay-consent.png](../../docs/design/mirror-relay-consent.png)
- 回应态：[mirror-relay-response.png](../../docs/design/mirror-relay-response.png)
- 回流态：[mirror-relay-return.png](../../docs/design/mirror-relay-return.png)

设计系统：深夜墨蓝编辑顶栏、暖象牙开放书页、珊瑚与玉绿双线、金色关系中缝、真实 3D 房间和三人社会场景。禁止改造成隐私设置页、好友列表或 SaaS 弹窗。

允许的首屏文案严格来自三张视觉母版。功能必需但母版未展示的昵称输入使用标签“这次怎样称呼你”，不增加说明卡或装饰性标签。

## Affected Systems

| System | Impact | Action Required |
| --- | --- | --- |
| 双线回声终章 | 新增真人接力主行动 | 保留故事卡并将接力提升为主要传播闭环 |
| URL 状态 | 编码邀请与回应 | 新增白名单解析、校验、消费与清理 |
| 本地存档 | 保存已发邀请、回应、撤回状态 | 新增向后兼容 `mirrorRelay` 归一化 |
| 多 Agent | 好友回应转为可调度 Agent | 新增 guest 创建、记忆、inbox 与移除 |
| AI 剧情师 | 把价值差异变成下一集戏剧问题 | 保存 relay 证据并排入限时任务 |
| 安全边界 | 展示共享字段与撤回入口 | 增加 relay 审计区 |

## Acceptance Criteria

- [x] 完成 host → friend consent → friend response → host import → guest Agent 的真实双浏览器闭环。
- [x] 好友拒绝时不写 localStorage、不生成回应、不通知邀请者。
- [x] 邀请和回应 payload 均不包含 profile、memory、relationship、device 或 location 字段。
- [x] 无效校验、未知版本、超长 payload 会被拒绝且不会执行动态 HTML。
- [x] 邀请者选择“只保存回应”时不生成 Agent；选择“加入下一集”时只生成一个幂等 guest。
- [x] guest 获得剧情师任务、长期记忆与关系事件，随后能被现有 Agent 调度器观察和演化。
- [x] 移除 guest 后刷新不会复活，相关定向 inbox 同时清除。
- [x] 桌面 `1536 × 1024` 与移动 `390 × 844` 三态无横向溢出、无关键文案或操作裁切。
- [x] 键盘 Escape 可退出；同意、价值、回应、加入与移除均为语义化可聚焦控件。
- [x] No regression: 双线选择、五地点终章、分享卡、室内物理和 Agent 自演化验证继续通过。

验证证据：`scripts/verify-mirror-relay.mjs` 使用两个隔离浏览器身份完成邀请、同意、回应、回流、入场、移除和刷新检查；截图与 manifest 输出到 `dist/interior-3d-work/mirror-relay-review/`。

## Systems Index

当前项目没有 `design/gdd/systems-index.md`。该系统横跨传播、同意和 Agent，但仍是一个有界的单集扩展；本 Quick Spec 足以支撑本轮垂直切片。若后续加入服务器回传、实时好友在线状态或账号身份认证，应升级为完整网络社会系统 GDD。
