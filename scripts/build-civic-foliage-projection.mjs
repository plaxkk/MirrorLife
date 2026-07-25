import fs from "node:fs/promises";
import { PNG } from "pngjs";

const sourcePath = "public/assets/interiors/textures/atelier-window-view.png";
const outputPath = "public/assets/interiors/textures/civic-foliage-gobo-v1.png";
const shadowOutputPath = "public/assets/interiors/textures/civic-foliage-shadow-v1.png";
const source = PNG.sync.read(await fs.readFile(sourcePath));
const size = 512;
const output = new PNG({ width: size, height: size });
const shadowOutput = new PNG({ width: size, height: size });

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const smoothstep = (minimum, maximum, value) => {
  const t = clamp((value - minimum) / Math.max(0.0001, maximum - minimum));
  return t * t * (3 - 2 * t);
};

function rgbToHsv(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  const delta = maximum - minimum;
  let hue = 0;
  if (delta > 0.0001) {
    if (maximum === r) hue = 60 * (((g - b) / delta) % 6);
    else if (maximum === g) hue = 60 * (((b - r) / delta) + 2);
    else hue = 60 * (((r - g) / delta) + 4);
  }
  if (hue < 0) hue += 360;
  return {
    hue,
    saturation: maximum <= 0.0001 ? 0 : delta / maximum,
    value: maximum
  };
}

// The upper-left window-view crop is a real, internally licensed foliage
// photograph. Extract only its leaf/branch silhouette so the runtime projects
// believable light transport instead of synthesising decorative ellipses.
const crop = {
  x: 0,
  y: 0,
  width: Math.min(source.width, 760),
  height: Math.min(source.height, 300)
};
const foliageMask = new Float32Array(size * size);

for (let y = 0; y < size; y += 1) {
  for (let x = 0; x < size; x += 1) {
    const sourceX = Math.min(
      source.width - 1,
      Math.floor(crop.x + (x / Math.max(1, size - 1)) * (crop.width - 1))
    );
    const sourceY = Math.min(
      source.height - 1,
      Math.floor(crop.y + (y / Math.max(1, size - 1)) * (crop.height - 1))
    );
    const sourceOffset = (sourceY * source.width + sourceX) * 4;
    const red = source.data[sourceOffset];
    const green = source.data[sourceOffset + 1];
    const blue = source.data[sourceOffset + 2];
    const { hue, saturation, value } = rgbToHsv(red, green, blue);
    const leafHue = smoothstep(52, 70, hue) * (1 - smoothstep(132, 164, hue));
    const leafChroma = smoothstep(0.11, 0.3, saturation);
    const leafDepth = 0.36 + 0.64 * (1 - smoothstep(0.32, 0.94, value));
    const upperBranch = y < size * 0.26
      ? smoothstep(0.08, 0.34, saturation) * (1 - smoothstep(0.18, 0.54, value))
      : 0;
    foliageMask[y * size + x] = clamp(Math.max(leafHue * leafChroma * leafDepth, upperBranch));
  }
}

function boxBlur(mask, radius) {
  const horizontal = new Float32Array(mask.length);
  const result = new Float32Array(mask.length);
  for (let y = 0; y < size; y += 1) {
    let sum = 0;
    for (let x = -radius; x <= radius; x += 1) {
      sum += mask[y * size + Math.max(0, Math.min(size - 1, x))];
    }
    for (let x = 0; x < size; x += 1) {
      horizontal[y * size + x] = sum / (radius * 2 + 1);
      sum -= mask[y * size + Math.max(0, x - radius)];
      sum += mask[y * size + Math.min(size - 1, x + radius + 1)];
    }
  }
  for (let x = 0; x < size; x += 1) {
    let sum = 0;
    for (let y = -radius; y <= radius; y += 1) {
      sum += horizontal[Math.max(0, Math.min(size - 1, y)) * size + x];
    }
    for (let y = 0; y < size; y += 1) {
      result[y * size + x] = sum / (radius * 2 + 1);
      sum -= horizontal[Math.max(0, y - radius) * size + x];
      sum += horizontal[Math.min(size - 1, y + radius + 1) * size + x];
    }
  }
  return result;
}

const softenedMask = boxBlur(foliageMask, 4);
for (let y = 0; y < size; y += 1) {
  for (let x = 0; x < size; x += 1) {
    const foliage = softenedMask[y * size + x];
    // SpotLight.map uses luminance as transmission. Open sky/plaster remains
    // bright; foliage blocks between 62% and 88% of the projected warm light.
    const transmission = Math.round(255 * (1 - foliage * 0.82));
    const outputOffset = (y * size + x) * 4;
    output.data[outputOffset] = transmission;
    output.data[outputOffset + 1] = transmission;
    output.data[outputOffset + 2] = transmission;
    output.data[outputOffset + 3] = 255;
    shadowOutput.data[outputOffset] = 89;
    shadowOutput.data[outputOffset + 1] = 83;
    shadowOutput.data[outputOffset + 2] = 65;
    shadowOutput.data[outputOffset + 3] = Math.round(255 * foliage * 0.68);
  }
}

await fs.writeFile(outputPath, PNG.sync.write(output));
await fs.writeFile(shadowOutputPath, PNG.sync.write(shadowOutput));
console.log(`${outputPath} + ${shadowOutputPath} (${size}x${size})`);
