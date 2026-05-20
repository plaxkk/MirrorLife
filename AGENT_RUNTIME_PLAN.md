# 虚拟社会 Agent 运行方案

这份文档把“自演化 AI 算法”和“接入 agent 自动推演虚拟社会”落到可实施层面。

结论先放前面：

1. 不建议把“自演化”理解为在线改模型权重。
2. 更适合这类产品的，是“规则引擎 + 多 agent + 记忆/反思 + 评价器”的组合。
3. 其中真正稳定的自演化来自行为、技能和社会规则三个层面，而不是单一模型自发进化。

当前仓库已经落地了最小可运行版本：

1. 世界状态中已包含 `agents` 运行时、`memoryStore`、`reflectionStore`、`skillStore`、`inbox`、`outbox` 和 `auditLog`。
2. 每次社会回合都会写入 agent 记忆、反思与审计记录。
3. 社会页已经有 `Agent 运行时` 面板展示循环、记忆、反思、技能和最近审计。
4. 用户输入和玩家动作会通过同一条 agent 闭环进入社会推演。

## 1. 目标

让虚拟社会持续自动运行，且分身不是静态 NPC，而是会：

1. 观察当前世界状态。
2. 选择行动。
3. 记住结果。
4. 反思偏差。
5. 在下一轮改变行为。

最终达到：

1. 社会会自己产生事件。
2. 分身会彼此影响。
3. 世界规则会随着反馈调整。
4. 用户只需偶尔注入现实片段，就能看到社会持续演变。

## 2. 可用路线

### 2.1 行为自演化

典型思路是 `Generative Agents` 风格：

1. 记忆存储事件。
2. 按相关性检索记忆。
3. 基于记忆生成计划。
4. 行动后写回记忆。

适合做：

1. 分身日常行为。
2. 社交关系推进。
3. 情绪恢复与再参与。

参考实现思路：`observe -> retrieve -> plan -> act -> store`.

### 2.2 反思自演化

典型思路是 `Reflexion` 风格：

1. 每轮行动结束后写反思。
2. 反思不改权重，只改下一轮提示词和计划。
3. 反思可被检索并复用。

适合做：

1. 行为纠偏。
2. 沟通风格优化。
3. 规则违规后的自我修正。

### 2.3 技能自演化

典型思路是 `Voyager` 风格：

1. 把重复成功的行为沉淀成技能。
2. 技能进入可调用库。
3. 下一次遇到类似场景时优先复用。

适合做：

1. 调停技能。
2. 组织活动技能。
3. 教育、照护、建设、协作等技能库。

### 2.4 社会自演化

这是最重要的一层：

1. 不是单个角色变强。
2. 而是规则、资源、关系网络、区域热度、任务分布一起变化。

适合做：

1. 公共空间拥挤与疏散。
2. 平等/自由/开放准则波动。
3. 脆弱分身的保护优先级变化。
4. 强者文化从“支配”变成“可借力的组织能力”。

## 3. 推荐架构

### 3.1 四层结构

1. 世界内核
   - 回合制状态机。
   - 区块、时钟、事件、任务、指标。
   - 负责最终状态裁决。

2. Agent 层
   - 每个分身一个轻量 agent。
   - 负责提出动作候选、解释动机、写反思。

3. 记忆层
   - 短期记忆：当前回合相关事件。
   - 中期记忆：最近若干轮的关系变化。
   - 长期记忆：人格、禁区、职业、关键回声。

4. 评价层
   - 检查自由、平等、开放、脆弱保护是否被破坏。
   - 对越界行为做降权、重写或驳回。

### 3.2 推荐工具组合

优先级：

1. `LangGraph`
   - 适合状态化、多 agent、持续循环。
   - 适合把世界推进、评估、反思、记忆更新串成 DAG 或循环图。

2. `OpenAI Agents SDK`
   - 适合快速搭工具调用、handoff、trace。
   - 适合把“社会调度器”做成可观测 agent。

3. `AutoGen` / `CrewAI`
   - 适合概念验证和角色协作演示。
   - 如果你更想要“团队协作感”，它们很好用。

我的建议是：

1. 产品内核用你自己的规则引擎。
2. agent 编排优先用 `LangGraph`。
3. 如果后面要快速做 demo，再接 `OpenAI Agents SDK`。

## 4. Agent 角色设计

### 4.1 世界调度器

职责：

1. 读取世界状态。
2. 分发任务给 citizen agent。
3. 汇总动作。
4. 推进回合。

输入：

1. 当前时钟。
2. 当前区域负载。
3. 当前准则评分。
4. 当前事件种子。

输出：

1. 待执行任务列表。
2. 回合推进计划。

### 4.2 Citizen Agent

职责：

1. 代表一个分身。
2. 决定发言、协作、安抚、倾听、调停、休整。
3. 生成行为解释。

每个 citizen agent 只需要知道：

1. 自己的记忆。
2. 当前区域。
3. 当前情绪和信任。
4. 社会规则。

### 4.3 规则审计 Agent

职责：

1. 检查平等是否被打破。
2. 检查强者是否形成表达垄断。
3. 检查脆弱状态是否得到保护。
4. 检查用户禁区和隐私边界。

输出：

1. 通过。
2. 降权。
3. 重写。
4. 驳回。

### 4.4 记忆整理 Agent

职责：

1. 从事件流中抽取可回忆的事实。
2. 写入短期和长期记忆。
3. 形成回声摘要。

### 4.5 叙事编剧 Agent

职责：

