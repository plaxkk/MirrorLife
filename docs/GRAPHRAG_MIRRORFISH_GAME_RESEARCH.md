# GraphRAG + MiroFish Research For MirrorLife

> Purpose: evaluate how the MiroFish project and GraphRAG-style memory can inform MirrorLife's next social simulation architecture.

## 1. Research Scope

This note assumes `mirrorfish` refers to the public MiroFish project:

- Repository: <https://github.com/666ghj/MiroFish>
- Tagline: "A Simple and Universal Swarm Intelligence Engine, Predicting Anything"
- License: AGPL-3.0

MiroFish should be treated as an architectural reference, not as code to copy directly into MirrorLife. Its AGPL license creates open-source obligations if code is reused. For MirrorLife, the useful parts are the product pipeline and simulation ideas.

GraphRAG source references:

- Microsoft GraphRAG paper: <https://www.microsoft.com/en-us/research/publication/from-local-to-global-a-graph-rag-approach-to-query-focused-summarization/>
- Microsoft GraphRAG docs: <https://microsoft.github.io/graphrag/>

OASIS reference:

- OASIS: <https://github.com/camel-ai/oasis>

## 2. What MiroFish Actually Does

MiroFish is not a game in the normal sense. It is closer to a prediction sandbox:

1. User uploads seed material such as news, policy drafts, financial signals, reports, or fiction.
2. System extracts seed information and builds a graph/memory layer.
3. System creates a parallel digital world populated by many agents.
4. Agents interact in social-media-like environments.
5. System generates prediction reports and lets users inspect or interview agents.

Its README describes the workflow as:

1. Graph Building: seed extraction, memory injection, GraphRAG construction.
2. Environment Setup: entity relationship extraction, persona generation, agent configuration.
3. Simulation: dual-platform parallel simulation, prediction parsing, temporal memory updates.
4. Report Generation: ReportAgent with tools for post-simulation analysis.
5. Deep Interaction: chat with agents and the ReportAgent.

The cloned code confirms this structure:

- `GraphBuilderService` builds a Zep graph from input text and ontology.
- `OasisProfileGenerator` turns graph entities into OASIS agent profiles.
- `SimulationConfigGenerator` generates time, event, agent, and platform configuration.
- `ZepGraphMemoryUpdater` writes agent activities back into graph memory.
- Simulation APIs expose start/stop, timeline, actions, agent stats, posts/comments, and interview endpoints.

## 3. What GraphRAG Contributes

GraphRAG is useful when simple vector retrieval is not enough.

Microsoft's description is directly relevant to MirrorLife because the game needs to answer questions like:

- Why did this agent react this way?
- Which relationship path caused this consequence?
- What is the main tension in this neighborhood?
- Which unresolved social thread should become the player's next choice?

The GraphRAG process:

1. Split source material into text units.
2. Extract entities, relationships, and key claims.
3. Build a knowledge graph.
4. Cluster the graph into communities.
5. Generate summaries for communities.
6. Query through global search, local search, DRIFT search, or basic vector search.

For MirrorLife, this should be adapted from "answering corpus questions" into "running a playable city memory."

## 4. Strategic Fit For MirrorLife

MiroFish is optimized for prediction reports. MirrorLife should be optimized for player agency.

The useful translation is:

| MiroFish concept | MirrorLife translation |
| --- | --- |
| Seed material | Player reality fragment, previous city events, agent memories |
| GraphRAG construction | Living city causality graph |
| Persona generation | Citizen agents, institutions, avatar agents |
| Dual social platform simulation | City scenes, channels, neighborhoods, public/private threads |
| Prediction report | First-minute causal result plus inspectable "why" |
| Agent interview | Talk to a citizen, avatar, narrator, or resolver |
| Dynamic temporal memory | Overnight reflection, rumor spread, trust/obligation updates |

MirrorLife should not copy MiroFish's "simulate thousands of agents and return a report" product shape. The game should use GraphRAG to make every consequence traceable and every next choice grounded in social relationships.

## 5. Proposed MirrorLife Graph Model

Start with a small property graph that can run locally before adopting external graph infrastructure.

### 5.1 Node Types

- `PlayerFragment`: the user's input life fragment.
- `AvatarAction`: the player's chosen or avatar-proposed action.
- `Agent`: player avatar, citizen, narrator, moderator, planner.
- `Citizen`: a city character with memory and constraints.
- `Place`: home, school, workplace, plaza, neighborhood.
- `Institution`: company, school, family, platform, community group.
- `Event`: concrete observable city event.
- `Claim`: one belief, interpretation, rumor, or stated motive.
- `Relationship`: trust, conflict, obligation, affinity, authority.
- `Task`: promise, repair action, investigation, social obligation.
- `Resource`: attention, trust reserve, repair capacity, public safety.
- `Norm`: neighborhood rule or social expectation.
- `EmotionState`: mood/state change attached to an agent.
- `Consequence`: resolved change from the Simulation Resolver.
- `CommunitySummary`: generated summary for a graph cluster.

