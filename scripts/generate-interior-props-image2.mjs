import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

loadLocalEnv();

const outputRoot = path.resolve("dist/assets/interior-props-image2");
const model = process.env.GPT_IMAGE_MODEL || "gpt-image-2";
const apiKey = process.env.OPENAI_API_KEY;

const stylePrompt = [
  "MirrorLife game prop asset.",
  "Single isolated object only, no extra objects, no labels, no text.",
  "Warm dopamine cel-shading cartoon style, isometric 3/4 view, thick clean ink outline, soft rounded forms, cozy humanistic feeling.",
  "Pure transparent background, centered composition, full object visible, game-ready PNG sprite.",
  "Match the source board's visual language: clean miniature interior props, gentle colors, readable silhouette, polished mobile-game asset.",
].join(" ");

const props = [
  ["hospital", "hospital_bed_monitor_iv", "hospital bed with a pink blanket, bedside monitor, IV stand, small wheels"],
  ["hospital", "reception_counter", "curved hospital reception desk with red cross sign, small monitor, tiny potted plant"],
  ["hospital", "medicine_cabinet", "tall medicine cabinet with glass shelves, bottles, lower drawers"],
  ["hospital", "medical_supply_podium", "small wooden medical supply podium with red cross emblem, notebook, plant"],
  ["kindergarten", "baby_stroller", "pink baby stroller with black wheels and rounded canopy"],
  ["kindergarten", "teddy_play_rug", "cute teddy bear sitting on a pink play rug with pillows"],
  ["kindergarten", "playroom_interior", "small cozy kindergarten nap room diorama with bed, toy blocks, window, curtains"],
  ["school_library", "chalkboard", "green classroom chalkboard on wooden stand with chalk and eraser"],
  ["school_library", "student_desk", "small student desk with open book, chair, backpack"],
  ["school_library", "reading_armchair_lamp", "green reading armchair with small round table, lamp, plant, pillow"],
  ["school_library", "bookcase", "wooden bookcase filled with colorful books"],
  ["school_library", "library_classroom_interior", "cozy library classroom diorama with bookshelves, desks, green armchair, arched window"],
  ["park_plaza", "notice_board", "wooden community notice board with pinned paper notices"],
  ["park_plaza", "wooden_bench", "simple wooden park bench"],
  ["park_plaza", "flower_fountain", "round park fountain surrounded by flowers and greenery"],
  ["park_plaza", "flower_planter", "rectangular wooden flower planter filled with colorful flowers"],
  ["park_plaza", "community_square", "small community square diorama with fountain, benches, flower beds, trees"],
  ["market_cafe", "produce_stall", "small striped canopy produce stall with fresh vegetables"],
  ["market_cafe", "pantry_shelf", "wooden pantry shelf with jars and kitchen goods"],
  ["market_cafe", "hot_food_counter", "small warm food counter with hanging lights and serving bowls"],
  ["market_cafe", "fruit_baskets", "two baskets of fresh fruit and vegetables"],
  ["market_cafe", "market_hall_interior", "small colorful indoor market diorama with three stalls and central table"],
  ["market_cafe", "cafe_table_corner", "cozy cafe corner with small chair, tree, round table, plant"],
  ["residence", "sofa_coffee_table", "green sofa with pillows and low wooden coffee table"],
  ["residence", "dining_table_set", "small dining table with four wooden chairs and potted plant"],
  ["residence", "single_bed_nightstand", "single wooden bed with green blanket and small nightstand"],
  ["residence", "vanity_dresser", "wooden vanity dresser with mirror, drawers, small plant"],
  ["residence", "sink_vanity", "wooden bathroom sink vanity with arched mirror"],
  ["residence", "bedroom_suite_interior", "cozy bedroom diorama with two green beds, railing, dresser, plants"],
  ["residence", "round_dining_table", "round dining table with four green chairs and small plant"],
  ["residence", "drawer_cabinet", "tall wooden drawer cabinet with colored front panels"],
  ["residence", "living_room_interior", "cozy living room diorama with windows, round table, green chairs, lamp, plants"],
  ["studio_workshop", "painting_easel", "wooden painting easel with landscape painting"],
  ["studio_workshop", "art_supply_cart", "small rolling cart full of paint brushes and art supplies"],
  ["studio_workshop", "gallery_frames", "cluster of framed wall paintings"],
  ["studio_workshop", "meditation_rug", "round rug with cushion and potted flower for meditation"],
  ["studio_workshop", "maker_workbench", "wooden maker workbench with tools, jars, stool"],
  ["studio_workshop", "writing_desk", "small writing desk with laptop, coffee cup, wooden chair"],
  ["studio_workshop", "tool_chest", "green rolling tool chest with tools on top"],
  ["studio_workshop", "drill_press", "compact workshop drill press machine"],
  ["greenhouse_garden", "glass_greenhouse", "small glass greenhouse full of potted plants"],
  ["greenhouse_garden", "plant_shelf", "rolling plant shelf filled with potted plants"],
  ["greenhouse_garden", "flower_bed_watering_can", "raised flower bed with watering can"],
  ["greenhouse_garden", "fenced_garden", "small fenced garden patch with flowers, stone path, greenery"],
  ["memorial_cemetery", "cherry_blossom_tree", "small cherry blossom tree planter"],
  ["memorial_cemetery", "stone_lantern_garden", "small stone lantern garden with stepping stones and shrubs"],
  ["memorial_cemetery", "tombstone_memorial", "small respectful tombstone memorial with flowers"],
  ["memorial_cemetery", "memorial_bench", "wooden memorial bench with small plants"],
  ["memorial_cemetery", "low_memorial_table", "low memorial offering table with cushion, vase, candle"],
  ["memorial_cemetery", "long_memorial_altar", "long memorial altar table with flowers, framed photo, candle, small offerings"],
  ["memorial_cemetery", "flower_vase", "clear vase with pink flowers"],
  ["memorial_cemetery", "flower_box", "wooden flower box with white daisies"],
  ["memorial_cemetery", "small_fountain", "small stone fountain basin"],
  ["memorial_cemetery", "garden_lantern", "small garden lantern"],
  ["memorial_cemetery", "cemetery_garden_interior", "peaceful memorial garden diorama with cherry blossom tree, tombstone, flowers, path"],
];

