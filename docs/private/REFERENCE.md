# 多 Agent 社会模拟游戏论文文献库

> 整理目的：为在线互动多 Agent 社会模拟游戏开发提供学术参考
> 整理日期：2025 年 5 月
> 覆盖方向：Agent 架构 · 社交博弈游戏 · 社会涌现模拟 · 规则设计

---

## 一、必读基础架构论文

### 1. Generative Agents: Interactive Simulacra of Human Behavior

| 字段 | 内容 |
|------|------|
| 作者 | Joon Sung Park, Joseph O'Brien, Carrie Jun Cai, et al. (Stanford / Google) |
| 发表 | UIST 2023 |
| arXiv | [2304.03442](https://arxiv.org/abs/2304.03442) |
| 代码 | [github.com/joonspk-research/generative_agents](https://github.com/joonspk-research/generative_agents) |

**核心贡献**

该论文定义了 Generative Agent 的三模块标准架构：

- **Memory Stream（记忆流）**：用自然语言记录 agent 所有经历，检索时综合 relevance（相关性）、recency（时近性）、importance（重要性）三个维度打分
- **Reflection（反思）**：周期性将碎片记忆综合提炼为高阶推断，使 agent 能形成对自身和他人的认知
- **Planning（计划）**：基于反思结论生成行为计划，并在执行中动态 react

**实验亮点**

25 个 agent 居住在一个类 The Sims 沙盒小镇中。只需向其中一个 agent 植入"想办情人节派对"的想法，agent 们会在两天内自主扩散邀请、结识新朋友、相互约会、并协调一起出席——所有社会行为完全涌现，无需额外编程。

**对游戏开发的价值**

Memory Stream + Reflection 是 agent 长期存在感和人格一致性的核心。这是整个领域公认的基础架构，优先复用官方代码。

---

### 2. AgentSims: An Open-Source Sandbox for Large Language Model Evaluation

| 字段 | 内容 |
|------|------|
| arXiv | [2308.04026](https://arxiv.org/abs/2308.04026) |
| 发表 | 2023 |
| 代码 | 开源，含完整实现 |

**核心贡献**

比 Generative Agents 更轻量的开源沙盒框架，专门为 LLM 驱动的 agent 评测设计。提供了可直接运行的基础设施，适合快速搭建 MVP 原型。

**对游戏开发的价值**

快速原型首选，有完整代码库可 fork。

---

### 3. Lyfe Agents: Generative Agents for Low-Cost Real-Time Social Interactions

| 字段 | 内容 |
|------|------|
| arXiv | [2310.02172](https://arxiv.org/abs/2310.02172) |
| 发表 | 2023 |

**核心贡献**

聚焦于**实时低成本**运行的 agent 架构。Generative Agents 每步推理消耗较高，Lyfe Agents 通过异步思考、压缩记忆等机制大幅降低 API 调用开销。

**对游戏开发的价值**

在线互动游戏要求低延迟响应，该论文的优化策略对工程落地至关重要。

---

## 二、社交博弈 / 社会推理游戏论文

### 4. Language Agents with Reinforcement Learning for Strategic Play in the Werewolf Game

| 字段 | 内容 |
|------|------|
| arXiv | [2310.18940](https://arxiv.org/abs/2310.18940) |
| 发表 | ICML 2024 |

**核心贡献**

以狼人杀为测试床，提出 LLM + RL 混合决策架构：

1. LLM 通过演绎推理生成多个候选行动
2. 经 RL 策略从候选中选出最优决策，克服 LLM 的内在偏差（如总是倾向极端值）

实验证明 agent 达到人类水平博弈表现。

**对游戏开发的价值**

适合设计具有竞争性的 agent 角色——欺骗、结盟、投票等复杂社交行为的底层决策机制参考。

---

### 5. Werewolf Arena: A Case Study in LLM Evaluation via Social Deduction

| 字段 | 内容 |
|------|------|
| arXiv | [2407.13943](https://arxiv.org/abs/2407.13943) |
| 发表 | 2024 |

**核心贡献**

引入**动态发言权竞拍系统**：玩家通过竞标争取发言顺序，而非随机或固定轮次，模拟了真实社交中话语权的争夺动态。

**对游戏开发的价值**

"竞拍发言权"机制直接可用于在线互动游戏的节奏设计，使讨论阶段更具策略性和可观赏性。

---

### 6. DVM: Towards Controllable LLM Agents in Social Deduction Games

| 字段 | 内容 |
|------|------|
| arXiv | [2501.06695](https://arxiv.org/abs/2501.06695) |
| 发表 | 2025 |

**核心贡献**

提出 Predictor-Decider-Discussor 三模块可控框架，通过 RL + 胜率约束奖励机制，使 agent 能**动态调整博弈水平**以达到预设胜率目标（如主动降低水平陪新手玩家）。

**对游戏开发的价值**

对人类玩家开放的游戏中，agent 难度可控性至关重要。这是目前最直接解决该问题的论文。

---

### 7. Enhance Reasoning for LLMs in the Werewolf Game

| 字段 | 内容 |
|------|------|
| arXiv | [2402.02330](https://arxiv.org/abs/2402.02330) |
| 数据集 | 18,800 人类局游戏日志（开源） |

**核心贡献**

引入外部 Thinker 模块辅助 LLM 推理，并在 18,800 条人类游戏数据上训练，使 6B 小模型在多数评测场景超过 GPT-4。同时贡献了目前最大的社交推理游戏数据集。

**对游戏开发的价值**

数据集可直接用于训练或 fine-tune 游戏专用 agent；Thinker 模块思路适合构建"思考层 + 发言层"分离架构。

---

## 三、社会涌现 / 社会系统模拟论文

### 8. S3: Social-network Simulation System with LLM-Empowered Agents

| 字段 | 内容 |
|------|------|
| arXiv | [2307.14984](https://arxiv.org/abs/2307.14984) |
| 发表 | 2023 |

**核心贡献**

专为社交网络行为模拟设计的 agent 框架，重点研究信息扩散、舆论形成、群体行为等社会现象的涌现机制。

**对游戏开发的价值**

若游戏包含新闻传播、谣言扩散、派系形成等社会机制，S3 是直接的技术参考。

---

### 9. Spontaneous Emergence of Agent Individuality Through Social Interactions

| 字段 | 内容 |
|------|------|
| 发表 | Frontiers in Artificial Intelligence, 2024 |
| 链接 | [PMC11675631](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11675631/) |

**核心贡献**

在多 agent 持续通信模拟中，agent 的**个性、情感变化和社群结构自发涌现**，无需显式编程。实验观察到 agent 自主发展出不同性格，并在互动中形成稳定的社区划分。

**对游戏开发的价值**

角色个性应该"长出来"，而不是完全硬编码。该论文提供了让 agent 自然发展独特身份的机制设计参考。

---

### 10. Generative Agent Simulations of 1,000 People

| 字段 | 内容 |
|------|------|
| arXiv | [2411.10109](https://arxiv.org/abs/2411.10109) |
| 作者 | Park et al. (Generative Agents 续集) |
| 发表 | 2024 |

**核心贡献**

用真实人口调查数据构建 1,000 个 agent，研究大规模模拟的可行性，深入讨论规模化时的**计算成本、角色一致性和偏差问题**。

**对游戏开发的价值**

大规模 agent 部署时的工程挑战和解决方案参考，避免规模化时踩坑。

---

### 11. Artificial Leviathan: Exploring Social Evolution Through Hobbesian Social Contract Theory

| 字段 | 内容 |
|------|------|
| arXiv | [2406.14373](https://arxiv.org/abs/2406.14373) |
| 发表 | 2024 |

**核心贡献**

从霍布斯社会契约论的角度研究 LLM agent 的社会演化：权力如何集中、秩序如何形成、冲突如何解决——这些都在 agent 社会中自发涌现并与理论预测高度吻合。

**对游戏开发的价值**

世界观设计和规则设计的理论基础。如果游戏涉及国家建立、权力结构、社会分层，这是必读的设计参考。

---

## 四、规则设计 / 社会实验论文

### 12. Simulating Cooperative Prosocial Behavior with Multi-Agent LLMs (Public Goods Game)

| 字段 | 内容 |
|------|------|
| 发表 | IUI 2025 (ACM) |
| 链接 | [ACM DL](https://dl.acm.org/doi/10.1145/3708359.3712149) |

**核心贡献**

研究多 agent 系统在**公共物品博弈（Public Goods Game）**中能否复现人类的亲社会行为（贡献、搭便车、惩罚机制）。验证了 LLM agent 在经济博弈规则框架下的可预测性和可用性。

**对游戏开发的价值**

经济博弈规则（资源共享/搭便车/集体惩罚）的 LLM 实现参考，适合设计游戏内的经济系统和社会激励机制。

---

### 13. SOTOPIA: Interactive Evaluation for Social Intelligence in Language Agents

| 字段 | 内容 |
|------|------|
| arXiv | [2310.11667](https://arxiv.org/abs/2310.11667) |
| 代码 | 开源，含评测框架 |
| 发表 | 2023 |

**核心贡献**

定义了评估 agent 社交智能的标准框架，包含多种社交场景（谈判、合作、冲突解决）的规则设计和量化评估指标。

**对游戏开发的价值**

提供了一套现成的**社交场景规则设计模板**，可直接借鉴其场景设计和评分维度构建游戏内的社交任务系统。

---

### 14. Wargames: SIM-1 for Realistic Conflict & Competition in Multi-Agent Simulations

| 字段 | 内容 |
|------|------|
| 来源 | Fable Studio |
| 链接 | [fablestudio.github.io/openai-wargames](https://fablestudio.github.io/openai-wargames/) |
| 发表 | 2024 |

**核心贡献**

以 OpenAI 2023 年权力危机为背景，运行 20 次模拟实验，所有关键人物被建模为具有明确目标的 agent。在 20 次模拟中，Sam Altman 仅在 4 次中回归，体现了真实世界事件的随机性。

**对游戏开发的价值**

竞争与欺骗驱动的多 agent 模拟的工程实现参考，是目前最接近"可玩游戏"的社会模拟研究案例。

---

## 五、架构速查表

适用场景对应推荐论文：

| 需求 | 推荐论文 |
|------|----------|
| Agent 记忆与个性持久化 | Generative Agents `2304.03442` |
| 快速原型搭建（有代码） | AgentSims `2308.04026` |
| 实时低延迟运行 | Lyfe Agents `2310.02172` |
| 博弈/欺骗/投票决策 | Werewolf + RL `2310.18940` |
| 动态发言节奏设计 | Werewolf Arena `2407.13943` |
| Agent 难度可控性 | DVM `2501.06695` |
| 社会涌现 / 角色个性形成 | Spontaneous Emergence `PMC11675631` |
| 信息传播 / 舆论机制 | S3 `2307.14984` |
| 大规模 Agent 工程挑战 | 1000 People `2411.10109` |
| 权力/秩序世界观设计 | Artificial Leviathan `2406.14373` |
| 经济激励 / 博弈规则 | Public Goods Game `IUI 2025` |
| 社交场景规则模板 | SOTOPIA `2310.11667` |
| 竞争与欺骗模拟参考 | Wargames SIM-1 |

---

## 六、GitHub 资源汇总

- [awesome-LLM-game-agent-papers](https://github.com/git-disl/awesome-LLM-game-agent-papers) — LLM 游戏 agent 论文持续更新列表（ACM CSUR 综述配套）
- [joonspk-research/generative_agents](https://github.com/joonspk-research/generative_agents) — Generative Agents 官方代码
- [boluoweifenda/werewolf](https://github.com/boluoweifenda/werewolf) — 18,800 条狼人杀人类游戏数据集
- [AI4SS/GAS-3](https://github.com/AI4SS/GAS-3) — GA-S³ 社交网络模拟系统代码

---

*文档由 Claude 整理，基于 2025 年 5 月公开学术资源*