### 5.2 Edge Types

- `CAUSED`: action or event caused another event.
- `AFFECTS`: event affects agent/resource/place.
- `BELIEVES`: agent believes a claim.
- `CONTRADICTS`: claim conflicts with another claim.
- `TRUSTS`: agent has trust toward another agent.
- `OWES`: one agent has obligation toward another.
- `WITNESSED`: agent saw an event.
- `SPREADS_TO`: rumor or claim moved through a relationship path.
- `BELONGS_TO`: agent belongs to group, place, or institution.
- `LOCATED_AT`: event or agent is tied to a place.
- `CLAIMS`: agent made a claim.
- `OWNS_TASK`: agent claimed or owns a task.
- `EVIDENCED_BY`: consequence is supported by events/claims.
- `NEXT_CHOICE`: graph tension creates a playable next choice.

### 5.3 Minimum Record Shape

```ts
type GraphNode = {
  id: string;
  type: string;
  label: string;
  summary: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  weight?: number;
};

type GraphEdge = {
  id: string;
  type: string;
  source: string;
  target: string;
  summary: string;
  evidenceEventIds: string[];
  confidence: number;
  createdAt: number;
};
```

This can live in localStorage or IndexedDB first, then move to SQLite/Postgres/graph DB when the backend exists.

## 6. Runtime Architecture

### 6.1 Ingestion Layer

Inputs:

- Player reality fragment.
- Existing event log.
- Echo archive.
- Agent memory cards.
- Future uploaded seed material.

Output:

- Candidate nodes.
- Candidate edges.
- Key claims.
- Confidence scores.

MVP approach:

- Start with rule/template extraction from the current first-minute loop.
- Later add LLM extraction.
- Keep raw evidence event IDs so each consequence is explainable.

### 6.2 Graph Indexer

Responsibilities:

- Deduplicate entities.
- Merge aliases.
- Update relationship weights.
- Maintain claim contradictions.
- Build lightweight community clusters.
- Generate/update community summaries.

MVP can avoid heavy graph algorithms. Use deterministic buckets first:

- by place,
- by relationship,
- by unresolved task,
- by agent,
- by shared claim or rumor.

### 6.3 Retrieval Layer

MirrorLife needs three retrieval modes:

- Local search: explain one agent, one relationship, or one consequence.
- Global search: summarize the current city tension or neighborhood mood.
- Directed search: find next playable pressure point, similar to DRIFT-style expansion from an entity plus its community context.

### 6.4 Agent Proposal Layer

Agents should not mutate the world.

Given retrieved graph context, each agent can submit an action proposal:

```ts
type ActionProposal = {
  agentId: string;
  intent: string;
  proposedAction: string;
  targetNodeIds: string[];
  expectedEffects: Array<{
    targetId: string;
    delta: string;
  }>;
  riskLevel: "low" | "medium" | "high";
  evidenceEdgeIds: string[];
};
```

### 6.5 Simulation Resolver

The resolver is the authority.

Responsibilities:

- Merge competing proposals.
- Apply rules and safety constraints.
- Decide state changes.
- Write new graph nodes/edges.
- Produce the visible causal rail.

This matches prior product decisions: agents propose; the world server resolves.

### 6.6 Narrative Renderer

Output must stay simple:

```text
You did: <one action>
Affected: <person/group/place>
Changed: <state delta>
Because: <one graph-backed reason>
Next: <one or three choices>
```

GraphRAG depth should be inspectable, not dumped into the first screen.

## 7. Game Loop With GraphRAG

### 7.1 First-Minute Graph Loop

1. Player enters a reality fragment.
2. System extracts initial graph:
   - player fragment,
   - involved people,
   - implied tension,
   - possible social resource.
3. Player chooses one avatar action.
4. Resolver writes:
   - `AvatarAction`,
   - `Consequence`,
   - `AFFECTS` edge,
   - `EVIDENCED_BY` edge.
5. UI shows the causal rail.
6. System creates one `NEXT_CHOICE` edge from graph tension.

Acceptance target:

The player can answer: what did I do, who changed, why did it happen, what can I influence next?

### 7.2 Social Ripple Loop

1. Resolver identifies agents connected to the affected node.
2. Agents submit low-cost reactions.
3. Graph records new claims, mood changes, and relationship deltas.
4. UI shows one visible ripple path.

Example:

```text
Reality fragment: I stayed late to help a colleague.
Action: Let avatar quietly acknowledge their effort.
Graph result: Colleague trust +1, manager attention +1, team obligation created.
Ripple: another coworker interprets it as favoritism.
Next choice: clarify publicly, help privately, or observe one more turn.
```

### 7.3 Community Summary Loop

At day change:

1. Cluster recent graph changes.
2. Generate one summary per cluster.
3. Let narrator compress them into "City Echo."
4. Convert unresolved tensions into next-day tasks.

This is the game equivalent of GraphRAG community summaries.

