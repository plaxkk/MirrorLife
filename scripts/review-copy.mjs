import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = [
  "game.html",
  "public/engine.js",
  "public/game.js",
  "PRODUCT_DESIGN.md"
];

const rules = [
  {
    name: "避免英式抽象：旧身份/身份松动",
    pattern: /旧身份|身份松动/g,
    suggestion: "写成“熟悉的生活开始变化”“原来的角色不再适合”。"
  },
  {
    name: "避免生造称谓：醒梦人",
    pattern: /醒梦人/g,
    suggestion: "写成“重新思考工作意义的人”“正在整理自己的人”。"
  },
  {
    name: "避免口号化：同样向光",
    pattern: /同样向光|向光的人/g,
    suggestion: "写成“也愿意认真生活的人”“也愿意往明亮处走的人”。"
  },
  {
    name: "避免悬浮隐喻：这束光",
    pattern: /这束光/g,
    suggestion: "写成“这一步”“这一刻”“这句话”。"
  },
  {
    name: "避免翻译腔：把生命交给",
    pattern: /把生命交给/g,
    suggestion: "写成“把时间和热情交给”。"
  },
  {
    name: "避免机制感：流程接走",
    pattern: /流程接走/g,
    suggestion: "写成“被流程和工具接了过去”。"
  },
  {
    name: "避免概念堆叠：亏欠里解放",
    pattern: /亏欠里解放/g,
    suggestion: "写成“让爱不再变成亏欠”。"
  },
  {
    name: "避免动作不清：练习真实",
    pattern: /练习真实/g,
    suggestion: "写成“说真话”“说出真实感受”。"
  },
  {
    name: "避免产品黑话：价值回声",
    pattern: /价值回声/g,
    suggestion: "写成“选择回声”。"
  },
  {
    name: "避免产品黑话：内在转向",
    pattern: /内在转向/g,
    suggestion: "写成“最近的变化”“自我变化”。"
  },
  {
    name: "避免咨询黑话：真实痛点",
    pattern: /真实痛点/g,
    suggestion: "写成“真正让你在意的是什么”。"
  },
  {
    name: "避免别扭口语：撑场景",
    pattern: /撑场景/g,
    suggestion: "写成“撑了很久”。"
  },
  {
    name: "避免方位翻译腔：现实侧",
    pattern: /现实侧/g,
    suggestion: "写成“现实这边”或“现实”。"
  },
  {
    name: "避免过度诗化：清澈的空间",
    pattern: /清澈的空间/g,
    suggestion: "写成“安静时间”。"
  }
];

function lineAndColumn(source, index) {
  const before = source.slice(0, index);
  const lines = before.split(/\r?\n/);
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

const findings = [];

for (const relativeFile of files) {
  const absoluteFile = path.join(root, relativeFile);
  if (!fs.existsSync(absoluteFile)) continue;
  const source = fs.readFileSync(absoluteFile, "utf8");

  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(source)) !== null) {
      const position = lineAndColumn(source, match.index);
      const line = source.split(/\r?\n/)[position.line - 1]?.trim() || "";
      findings.push({
        file: relativeFile,
        line: position.line,
        column: position.column,
        match: match[0],
        rule: rule.name,
        suggestion: rule.suggestion,
        preview: line
      });
    }
  }
}

if (findings.length) {
  console.error("中文语境审阅发现需要处理的表达：");
  findings.forEach((finding) => {
    console.error(
      `- ${finding.file}:${finding.line}:${finding.column} ${finding.rule} “${finding.match}”`
    );
    console.error(`  建议：${finding.suggestion}`);
    console.error(`  原文：${finding.preview}`);
  });
  process.exit(1);
}

console.log("中文语境审阅通过：未发现 MirrorLife 高风险表达。");
