# Scene Contract 与每 Agent 独立 LLM 接入

MirrorLife 当前默认使用本地规则驱动 Agent。每个 Agent 已可注册独立 Narrative Adapter，但模型永远不是世界状态的最终写入者。

## 数据流

```text
只读 Agent 快照
  → 独立模型提出 intent / dialogue / actionType / targetId / evidenceIds
  → Scene Contract 校验参与者、动作、同意和禁止字段
  → 合法候选进入 Agent inbox
  → Utility AI 与人物状态决定是否行动
  → engine.js 结算物理、关系、情绪和城市状态
  → outbox 行动证据推动剧情
```

模型返回值中出现以下字段会被拒绝：`mutations`、`patches`、`worldState`、`state`、`effects`、`relationshipDelta`、`memoryWrites`。

## Scene Contract 保证什么

- `worldMutationAuthority: engine-only`：只有规则引擎能修改世界。
- `evidenceSource: engine-outbox-only`：剧情不能用模型自述冒充已经发生的行动。
- `actorMayRefuse: true`：Agent 可以拒绝任务，拒绝本身也能成为剧情证据。
- `rawMemoryMayBePublished: false`：默认禁止把原始记忆作为公开内容。
- 每个阶段只允许有限动作，并限定参与者与目标。

五个具身章节也有独立契约：看见、留下、穿过、修正、授权。它们分别要求场所证据、八秒静默、两种证词与第三站位、误读纠正与协商距离、记忆所有者授权回执。

## 接入一个独立模型

```js
window.MirrorLifeNarrativeRuntime.registerAdapter(citizenId, {
  async propose(context) {
    const response = await callYourServerSideModel(context);
    return {
      questId: context.contract.questId,
      agentId: context.citizen.id,
      actionType: response.actionType,
      targetId: response.targetId,
      intent: response.intent,
      dialogue: response.dialogue,
      evidenceIds: response.evidenceIds
    };
  }
});

const result = await window.MirrorLifeNarrativeRuntime.requestProposal(citizenId);
```

生产接入必须通过服务端代理，不在浏览器保存 provider key。服务端还需要补充身份认证、速率限制、成本预算、内容审核、超时降级和 trace 审计。

## 验证

启动游戏后执行：

```bash
MIRRORLIFE_BASE_URL=http://127.0.0.1:4173 npm run verify:narrative-runtime
```

该门禁会验证五个具身契约齐全、恶意状态写入被拒绝、合法模型候选进入 inbox，且请求前后世界状态完全相同。
