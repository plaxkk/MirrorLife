# MirrorLife 心理连锁反应框架(Psych Ripple Framework)

> 目标:用户注册身份人格后,向城市投入一个现实事件,系统按社会心理学与个体心理学的可解释框架,自动产生一条"评估 → 应对 → 场所 → 社交 → 涟漪"的连锁反应,覆盖 **与人的交互、与空间建筑的交互、自身行为动作** 三个层面。

## 总览:连锁链条

```text
注册(人格档案)
   │  MBTI原型 → 大五人格 → 依恋风格 → 人际风格 → 应对风格档案
   ▼
现实事件输入(镜像舱)
   │  认知评估 appraiseLifeEvent()          [Lazarus & Folkman 认知评估理论]
   │  效价 × 强度 × 领域 → 需求冲击 + 情绪冲击
   ▼
T+1  自我应对行为                            [应对方式理论 + 依恋理论]
   │  问题聚焦→干活/敲电脑/跑步;支持寻求→喝茶/看书(过渡);回避→睡觉/独处
   ▼
T+2  场所寻求(与空间建筑交互)                 [马斯洛需求 × 场所供给 + 恢复性环境理论 + 场所依恋]
   │  需求缺口匹配 zone provides;应激状态偏好疗愈层;去过的好地方权重更高
   ▼
T+3  社会互动(与人交互)                       [社会支持理论 / 积极事件资本化(Gable)]
   │  负事件→向最信任的关系寻求倾听/安抚;正事件→分享放大;回避型→独处休整
   ▼
T+4  二级涟漪                                 [情绪感染理论(Hatfield)]
   │  互动对象的情绪波动继续传给 TA 的亲近关系(宜人性放大共情,神经质放大负性)
   ▼
持续  环境心理漂移 + 场所依恋累积              [人-环境匹配 P-E fit + 注意力恢复理论 ART]
```

## 理论 → 机制 → 代码映射

| 心理学理论 | 游戏机制 | 代码位置 |
|---|---|---|
| 大五人格(Costa & McCrae) | 行为选择权重、感染易感性、应对风格推导 | `engine.js buildBigFiveProfile` / `game.js behaviorPsychBonus` |
| MBTI 16 型原型 | 社交动作偏置 socialBias、核心需求主题、关系偏好 | `engine.js MBTI_ARCHETYPES` |
| 依恋理论(Bowlby/Ainsworth) | secure/anxious/avoidant/disorganized → 应对风格修正 | `engine.js buildAttachmentStyle / deriveCopingProfile` |
| 应对方式理论(Lazarus & Folkman) | 问题聚焦 / 社会支持寻求 / 回避缓冲 三维应对档案 | `engine.js deriveCopingProfile / COPING_BEHAVIOR_HINTS` |
| 认知评估理论(Lazarus) | 事件文本 → 效价/强度/领域/需求冲击 | `engine.js appraiseLifeEvent / applyAppraisalToCitizen` |
| 马斯洛需求层次 | 需求缺口驱动场所选择;事件冲击经 needsShock 通道衰减 | `engine.js NEED_PROVIDES_MAP / pickZoneForNeeds / updateCitizenPsychState` |
| PAD 情绪模型(Mehrabian) | 愉悦/唤醒/支配三维;应激与倦怠改变行为偏好 | `engine.js buildPadEmotion` / `game.js behaviorPsychBonus` |
| 社会支持理论 | 负事件后向最高信任关系发起倾听/安抚 | `engine.js buildPsychRipple(outreach) / pickTopTrustRelation` |
| 积极事件资本化(Gable) | 正事件后主动分享(propose),放大积极情绪 | `engine.js buildPsychRipple(outreach)` |
| 情绪感染(Hatfield) | 互动情绪按共情系数波及第三方,形成关系网涟漪 | `engine.js propagateSecondaryContagion` |
| 恢复性环境理论(Kaplan ART) | 应激状态优先选择疗愈/生态层场所;疗愈场所回血 | `engine.js pickZoneForNeeds / applyZoneAmbiencePsych` |
| 人-环境匹配(P-E fit) | 尽责者在工作区更满足;外向者在娱乐区更快乐,反之受损 | `engine.js applyZoneAmbiencePsych` |
| 场所依恋(place attachment) | 正体验累积 placeAffinity,影响未来场所选择 | `engine.js applyZoneAmbiencePsych / pickZoneForNeeds` |
| 关系模型理论(Fiske) | communal/equality/authority/market 四种关系偏好 | `engine.js MBTI_ARCHETYPES.relationPreference` |
| 需求-行为演化 | 行为完成反哺 mood/energy,与社会模拟共同演化 | `game.js BEHAVIOR_LIBRARY.effects / finishCitizenBehavior` |

