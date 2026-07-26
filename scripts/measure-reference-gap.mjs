#!/usr/bin/env node
// Measures the rendered frame against the reference illustration on axes that
// can actually be moved by rendering work, and prints a signed gap per axis.
//
// This exists because the fidelity loop that produced v1–v146 judged every
// version by eye, so the same three findings were re-worded 20 times while the
// underlying constants oscillated inside a fixed band. A numeric gap makes a
// change either an improvement or a regression, not a matter of description.
//
// usage: node scripts/measure-reference-gap.mjs [current.png] [reference.png]
import fs from "node:fs";
import { PNG } from "pngjs";

const HUD_BANDS = [
  // The HUD is authored chrome, identical in both images by design. Sampling
  // it would report agreement that has nothing to do with the 3D scene.
  { top: 0, bottom: 0.115 },
  { top: 0.86, bottom: 1 }
];

function load(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function resampleToGrid(png, gridW, gridH) {
  // Box-filter to a common grid so two different resolutions compare fairly.
  const cells = new Float64Array(gridW * gridH * 3);
  const counts = new Float64Array(gridW * gridH);
  for (let y = 0; y < png.height; y += 1) {
    const v = y / png.height;
    if (HUD_BANDS.some((b) => v >= b.top && v < b.bottom)) continue;
    const gy = Math.min(gridH - 1, Math.floor((v - 0.115) / (0.86 - 0.115) * gridH));
    if (gy < 0) continue;
    for (let x = 0; x < png.width; x += 1) {
      const gx = Math.min(gridW - 1, Math.floor(x / png.width * gridW));
      const si = (png.width * y + x) << 2;
      const ci = (gy * gridW + gx) * 3;
      cells[ci] += png.data[si];
      cells[ci + 1] += png.data[si + 1];
      cells[ci + 2] += png.data[si + 2];
      counts[gy * gridW + gx] += 1;
    }
  }
  for (let i = 0; i < gridW * gridH; i += 1) {
    const n = counts[i] || 1;
    cells[i * 3] /= n;
    cells[i * 3 + 1] /= n;
    cells[i * 3 + 2] /= n;
  }
  return { cells, gridW, gridH };
}

function luma(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Tonal axes are scale-insensitive and read fine from a coarse grid. Detail
// axes are not: a 320×180 resample box-filters away exactly the stone chips,
// fabric weave and joinery edges it claims to measure, so it reports "no
// change" for material work that is plainly visible on screen. Detail is
// therefore measured on a grid close to the delivered frame instead.
// The detail grid must sit below BOTH sources' sampled resolution. The scene
// band excluding HUD is 1280×536 in a capture and 1672×701 in the reference;
// sampling either upward turns nearest-neighbour blockiness into fake edges,
// and because the two upsample by different factors the comparison inverts.
// 1024×428 keeps the shared 2.39:1 band and downsamples both.
const TONE_GRID = { width: 320, height: 180 };
const DETAIL_GRID = { width: 1024, height: 428 };

function analyse(png) {
  const GRID_W = TONE_GRID.width;
  const GRID_H = TONE_GRID.height;
  const { cells } = resampleToGrid(png, GRID_W, GRID_H);

  const lumas = new Float64Array(GRID_W * GRID_H);
  let satSum = 0;
  let warmSum = 0;
  for (let i = 0; i < GRID_W * GRID_H; i += 1) {
    const r = cells[i * 3] / 255;
    const g = cells[i * 3 + 1] / 255;
    const b = cells[i * 3 + 2] / 255;
    lumas[i] = luma(r, g, b);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    satSum += max === 0 ? 0 : (max - min) / max;
    warmSum += r - b;
  }

  const mean = lumas.reduce((a, b) => a + b, 0) / lumas.length;
  const variance = lumas.reduce((a, b) => a + (b - mean) ** 2, 0) / lumas.length;

  // Local contrast: mean absolute laplacian. Reads as "how much form and
  // material separation survives at viewing scale" — the axis the QA record
  // kept describing as "secondary craft" without ever measuring it.
  const detail = resampleToGrid(png, DETAIL_GRID.width, DETAIL_GRID.height);
  const dW = DETAIL_GRID.width;
  const dH = DETAIL_GRID.height;
  const detailLumas = new Float64Array(dW * dH);
  for (let i = 0; i < dW * dH; i += 1) {
    detailLumas[i] = luma(detail.cells[i * 3] / 255, detail.cells[i * 3 + 1] / 255, detail.cells[i * 3 + 2] / 255);
  }
  let laplacian = 0;
  let edges = 0;
  for (let y = 1; y < dH - 1; y += 1) {
    for (let x = 1; x < dW - 1; x += 1) {
      const i = y * dW + x;
      const l = 4 * detailLumas[i] - detailLumas[i - 1] - detailLumas[i + 1] - detailLumas[i - dW] - detailLumas[i + dW];
      laplacian += Math.abs(l);
      if (Math.abs(l) > 0.06) edges += 1;
    }
  }
  const inner = (dW - 2) * (dH - 2);

  // Tonal spread across the frame's thirds: the reference pools sunlight, so
  // its rows differ from each other far more than a flatly lit room's do.
  const rowMeans = [];
  for (let band = 0; band < 3; band += 1) {
    let sum = 0;
    let n = 0;
    for (let y = Math.floor(band * GRID_H / 3); y < Math.floor((band + 1) * GRID_H / 3); y += 1) {
      for (let x = 0; x < GRID_W; x += 1) {
        sum += lumas[y * GRID_W + x];
        n += 1;
      }
    }
    rowMeans.push(sum / n);
  }

  return {
    luma: mean,
    lumaStdDev: Math.sqrt(variance),
    saturation: satSum / (GRID_W * GRID_H),
    warmth: warmSum / (GRID_W * GRID_H),
    localContrast: laplacian / inner,
    detailDensity: edges / inner,
    verticalLightSpread: Math.max(...rowMeans) - Math.min(...rowMeans)
  };
}

const AXES = [
  { key: "luma", label: "全帧亮度", tolerance: 0.03 },
  { key: "lumaStdDev", label: "明暗动态范围", tolerance: 0.02 },
  { key: "saturation", label: "平均饱和度", tolerance: 0.03 },
  { key: "warmth", label: "暖冷偏移 (R-B)", tolerance: 0.02 },
  { key: "localContrast", label: "局部对比 (形体分离)", tolerance: 0.004 },
  { key: "detailDensity", label: "细节密度 (边缘占比)", tolerance: 0.015 },
  { key: "verticalLightSpread", label: "垂直光照落差", tolerance: 0.02 }
];

const currentFile = process.argv[2] || "dist/interior-3d-work/environment-review/00-public.png";
const referenceFile = process.argv[3]
  || "/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png";

const current = analyse(load(currentFile));
const reference = analyse(load(referenceFile));

console.log(`current   ${currentFile}`);
console.log(`reference ${referenceFile}\n`);
console.log("轴".padEnd(22) + "当前".padStart(10) + "参考".padStart(10) + "差值".padStart(10) + "   状态");
console.log("-".repeat(66));

let within = 0;
const gaps = {};
for (const axis of AXES) {
  const c = current[axis.key];
  const r = reference[axis.key];
  const delta = c - r;
  const ok = Math.abs(delta) <= axis.tolerance;
  if (ok) within += 1;
  gaps[axis.key] = { current: c, reference: r, delta, within: ok };
  const arrow = ok ? "✓ 达标" : delta > 0 ? `✗ 偏高 ${(Math.abs(delta) / axis.tolerance).toFixed(1)}×` : `✗ 偏低 ${(Math.abs(delta) / axis.tolerance).toFixed(1)}×`;
  console.log(
    axis.label.padEnd(18) + c.toFixed(4).padStart(10) + r.toFixed(4).padStart(10)
    + (delta >= 0 ? "+" : "") + delta.toFixed(4).padStart(9) + "   " + arrow
  );
}
console.log("-".repeat(66));
console.log(`${within}/${AXES.length} 轴在容差内`);

if (process.env.MIRRORLIFE_GAP_JSON) {
  fs.writeFileSync(process.env.MIRRORLIFE_GAP_JSON, `${JSON.stringify({ current: currentFile, gaps, within, total: AXES.length }, null, 2)}\n`);
}