function buildPrompt(description) {
  return `${stylePrompt}\nObject to generate: ${description}.`;
}

async function generateProp([category, name, description]) {
  const prompt = buildPrompt(description);
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
      background: "transparent",
      output_format: "png",
      quality: "high",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Image generation failed for ${category}/${name}: ${response.status} ${text}`);
  }

  const json = await response.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`Image generation returned no b64_json for ${category}/${name}`);
  }

  const dir = path.join(outputRoot, category);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${name}.png`), Buffer.from(b64, "base64"));

  return {
    category,
    name,
    description,
    file: `${category}/${name}.png`,
    prompt,
    size: [1024, 1024],
    model,
  };
}

if (!apiKey) {
  await mkdir(outputRoot, { recursive: true });
  await writeFile(
    path.join(outputRoot, "prompts.json"),
    `${JSON.stringify({
      count: props.length,
      model,
      outputRoot,
      source: "dist/assets/mirrorlife-interior-prop-design-board.png",
      items: props.map(([category, name, description]) => ({
        category,
        name,
        description,
        file: `${category}/${name}.png`,
        prompt: buildPrompt(description),
        size: [1024, 1024],
      })),
    }, null, 2)}\n`,
  );
  console.error("OPENAI_API_KEY is required to generate fresh image2 assets.");
  console.error(`Target output: ${outputRoot}`);
  console.error(`Prompt manifest written to ${path.join(outputRoot, "prompts.json")}`);
  process.exit(1);
}

await mkdir(outputRoot, { recursive: true });

const manifest = [];
for (const prop of props) {
  console.log(`Generating ${prop[0]}/${prop[1]}...`);
  manifest.push(await generateProp(prop));
}

await writeFile(
  path.join(outputRoot, "manifest.json"),
  `${JSON.stringify({ count: manifest.length, model, items: manifest }, null, 2)}\n`,
);

console.log(`Generated ${manifest.length} image2 assets in ${outputRoot}`);