1. 把世界事件转成可读故事。
2. 把动作结果转成用户能理解的回声。
3. 保持人文关怀和低评判语气。

### 4.6 危机支持 Agent

职责：

1. 识别高风险内容。
2. 降噪，不强推剧情。
3. 只输出安全回声和现实支持建议。

## 5. 世界循环

一个完整回合建议按这个顺序跑：

1. 读取世界状态。
2. 解析用户最新输入。
3. 生成本回合事件种子。
4. 分发给 citizen agents。
5. 各 agent 生成动作候选。
6. 规则审计 agent 过滤越界动作。
7. 世界引擎裁决并写入状态。
8. 记忆整理 agent 生成摘要。
9. 叙事编剧 agent 生成回声。
10. 将结果写回 UI 和日志。

这意味着：

1. LLM 不直接改底层状态。
2. LLM 只产生候选动作、解释和摘要。
3. 最终状态由世界引擎决定。

## 6. 数据契约

### 6.1 WorldState

最少字段：

```ts
type WorldState = {
  turn: number;
  clock: { day: number; hour: number; minute: number };
  scenarioText: string;
  scene: string;
  tension: number;
  harmony: number;
  metrics: { freedom: number; equality: number; openness: number };
  principleHealth: { freedom: number; equality: number; openness: number };
  zones: Zone[];
  citizens: CitizenState[];
  events: WorldEvent[];
  missions: Mission[];
  rules: SocialRules;
};
```

### 6.2 CitizenState

```ts
type CitizenState = {
  id: string;
  name: string;
  age: number;
  professionId: string;
  zoneId: string;
  mood: number;
  energy: number;
  trust: number;
  alive: boolean;
  memoryIds: string[];
  reflectionIds: string[];
  skillIds: string[];
  lastAction: string;
};
```

### 6.3 WorldEvent

```ts
type WorldEvent = {
  id: string;
  turn: number;
  type: 'propose' | 'cooperate' | 'support' | 'listen' | 'mediate' | 'rest' | 'conflict';
  actorId: string;
  targetId?: string;
  zoneId?: string;
  source: 'user' | 'agent' | 'system';
  text: string;
  impact: {
    moodDelta?: number;
    trustDelta?: number;
    tensionDelta?: number;
    harmonyDelta?: number;
  };
};
```

### 6.4 MemoryItem

```ts
type MemoryItem = {
  id: string;
  ownerId: string;
  kind: 'event' | 'reflection' | 'skill' | 'relationship';
  text: string;
  importance: number;
  createdAtTurn: number;
  references: string[];
};
```

## 7. 记忆策略

建议分三层：

1. 短期记忆
   - 最近 3 到 5 回合。
   - 用于行动连贯性。

2. 中期记忆
   - 最近 20 到 50 个事件。
   - 用于关系变化和阶段性策略。

3. 长期记忆
   - 人格、职业、关系边界、关键创伤、关键成功经验。
   - 用于身份稳定性。

记忆进入规则：

1. 发生了明显情绪变化就写入。
2. 发生了关系变化就写入。
3. 发生了规则越界或修复就写入。
4. 被重复使用过的反思，提升权重。

## 8. 自演化机制

### 8.1 行为层

如果某个动作在相似场景里持续有效，就把它标记为高优先级策略。

例如：

1. 低情绪时优先 `support`。
2. 公共广场拥挤时优先 `listen`。
3. 高张力时优先 `mediate`。

### 8.2 技能层

把成功组合沉淀成技能：

1. 安抚话术。
2. 协作模板。
3. 边界表达模板。
4. 公开协商模板。

### 8.3 社会层

根据群体行为动态调整：

1. 哪些区域更适合公开发言。
2. 哪些区域适合修复。
3. 哪些职业承担组织/照护/治理职责。
4. 哪些事件类型容易触发冲突或共识。

## 9. 安全与准则

必须保留硬约束：

1. 自由、平等、开放不可关闭。
2. 脆弱状态不能被惩罚。
3. 强者只能增强组织和借力能力，不能拥有压制权限。
4. 高风险内容不进入常规推演链路。
5. 用户禁区和隐私标签优先于社会玩法。

## 10. 落地顺序

### Phase 1

1. 保留现有规则引擎。
2. 加上记忆层。
3. 让 citizen agent 先做单轮行动建议。
4. 用规则审计器过滤。

### Phase 2

1. 加入反思 agent。
2. 加入技能库。
3. 让社会可以跨回合记住经验。

### Phase 3

1. 接入多 agent 编排。
2. 让不同 agent 分工：叙事、审计、调停、整理。
3. 让社会持续自动推演。

### Phase 4

1. 加入更强的环境目标。
2. 加入群体级演化指标。
3. 让世界出现长期文明差异和文化分支。

## 11. 与当前项目的对接

当前仓库已经有的东西：

1. 回合制社会状态机。
2. 区域地图。
3. 日夜节律。
4. 任务板。
5. 社会准则评分。
6. 回声档案。

适合直接加上的下一层：

1. `memoryStore`
2. `reflectionStore`
3. `agentInbox`
4. `agentOutbox`
5. `auditLog`

如果要继续往代码里落，我建议优先把这五个状态挂到现有 `state.society` 里。

## 12. 建议的最小可运行版本

最小可运行版不需要一开始就真接网络 agent 服务。

可以先做：

1. 规则引擎驱动。
2. 每个分身一个本地 agent 模拟器。
3. 记忆和反思都在浏览器里跑。
4. 未来再把 agent 模拟器替换成远程 LLM agent。

这样能先验证产品逻辑，而不是卡在平台依赖上。
