/* ═══════════════════════════════════════════════════════════════
   MirrorLife - Local Causal Graph Memory
   Deterministic graph writes for the first-minute causal loop.
   ═══════════════════════════════════════════════════════════════ */

(function initCausalGraphMemory(global) {
  const GRAPH_VERSION = 1;
  const MAX_NODES = 90;
  const MAX_EDGES = 140;
  const MAX_RECORDS = 16;

  function now() {
    return Date.now();
  }

  function makeId(prefix) {
    const randomPart = Math.random().toString(36).slice(2, 8);
    return `${prefix}_${now().toString(36)}_${randomPart}`;
  }

  function shortText(value, limit = 48) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= limit) return text;
    return `${text.slice(0, limit - 1)}...`;
  }

  function normalizeArray(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function normalizeGraph(graph) {
    return {
      version: GRAPH_VERSION,
      nodes: normalizeArray(graph?.nodes),
      edges: normalizeArray(graph?.edges),
      records: normalizeArray(graph?.records)
    };
  }

  function pruneGraph(graph) {
    graph.nodes = graph.nodes.slice(-MAX_NODES);
    graph.edges = graph.edges.slice(-MAX_EDGES);
    graph.records = graph.records.slice(-MAX_RECORDS);
    return graph;
  }

  function buildNode(type, label, summary, tags = [], extra = {}) {
    const timestamp = now();
    return {
      id: makeId(type.toLowerCase()),
      type,
      label: shortText(label, 36),
      summary: shortText(summary, 120),
      tags: normalizeArray(tags),
      createdAt: timestamp,
      updatedAt: timestamp,
      ...extra
    };
  }

  function buildEdge(type, source, target, summary, evidenceEventIds = [], confidence = 1, extra = {}) {
    return {
      id: makeId(type.toLowerCase()),
      type,
      source,
      target,
      summary: shortText(summary, 140),
      evidenceEventIds: normalizeArray(evidenceEventIds),
      confidence,
      createdAt: now(),
      ...extra
    };
  }

  function inferFragmentTags(input = "") {
    const text = input.toLowerCase();
    const tags = ["first-loop"];
    if (/同事|工作|计划|会议|项目|老板|客户/.test(text)) tags.push("work");
    if (/朋友|家人|伴侣|同学|邻居/.test(text)) tags.push("relationship");
    if (/吵|冲突|分歧|误解|生气|焦虑|压力/.test(text)) tags.push("tension");
    if (/合作|帮|支持|完成|一起/.test(text)) tags.push("support");
    return tags;
  }

  function buildBecauseLine(payload) {
    const input = shortText(payload.input, 28);
    const action = payload.actionLabel || payload.actionType || "分身行动";
    const target = payload.targetName || "城市";
    const delta = payload.deltaSummary || "状态变化已被记录";
    return `因为你输入了“${input}”，分身选择“${action}”，所以${target}发生了变化：${delta}。`;
  }

  function recordFirstLoop(graphInput, payloadInput) {
    const graph = normalizeGraph(graphInput);
    const payload = payloadInput || {};
    const input = String(payload.input || "").trim();
    const timestamp = now();
    const actionLabel = payload.actionLabel || payload.actionType || "行动";
    const targetName = payload.targetName || "城市";
    const nextText = payload.nextText || "继续观察这条社会张力会怎样扩散。";
    const deltaSummary = payload.deltaSummary || "状态变化已被记录";

    const fragment = buildNode(
      "PlayerFragment",
      input || "现实片段",
      input || "玩家输入了一段现实片段。",
      inferFragmentTags(input),
      { weight: 1 }
    );
    const action = buildNode(
      "AvatarAction",
      actionLabel,
      payload.actionIntent || `${payload.actorName || "分身"}执行了${actionLabel}。`,
      ["first-loop", payload.actionType || "action"],
      { weight: 1, actionType: payload.actionType || "" }
    );
    const target = buildNode(
      payload.targetId ? "Citizen" : "Place",
      targetName,
      `${targetName}是这次行动的直接影响对象。`,
      ["affected-target"],
      { externalId: payload.targetId || "" }
    );
    const consequence = buildNode(
      "Consequence",
      "城市结果",
      payload.resultText || `${targetName}发生变化：${deltaSummary}。`,
      ["first-loop", "visible-result"],
      { weight: 1 }
    );
    const nextChoice = buildNode(
      "Task",
      "下一步选择",
      nextText,
      ["next-choice", "unresolved-thread"],
      { weight: 0.8 }
    );

    const evidenceIds = [fragment.id, action.id, consequence.id];
    const caused = buildEdge(
      "CAUSED",
      fragment.id,
      action.id,
      `现实片段触发了分身的${actionLabel}。`,
      [fragment.id],
      1
    );
    const affects = buildEdge(
      "AFFECTS",
      action.id,
      target.id,
      `${actionLabel}影响了${targetName}。`,
      evidenceIds,
      1,
      { delta: deltaSummary }
    );
    const evidenced = buildEdge(
      "EVIDENCED_BY",
      consequence.id,
      affects.id,
      "城市结果由本次行动和目标状态变化支撑。",
      evidenceIds,
      1
    );
    const next = buildEdge(
      "NEXT_CHOICE",
      consequence.id,
      nextChoice.id,
      nextText,
      [consequence.id],
      0.92
    );

    const record = {
      id: makeId("record"),
      kind: "first-loop",
      createdAt: timestamp,
      turn: Number.isFinite(payload.turn) ? payload.turn : 0,
      nodeIds: [fragment.id, action.id, target.id, consequence.id, nextChoice.id],
      edgeIds: [caused.id, affects.id, evidenced.id, next.id],
      evidenceEdgeIds: [affects.id, evidenced.id],
      becauseLine: buildBecauseLine({
        ...payload,
        deltaSummary,
        targetName,
        actionLabel
      })
    };

    graph.nodes.push(fragment, action, target, consequence, nextChoice);
    graph.edges.push(caused, affects, evidenced, next);
    graph.records.push(record);

    return {
      graph: pruneGraph(graph),
      record
    };
  }

  function latestRecord(graphInput) {
    const graph = normalizeGraph(graphInput);
    return graph.records[graph.records.length - 1] || null;
  }

  function exportGraph(graphInput) {
    return JSON.stringify(normalizeGraph(graphInput), null, 2);
  }

  global.CausalGraphMemory = {
    version: GRAPH_VERSION,
    normalizeGraph,
    recordFirstLoop,
    latestRecord,
    exportGraph
  };
})(window);