## 数据结构

### 市民心理档案(注册时生成,`normalizeCitizen`)

```js
{
  mbtiType, personaLabel, personaNeed, relationPreference,
  bigFive: { openness, conscientiousness, extraversion, agreeableness, neuroticism },
  attachmentStyle: "secure" | "anxious" | "avoidant" | "disorganized",
  interpersonal: { warmth, dominance },          // 人际环状模型
  coping: { problemFocused, socialSeeking, avoidant },  // 归一化应对档案
  needs: { physiological, safety, belonging, esteem, selfActualization, ... },
  pad: { pleasure, arousal, dominance },
  placeAffinity: { [zoneId]: 0..1 },             // 场所依恋
  needsShock: { [needKey]: delta },              // 事件冲击残留,每 tick 衰减 10%
  zoneLock: { zoneId, untilTurn }                // 心理连锁的场所锁
}
```

### 连锁计划(`society.psychRipple`)

```js
{
  steps: [ { due, kind: "cope"|"seek-place"|"outreach"|"withdraw"|"echo", ...payload, reason } ],
  cursor, createdTurn, sourceText,
  appraisal: { valence, intensity, domainLabel, summary },
  copingStyle: "问题聚焦" | "社会支持寻求" | "回避缓冲"
}
```

### 心理动线日志(`society.psychChain`,环形 14 条)

每个连锁步骤执行后记录 `{ turn, kind, text, actorName }`,在市民详情面板"心理动线"区展示,并同步进入事件流(前缀"心理连锁:")。

## 执行时序

1. **注册**:`normalizeCitizen` 从 MBTI/标签推导完整心理档案(含应对风格)。
2. **事件输入**:`injectLifeEventToSociety` → `appraiseLifeEvent` 评估 → `applyAppraisalToCitizen` 冲击 mood/energy/needsShock → `buildPsychRipple` 生成 T+1..T+4 连锁计划。
3. **逐回合推进**:`stepSociety` 每 tick 调 `advancePsychRipple`(执行到期步骤)与 `applyZoneAmbiencePsych`(环境漂移,每 2 回合)。
4. **游戏层可视化**(`game.js`):
   - `cope` 步骤写入 `citizen.pendingBehaviorHint`,街道行为循环优先消费,人物做出对应姿态动画并冒泡说明原因;
   - `seek-place` 修改 zoneId + zoneLock,人物在地图上走向目标建筑;
   - `outreach/withdraw` 走既有 resolveAction 管线,互动可视化分层展示;
   - 详情面板"心理动线"逐步列出链条,跟随视角横幅同步行为标签。

## 调参入口

- 评估词典:`APPRAISAL_LEXICON`(效价/领域关键词)
- 需求→场所映射:`NEED_PROVIDES_MAP`
- 应对→行为映射:`COPING_BEHAVIOR_HINTS`
- 感染系数:`propagateSecondaryContagion`(共情 0.25+宜人性×0.4;负性放大 0.8+神经质×0.5;衰减 0.4)
- 环境漂移幅度:`applyZoneAmbiencePsych`(±0.3~0.9/2回合)
- 冲击衰减:`updateCitizenPsychState` needsShock ×0.9/tick

## 已知边界

- 评估当前是关键词词典,后续可换 LLM 评估(经后端代理),接口保持 `appraisal` 结构不变。
- 连锁同一时间只保留一条(新事件覆盖旧计划的未执行步骤)。
- 二级涟漪只传导一层,避免全网雪崩;负性放大有 clamp 保护。
