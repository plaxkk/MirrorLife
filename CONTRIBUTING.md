# 为 MirrorLife 做贡献 / Contributing to MirrorLife

感谢你愿意帮助 MirrorLife 变得更好。无论是修复问题、改进体验、补充验证、优化 3D 资产，还是完善文档，我们都欢迎清晰、可验证且尊重项目边界的贡献。

Thank you for helping make MirrorLife better. We welcome clear, verifiable contributions across gameplay, accessibility, performance, 3D assets, testing, and documentation.

[中文](#中文) · [English](#english)

---

## 中文

### 开始之前

MirrorLife 目前是 local-first 的单人可玩开发版。贡献应优先让游戏变得更好玩、更容易理解、更稳定，同时避免把路线图能力描述成已经上线的功能。

提交改动前：

1. 搜索现有 Issue 和 Pull Request，避免重复工作。
2. 小型修复、文档和局部优化可以直接提交 PR。
3. 新系统、架构重构、数据格式变更或破坏兼容性的改动，请先创建 Issue 说明目标与影响。
4. 不确定当前实现边界时，先阅读 [README](README.md)、[产品设计方案](PRODUCT_DESIGN.md) 和 [Scene Contract](docs/SCENE_CONTRACTS.md)。

### 开发环境

要求：

- Node.js 22
- npm 10+
- 支持 WebGL 的现代 Chrome / Chromium

安装并启动：

```bash
git clone https://github.com/plaxkk/MirrorLife.git
cd MirrorLife
npm ci
npm run dev
```

游戏默认运行在 <http://localhost:4173/game.html>。

### 分支与提交

- 从最新的 `main` 创建短生命周期分支。
- 建议使用清楚的分支名，例如 `feat/relationship-map`、`fix/interior-collision` 或 `docs/setup-guide`。
- 一个 PR 聚焦一个可说明、可验证的目标；不要混入无关格式化或重构。
- 提交信息建议遵循 Conventional Commits：

```text
feat: add relationship replay
fix: keep interior camera inside walkable bounds
docs: clarify local memory setup
test: cover mirror relay consent flow
```

### 项目原则

所有改动都应遵循以下约束：

1. **游戏先于面板**：优先让玩家做出有结果的动作，再展示系统解释。
2. **行动先于台词**：剧情和关系变化必须能追溯到真实行动证据。
3. **规则先于模型**：模型只能提出意图、台词和动作候选，不能直接改写世界状态。
4. **隐私默认收紧**：现实片段、关系和记忆必须可授权、可撤回、可删除。
5. **空间保持一致**：室内人物、家具、碰撞、交互距离和相机共享统一世界坐标。
6. **开发资产不冒充正式资产**：能加载不等于达到发布质量。

### 代码与内容规范

- 保持现有 ESM 与浏览器 local-first 架构，除非改动已经过架构讨论。
- 优先使用现有模块、设计 token 和工具脚本，避免引入重复依赖。
- 不要绕过规则引擎直接修改关系、记忆、任务完成状态或城市指标。
- 用户可见文案应准确、克制，不作心理治疗、诊断或危机干预承诺。
- 新功能应包含降级路径；云端服务不可用时，核心单人体验仍应运行。
- 改动交互时同时考虑键盘、触控、移动端布局与基本无障碍体验。

### 3D 与视觉贡献

涉及室内、角色或 3D 资产时：

- 保持 X/Z 世界坐标、接地、碰撞体、交互锚点和通行路线正确。
- 不使用 2D billboard 冒充需要真实 3D 环绕的角色。
- 不为单张截图牺牲可行走、可旋转、人物跟随或性能预算。
- 正式资产必须具备来源说明、多视图参考、Web LOD 和发布质量验证。
- 提交桌面四向视图与移动端截图；动画改动还应检查眨眼、手部接触、肘膝体积和 foot plant。

完整标准见 [室内 3D 高保真规范](docs/INTERIOR_3D_FIDELITY.md) 与 [室内 3D 模型管线](docs/INTERIOR_3D_MODEL_PIPELINE.md)。

### 验证要求

所有代码 PR 至少运行：

```bash
npm run check
npm run build
git diff --check
```

根据改动范围补充专项验证：

| 改动范围 | 建议验证 |
| --- | --- |
| 社会模拟 / 关系 | `npm run test:evolution` |
| 叙事 / Agent | `npm run verify:narrative-runtime`、相关章节验证 |
| 室内物理 | `npm run verify:interior-physics` |
| 3D 人物 / 相机 | `npm run verify:interior-character-exploration`、`npm run verify:characters:civic` |
| 场景切换 | `npm run verify:interior-scene-flow`、`npm run verify:interior-transitions` |
| 视觉保真 | `npm run verify:reference-fidelity:v3` 与桌面/移动端截图 |
| 性能 | `npm run benchmark:interior`，附修改前后数据 |
| 纯文档 | 本地链接、图片路径和 `git diff --check` |

浏览器自动化不可用时，请使用本机 Chrome / Chromium 完成同等验证。已知且与本次改动无关的警告可以记录在 PR 中，但不得隐藏新错误。

### 安全与隐私

禁止提交：

- API key、访问令牌、私钥、生产环境变量或真实凭据。
- 未脱敏的用户数据、访谈、对话、关系记录或个人记忆。
- 无明确授权的第三方素材、模型、字体或受限制数据集。
- 把生产密钥放入浏览器端代码的实现。

发现安全问题时，请不要在公开 Issue 中粘贴凭据或敏感利用细节；先通过仓库维护者可用的私密渠道报告。

### Pull Request 清单

提交 PR 前确认：

- [ ] PR 只处理一个清晰目标，并解释“为什么”。
- [ ] 行为变化、边界条件与用户影响已写入说明。
- [ ] 已列出实际运行的测试和人工检查。
- [ ] 新增或变化的 UI 附桌面端与移动端截图。
- [ ] 新功能同步更新相关 README 或设计文档。
- [ ] 没有提交密钥、个人数据或无授权资产。
- [ ] 分支已基于最新 `main`，且没有无关文件。
- [ ] CI 与 Vercel Preview 通过，或已解释可复现的外部阻塞。

推荐的 PR 描述：

```markdown
## Summary
- 做了什么

## Why
- 为什么需要这个改动
- 根因或产品背景

## Impact
- 对玩家、性能、数据或兼容性的影响

## Verification
- `npm run check`
- `npm run build`
- 相关专项验证与人工检查

## Screenshots
- UI / 3D 改动前后对比

## Known limitations
- 已知边界和后续工作
```

### 报告问题

Issue 中请尽量提供：

- 简明的问题描述与期望行为。
- 可重复的最小步骤。
- 浏览器、操作系统、设备类型和提交版本。
- 控制台错误、截图或录屏。
- 是否影响存档、隐私、碰撞、移动端或生产构建。

贡献一经合并，将按项目的 [MIT License](LICENSE) 发布。

---

## English

### Before You Start

MirrorLife is currently a local-first, single-player playable development build. Contributions should make the game more playable, understandable, or reliable without presenting roadmap features as already shipped.

Before making a change:

1. Search existing issues and pull requests to avoid duplicate work.
2. Small fixes, documentation, and scoped improvements can go directly to a PR.
3. Open an issue first for new systems, architectural changes, data-format changes, or compatibility breaks.
4. Read the [README](README.en.md), [product design](PRODUCT_DESIGN.md), and [Scene Contracts](docs/SCENE_CONTRACTS.md) when the current boundary is unclear.

### Development Setup

Requirements:

- Node.js 22
- npm 10+
- A modern Chrome / Chromium browser with WebGL

Install and run:

```bash
git clone https://github.com/plaxkk/MirrorLife.git
cd MirrorLife
npm ci
npm run dev
```

The game opens at <http://localhost:4173/game.html>.

### Branches and Commits

- Create a short-lived branch from the latest `main`.
- Use a descriptive name such as `feat/relationship-map`, `fix/interior-collision`, or `docs/setup-guide`.
- Keep each PR focused on one explainable, verifiable goal.
- Conventional Commit-style messages are encouraged:

```text
feat: add relationship replay
fix: keep interior camera inside walkable bounds
docs: clarify local memory setup
test: cover mirror relay consent flow
```

### Project Principles

Every change should preserve these constraints:

1. **Game before dashboards:** let the player take a consequential action before explaining the system.
2. **Actions before dialogue:** stories and relationship changes must trace back to real action evidence.
3. **Rules before models:** models may propose intent, dialogue, and actions but cannot mutate world state directly.
4. **Privacy by default:** real-life fragments, relationships, and memories must be consented, revocable, and deletable.
5. **One spatial language:** people, furniture, collision, interaction distances, and camera share world coordinates.
6. **Development assets are not release assets:** loading successfully is not the same as meeting the art-release bar.

### Code and Content Guidelines

- Preserve the existing ESM and browser local-first architecture unless an architectural change has been discussed.
- Reuse existing modules, design tokens, and tooling before adding dependencies.
- Never bypass the rules engine to mutate relationships, memories, task completion, or city metrics.
- Keep user-facing copy accurate and restrained; do not make therapy, diagnostic, or crisis-support claims.
- Add graceful degradation so the core single-player experience survives unavailable cloud services.
- Consider keyboard, touch, responsive layout, and basic accessibility when changing interactions.

### 3D and Visual Contributions

For interiors, characters, or 3D assets:

- Preserve X/Z coordinates, grounding, colliders, interaction anchors, and walkable routes.
- Do not replace characters that require real 3D orbiting with 2D billboards.
- Do not sacrifice movement, rotation, character following, or performance for a single screenshot.
- Release assets need source information, multiview references, Web LODs, and release-quality verification.
- Include desktop four-direction and mobile screenshots. Animation changes should also check blinking, hand contact, elbow and knee volume, and foot planting.

See the [3D interior fidelity standard](docs/INTERIOR_3D_FIDELITY.md) and [3D model pipeline](docs/INTERIOR_3D_MODEL_PIPELINE.md).

### Verification

Every code PR should run at least:

```bash
npm run check
npm run build
git diff --check
```

Add checks based on scope:

| Change area | Recommended verification |
| --- | --- |
| Social simulation / relationships | `npm run test:evolution` |
| Narrative / Agents | `npm run verify:narrative-runtime` and relevant episode checks |
| Interior physics | `npm run verify:interior-physics` |
| 3D characters / camera | `npm run verify:interior-character-exploration`, `npm run verify:characters:civic` |
| Scene transitions | `npm run verify:interior-scene-flow`, `npm run verify:interior-transitions` |
| Visual fidelity | `npm run verify:reference-fidelity:v3` plus desktop/mobile screenshots |
| Performance | `npm run benchmark:interior` with before/after measurements |
| Documentation only | Local links, image paths, and `git diff --check` |

If bundled browser automation is unavailable, use a local Chrome / Chromium installation for equivalent verification. Existing unrelated warnings may be documented in the PR; new errors must not be hidden.

### Security and Privacy

Never commit:

- API keys, tokens, private keys, production environment variables, or real credentials.
- Unsanitized user data, interviews, conversations, relationship records, or personal memories.
- Third-party assets, models, fonts, or restricted datasets without clear permission.
- Any implementation that places a production secret in browser code.

Do not paste credentials or sensitive exploit details into a public issue. Use a private maintainer channel when one is available.

### Pull Request Checklist

Before submitting:

- [ ] The PR has one clear goal and explains why it matters.
- [ ] Behavior changes, edge cases, and user impact are documented.
- [ ] The description lists tests and manual checks actually performed.
- [ ] Changed UI includes desktop and mobile screenshots.
- [ ] New or changed behavior updates the relevant README or design documentation.
- [ ] No secrets, personal data, or unlicensed assets are included.
- [ ] The branch is based on current `main` and contains no unrelated files.
- [ ] CI and Vercel Preview pass, or a reproducible external blocker is documented.

Suggested PR body:

```markdown
## Summary
- What changed

## Why
- Why this change is needed
- Root cause or product context

## Impact
- Player, performance, data, or compatibility impact

## Verification
- `npm run check`
- `npm run build`
- Relevant focused and manual checks

## Screenshots
- Before/after images for UI or 3D changes

## Known limitations
- Current boundaries and follow-up work
```

### Reporting Issues

Please include:

- A concise description and expected behavior.
- Minimal reproduction steps.
- Browser, operating system, device type, and commit/version.
- Console output, screenshots, or a recording.
- Whether saves, privacy, collision, mobile, or production builds are affected.

Merged contributions are released under the project's [MIT License](LICENSE).
