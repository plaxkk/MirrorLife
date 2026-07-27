import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const sourceFiles = execFileSync(
  "git",
  [
    "ls-files",
    "*.md",
    "*.html",
    "*.css",
    "*.js",
    "*.mjs",
    "*.json",
  ],
  { encoding: "utf8" },
)
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean);

const volatileReferencePatterns = [
  { label: "macOS clipboard cache", pattern: /\/var\/folders\/[^\s`"')]+/g },
  { label: "WeChat temporary file", pattern: /\/Library\/Containers\/[^\s`"')]+\/(?:temp|RWTemp)\/[^\s`"')]+/gi },
  { label: "Codex clipboard file", pattern: /codex-clipboard-[^\s`"')]+/g },
];

const violations = [];

for (const file of sourceFiles) {
  if (file === "scripts/verify-stable-project-references.mjs") continue;
  const source = readFileSync(file, "utf8");
  for (const { label, pattern } of volatileReferencePatterns) {
    for (const match of source.matchAll(pattern)) {
      const line = source.slice(0, match.index).split("\n").length;
      violations.push(`${file}:${line} ${label}: ${match[0]}`);
    }
  }
}

if (violations.length > 0) {
  console.error("Volatile project references found:\n" + violations.join("\n"));
  console.error("Copy required files into design/references and reference the repository path instead.");
  process.exit(1);
}

console.log(`Stable project reference check passed: ${sourceFiles.length} tracked text files.`);
