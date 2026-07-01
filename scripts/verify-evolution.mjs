import fs from "node:fs";
import vm from "node:vm";

const engineSource = fs.readFileSync(new URL("../public/engine.js", import.meta.url), "utf8");

const storage = new Map();
const context = {
  console,
  Date,
  JSON,
  Math,
  Number,
  String,
  Array,
  Object,
  Set,
  Map,
  Promise,
  setTimeout,
  clearTimeout,
  localStorage: {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key)
  },
  document: {
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ innerHTML: "", textContent: "", innerText: "" })
  }
};

const verification = `
initEngineState();
state.society = buildSocietyFromInput("一个多巴胺风格的镜像社区，角色会长期生活、建立关系并根据社会缺口建设新场景。");

const actionSequence = [
  "mediate-relation",
  "survey-deficits",
  "host-commons",
  "night-watch",
  "survey-deficits",
  "host-commons"
];

const growthEvents = [];
for (const actionId of actionSequence) {
  const result = runOpenWorldAction(actionId);
  if (result?.growth) {
    growthEvents.push({
      actionId,
      scene: result.growth.zone.name,
      profession: result.growth.profession.name
    });
  }
}

const roadmap = getEvolutionRoadmap(state.society);
const unlocked = roadmap.filter((item) => item.unlocked);
const professionCount = new Set((state.society.growth.emergentProfessions || []).map((item) => item.id)).size;
const citizensWithPersona = getAliveCitizens(state.society).filter((citizen) => citizen.mbtiType && citizen.personaLabel && citizen.avatarShape).length;
const archetypeCount = MBTI_ARCHETYPES.length;
const layeredCitizens = getAliveCitizens(state.society).filter((citizen) =>
  citizen.bigFive &&
  citizen.needs &&
  citizen.pad &&
  citizen.values &&
  citizen.interpersonal &&
  citizen.attachmentStyle
).length;
const modeledZones = (state.society.zones || []).filter((zone) => zone.zoneModel?.model && zone.zoneModel?.gameplay).length;
const relationshipModelCount = Object.keys(SOCIAL_RELATION_MODELS).length;

for (let i = 0; i < 60; i += 1) {
  stepSociety();
}

const aliveAfterSoak = getAliveCitizens(state.society).length;
const lifeWeekAfterSoak = state.society.lifeWeek.week;
const logAfterSoak = state.society.lifeWeek.schedulerLog.length;
const relationshipEvents = Object.values(state.society.relationships || {}).reduce((sum, relationship) => sum + (relationship.eventLog || []).length, 0);

if (unlocked.length < 6) {
  throw new Error("Expected 6 evolved scenes, got " + unlocked.length + ": " + unlocked.map((item) => item.name).join(", "));
}
if (professionCount < 6) {
  throw new Error("Expected 6 emergent professions, got " + professionCount);
}
if (citizensWithPersona < 6) {
  throw new Error("Expected at least 6 citizens with MBTI-like personas, got " + citizensWithPersona);
}
if (archetypeCount < 16) {
  throw new Error("Expected at least 16 MBTI-like archetypes, got " + archetypeCount);
}
if (layeredCitizens < 6) {
  throw new Error("Expected at least 6 citizens with Big Five/Maslow/PAD/value layers, got " + layeredCitizens);
}
if (modeledZones < 20) {
  throw new Error("Expected concrete zone models for the world, got " + modeledZones);
}
if (relationshipModelCount < 4) {
  throw new Error("Expected four social relation models, got " + relationshipModelCount);
}
if (aliveAfterSoak < 6) {
  throw new Error("Expected society to remain populated after soak, got " + aliveAfterSoak);
}
if (lifeWeekAfterSoak < 2) {
  throw new Error("Expected life week loop to advance during soak, got week " + lifeWeekAfterSoak);
}
if (relationshipEvents < 4) {
  throw new Error("Expected relationship event sourcing logs, got " + relationshipEvents);
}

globalThis.__verificationResult = {
  growthEvents,
  unlockedScenes: unlocked.map((item) => item.name),
  emergentProfessions: state.society.growth.emergentProfessions.map((item) => item.name),
  citizensWithPersona,
  archetypeCount,
  layeredCitizens,
  modeledZones,
  relationshipModelCount,
  relationshipEvents,
  aliveAfterSoak,
  lifeWeekAfterSoak,
  schedulerLogSize: logAfterSoak
};
`;

vm.createContext(context);
vm.runInContext(`${engineSource}\n${verification}`, context, {
  filename: "verify-evolution.vm.js",
  timeout: 5000
});

console.log(JSON.stringify(context.__verificationResult, null, 2));
