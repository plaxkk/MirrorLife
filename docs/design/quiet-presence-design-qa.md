# 静默陪伴设计 QA

## 已证明

- 静心角会把稳定选中的 Citizen 放入当前室内 occupant 集合。
- 物件证据最多只计两条，第三次点击不会完成房间。
- 仪式使用人物与玩家的 X/Z 坐标计算视线和距离，而不是单纯前端读条。
- 真实拖动镜头后，视线失配且已获得的进度缓慢回落。
- 从任务卡重新聚焦人物时保留已有进度，不会把温和恢复误做成惩罚重置。
- 完成后房间从仪式阶段进入原有的事实/如果场景，关系、记忆和体验证据均有写回。
- 刷新后仪式保持完成，不会重新阻断房间路线。

## 视觉证据

- `dist/interior-3d-work/quiet-presence-review/desktop-quiet-presence-active.png`
- `dist/interior-3d-work/quiet-presence-review/desktop-quiet-presence-complete.png`
- `dist/interior-3d-work/quiet-presence-review/mobile-quiet-presence-active.png`
- `dist/interior-3d-work/quiet-presence-review/manifest.json`

## 仍需真人证明

自动化能证明空间判定和状态写回，但不能证明「停下来」本身有情绪张力。真人测试必须记录：是否看懂安全距离、是否因进度回落感到困惑、八秒是否像陪伴而非人机验证、完成后能否说出居民发生了什么。