### 7.4 Agent Interview Loop

Borrow from MiroFish's interview concept, but make it playful:

- Ask a citizen: "Why did you react that way?"
- Ask narrator: "What is the main tension today?"
- Ask avatar: "What would you do next?"
- Ask resolver: "What evidence supports this consequence?"

Each answer must cite graph nodes/edges internally, but the UI should display plain language.

## 8. Implementation Phases

### Phase 1: Local Graph Memory

No LLM required.

Tasks:

- Add local graph store around the current first-minute loop.
- Convert `firstLoop` and event log entries into graph nodes/edges.
- Show "because" backed by graph evidence.
- Add a debug view hidden behind a dev flag.

Deliverable:

- First action creates a replayable causal graph.

### Phase 2: Template GraphRAG Retrieval

Tasks:

- Add local search around affected agent/place/task.
- Add global summary from deterministic clusters.
- Use graph context to generate next choices.
- Keep all output template-based or fallback-safe.

Deliverable:

- Next choices come from graph tension, not hard-coded button text only.

### Phase 3: LLM Extractor And Summarizer

Tasks:

- Add optional backend proxy for graph extraction.
- Extract entities, relationships, and key claims from player fragments.
- Summarize graph communities at day change.
- Store evidence and confidence for each generated edge.

Deliverable:

- The game can ingest richer fragments without hand-authored parsing.

### Phase 4: Small Agent Swarm

Do not start with thousands of agents.

Tasks:

- Run 3-7 active agents per scene.
- Each agent receives local graph context and one community summary.
- Agents submit proposals.
- Simulation Resolver commits only one or two visible consequences.

Deliverable:

- The city feels alive without overwhelming the first screen.

### Phase 5: Claude Code Runner

Aligned with prior product decision: first real runner is Claude Code / Claude Agent SDK.

Tasks:

- Define an `AgentRuntimeAdapter`.
- Let Claude runner observe selected graph context.
- Require action proposals, not direct mutation.
- Add audit logs and budget controls.

Deliverable:

- A user-side local runner can participate in one scene safely.

### Phase 6: Persistent City Memory

Tasks:

- Move graph store to backend.
- Add accounts and room/session identity.
- Add graph snapshots and replay.
- Add memory deletion/reset controls.
- Add moderation and graph pollution safeguards.

Deliverable:

- A persistent social simulation city with explainable history.

## 9. Technical Choices

### Recommended MVP

- Keep the current frontend.
- Add a local graph module in `public/`.
- Store graph in localStorage or IndexedDB.
- Use deterministic extraction first.
- Add optional LLM extraction later through backend proxy.

### Avoid For MVP

- Do not introduce Neo4j/Zep/OASIS immediately.
- Do not run thousands of agents.
- Do not expose raw GraphRAG output to users.
- Do not let agents write state directly.
- Do not make a report dashboard the primary game UI.

### Later Options

- Zep: useful if we want hosted graph memory and entity extraction.
- OASIS: useful for large social-media-like simulations, but too heavy for first MirrorLife gameplay.
- Microsoft GraphRAG: useful for offline indexing and community summaries over large corpora.
- Neo4j/Memgraph: useful once graph query requirements exceed local storage.

## 10. Why This Makes The Game More Fun

GraphRAG should not be a backend buzzword. It should create player-facing fun:

- Consequences become explainable.
- Characters remember specific incidents.
- Rumors and trust travel through visible paths.
- The next choice comes from real social tension.
- Replays can show how different choices changed the graph.
- Agent actions feel grounded instead of random.

The player-facing promise:

```text
The city remembers what happened.
People react through relationships, not scripts.
Every consequence has a reason.
Every next choice comes from a living social graph.
```

## 11. Risks

- Cost: full GraphRAG indexing plus agents can be expensive.
- Latency: graph extraction and community summaries cannot block first-minute feedback.
- Hallucinated edges: LLM-created relations can corrupt world state.
- UX overload: graph views can make the game feel like a BI dashboard.
- Privacy: player fragments can contain sensitive life details.
- License: MiroFish is AGPL-3.0, so avoid copying code unless we accept obligations.
- Direction drift: MiroFish predicts; MirrorLife must remain a playable social simulation.

Mitigations:

- Use deterministic graph writes for core gameplay.
- Mark LLM-generated edges with confidence and evidence.
- Keep the resolver authoritative.
- Keep GraphRAG invisible in the first screen.
- Store private route/strategy docs in ignored files when needed.

## 12. Recommended Next Task

Create a small implementation task:

```text
GraphRAG Phase 1: Local causal graph memory for first-minute loop

Scope:
- Add a local graph store module.
- Convert first-loop input/action/result into nodes and edges.
- Render one graph-backed "because" line in the causal panel.
- Add hidden debug export for graph JSON.
- Keep all data local and deterministic.
```

This is the lowest-risk path to prove the idea before introducing backend GraphRAG, Zep, OASIS, or Claude runner integration.
