import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync
} from "node:fs";
import path from "node:path";

const ROOT_RUNTIME_FILES = Object.freeze([
  "analytics-entry.js",
  "game.css",
  "game.html",
  "index.html",
  "package-lock.json",
  "package.json",
  "pnpm-lock.yaml",
  "vite.config.js",
  "scripts/lib/reference-fidelity-build-fingerprint.mjs"
]);

const RUNTIME_DIRECTORIES = Object.freeze([
  "src",
  "public/assets/characters"
]);

function collectFiles(rootDir, relativeDirectory) {
  const absoluteDirectory = path.join(rootDir, relativeDirectory);
  if (!existsSync(absoluteDirectory)) return [];
  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = path.posix.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) return collectFiles(rootDir, relativePath);
      return entry.isFile() ? [relativePath] : [];
    });
}

export function referenceFidelityBuildInputs(rootDir) {
  const publicRuntimeFiles = existsSync(path.join(rootDir, "public"))
    ? readdirSync(path.join(rootDir, "public"), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
      .map((entry) => path.posix.join("public", entry.name))
    : [];
  return [
    ...ROOT_RUNTIME_FILES.filter((relativePath) => (
      existsSync(path.join(rootDir, relativePath))
    )),
    ...publicRuntimeFiles,
    ...RUNTIME_DIRECTORIES.flatMap((relativeDirectory) => (
      collectFiles(rootDir, relativeDirectory)
    ))
  ].sort();
}

export function computeReferenceFidelityBuildFingerprint(rootDir) {
  const files = referenceFidelityBuildInputs(rootDir);
  if (!files.length) {
    throw new Error(`No reference-fidelity build inputs found under ${rootDir}`);
  }
  const hash = createHash("sha256");
  for (const relativePath of files) {
    const contents = readFileSync(path.join(rootDir, relativePath));
    const length = Buffer.allocUnsafe(8);
    length.writeBigUInt64BE(BigInt(contents.length));
    hash.update(relativePath);
    hash.update("\0");
    hash.update(length);
    hash.update(contents);
  }
  return `sha256:${hash.digest("hex")}`;
}
