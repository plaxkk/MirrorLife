const STORAGE_KEY = "mirror-life-mvp";

let state = null;
let activeMode = "mirror";
let activeRobotMode = "quiet";
let mirrorFrame = null;
let societyFrame = null;
let societyTimer = null;
let lastBottleCheckAt = 0;

const MAX_SOCIETY_EVENTS = 18;
const APP_VIEWS = ["mirror", "script", "exchange", "society", "bottle", "robot"];

const exchangeStories = {
  career: {
    title: "职业岔路：留下的人，先重新谈边界",
    body:
      "这个片段里，她没有把离开当成唯一的出口。她先把最耗尽自己的三件事写下来，约主管谈一次边界：哪些事必须由她负责，哪些事只是她一直习惯性接住。她后来仍然离开了，但那一次离开不再是逃跑，而是带着更清楚的判断。",
    echo: "也许你现在要分辨的不是走或留，而是你有没有被允许诚实地说出代价。",
    tags: ["职业焦虑", "边界", "选择代价"]
  },
  relationship: {
    title: "亲密沉默：他先承认自己害怕",
    body:
      "这个片段里，他原本想解释自己为什么冷淡，但最后只说：我不是不在乎，我是害怕一开口就被否定。对方没有立刻理解，可那句话让关系从互相猜测，变成了可以被看见的脆弱。",
    echo: "敏感并不等于错误。它常常只是你比别人更早听见了关系里的细小变化。",
    tags: ["亲密关系", "表达", "脆弱"]
  },
  family: {
    title: "家庭回声：她把需要空间说完整",
    body:
      "这个片段里，她没有再用沉默抵抗家人的期待。她说：我知道你们担心我，但我需要自己决定一部分生活。她说得很慢，中间停了很久。那一天没有立刻变好，但她第一次没有把自己的边界说成歉意。",
    echo: "边界不是把爱推开，而是让爱不再只能以亏欠的方式存在。",
    tags: ["家庭", "空间", "自我"]
  }
};

const bottleEchoes = [
  "有个匿名的人接住了这句话：我也有过这种累，不是因为你不够坚强，而是你撑得太久了。",
  "一段回声漂了回来：我不知道你的全貌，但我相信此刻的你值得被轻一点对待。",
  "沙箱里有人停留了一会儿：如果今天只能做一件事，请先让自己安全地度过今晚。",
  "另一段人生给你的回应是：你说不出口的部分，并不因此就不存在。"
];

const robotReplies = {
  quiet:
    "我会陪你安静三分钟。你不需要解释，也不需要马上变好。把呼吸放慢一点，先让今天停在门外。",
  reflect:
    "我们只复盘一个问题：今天哪个瞬间最像是在替过去的自己承受？如果你愿意，可以把它放进回声档案。",
  action:
    "明天只做一件小事就够了：给一个可信任的人发一句真实但不沉重的话，或者为自己留出十分钟不被打扰的时间。"
};

const scenePresets = {
  "open-square": "在一个开放广场中，每个分身都能公开发言。今天优先推进互助与公开协商，禁止任何人拥有特权发言权。",
  "study-hub": "创建一个共学市集。每个分身每天要把自己最近的困惑转成一个建议，并邀请另一位分身一起完成一个小任务。",
  "respite": "这是一次修复之夜。社会出现误会后，所有分身都要尝试把冲突转化为理解，优先进行安抚与补位。",
  "homefront": "这是一个家庭庭院场景。每个关系都保留差异，规则是自由表达、平等参与、公开反馈，不允许沉默惩罚。"
};

const HIGH_RISK_KEYWORDS = [
  "自杀",
  "我想死",
  "想死",
  "结束生命",
  "伤害自己",
  "自残",
  "自伤",
  "不想活",
  "轻生",
  "自我伤害",
  "吞药",
  "割"
];

const DEFAULT_CITIZEN_LIBRARY = [
  { id: "a", name: "洛言", role: "城市提议人", color: "#296c68", x: 0.2, y: 0.33, purpose: "协商共建", age: 39, professionId: "architect", zoneId: "office-district" },
  { id: "b", name: "澜", role: "城市守望者", color: "#7a4462", x: 0.56, y: 0.27, purpose: "照护协作", age: 28, professionId: "nurse", zoneId: "maternity-hospital" },
  { id: "c", name: "木子", role: "课程策划", color: "#b45f45", x: 0.34, y: 0.62, purpose: "共学组织", age: 33, professionId: "teacher", zoneId: "primary-school" },
  { id: "d", name: "景深", role: "安静观察者", color: "#8a9b74", x: 0.72, y: 0.46, purpose: "协作观察", age: 16, professionId: "student", zoneId: "middle-school" },
  { id: "e", name: "白槐", role: "关系重建者", color: "#c18b3d", x: 0.63, y: 0.74, purpose: "修复关系", age: 45, professionId: "lawyer", zoneId: "legal-court" },
  { id: "f", name: "明月", role: "农场看护者", color: "#6b7f5f", x: 0.11, y: 0.58, purpose: "照料农作", age: 56, professionId: "farmer", zoneId: "farm" },
  { id: "g", name: "星辰", role: "程序工坊", color: "#4e5c8d", x: 0.8, y: 0.32, purpose: "搭建系统", age: 29, professionId: "programmer", zoneId: "creative-studio" },
  { id: "h", name: "晓雨", role: "法治协同者", color: "#7a4462", x: 0.51, y: 0.84, purpose: "维护秩序", age: 52, professionId: "judge", zoneId: "legal-court" },
  { id: "i", name: "木叶", role: "幼儿探索者", color: "#8f6a5f", x: 0.33, y: 0.12, purpose: "童年学习", age: 7, professionId: "student", zoneId: "kindergarten" },
  { id: "j", name: "珞南", role: "设计与建设", color: "#af5f3a", x: 0.77, y: 0.58, purpose: "落地设计", age: 31, professionId: "designer", zoneId: "creative-studio" },
  { id: "k", name: "若云", role: "夜猫观察员", color: "#7f5c7a", x: 0.89, y: 0.83, purpose: "夜晚维护", age: 67, professionId: "retiree", zoneId: "residential" },
  { id: "l", name: "海心", role: "园艺伙伴", color: "#7f8f6a", x: 0.15, y: 0.82, purpose: "照料植物", age: 58, professionId: "caretaker", zoneId: "botanical-garden" }
];

const WORLD_THEMES = {
  "open-square": {
    scene: "开放广场",
    baseTension: 38,
    baseTone: "coherent",
    principles: {
      freedom: 92,
      equality: 91,
      openness: 95
    }
  },
  "study-hub": {
    scene: "共学市集",
    baseTension: 35,
    baseTone: "learning",
    principles: {
      freedom: 88,
      equality: 94,
      openness: 90
    }
  },
  respite: {
    scene: "修复之夜",
    baseTension: 55,
    baseTone: "healing",
    principles: {
      freedom: 86,
      equality: 89,
      openness: 87
    }
  },
  homefront: {
    scene: "家庭庭院",
    baseTension: 48,
    baseTone: "domestic",
    principles: {
      freedom: 83,
      equality: 85,
      openness: 88
    }
  },
  default: {
    scene: "镜像市域",
    baseTension: 42,
    baseTone: "neutral",
    principles: {
      freedom: 84,
      equality: 84,
      openness: 84
    }
  }
};

const WORLD_PHASES = [
  {
    id: "open-call",
    name: "开放晨会",
    duration: 6,
    moodDelta: 1.2,
    tensionDelta: -1,
    harmonyDelta: 2,
    fairnessDelta: 0,
    narrative: "更多公开提案进入讨论，社会秩序偏向协作与表达。",
    missionBias: ["propose", "cooperate"]
  },
  {
    id: "high-collab",
    name: "协作高峰",
    duration: 7,
    moodDelta: 1.4,
    tensionDelta: -2,
    harmonyDelta: 3,
    fairnessDelta: -1,
    narrative: "分身优先进入共享任务，低情绪分身更易被旁边分身看见。",
    missionBias: ["cooperate", "listen"]
  },
  {
    id: "friction-week",
    name: "张力窗口",
    duration: 5,
    moodDelta: -1.6,
    tensionDelta: 2.5,
    harmonyDelta: -3,
    fairnessDelta: 1,
    narrative: "意见分歧上升，系统更容易触发安抚与调停机制。",
    missionBias: ["support", "meditate"]
  },
  {
    id: "repair-night",
    name: "修复夜",
    duration: 6,
    moodDelta: 1.8,
    tensionDelta: -2.8,
    harmonyDelta: 4,
    fairnessDelta: -2,
    narrative: "系统默认放大修复路径，情绪修复与公开复盘更容易发生。",
    missionBias: ["support", "listen", "propose"]
  }
];

const WORLD_EVOLUTION = {
  ambientStepInterval: 3,
  naturalDecay: 0.85,
  fairnessDecay: 0.9,
  historyLimit: 18
};

const WORLD_ENGINE_VERSION = 2;
const AGENT_RUNTIME_VERSION = 1;
const AGENT_MEMORY_LIMIT = 24;
const AGENT_REFLECTION_LIMIT = 16;
const AGENT_AUDIT_LIMIT = 18;

const OPEN_WORLD_ZONES = [
  { id: "public-plaza", name: "公开广场", openness: 0.93, tolerance: 0.84, mobility: 0.72, role: "public", x: 0.12, y: 0.14, w: 0.25, h: 0.2, archetype: "social" },
  { id: "maternity-hospital", name: "接生医院", openness: 0.62, tolerance: 0.96, mobility: 0.46, role: "heal", x: 0.06, y: 0.05, w: 0.18, h: 0.16, archetype: "life" },
  { id: "residential", name: "住宅区", openness: 0.76, tolerance: 0.9, mobility: 0.78, role: "rest", x: 0.13, y: 0.62, w: 0.18, h: 0.22, archetype: "daily" },
  { id: "kindergarten", name: "幼儿园", openness: 0.72, tolerance: 0.84, mobility: 0.64, role: "cooperate", x: 0.38, y: 0.04, w: 0.18, h: 0.16, archetype: "education" },
  { id: "primary-school", name: "小学", openness: 0.78, tolerance: 0.82, mobility: 0.66, role: "cooperate", x: 0.38, y: 0.23, w: 0.18, h: 0.14, archetype: "education" },
  { id: "middle-school", name: "中学", openness: 0.74, tolerance: 0.76, mobility: 0.67, role: "cooperate", x: 0.58, y: 0.23, w: 0.16, h: 0.14, archetype: "education" },
  { id: "university", name: "大学", openness: 0.86, tolerance: 0.79, mobility: 0.74, role: "cooperate", x: 0.58, y: 0.05, w: 0.2, h: 0.16, archetype: "education" },
  { id: "office-district", name: "办公楼群", openness: 0.81, tolerance: 0.71, mobility: 0.76, role: "cooperate", x: 0.74, y: 0.53, w: 0.22, h: 0.16, archetype: "work" },
  { id: "factory", name: "工厂", openness: 0.7, tolerance: 0.68, mobility: 0.64, role: "cooperate", x: 0.72, y: 0.74, w: 0.2, h: 0.12, archetype: "work" },
  { id: "legal-court", name: "法院", openness: 0.62, tolerance: 0.75, mobility: 0.58, role: "support", x: 0.42, y: 0.42, w: 0.16, h: 0.12, archetype: "justice" },
  { id: "creative-studio", name: "设计工作室", openness: 0.8, tolerance: 0.83, mobility: 0.7, role: "cooperate", x: 0.46, y: 0.56, w: 0.16, h: 0.12, archetype: "work" },
  { id: "commercial-zone", name: "商业区", openness: 0.84, tolerance: 0.78, mobility: 0.8, role: "public", x: 0.22, y: 0.36, w: 0.18, h: 0.14, archetype: "commerce" },
  { id: "farm", name: "农场", openness: 0.68, tolerance: 0.9, mobility: 0.63, role: "heal", x: 0.06, y: 0.42, w: 0.16, h: 0.16, archetype: "life" },
  { id: "park", name: "公园", openness: 0.95, tolerance: 0.93, mobility: 0.7, role: "heal", x: 0.46, y: 0.7, w: 0.2, h: 0.14, archetype: "green" },
  { id: "zoo", name: "动物园", openness: 0.9, tolerance: 0.88, mobility: 0.6, role: "heal", x: 0.74, y: 0.34, w: 0.16, h: 0.12, archetype: "green" },
  { id: "botanical-garden", name: "植物园", openness: 0.9, tolerance: 0.94, mobility: 0.58, role: "heal", x: 0.74, y: 0.22, w: 0.2, h: 0.1, archetype: "green" },
  { id: "night-market", name: "娱乐设施", openness: 0.84, tolerance: 0.73, mobility: 0.76, role: "public", x: 0.34, y: 0.82, w: 0.2, h: 0.12, archetype: "entertainment" },
  { id: "quiet-nook", name: "静默角落", openness: 0.55, tolerance: 0.96, mobility: 0.55, role: "heal", x: 0.5, y: 0.82, w: 0.16, h: 0.1, archetype: "support" },
  { id: "repair-station", name: "修复站", openness: 0.66, tolerance: 0.98, mobility: 0.5, role: "meditate", x: 0.6, y: 0.62, w: 0.14, h: 0.1, archetype: "support" },
  { id: "cemetery", name: "安宁公地", openness: 0.48, tolerance: 0.99, mobility: 0.26, role: "rest", x: 0.86, y: 0.06, w: 0.1, h: 0.1, archetype: "rest" }
];

const WORLD_CLOCK = {
  startHour: 6,
  minutesPerTurn: 60,
  schedule: [
    { id: "wake", label: "晨起", start: 6, end: 8, dominantAction: "rest", movementBias: ["residential"], sceneTone: "warm" },
    { id: "schoolwork-morning", label: "上学/上班", start: 8, end: 12, dominantAction: "cooperate", movementBias: ["primary-school", "middle-school", "university", "office-district", "factory", "creative-studio"], sceneTone: "active" },
    { id: "noon", label: "午餐与交接", start: 12, end: 14, dominantAction: "listen", movementBias: ["public-plaza", "commercial-zone", "park"], sceneTone: "bright" },
    { id: "afternoon", label: "放学/下班前", start: 14, end: 18, dominantAction: "propose", movementBias: ["office-district", "creative-studio", "legal-court", "farm", "commercial-zone"], sceneTone: "active" },
    { id: "evening", label: "放学/下班", start: 18, end: 22, dominantAction: "support", movementBias: ["park", "residential", "botanical-garden", "zoo", "family"], sceneTone: "calm" },
    { id: "night", label: "夜晚休息", start: 22, end: 6, dominantAction: "rest", movementBias: ["residential", "quiet-nook", "repair-station"], sceneTone: "night" }
  ],
  sunlight: [
    { period: "night", color: "rgba(23, 37, 56, 0.20)" },
    { period: "dawn", color: "rgba(255, 214, 153, 0.16)" },
    { period: "day", color: "rgba(255, 247, 224, 0.12)" }
  ]
};

const WORLD_LIFE_STAGES = [
  { id: "newborn", label: "新生婴幼", minAge: 0, maxAge: 4, schoolHint: "maternity-hospital", professionHint: "新生婴儿", zoneHint: "residential", actionHint: "rest", scheduleTone: "warm" },
  { id: "child", label: "幼儿-少儿", minAge: 4, maxAge: 12, schoolHint: "kindergarten", professionHint: "学生", zoneHint: "primary-school", actionHint: "learn", scheduleTone: "active" },
  { id: "teen", label: "少年-青少年", minAge: 12, maxAge: 18, schoolHint: "middle-school", professionHint: "中学生", zoneHint: "middle-school", actionHint: "learn", scheduleTone: "active" },
  { id: "young", label: "青年", minAge: 18, maxAge: 28, schoolHint: "university", professionHint: "实习生", zoneHint: "university", actionHint: "propose", scheduleTone: "active" },
  { id: "adult", label: "成体-职业人", minAge: 28, maxAge: 55, schoolHint: "", professionHint: "白领", zoneHint: "office-district", actionHint: "cooperate", scheduleTone: "active" },
  { id: "elder", label: "中老年", minAge: 55, maxAge: 80, schoolHint: "", professionHint: "社区贡献者", zoneHint: "park", actionHint: "support", scheduleTone: "calm" },
  { id: "senior", label: "高龄", minAge: 80, maxAge: 105, schoolHint: "", professionHint: "居家观察员", zoneHint: "residential", actionHint: "rest", scheduleTone: "night" }
];

const WORLD_CATALOG = {
  humans: [
    "医生", "护士", "教师", "行政官员", "律师", "法官", "程序员", "建筑师", "平面设计师", "机械工程师", "软件工程师",
    "会计", "记者", "前端工程师", "后端工程师", "产品经理", "运营主管", "厨师", "服务员", "快递员", "公交司机",
    "农民", "园艺师", "动物管理员", "商家", "店主", "设计师", "研究员", "自由职业者", "消防员", "警员", "翻译"
  ],
  objects: [
    "医院与接生室", "幼儿园", "小学", "中学", "大学", "住宅区", "办公楼", "商业区", "农场", "法庭", "公园", "动物园", "植物园", "娱乐区", "修复站", "静默角落"
  ],
  life: [
    "树木", "草坪", "花卉", "家畜（羊驼、马、牛）", "犬猫", "城市鸟类", "小型昆虫群", "溪流鱼群"
  ]
};

const WORLD_ENTITIES = [
  { id: "dog", emoji: "🐕", zones: ["residential", "farm", "park"], speed: 0.8, size: 12, wanderRadius: 0.08 },
  { id: "cat", emoji: "🐱", zones: ["residential", "park", "botanical-garden"], speed: 0.5, size: 10, wanderRadius: 0.06 },
  { id: "bird", emoji: "🐦", zones: ["park", "botanical-garden", "farm", "public-plaza", "zoo"], speed: 1.2, size: 8, wanderRadius: 0.15 },
  { id: "fish", emoji: "🐟", zones: ["park", "botanical-garden"], speed: 0.4, size: 7, wanderRadius: 0.04 },
  { id: "sheep", emoji: "🐑", zones: ["farm"], speed: 0.3, size: 14, wanderRadius: 0.06 },
  { id: "butterfly", emoji: "🦋", zones: ["park", "botanical-garden", "farm", "zoo"], speed: 0.7, size: 6, wanderRadius: 0.1 }
];

const WORLD_WEATHER_TYPES = {
  sunny: { label: "晴天", moodEffect: 1.5, energyEffect: 1, transitionProb: 0.06 },
  cloudy: { label: "多云", moodEffect: 0, energyEffect: 0, transitionProb: 0.08 },
  rainy: { label: "雨天", moodEffect: -2, energyEffect: -1, transitionProb: 0.05 },
  snowy: { label: "雪天", moodEffect: -1, energyEffect: -1.5, transitionProb: 0.04 }
};

const ENTITY_SPAWN_COUNTS = { dog: 1, cat: 1, bird: 3, fish: 2, sheep: 1, butterfly: 4 };

const ACTION_LABELS_MAP = {
  propose: "提案",
  cooperate: "协作",
  support: "安抚",
  listen: "倾听",
  meditate: "调停",
  rest: "休息",
  conflict: "冲突"
};

const WORLD_IMAGE_PROMPTS = {
  style: "warm digital cartoon, soft rounded edges, humanistic, expressive but gentle, soft skin tones, cozy ambient lighting, emotional clarity",
  citizen: {
    newborn: "warm cartoony newborn in soft hospital light, oversized gentle eyes, soft pastel background, non-photorealistic 2d toon",
    child: "cute cartoon child character in warm tones, clear eyes, safe caring posture, gentle movement, educational setting",
    teen: "youth cartoon avatar, open shoulders, expressive face, soft pastel, community friendly vibe",
    adult: "adult toon avatar, warm color card, everyday urban outfit, approachable and humane expression",
    elder: "elder cartoon portrait, calm color, dignified and gentle, warm smile, cozy environment"
  },
  zone: {
    "maternity-hospital": "cozy cartoony hospital scene, warm humanistic design, soft lighting, gentle shadows",
    "kindergarten": "cartoon kindergarten playground with warm colors and rounded corners",
    "primary-school": "small school courtyard in warm cartoon style, open and friendly",
    "middle-school": "school environment, soft toon style, caring mentorship atmosphere",
    "university": "open university campus, warm sunset, diverse student portraits",
    "office-district": "open office district, collaborative desks, warm daylight cartoon palette",
    "factory": "small humane factory scene, clean mechanics, safe and warm toon style",
    "legal-court": "human-centered cartoon courtroom, respectful and balanced",
    "creative-studio": "cartoon design studio with warm material textures and soft light",
    "commercial-zone": "friendly market town, warm stalls, playful people",
    "farm": "cartoon farm with crops, tools, gentle sunlight and kindness",
    "park": "urban park in soft cartoon brush style, warm afternoon light",
    "zoo": "animal-friendly cartoon zoo, humane and gentle expressions",
    "botanical-garden": "botanical garden in warm pastel, close-up flora and people",
    "night-market": "night entertainment district, warm neon glow and human care",
    "residential": "cozy community streets, small homes, warm evening light",
    "public-plaza": "open social square, public notice board, collective dialogue in warm cartoon style",
    "repair-station": "human-centered healing station, soft rounded architecture, gentle lantern light, emotional recovery mood",
    "quiet-nook": "quiet refuge corner in warm tones, soft cushions, low noise, safe personal space",
    "cemetery": "peaceful memorial garden scene, soft sunset, dignified remembrance atmosphere, gentle textures"
  },
  object: {
    "hospital": "gentle birthing room concept art in warm cartoon style, caring nurses, safe medical warmth",
    "school": "cozy educational classroom scene in cartoon style, warm color grading, empathy driven",
    "workplace": "open office and workshop city block in warm digital cartoon, approachable human scale",
    "garden": "urban ecological garden in pastel cartoon style, flowers, trees, birds and benches",
    "animal-house": "humane animal enclosure in gentle cartoon style, respectful distance, warm care details",
    "justice": "lawful but human-centered courthouse courtyard, neutral warmth, respectful mediation room"
  }
};

const WORLD_PROFESSIONS = [
  { id: "student", name: "学生", zoneIds: ["kindergarten", "primary-school", "middle-school", "university"], minLifeAge: 4, maxLifeAge: 27, tone: "learn" },
  { id: "doctor", name: "医生", zoneIds: ["maternity-hospital", "commercial-zone"], minLifeAge: 20, maxLifeAge: 75, tone: "care" },
  { id: "nurse", name: "护士", zoneIds: ["maternity-hospital", "repair-station"], minLifeAge: 20, maxLifeAge: 75, tone: "care" },
  { id: "teacher", name: "教师", zoneIds: ["kindergarten", "primary-school", "middle-school", "university"], minLifeAge: 22, maxLifeAge: 70, tone: "guide" },
  { id: "white-collar", name: "白领", zoneIds: ["office-district", "commercial-zone"], minLifeAge: 20, maxLifeAge: 65, tone: "organize" },
  { id: "worker", name: "工人", zoneIds: ["factory", "farm"], minLifeAge: 18, maxLifeAge: 65, tone: "support" },
  { id: "architect", name: "建筑师", zoneIds: ["office-district", "commercial-zone"], minLifeAge: 24, maxLifeAge: 75, tone: "build" },
  { id: "designer", name: "设计师", zoneIds: ["creative-studio", "office-district"], minLifeAge: 20, maxLifeAge: 65, tone: "co-create" },
  { id: "lawyer", name: "律师", zoneIds: ["legal-court", "office-district"], minLifeAge: 24, maxLifeAge: 70, tone: "analyze" },
  { id: "judge", name: "法官", zoneIds: ["legal-court"], minLifeAge: 35, maxLifeAge: 70, tone: "balance" },
  { id: "programmer", name: "程序员", zoneIds: ["office-district", "creative-studio"], minLifeAge: 20, maxLifeAge: 70, tone: "optimize" },
  { id: "engineer", name: "工程师", zoneIds: ["factory", "office-district", "creative-studio"], minLifeAge: 22, maxLifeAge: 68, tone: "optimize" },
  { id: "chef", name: "厨师", zoneIds: ["commercial-zone", "residential"], minLifeAge: 20, maxLifeAge: 70, tone: "care" },
  { id: "driver", name: "司机", zoneIds: ["public-plaza", "commercial-zone", "residential"], minLifeAge: 18, maxLifeAge: 70, tone: "transport" },
  { id: "farmer", name: "农民", zoneIds: ["farm", "residential"], minLifeAge: 18, maxLifeAge: 80, tone: "grow" },
  { id: "caretaker", name: "社区照料者", zoneIds: ["park", "residential", "repair-station"], minLifeAge: 28, maxLifeAge: 80, tone: "heal" },
  { id: "artist", name: "艺术家", zoneIds: ["creative-studio", "public-plaza"], minLifeAge: 18, maxLifeAge: 75, tone: "imagine" },
  { id: "researcher", name: "研究员", zoneIds: ["university", "creative-studio"], minLifeAge: 24, maxLifeAge: 78, tone: "observe" },
  { id: "freelancer", name: "自由职业者", zoneIds: ["residential", "office-district"], minLifeAge: 20, maxLifeAge: 72, tone: "adapt" },
  { id: "reporter", name: "记者", zoneIds: ["public-plaza", "commercial-zone", "legal-court"], minLifeAge: 22, maxLifeAge: 65, tone: "public" },
  { id: "retiree", name: "退休顾问", zoneIds: ["residential", "park", "repair-station"], minLifeAge: 58, maxLifeAge: 100, tone: "guide" }
];

const WORLD_LIFECYCLE = {
  ageAdvancePerTurn: 0.23,
  birthCadenceTurns: 18,
  deathRateBias: 0.0007,
  maxAlive: 14,
  minimumAlive: 6
};

const OPEN_WORLD_RULES = {
  hardConstraints: {
    vulnerableMoodFloor: 28,
    vulnerableEnergyFloor: 24,
    maxConsecutivePublicVoice: 3,
    dominanceRatioLimit: 0.42
  },
  softCoefficients: {
    dominancePenalty: 4,
    vulnerabilityPenalty: 3,
    opennessBoost: 2
  }
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(list) {
  const output = [...list];
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}

function randomFrom(list) {
  if (!list.length) {
    return null;
  }
  return list[randomInt(0, list.length - 1)];
}

function buildBaseSociety() {
  return {
    running: false,
    speed: 1,
    turn: 0,
    clock: {
      day: 1,
      hour: WORLD_CLOCK.startHour,
      minute: 0,
      tick: 0,
      weather: "fine",
      timePhase: WORLD_CLOCK.schedule[0].id
    },
    autoEvolution: true,
    phaseId: WORLD_PHASES[0].id,
    phaseTurn: 0,
    lastAmbientTurn: 0,
    metricHistory: [],
    scenarioText: "开放式虚拟社会正在等待你用一句话设定。",
    scene: WORLD_THEMES.default.scene,
    tension: WORLD_THEMES.default.baseTension,
    tone: WORLD_THEMES.default.baseTone,
    principles: { ...WORLD_THEMES.default.principles },
    metrics: {
      freedom: WORLD_THEMES.default.principles.freedom,
      equality: WORLD_THEMES.default.principles.equality,
      openness: WORLD_THEMES.default.principles.openness
    },
    harmony: 0,
    score: 0,
    fairnessPenalty: 0,
    actionHistory: [],
    missions: [],
    log: [],
    actorActionHistory: [],
    engine: {
      version: WORLD_ENGINE_VERSION,
      activeTick: 0,
      dominanceWindow: [],
      zoneHistory: [],
      governanceTriggers: []
    },
    principleHealth: {
      freedom: 100,
      equality: 100,
      openness: 100,
      lastPressureAt: 0
    },
    zones: buildOpenWorldZones(),
    lifecycle: {
      totalBirths: 0,
      totalDeaths: 0,
      naturalPassage: 0
    },
    agents: buildAgentRuntime(DEFAULT_CITIZEN_LIBRARY.map((seed) => normalizeCitizen(seed))),
    citizens: [],
    entities: [],
    weather: "sunny",
    weatherTimer: 0,
    lastPreset: "default"
  };
}

function getLifeStage(ageYears) {
  const age = Number(ageYears) || 0;
  for (let i = 0; i < WORLD_LIFE_STAGES.length; i += 1) {
    const stage = WORLD_LIFE_STAGES[i];
    if (age >= stage.minAge && age < stage.maxAge) {
      return stage;
    }
  }
  return WORLD_LIFE_STAGES[WORLD_LIFE_STAGES.length - 1];
}

function resolveProfession(seed) {
  if (seed.professionId) {
    const direct = WORLD_PROFESSIONS.find((profession) => profession.id === seed.professionId);
    if (direct) {
      return direct;
    }
  }
  const options = WORLD_PROFESSIONS.slice();
  if (typeof seed.age === "number") {
    const age = Math.max(0, seed.age);
    const stageOptions = options.filter(
      (profession) => age >= profession.minLifeAge && age <= profession.maxLifeAge
    );
    if (stageOptions.length) {
      return stageOptions[Math.floor(Math.random() * stageOptions.length)];
    }
  }
  return options[randomInt(0, options.length - 1)];
}

function randomLifespanForAge(ageYears) {
  const base = clamp(Math.round(randomInt(62, 102) + (Number(ageYears) || 0) * 0.06), 40, 110);
  return clamp(base, 45, 110);
}

function normalizeLifeCoordinates(seed) {
  const safeZone = seed.zoneId || seed.homeZoneId || OPEN_WORLD_ZONES[0].id;
  const stage = getLifeStage(seed.age);
  const profession = resolveProfession(seed);
  return {
    age: Number(seed.age) || randomInt(1, 58),
    lifeStage: stage.id,
    lifeStageLabel: stage.label,
    profession: profession.name || "参与者",
    professionId: profession.id,
    zoneAffinity: Array.isArray(seed.zoneAffinity)
      ? seed.zoneAffinity
      : profession.zoneIds || [].slice(0),
    lifespan: clamp(seed.lifespan || randomLifespanForAge(Number(seed.age) || randomInt(1, 58)), 45, 110),
    alive: seed.alive === false ? false : true,
    birthTurn: seed.birthTurn || 1,
    avatarTone: stage.id
  };
}

function normalizeCitizen(seed) {
  const zone = seed.zoneId || OPEN_WORLD_ZONES[0].id;
  const life = normalizeLifeCoordinates(seed);
  return {
    id: seed.id || `c-${Date.now().toString(36)}-${randomInt(1000, 9999)}`,
    name: seed.name || "分身",
    role: seed.role || "参与者",
    color: seed.color || "#296c68",
    mood: clamp(Math.round(seed.mood ?? randomInt(34, 88)), 0, 100),
    energy: clamp(Math.round(seed.energy ?? randomInt(42, 96)), 0, 100),
    trust: clamp(Math.round(seed.trust ?? randomInt(35, 92)), 0, 100),
    purpose: seed.purpose || "共同生活",
    x: clamp(seed.x ?? Math.random() * 0.8 + 0.1, 0.05, 0.95),
    y: clamp(seed.y ?? Math.random() * 0.8 + 0.1, 0.05, 0.95),
    vx: seed.vx || 0,
    vy: seed.vy || 0,
    zoneId: Object.prototype.hasOwnProperty.call(seed, "zoneId") ? seed.zoneId : zone,
    actionCount: seed.actionCount || 0,
    actionStreak: seed.actionStreak || 0,
    lastAction: seed.lastAction || "",
    lastRound: seed.lastRound || 0,
    traces: [],
    age: life.age,
    lifeStage: life.lifeStage,
    lifeStageLabel: life.lifeStageLabel,
    profession: life.profession?.name || "参与者",
    professionId: life.professionId,
    zoneAffinity: life.zoneAffinity,
    lifespan: life.lifespan,
    alive: life.alive,
    avatarTone: life.avatarTone,
    birthTurn: life.birthTurn
  };
}

function setCitizenZonePosition(citizen, zone) {
  if (!citizen || !zone) {
    return;
  }
  const jitter = 0.09;
  const zoneHalfW = (zone.w || 0.16) / 2;
  const zoneHalfH = (zone.h || 0.12) / 2;
  citizen.x = clamp((zone.x || 0) + zoneHalfW + (Math.random() - 0.5) * zoneHalfW * 1.6, 0.03, 0.97);
  citizen.y = clamp((zone.y || 0) + zoneHalfH + (Math.random() - 0.5) * zoneHalfH * 1.6, 0.03, 0.97);
  citizen.x = clamp(citizen.x + ((Math.random() - 0.5) * jitter), 0.02, 0.98);
  citizen.y = clamp(citizen.y + ((Math.random() - 0.5) * jitter), 0.02, 0.98);
  citizen.vx = (citizen.vx || 0) * 0.35;
  citizen.vy = (citizen.vy || 0) * 0.35;
}

function mergeCitizens(citizens) {
  if (!Array.isArray(citizens)) {
    return DEFAULT_CITIZEN_LIBRARY.map((seed) => normalizeCitizen(seed));
  }

  const mapped = citizens
    .map((seed) => normalizeCitizen(seed))
    .filter((citizen) => citizen && citizen.name);
  if (!mapped.length) {
    return DEFAULT_CITIZEN_LIBRARY.map((seed) => normalizeCitizen(seed));
  }
  return mapped;
}

function mergeMissions(missions) {
  if (!Array.isArray(missions) || !missions.length) {
    return [
      {
        id: "cooperation",
        key: "cooperate",
        label: "协作完成 3 次",
        target: 3,
        progress: 0,
        done: false
      },
      {
        id: "propose",
        key: "propose",
        label: "发起公开提案 2 次",
        target: 2,
        progress: 0,
        done: false
      },
      {
        id: "support",
        key: "support",
        label: "支持他人 2 次",
        target: 2,
        progress: 0,
        done: false
      }
    ];
  }
  return missions.map((mission) => ({
    id: mission.id || `m-${randomInt(100, 999)}`,
    key: mission.key || "",
    label: mission.label || "任务",
    target: Number(mission.target) || 1,
    progress: Number(mission.progress) || 0,
    done: !!mission.done
  }));
}

function buildOpenWorldZones() {
  return OPEN_WORLD_ZONES.map((zone) => ({ ...zone }));
}

function buildAgentRuntime(citizens = []) {
  const memoryStore = {};
  const reflectionStore = {};
  const skillStore = {};
  citizens.forEach((citizen) => {
    if (!citizen?.id) {
      return;
    }
    memoryStore[citizen.id] = [];
    reflectionStore[citizen.id] = [];
    skillStore[citizen.id] = [];
  });

  return {
    version: AGENT_RUNTIME_VERSION,
    cycle: 0,
    scheduler: {
      lastWorldSummary: "",
      lastDecision: "",
      lastAudit: "",
      lastReflection: ""
    },
    inbox: [],
    outbox: [],
    memoryStore,
    reflectionStore,
    skillStore,
    auditLog: []
  };
}

function normalizeAgentBucket(bucket, limit) {
  if (!Array.isArray(bucket)) {
    return [];
  }
  return bucket.slice(0, limit);
}

function normalizeAgentMap(sourceMap, citizens, limit) {
  const result = {};
  citizens.forEach((citizen) => {
    if (!citizen?.id) {
      return;
    }
    result[citizen.id] = normalizeAgentBucket(sourceMap?.[citizen.id], limit);
  });
  return result;
}

function normalizeAgentRuntime(runtime, citizens) {
  const base = buildAgentRuntime(citizens);
  const source = runtime || {};
  const merged = {
    ...base,
    ...source,
    scheduler: {
      ...base.scheduler,
      ...(source.scheduler || {})
    },
    inbox: Array.isArray(source.inbox) ? source.inbox.slice(0, AGENT_MEMORY_LIMIT) : [],
    outbox: Array.isArray(source.outbox) ? source.outbox.slice(0, AGENT_MEMORY_LIMIT) : [],
    auditLog: Array.isArray(source.auditLog) ? source.auditLog.slice(0, AGENT_AUDIT_LIMIT) : [],
    memoryStore: normalizeAgentMap(source.memoryStore || {}, citizens, AGENT_MEMORY_LIMIT),
    reflectionStore: normalizeAgentMap(source.reflectionStore || {}, citizens, AGENT_REFLECTION_LIMIT),
    skillStore: normalizeAgentMap(source.skillStore || {}, citizens, AGENT_REFLECTION_LIMIT)
  };

  return merged;
}

function ensureAgentRuntime(society) {
  if (!society) {
    return null;
  }
  const citizens = Array.isArray(society.citizens) ? society.citizens : [];
  society.agents = normalizeAgentRuntime(society.agents || buildAgentRuntime(citizens), citizens);
  return society.agents;
}

function getAgentBucket(map, citizenId) {
  if (!map[citizenId]) {
    map[citizenId] = [];
  }
  return map[citizenId];
}

function pushAgentRecord(bucket, record, limit) {
  bucket.unshift(record);
  if (bucket.length > limit) {
    bucket.length = limit;
  }
  return bucket;
}

function recordAgentMemory(society, citizenId, text, kind = "event", importance = 1, references = []) {
  const runtime = ensureAgentRuntime(society);
  if (!runtime || !citizenId) {
    return null;
  }
  const item = {
    id: `mem-${society.turn}-${randomInt(100, 999)}`,
    kind,
    text,
    importance,
    turn: society.turn,
    references
  };
  pushAgentRecord(getAgentBucket(runtime.memoryStore, citizenId), item, AGENT_MEMORY_LIMIT);
  return item;
}

function recordAgentReflection(society, citizenId, text, references = []) {
  const runtime = ensureAgentRuntime(society);
  if (!runtime || !citizenId) {
    return null;
  }
  const item = {
    id: `ref-${society.turn}-${randomInt(100, 999)}`,
    text,
    turn: society.turn,
    references
  };
  pushAgentRecord(getAgentBucket(runtime.reflectionStore, citizenId), item, AGENT_REFLECTION_LIMIT);
  runtime.scheduler.lastReflection = text;
  return item;
}

function recordAgentSkill(society, citizenId, skillId, label, confidence = 1) {
  const runtime = ensureAgentRuntime(society);
  if (!runtime || !citizenId) {
    return null;
  }
  const item = {
    id: skillId,
    label,
    confidence: clamp(confidence, 0, 100),
    turn: society.turn
  };
  const bucket = getAgentBucket(runtime.skillStore, citizenId);
  const existingIndex = bucket.findIndex((entry) => entry.id === skillId);
  if (existingIndex >= 0) {
    bucket[existingIndex] = item;
  } else {
    bucket.unshift(item);
  }
  if (bucket.length > AGENT_REFLECTION_LIMIT) {
    bucket.length = AGENT_REFLECTION_LIMIT;
  }
  return item;
}

function recordAgentAudit(society, actor, verdict, detail) {
  const runtime = ensureAgentRuntime(society);
  if (!runtime) {
    return null;
  }
  const item = {
    id: `audit-${society.turn}-${randomInt(100, 999)}`,
    actor: actor || "",
    verdict,
    detail,
    turn: society.turn
  };
  pushAgentRecord(runtime.auditLog, item, AGENT_AUDIT_LIMIT);
  runtime.scheduler.lastAudit = detail;
  return item;
}

function queueAgentInbox(society, message) {
  const runtime = ensureAgentRuntime(society);
  if (!runtime) {
    return;
  }
  const item = {
    id: `msg-${society.turn}-${randomInt(100, 999)}`,
    turn: society.turn,
    ...message
  };
  runtime.inbox.unshift(item);
  if (runtime.inbox.length > AGENT_MEMORY_LIMIT) {
    runtime.inbox.length = AGENT_MEMORY_LIMIT;
  }
  return item;
}

function composeAgentWorldSummary(society) {
  const alive = getAliveCitizens(society).length;
  const phase = getWorldPhaseByTurn(society.turn);
  const timeState = getWorldTimeState(society);
  return `${society.scene} · ${phase.name} · ${timeState.label} · 活体 ${alive}/${society.citizens.length} · 自由${society.metrics.freedom} 平等${society.metrics.equality} 开放${society.metrics.openness}`;
}

function getCitizenAgentContext(society, citizen) {
  const runtime = ensureAgentRuntime(society);
  const memory = (runtime?.memoryStore?.[citizen.id] || []).slice(0, 6);
  const reflections = (runtime?.reflectionStore?.[citizen.id] || []).slice(0, 4);
  const skills = (runtime?.skillStore?.[citizen.id] || []).slice(0, 4);
  const inbox = (runtime?.inbox || []).filter((item) => item.scope === "world" || item.targetId === citizen.id).slice(0, 4);
  return { runtime, memory, reflections, skills, inbox };
}

function planCitizenAgentAction(society, citizen, baseAction) {
  const context = getCitizenAgentContext(society, citizen);
  const recentConflict = context.memory.find((item) => String(item.text || "").includes("冲突"));
  const recentSupport = context.reflections.find((item) => String(item.text || "").includes("安抚"));
  const skillHint = context.skills[0]?.id || "";
  const inboxHint = context.inbox[0]?.hint || "";
  const memoryCount = context.memory.length + context.reflections.length;

  let action = baseAction;
  if (citizen.mood < 32 || recentConflict) {
    action = { actorId: citizen.id, type: "support", targetId: baseAction.targetId || null };
  } else if (context.skills.some((skill) => skill.id === "mediation") || inboxHint === "repair") {
    action = { actorId: citizen.id, type: "meditate", targetId: baseAction.targetId || null };
  } else if (memoryCount >= 6 && citizen.trust > 68 && baseAction.type === "listen") {
    action = { actorId: citizen.id, type: "propose", targetId: baseAction.targetId || null };
  } else if (skillHint === "support-loop" && citizen.energy > 40 && citizen.mood < 60) {
    action = { actorId: citizen.id, type: "support", targetId: baseAction.targetId || null };
  } else if (recentSupport && baseAction.type === "rest" && citizen.energy > 38) {
    action = { actorId: citizen.id, type: "cooperate", targetId: baseAction.targetId || null };
  }

  return {
    ...action,
    context
  };
}

function summarizeAgentReflection(society, citizen, result, context) {
  const moodWord = citizen.mood < 35 ? "低状态" : citizen.mood > 70 ? "高能量" : "稳定";
  const text = `${citizen.name} 在${result.zone || "开放区"}以${result.type}回应当前社会，${moodWord}下优先保持${isActionSupportive(result.type) ? "支持" : "参与"}节奏。`;
  recordAgentReflection(society, citizen.id, text, [result.type, context.memory[0]?.id, context.reflections[0]?.id].filter(Boolean));
  if (result.type === "support" || result.type === "meditate") {
    recordAgentSkill(
      society,
      citizen.id,
      result.type === "support" ? "support-loop" : "mediation",
      result.type === "support" ? "支持循环" : "调停技能",
      (context.skills.find((skill) => skill.id === (result.type === "support" ? "support-loop" : "mediation"))?.confidence || 50) + 6
    );
  }
}

function recordAgentOutbox(society, citizen, result, context) {
  const runtime = ensureAgentRuntime(society);
  if (!runtime || !citizen || !result) {
    return null;
  }
  const item = {
    id: `out-${society.turn}-${randomInt(100, 999)}`,
    actorId: citizen.id,
    type: result.type,
    text: result.text,
    turn: society.turn,
    zone: result.zone || "",
    score: result.score || 0,
    context: {
      memoryCount: context.memory.length,
      reflectionCount: context.reflections.length,
      skillCount: context.skills.length
    }
  };
  pushAgentRecord(runtime.outbox, item, AGENT_MEMORY_LIMIT);
  runtime.scheduler.lastDecision = `${citizen.name} -> ${result.type}`;
  return item;
}

function runAgentRuntimeTick(society) {
  const runtime = ensureAgentRuntime(society);
  if (!runtime) {
    return null;
  }
  runtime.cycle += 1;
  runtime.scheduler.lastWorldSummary = composeAgentWorldSummary(society);
  queueAgentInbox(society, {
    scope: "world",
    type: "tick",
    hint: "observe",
    text: runtime.scheduler.lastWorldSummary
  });
  return runtime.scheduler.lastWorldSummary;
}

function normalizeSocietyState(society) {
  const base = buildBaseSociety();
  const zones = buildOpenWorldZones();
  const zoneIds = zones.map((zone) => zone.id);
  const normalizedCitizens = mergeCitizens(society.citizens || []).map((citizen) => ({
    ...citizen,
    zoneId: zoneIds.includes(citizen.zoneId) ? citizen.zoneId : zoneIds[0]
  }));
  const merged = {
    ...base,
    ...society,
    principles: {
      ...base.principles,
      ...(society.principles || {})
    },
    metrics: {
      ...base.metrics,
      ...(society.metrics || {})
    },
    engine: {
      ...base.engine,
      ...(society.engine || {})
    },
    principleHealth: {
      ...base.principleHealth,
      ...(society.principleHealth || {})
    },
    zones,
    missions: mergeMissions(society.missions || []),
    log: Array.isArray(society.log) ? society.log.slice(0, MAX_SOCIETY_EVENTS) : [],
    actorActionHistory: Array.isArray(society.actorActionHistory) ? society.actorActionHistory.slice(0, MAX_SOCIETY_EVENTS) : [],
    actionHistory: Array.isArray(society.actionHistory)
      ? society.actionHistory
      : [],
    citizens: normalizedCitizens,
    agents: normalizeAgentRuntime(society.agents || base.agents, normalizedCitizens),
    entities: Array.isArray(society.entities) ? society.entities : [],
    weather: society.weather || "sunny",
    weatherTimer: society.weatherTimer || 0
  };

  merged.zones = merged.zones.filter((zone) => zone && zone.id).map((zone) => ({ ...base.zones.find((source) => source.id === zone.id), ...zone }));
  if (!merged.zones.length) {
    merged.zones = buildOpenWorldZones();
  }

  return merged;
}

function spawnWorldEntities(society) {
  if (!Array.isArray(society.entities)) society.entities = [];
  society.entities = [];
  const zones = getOpenWorldZoneList(society);

  WORLD_ENTITIES.forEach((entityDef) => {
    const count = ENTITY_SPAWN_COUNTS[entityDef.id] || 1;
    const validZones = zones.filter(z => entityDef.zones.includes(z.id));
    if (!validZones.length) return;

    for (let i = 0; i < count; i++) {
      const zone = validZones[i % validZones.length];
      const e = {
        id: `e-${entityDef.id}-${i}`,
        type: entityDef.id,
        emoji: entityDef.emoji,
        zoneId: zone.id,
        x: zone.x + (zone.w / 2) + (Math.random() - 0.5) * zone.w * 0.6,
        y: zone.y + (zone.h / 2) + (Math.random() - 0.5) * zone.h * 0.6,
        targetX: 0,
        targetY: 0,
        speed: entityDef.speed,
        size: entityDef.size,
        wanderRadius: entityDef.wanderRadius,
        phase: Math.random() * Math.PI * 2
      };
      e.targetX = e.x;
      e.targetY = e.y;
      society.entities.push(e);
    }
  });
}

function updateEntityPositions(society) {
  if (!Array.isArray(society.entities)) return;
  society.entities.forEach((e) => {
    const dx = e.targetX - e.x;
    const dy = e.targetY - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.005) {
      // Pick new target within wander radius
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * e.wanderRadius;
      e.targetX = clamp(e.x + Math.cos(angle) * radius, 0.02, 0.98);
      e.targetY = clamp(e.y + Math.sin(angle) * radius, 0.02, 0.98);
    } else {
      const step = e.speed * 0.002;
      e.x += (dx / dist) * step;
      e.y += (dy / dist) * step;
    }
    e.phase += 0.05;
  });
}

function updateWeather(society) {
  society.weatherTimer = (society.weatherTimer || 0) + 1;
  if (society.weatherTimer % 6 !== 0) return;

  const currentWeather = society.weather || "sunny";
  const weatherInfo = WORLD_WEATHER_TYPES[currentWeather];
  if (!weatherInfo) return;

  if (Math.random() < (weatherInfo.transitionProb || 0.06)) {
    const weathers = Object.keys(WORLD_WEATHER_TYPES);
    const next = weathers[Math.floor(Math.random() * weathers.length)];
    if (next !== currentWeather) {
      society.weather = next;
      const nextInfo = WORLD_WEATHER_TYPES[next];
      addSocietyEvent(`天气变化：${nextInfo.label}`, "support");

      // Apply weather effects to citizens
      getAliveCitizens(society).forEach((c) => {
        c.mood = clamp(Math.round(c.mood + nextInfo.moodEffect), 0, 100);
        c.energy = clamp(Math.round(c.energy + nextInfo.energyEffect), 0, 100);
      });
    }
  }
}

function loadState() {
  const defaults = {
    profile: {},
    echoes: [],
    bottle: "",
    continuation: null,
    society: buildBaseSociety()
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) {
      return defaults;
    }

    const loadedSociety = saved.society || {};
    return {
      profile: { ...defaults.profile, ...(saved.profile || {}) },
      echoes: Array.isArray(saved.echoes) ? saved.echoes : defaults.echoes,
      bottle: typeof saved.bottle === "string" ? saved.bottle : "",
      continuation: saved.continuation && typeof saved.continuation === "object" ? saved.continuation : null,
      society: normalizeSocietyState(loadedSociety)
    };
  } catch {
    return defaults;
  }
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      profile: state.profile,
      echoes: state.echoes,
      bottle: state.bottle || "",
      continuation: state.continuation || null,
      society: state.society
    })
  );
}

function addEcho(text) {
  state.echoes = [
    {
      text,
      at: new Date().toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
    },
    ...state.echoes
  ].slice(0, 8);
  persist();
  if (typeof renderEchoes === "function") renderEchoes();
}

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return [...document.querySelectorAll(selector)];
}

function getSafeElement(selector) {
  return document.querySelector(selector);
}

// normalizeViewId - removed


// setView - removed


// syncViewFromHash - removed


// renderProfile - provided by game.js


// renderEchoes - provided by game.js


// saveScript - provided by game.js

// hydrateProfileForm - provided by game.js


// askMirror - provided by game.js

function buildMirrorResponse(input, identity, pattern) {
  const shortened = input.length > 52 ? `${input.slice(0, 52)}...` : input;

  if (activeMode === "observer") {
    return `<strong>${escapeHtml(identity)}</strong>，我看到你把“${escapeHtml(
      shortened
    )}”放到了这里。它是一次旧模式被激活：${escapeHtml(
      pattern
    )}。今天先不急着判断对错，先分清事实、解释与真实痛点。`;
  }

  if (activeMode === "companion") {
    return `我先陪你停一会儿。“${escapeHtml(
      shortened
    )}”听起来像在替很久以来的自己撑场景。你不用立即变得聪明，你先允许这个人性化的疲惫被看见。`;
  }

  return `我像镜子一样把它还给你：你说“${escapeHtml(
    shortened
  )}”。里面有压力，也有一个正在成熟的需要。真正关键的不在速度，而在你是否允许自己从这件事里学习。`;
}

function modeLabel(mode) {
  return {
    mirror: "镜子模式",
    observer: "旁观模式",
    companion: "陪伴模式"
  }[mode];
}

// selectExchange - provided by game.js

// sendBottle - provided by game.js

// receiveBottle - provided by game.js

// clearAllData - provided by game.js

// setRobotMode - provided by game.js

function parseScenario(text) {
  const scenarioText = (text || "").trim() || "一个强调自由平等开放的日常虚拟社会。";
  const toneText = scenarioText.toLowerCase();

  let preset = "default";
  if (scenarioText.includes("共学") || scenarioText.includes("市集") || scenarioText.includes("学习")) {
    preset = "study-hub";
  } else if (scenarioText.includes("修复") || scenarioText.includes("和解") || scenarioText.includes("误会")) {
    preset = "respite";
  } else if (scenarioText.includes("家庭") || scenarioText.includes("家人")) {
    preset = "homefront";
  } else if (scenarioText.includes("广场") || scenarioText.includes("开放") || scenarioText.includes("公共")) {
    preset = "open-square";
  }

  const base = WORLD_THEMES[preset] || WORLD_THEMES.default;
  const tensionScore =
    base.baseTension +
    (scenarioText.includes("争执") ? 12 : 0) +
    (scenarioText.includes("冲突") ? 10 : 0) +
    (scenarioText.includes("排斥") ? 14 : 0) +
    (scenarioText.includes("照顾") ? -8 : 0) +
    (scenarioText.includes("安抚") ? -6 : 0) +
    (scenarioText.includes("公开") ? 4 : 0);

  return {
    sceneText: scenarioText,
    sceneKey: preset,
    scene: base.scene,
    baseTone: base.baseTone,
    tension: clamp(tensionScore, 25, 84),
    principles: {
      freedom: clamp(base.principles.freedom + (scenarioText.includes("自由") ? 6 : 0), 70, 100),
      equality: clamp(base.principles.equality + (scenarioText.includes("平等") ? 6 : 0), 70, 100),
      openness: clamp(base.principles.openness + (scenarioText.includes("开放") ? 6 : 0), 70, 100)
    },
    intentWords: [
      scenarioText.includes("帮助") ? "协作" : "",
      scenarioText.includes("边界") ? "边界" : "",
      scenarioText.includes("对话") ? "对话" : ""
    ].filter(Boolean)
  };
}

function worldPhaseCycleLength() {
  return WORLD_PHASES.reduce((sum, phase) => sum + phase.duration, 0);
}

function getWorldPhaseByTurn(turn) {
  const total = worldPhaseCycleLength();
  const cursor = ((turn % total) + total) % total;
  let progress = 0;
  for (let i = 0; i < WORLD_PHASES.length; i += 1) {
    const phase = WORLD_PHASES[i];
    progress += phase.duration;
    if (cursor < progress) {
      return phase;
    }
  }
  return WORLD_PHASES[0];
}

function getAliveCitizens(society = state.society) {
  return Array.isArray(society?.citizens) ? society.citizens.filter((citizen) => citizen.alive !== false) : [];
}

function getClockPhase(hour) {
  const schedule = WORLD_CLOCK.schedule;
  const normalized = ((hour % 24) + 24) % 24;
  for (let i = 0; i < schedule.length; i += 1) {
    const segment = schedule[i];
    if (segment.start < segment.end && normalized >= segment.start && normalized < segment.end) {
      return segment;
    }
    if (segment.start > segment.end && (normalized >= segment.start || normalized < segment.end)) {
      return segment;
    }
  }
  return schedule[schedule.length - 1];
}

function getWorldTimeState(society = state.society) {
  const clock = society.clock || { hour: WORLD_CLOCK.startHour };
  const hour = ((clock.hour ?? WORLD_CLOCK.startHour) % 24 + 24) % 24;
  const phase = getClockPhase(hour);
  const labelMap = {
    wake: "清晨起床",
    "schoolwork-morning": "上学/上班",
    noon: "午餐与交接",
    afternoon: "放学/下班前",
    evening: "放学/下班",
    night: "夜晚休息"
  };
  return {
    hour,
    phase,
    label: labelMap[phase.id] || phase.label,
    minutes: clock.minute || 0,
    day: clock.day || 1,
    isNight: hour >= 21 || hour < 6,
    sceneTone: phase.sceneTone || "day"
  };
}

function advanceWorldClock(society) {
  const clock = society.clock || { hour: WORLD_CLOCK.startHour, minute: 0, day: 1, tick: 0 };
  const previousHour = ((clock.hour || WORLD_CLOCK.startHour) % 24 + 24) % 24;
  const minutes = (clock.minute || 0) + WORLD_CLOCK.minutesPerTurn;
  clock.minute = minutes % 60;
  const carryHours = Math.floor(minutes / 60);
  if (carryHours > 0) {
    clock.hour = ((clock.hour || WORLD_CLOCK.startHour) + carryHours) % 24;
    if (clock.hour <= previousHour && clock.day != null) {
      clock.day += 1;
    }
  }
  if (clock.day === undefined || clock.day === null) {
    clock.day = 1;
  }
  clock.tick = (clock.tick || 0) + 1;
  const phase = getClockPhase(clock.hour);
  clock.timePhase = phase.id;
  society.clock = clock;
}

function getStageZones(stageId) {
  if (stageId === "newborn") {
    return {
      day: ["maternity-hospital", "residential"],
      night: ["residential"]
    };
  }
  if (stageId === "child") {
    return {
      day: ["kindergarten", "primary-school", "residential", "park"],
      night: ["residential"]
    };
  }
  if (stageId === "teen") {
    return {
      day: ["middle-school", "university", "primary-school", "commercial-zone", "park"],
      night: ["residential", "quiet-nook", "repair-station"]
    };
  }
  if (stageId === "young" || stageId === "adult") {
    return {
      day: ["university", "office-district", "creative-studio", "factory", "commercial-zone", "legal-court"],
      night: ["residential", "public-plaza", "park", "repair-station"]
    };
  }
  return {
    day: ["residential", "park", "public-plaza", "commercial-zone"],
    night: ["residential", "quiet-nook", "repair-station", "park"]
  };
}

function pickRoutineZone(society, citizen) {
  const stage = getLifeStage(citizen.age);
  const timeState = getWorldTimeState(society);
  const schedule = WORLD_CLOCK.schedule.find((item) => item.id === timeState.phase.id) || WORLD_CLOCK.schedule[0];
  const zonePool = timeState.isNight ? getStageZones(stage.id).night : getStageZones(stage.id).day;
  const professionZones = getLifeProfessionZones(citizen);

  const preferred = [];
  if (professionZones?.length) {
    preferred.push(...professionZones);
  }
  preferred.push(...(schedule.movementBias || []), ...zonePool, "residential");

  const zones = getOpenWorldZoneList(society);
  const validZoneMap = preferred.map((zoneId) => zones.find((zone) => zone.id === zoneId)).filter(Boolean);
  if (!validZoneMap.length) {
    return zones.length ? zones[0] : null;
  }
  const zoneScore = new Map();
  validZoneMap.forEach((zone, index) => zoneScore.set(zone.id, (zoneScore.get(zone.id) || 0) + (10 - Math.min(9, index))));
  const picked = [...zoneScore.entries()].sort((a, b) => b[1] - a[1] || Math.random() - 0.5)[0];
  return zones.find((zone) => zone.id === picked[0]) || validZoneMap[0];
}

function getLifeProfessionZones(citizen) {
  const profession = WORLD_PROFESSIONS.find((item) => item.id === citizen.professionId);
  if (!profession) {
    return [];
  }
  return profession.zoneIds || [];
}

function getCitizenScheduleAction(society, citizen) {
  const timeState = getWorldTimeState(society);
  const stage = getLifeStage(citizen.age);
  if (!timeState.isNight && (timeState.phase.id === "wake" || timeState.phase.id === "schoolwork-morning" || timeState.phase.id === "afternoon")) {
    return stage.actionHint || timeState.phase.dominantAction || "cooperate";
  }
  if (timeState.isNight) {
    return "rest";
  }
  return timeState.phase.dominantAction || "listen";
}

function getOpenWorldZoneList(society) {
  const zones = Array.isArray(society?.zones) ? society.zones : [];
  if (zones.length) {
    return zones;
  }
  return buildOpenWorldZones();
}

function getCitizenZone(society, citizen) {
  const zones = getOpenWorldZoneList(society);
  const zone = zones.find((item) => item.id === citizen.zoneId);
  return zone || zones[0];
}

function pickCitizenZoneByNeed(society, citizen) {
  const zones = getOpenWorldZoneList(society);
  if (!citizen.alive) {
    return zones.find((zone) => zone.id === "cemetery") || zones[0];
  }
  if (!zones.length) {
    return null;
  }
  const tension = society.tension || 50;
  const mood = citizen.mood || 50;
  const trust = citizen.trust || 50;

  const candidateZones = [...zones];
  if (mood < 35) {
    candidateZones.sort((a, b) => b.tolerance - a.tolerance);
  } else if (tension > 64) {
    candidateZones.sort((a, b) => b.mobility - a.mobility);
  } else if (trust > 74) {
    candidateZones.sort((a, b) => b.openness - a.openness);
  } else {
    candidateZones.sort((a, b) => b.mobility - a.mobility);
  }

  return candidateZones[0];
}

function isActorVulnerable(citizen) {
  return (citizen.mood || 0) < OPEN_WORLD_RULES.hardConstraints.vulnerableMoodFloor || (citizen.energy || 0) < OPEN_WORLD_RULES.hardConstraints.vulnerableEnergyFloor;
}

function getMostActionDominantCitizen(society) {
  const citizens = getAliveCitizens(society);
  if (!citizens.length) {
    return null;
  }
  return [...citizens].sort((a, b) => (b.actionCount || 0) - (a.actionCount || 0))[0];
}

function isActorDominating(society, actor) {
  if (!society || !actor) {
    return false;
  }
  const citizens = getAliveCitizens(society);
  const total = citizens.reduce((sum, citizen) => sum + (citizen.actionCount || 0), 0);
  const allActors = citizens.filter((citizen) => (citizen.actionCount || 0) > 0);
  if (!allActors.length || !total) {
    return false;
  }

  const actorShare = (actor.actionCount || 0) / total;
  if (actorShare < OPEN_WORLD_RULES.hardConstraints.dominanceRatioLimit) {
    return false;
  }
  const top = getMostActionDominantCitizen(society);
  return actor.id === top?.id && actor.actionCount >= (top.actionCount || 0);
}

function pickAlternativeActionForVulnerable(type) {
  return isActionSupportive(type) ? type : (Math.random() < 0.6 ? "support" : "listen");
}

function isActionSupportive(type) {
  return type === "support" || type === "listen" || type === "meditate";
}

function applyOpenWorldMobility(society) {
  if (!Array.isArray(society?.citizens) || !Array.isArray(society?.zones) || !society.zones.length) {
    return;
  }
  const zones = society.zones;
  getAliveCitizens(society).forEach((citizen) => {
    const zone = getCitizenZone(society, citizen);
    const driftChance = (0.16 + Math.min(0.45, Math.abs(60 - society.tension) / 200)) * zone.mobility;
    if (Math.random() >= driftChance) {
      return;
    }
    const routineZone = pickRoutineZone(society, citizen);
    if (routineZone && routineZone.id && Math.random() < 0.65) {
      if (citizen.zoneId !== routineZone.id) {
        citizen._prevZoneId = citizen.zoneId;
        citizen._walking = true;
        citizen.zoneId = routineZone.id;
        setCitizenZonePosition(citizen, routineZone);
        addSocietyEvent(`按日程迁徙：${escapeHtml(citizen.name)} 进入“${escapeHtml(routineZone.name)}”。`, "support");
      }
      return;
    }
    const targetZone = pickCitizenZoneByNeed(society, citizen);
    if (targetZone && targetZone.id !== zone.id) {
      citizen._prevZoneId = citizen.zoneId;
      citizen._walking = true;
      citizen.zoneId = targetZone.id;
      setCitizenZonePosition(citizen, targetZone);
      addSocietyEvent(`开放世界迁徙：${escapeHtml(citizen.name)} 从“${escapeHtml(zone.name)}”移向“${escapeHtml(targetZone.name)}”。`, "support");
    }
  });
}

function recordSocietyMetricsHistory() {
  if (!Array.isArray(state.society.metricHistory)) {
    state.society.metricHistory = [];
  }
  state.society.metricHistory.push({
    turn: state.society.turn,
    freedom: state.society.metrics.freedom,
    equality: state.society.metrics.equality,
    openness: state.society.metrics.openness,
    tension: state.society.tension,
    harmony: state.society.harmony
  });
  if (state.society.metricHistory.length > WORLD_EVOLUTION.historyLimit) {
    state.society.metricHistory = state.society.metricHistory.slice(-WORLD_EVOLUTION.historyLimit);
  }
}

function worldPhaseTransition(oldPhaseId, newPhaseId) {
  if (oldPhaseId === newPhaseId) {
    return;
  }
  const phase = getWorldPhaseByTurn(state.society.turn);
  addSocietyEvent(`社会进入新阶段：「${phase.name}」，${phase.narrative}`, "support");
  state.society.phaseTurn = 0;
}

function applyAmbientEvent(effectType) {
  const society = state.society;
  const phase = getWorldPhaseByTurn(society.turn);
  if (effectType === "drift-up") {
    society.citizens.forEach((citizen) => {
      citizen.mood = clamp(Math.round(citizen.mood + 3), 0, 100);
      citizen.energy = clamp(Math.round(citizen.energy + 2), 0, 100);
      citizen.trust = clamp(Math.round(citizen.trust + 1), 0, 100);
    });
    addSocietyEvent("环境事件：公共节律上升，更多分身在自愿协作与公开对话。", "support");
    applyOpenWorldMobility(society);
  }

  if (effectType === "drift-calm") {
    society.tension = clamp(society.tension - 5, 20, 90);
    society.harmony = clamp(society.harmony + 2, 0, 100);
    society.citizens.forEach((citizen) => {
      citizen.mood = clamp(Math.round(citizen.mood + 4), 0, 100);
      citizen.energy = clamp(Math.round(citizen.energy + 1), 0, 100);
    });
    addSocietyEvent("环境事件：修复呼吸节奏启动，张力开始回落。", "support");
  }

  if (effectType === "drift-ripple") {
    society.fairnessPenalty = clamp(society.fairnessPenalty + 1, 0, 12);
    const target = randomCitizen();
    if (target) {
      target.trust = clamp(target.trust - 6, 0, 100);
      addSocietyEvent(
        `环境事件：阶段性分歧波及 ${escapeHtml(target.name)}，触发系统更高频的安抚建议。`,
        "conflict"
      );
    }
  }

  if (effectType === "open-forum") {
    const anchor = randomCitizen();
    if (anchor) {
      anchor.trust = clamp(Math.round(anchor.trust + 3), 0, 100);
      anchor.zoneId = "public-plaza";
      addSocietyEvent(
        `环境事件：公共回合开启，${escapeHtml(anchor.name)} 触发了一场“公开发言”回合。`,
        "propose"
      );
      anchor.lastAction = "propose";
    }
    society.harmony = clamp(society.harmony + 1, 0, 100);
  }

  if (effectType === "throttle") {
    society.citizens.forEach((citizen) => {
      citizen.energy = clamp(Math.round(citizen.energy - 4), 0, 100);
      citizen.mood = clamp(Math.round(citizen.mood - 1), 0, 100);
    });
    society.tension = clamp(society.tension + 4, 20, 90);
    addSocietyEvent("环境事件：外部压力扰动出现，分身动作更倾向短促修复。", "conflict");
  }

  if (phase && phase.id === "friction-week" && Math.random() < 0.25) {
    addSocietyEvent("“张力窗口”使安抚与调停动作优先级上升。", "support");
  }
}

function normalizeLifeTransition(citizen, newStage) {
  if (!citizen.alive) {
    citizen.deathCause = "deceased";
    return;
  }

  const stage = newStage || getLifeStage(citizen.age);
  if (citizen.lifeStage === stage.id) {
    return;
  }

  const oldLabel = citizen.lifeStageLabel || "未知阶段";
  citizen.lifeStage = stage.id;
  citizen.lifeStageLabel = stage.label;
  citizen.avatarTone = stage.id;
  const profession = WORLD_PROFESSIONS.find((item) => item.id === citizen.professionId) || resolveProfession(citizen);
  citizen.profession = profession.name || citizen.profession;
  citizen.professionId = profession.id || citizen.professionId;
  citizen.purpose = `${stage.label}行为适配`;
  citizen.role = `${stage.label}-${citizen.profession || "参与者"}`;
  if (profession?.zoneIds?.length) {
    citizen.zoneAffinity = profession.zoneIds.slice(0);
  }
  addSocietyEvent(`生命阶段迁移：${escapeHtml(citizen.name)} 从“${escapeHtml(oldLabel)}”进入“${escapeHtml(stage.label)}”。`, "support");
}

function updateCitizenLifeSchedule(citizen, society) {
  if (!citizen.alive) {
    citizen.role = "往昔记忆";
    citizen.zoneId = "cemetery";
    return;
  }

  const stage = getLifeStage(citizen.age);
  if (citizen.lifeStage !== stage.id) {
    normalizeLifeTransition(citizen, stage);
  }

  if (citizen.professionId && stage.id !== "newborn" && stage.id !== "senior") {
    const profession = WORLD_PROFESSIONS.find((item) => item.id === citizen.professionId);
    if (profession && profession.zoneIds.length) {
      citizen.zoneAffinity = profession.zoneIds.slice(0);
    }
  } else if (stage.id === "senior") {
    citizen.zoneAffinity = ["residential", "park", "repair-station", "quiet-nook"];
  }
  if (!getOpenWorldZoneList(society).find((zone) => zone.id === citizen.zoneId)) {
    const fallbackZone = getLifeStageZoneCandidate(society, citizen);
    if (fallbackZone) {
      citizen.zoneId = fallbackZone.id;
      setCitizenZonePosition(citizen, fallbackZone);
    }
  }
}

function getLifeStageZoneCandidate(society, citizen) {
  const stage = getLifeStage(citizen.age);
  const stageZones = getStageZones(stage.id);
  const candidates = getOpenWorldZoneList(society).filter((zone) => stageZones.day.includes(zone.id) || stageZones.night.includes(zone.id));
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : getOpenWorldZoneList(society)[0];
}

function runLifeClockAdvance(society) {
  getAliveCitizens(society).forEach((citizen) => {
    citizen.age = clamp(Math.round((citizen.age + WORLD_LIFECYCLE.ageAdvancePerTurn) * 100) / 100, 0, 120);
    const nextStage = getLifeStage(citizen.age);
    if (nextStage.id !== citizen.lifeStage) {
      normalizeLifeTransition(citizen, nextStage);
    }
    if (citizen.age >= (citizen.lifespan || 70)) {
      citizen.alive = false;
      citizen.lifeStage = "departed";
      citizen.lifeStageLabel = "离世";
      citizen.role = "已离世";
      citizen.zoneId = "cemetery";
      society.lifecycle.totalDeaths = (society.lifecycle.totalDeaths || 0) + 1;
      addSocietyEvent(`生命里程：${escapeHtml(citizen.name)} 达到寿终时点，系统将其送入安宁公地并保留记忆。`, "support");
      setCitizenZonePosition(citizen, getOpenWorldZoneList(society).find((zone) => zone.id === "cemetery"));
      return;
    }
    const lifeZone = getLifeStageZoneCandidate(society, citizen);
    if (lifeZone) {
      citizen.zoneId = lifeZone.id;
      if (Math.random() < 0.18) {
        setCitizenZonePosition(citizen, lifeZone);
      }
    }
  });

  const aliveCount = getAliveCitizens(society).length;
  society.lifecycle.naturalPassage = +(Number(society.lifecycle.naturalPassage) + WORLD_LIFECYCLE.ageAdvancePerTurn).toFixed(2);
  if (aliveCount < WORLD_LIFECYCLE.minimumAlive && society.turn % WORLD_LIFECYCLE.birthCadenceTurns === 0) {
    const newborn = buildLifeCitizenForBirth(society);
    if (newborn) {
      society.citizens.push(newborn);
      society.lifecycle.totalBirths += 1;
      addSocietyEvent(`生命补给：新生 ${escapeHtml(newborn.name)} 加入社会，继续保持人口连续性。`, "support");
    }
  } else if (Math.random() < WORLD_LIFECYCLE.deathRateBias) {
    maybeBirthByChance(society);
  }
}

function maybeBirthByChance(society) {
  if (getAliveCitizens(society).length >= WORLD_LIFECYCLE.maxAlive) {
    return;
  }
  if (society.turn % WORLD_LIFECYCLE.birthCadenceTurns !== 0) {
    return;
  }
  const newborn = buildLifeCitizenForBirth(society);
  if (!newborn) {
    return;
  }
  society.citizens.push(newborn);
  society.lifecycle.totalBirths += 1;
  addSocietyEvent(`生命补给：${escapeHtml(newborn.name)} 诞生并进入医疗阶段。`, "support");
}

function buildLifeCitizenForBirth(society) {
  const base = {
    name: `${randomFrom(["晓光", "晓彤", "安然", "晨曦", "禾野", "芷岚", "宁儿", "洛天"])}-${randomInt(100, 999)}`,
    role: "新生分身",
    color: `hsl(${randomInt(90, 160)}, 52%, ${randomInt(38, 62)}%)`,
    age: 0.3,
    professionId: "student",
    zoneId: "maternity-hospital",
    mood: 78,
    energy: 95,
    trust: 72
  };
  if (getAliveCitizens(society).length >= WORLD_LIFECYCLE.maxAlive) {
    return null;
  }
  const newborn = normalizeCitizen(base);
  setCitizenZonePosition(newborn, getOpenWorldZoneList(society).find((zone) => zone.id === newborn.zoneId));
  return newborn;
}

function evolveFromTurn() {
  const society = state.society;
  const phase = getWorldPhaseByTurn(society.turn);
  worldPhaseTransition(society.phaseId, phase.id);
  society.phaseId = phase.id;

  society.phaseTurn += 1;
  society.harmony = clamp(society.harmony + phase.harmonyDelta + randomInt(-1, 1), 0, 100);
  society.tension = clamp(Math.round(society.tension + phase.tensionDelta + (Math.random() - 0.35)), 20, 90);
  society.fairnessPenalty = clamp(Math.round(society.fairnessPenalty * WORLD_EVOLUTION.fairnessDecay + phase.fairnessDelta), 0, 12);

  society.citizens.forEach((citizen) => {
    citizen.mood = clamp(Math.round(citizen.mood + phase.moodDelta + (Math.random() - 0.5) * 1.6), 0, 100);
    citizen.energy = clamp(Math.round(citizen.energy - 1 + (Math.random() - 0.6)), 0, 100);
    if (Math.random() < 0.25) {
      citizen.vx = clamp((citizen.vx || 0) + (Math.random() - 0.5) * 0.01, -0.03, 0.03);
      citizen.vy = clamp((citizen.vy || 0) + (Math.random() - 0.5) * 0.01, -0.03, 0.03);
    }
  });

  if (!state.society.autoEvolution) {
    applyOpenWorldMobility(society);
    if (society.engine) {
      society.engine.activeTick = (society.engine.activeTick || 0) + 1;
    }
    updatePrincipleHealth(society);
    return;
  }

  if (society.turn - society.lastAmbientTurn >= WORLD_EVOLUTION.ambientStepInterval) {
    const weighted = ["drift-up", "drift-up", "drift-calm", "open-forum", "drift-ripple", "throttle"];
    const event = weighted[randomInt(0, weighted.length - 1)];
    applyAmbientEvent(event);
    society.lastAmbientTurn = society.turn;

    // Show world banner for significant events
    if (typeof showWorldBanner === "function") {
      const phase = getWorldPhaseByTurn(society.turn);
      showWorldBanner(`${society.scene} · ${phase.name} · 第${society.turn}回合`);
    }
  }

  if (phase.id === "high-collab" && society.tension > 64 && Math.random() < 0.25) {
    applyAmbientEvent("throttle");
  }
  if (phase.id === "repair-night" && society.tension > 45 && Math.random() < 0.35) {
    applyAmbientEvent("drift-calm");
  }

  if (society.tension > 76 && Math.random() < 0.12) {
    applyAmbientEvent("drift-ripple");
  }

  if (society.engine) {
    society.engine.activeTick = (society.engine.activeTick || 0) + 1;
  }
  updatePrincipleHealth(society);
}

function isHighRiskText(text) {
  const lowered = (text || "").toLowerCase();
  return HIGH_RISK_KEYWORDS.some((keyword) => lowered.includes(keyword));
}

function clampToOneRound(value) {
  return clamp(Math.round(value), 0, 100);
}

function recordGovernanceSignal(type, text, actorName) {
  const society = state.society;
  if (!society.engine) {
    society.engine = {
      version: WORLD_ENGINE_VERSION,
      activeTick: 0,
      dominanceWindow: [],
      zoneHistory: [],
      governanceTriggers: []
    };
  }
  const trigger = {
    turn: society.turn,
    type,
    text,
    actor: actorName || "",
    at: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  };
  society.engine.governanceTriggers = [...(society.engine.governanceTriggers || []), trigger].slice(-8);
  addSocietyEvent(`${text}`, type === "safety" ? "support" : "conflict");
}

function updatePrincipleHealth(society) {
  const equalShare = computeEqualityMetric();
  const opennessShare = computeOpennessMetric();
  const aliveCitizens = getAliveCitizens(society);
  const vulnerableCount = aliveCitizens.filter((citizen) => isActorVulnerable(citizen)).length;
  const fragileRate = aliveCitizens.length
    ? clamp(vulnerableCount / aliveCitizens.length, 0, 1)
    : 0;
  society.principleHealth = {
    freedom: clampToOneRound(
      (society.metrics.freedom || 0) + 6 - fragileRate * 28 - Math.max(0, society.tension - 58) * 0.35
    ),
    equality: clampToOneRound(
      equalShare - society.fairnessPenalty * OPEN_WORLD_RULES.softCoefficients.dominancePenalty + Math.max(0, 12 - society.fairnessPenalty * 0.5)
    ),
    openness: clampToOneRound(
      opennessShare - society.fairnessPenalty * OPEN_WORLD_RULES.softCoefficients.opennessBoost - fragileRate * 18 + 10
    ),
    lastPressureAt: Date.now()
  };
}

function classifyLifeEventAction(text) {
  const source = (text || "").toLowerCase();
  if (source.includes("冲突") || source.includes("吵架") || source.includes("误解") || source.includes("被忽视")) {
    return "support";
  }
  if (source.includes("合作") || source.includes("帮我") || source.includes("一起")) {
    return "cooperate";
  }
  if (source.includes("建议") || source.includes("提议") || source.includes("想法") || source.includes("计划")) {
    return "propose";
  }
  if (source.includes("可不可以") || source.includes("听") || source.includes("理解")) {
    return "listen";
  }
  return source.includes("焦虑") || source.includes("紧张") || source.includes("害怕") ? "support" : "listen";
}

function captureNarrativeState(society, actor, target) {
  return {
    mood: Math.round(actor?.mood || 0),
    energy: Math.round(actor?.energy || 0),
    trust: Math.round(actor?.trust || 0),
    targetMood: target ? Math.round(target.mood || 0) : null,
    targetTrust: target ? Math.round(target.trust || 0) : null,
    harmony: Math.round(society?.harmony || 0),
    tension: Math.round(society?.tension || 0)
  };
}

function diffNarrativeState(before, after) {
  const delta = {};
  Object.keys(after || {}).forEach((key) => {
    if (typeof after[key] === "number" && typeof before?.[key] === "number") {
      delta[key] = after[key] - before[key];
    }
  });
  return delta;
}

function applySocietyActionResult(result, eventSuffix = "") {
  const society = state.society;
  if (!result) {
    return;
  }
  const text = result.governance ? `${result.text}（治理说明：${result.governance}）` : result.text;

  society.harmony = clamp(society.harmony + result.score, 0, 100);
  if (!Array.isArray(society.actionHistory)) {
    society.actionHistory = [];
  }
  if (!Array.isArray(society.actorActionHistory)) {
    society.actorActionHistory = [];
  }
  const actorKey = result.actorId || result.actor || "分身";
  society.actionHistory.push(result.type);
  society.actorActionHistory.push(actorKey);
  if (society.actionHistory.length > 140) {
    society.actionHistory = society.actionHistory.slice(-140);
  }
  if (society.actorActionHistory.length > 140) {
    society.actorActionHistory = society.actorActionHistory.slice(-140);
  }

  applyMissionProgress(result.type);
  addSocietyEvent(
    `${text}${eventSuffix ? ` ${eventSuffix}` : ""}`,
    result.type === "conflict" ? "conflict" : "support"
  );
  updateSocietyMetricsFromEvents();

  // Speech bubble hook (called from game.js)
  if (typeof addSpeechBubble === "function") {
    const actor = society.citizens.find(c => c.id === result.actorId);
    if (actor) {
      addSpeechBubble(result.actorId, ACTION_LABELS_MAP[result.type] || result.type, result.type);
    }
  }
}

function injectLifeEventToSociety(eventText, modeHint = "") {
  if (!state.society.citizens.length) {
    state.society = buildSocietyFromInput(eventText || scenePresets["open-square"]);
  }
  const actor =
    state.society.citizens.find((citizen) => citizen.id === "avatar") ||
    state.society.citizens[randomInt(0, state.society.citizens.length - 1)];
  if (!actor) {
    return;
  }

  const actionType = modeHint || classifyLifeEventAction(eventText);
  const actorContext = getCitizenAgentContext(state.society, actor);
  const target = randomCitizen(actor.id) || null;
  const before = captureNarrativeState(state.society, actor, target);
  const result = resolveAction({
    actorId: actor.id,
    type: actionType,
    targetId: target?.id || null
  });
  applySocietyActionResult(result, "，这一轮由现实输入触发。");
  const after = captureNarrativeState(state.society, actor, target);
  recordAgentOutbox(state.society, actor, result, actorContext);
  recordAgentMemory(
    state.society,
    actor.id,
    `现实输入触发了 ${result.type}：${stripTags(result.text)}`,
    "input",
    result.score + 1,
    [actionType]
  );
  summarizeAgentReflection(state.society, actor, result, actorContext);
  applyCityDrift();
  evaluateConflicts();
  persist();
  if (typeof renderSocietyViews === "function") renderSocietyViews();
  if (typeof renderSocietyEcho === "function") renderSocietyEcho();
  return {
    result,
    context: {
      turn: state.society.turn,
      phase: getWorldTimeState(state.society)?.phase?.name || "当前阶段",
      actorName: actor.name,
      actorId: actor.id,
      targetName: target?.name || "",
      targetId: target?.id || null,
      actionType: result?.type || actionType,
      requestedActionType: actionType,
      inputHint: eventText.length > 48 ? `${eventText.slice(0, 48)}...` : eventText,
      before,
      after,
      delta: diffNarrativeState(before, after)
    }
  };
}

function runPlayerSocietyAction(actionType) {
  if (!state.society.citizens.length) {
    launchSocietyFromInput();
  }

  const actor =
    state.society.citizens.find((citizen) => citizen.id === "avatar") ||
    state.society.citizens[0];
  if (!actor) {
    return;
  }

  const actorContext = getCitizenAgentContext(state.society, actor);
  const actorAction = resolveAction({
    actorId: actor.id,
    type: actionType,
    targetId: randomCitizen(actor.id)?.id || null
  });

  if (!actorAction) {
    return;
  }
  applySocietyActionResult(actorAction, "，这是玩家公开干预。");
  recordAgentOutbox(state.society, actor, actorAction, actorContext);
  recordAgentMemory(
    state.society,
    actor.id,
    `玩家干预触发了 ${actorAction.type}：${stripTags(actorAction.text)}`,
    "player",
    actorAction.score + 1,
    [actionType]
  );
  summarizeAgentReflection(state.society, actor, actorAction, actorContext);
  applyCityDrift();
  evaluateConflicts();
  persist();
  if (typeof renderSocietyViews === "function") renderSocietyViews();
  if (typeof renderSocietyEcho === "function") renderSocietyEcho();
}

function buildMissions(plan) {
  const missions = [
    {
      id: "cooperation",
      key: "cooperate",
      label: "完成 3 次协作互动",
      target: 3,
      progress: 0,
      done: false
    },
    {
      id: "propose",
      key: "propose",
      label: "发起 2 次公开提案",
      target: 2,
      progress: 0,
      done: false
    },
    {
      id: "support",
      key: "support",
      label: "进行 2 次支持回应",
      target: 2,
      progress: 0,
      done: false
    }
  ];

  if ((plan.intentWords || []).includes("协作")) {
    missions.push({
      id: "collective",
      key: "cooperate",
      label: "额外协作 2 次，维持公平节奏",
      target: 2,
      progress: 0,
      done: false
    });
  }
  if (plan.tension > 60) {
    missions.push({
      id: "mediation",
      key: "mediate",
      label: "至少完成 1 次调解",
      target: 1,
      progress: 0,
      done: false
    });
  }

  return missions;
}

function syncAvatarInSociety() {
  const avatarName = state.profile.identity || "你的分身";
  if (!state.society.citizens || !state.society.citizens.length) {
    return;
  }
  const defaultZone = getSafeAvatarZone();
  const avatar = state.society.citizens.find((citizen) => citizen.id === "avatar");
  if (avatar) {
    avatar.name = avatarName;
    avatar.zoneId = avatar.zoneId || defaultZone;
    setCitizenZonePosition(avatar, getCitizenZone(state.society, avatar));
    avatar.age = clamp(Number(avatar.age) || 22, 0, 120);
    avatar.professionId = avatar.professionId || "white-collar";
    avatar.lifeStage = getLifeStage(avatar.age).id;
    avatar.profession = (WORLD_PROFESSIONS.find((profession) => profession.id === avatar.professionId) || WORLD_PROFESSIONS[0]).name;
    avatar.lifeStageLabel = getLifeStage(avatar.age).label;
  } else if (state.society.citizens.length < 10) {
    state.society.citizens.unshift(
      normalizeCitizen({
        id: "avatar",
        name: avatarName,
        role: "你的分身",
        color: "#174743",
        x: 0.6,
        y: 0.58,
        purpose: "从真实生活带入选择与体验",
        mood: 64,
        energy: 72,
        trust: 72,
        zoneId: defaultZone,
        age: 24,
        professionId: "white-collar",
        traces: []
      })
  );
  }
  const avatarBackfill = state.society.citizens.find((citizen) => citizen.id === "avatar");
  if (avatarBackfill) {
    setCitizenZonePosition(avatarBackfill, getCitizenZone(state.society, avatarBackfill));
  }
}

function getSafeAvatarZone() {
  const zones = getOpenWorldZoneList(state.society);
  return zones[0]?.id || OPEN_WORLD_ZONES[0].id;
}

function syncAvatarForSociety(society) {
  const avatarName = state.profile.identity || "你的分身";
  const defaultZone = getSafeAvatarZoneForSociety(society);
  const avatar = society.citizens.find((citizen) => citizen.id === "avatar");
  if (avatar) {
    avatar.name = avatarName;
    avatar.zoneId = avatar.zoneId || defaultZone;
    setCitizenZonePosition(avatar, getCitizenZone(society, avatar));
    avatar.age = clamp(Number(avatar.age) || 26, 0, 120);
    avatar.professionId = avatar.professionId || "white-collar";
    avatar.profession = (WORLD_PROFESSIONS.find((profession) => profession.id === avatar.professionId) || WORLD_PROFESSIONS[0]).name;
    avatar.lifeStage = getLifeStage(avatar.age).id;
    avatar.lifeStageLabel = getLifeStage(avatar.age).label;
    return;
  }
  society.citizens.unshift(
    normalizeCitizen({
      id: "avatar",
      name: avatarName,
      role: "你的分身",
      color: "#174743",
      x: 0.6,
      y: 0.58,
        purpose: "从真实生活带入选择与体验",
        mood: 64,
        energy: 72,
        trust: 72,
        zoneId: defaultZone,
        age: 26,
        professionId: "white-collar",
        traces: []
      })
  );
  const avatarBackfill = society.citizens.find((citizen) => citizen.id === "avatar");
  if (avatarBackfill) {
    setCitizenZonePosition(avatarBackfill, getCitizenZone(society, avatarBackfill));
  }
}

function getSafeAvatarZoneForSociety(society) {
  const zones = getOpenWorldZoneList(society);
  return zones[0]?.id || OPEN_WORLD_ZONES[0].id;
}

function buildSocietyFromInput(rawText) {
  const plan = parseScenario(rawText);
  const theme = WORLD_THEMES[plan.sceneKey] || WORLD_THEMES.default;
  const zones = buildOpenWorldZones();
  const citizens = DEFAULT_CITIZEN_LIBRARY.map((seed, index) => {
    const citizen = normalizeCitizen(seed);
    citizen.zoneId = zones[index % zones.length]?.id || OPEN_WORLD_ZONES[0].id;
    setCitizenZonePosition(citizen, zones.find((zone) => zone.id === citizen.zoneId));
    return citizen;
  });
  const newSociety = {
    ...buildBaseSociety(),
    scenarioText: plan.sceneText,
    scene: plan.scene,
    tone: plan.baseTone,
    tension: plan.tension,
    lastPreset: plan.sceneKey,
    principles: {
      freedom: plan.principles.freedom,
      equality: plan.principles.equality,
      openness: plan.principles.openness
    },
    metrics: {
      freedom: plan.principles.freedom,
      equality: plan.principles.equality,
      openness: plan.principles.openness
    },
    missions: buildMissions(plan),
    zones,
    log: [
      {
        turn: 0,
        type: "neutral",
        text: `社会已生成：${escapeHtml(plan.scene)}，主题是“${escapeHtml(plan.sceneText.slice(0, 48))}”。`
      }
    ],
    citizens,
    actionHistory: []
  };

  if (theme.baseTension > 55 && !plan.sceneText.includes("开放")) {
    newSociety.tension = clamp(newSociety.tension - 4, 24, 88);
  }

  syncAvatarForSociety(newSociety);

  // Spawn entities
  if (typeof spawnWorldEntities === "function") spawnWorldEntities(newSociety);

  newSociety.citizens.forEach((citizen) => {
    citizen.traces = [];
  });
  newSociety.agents = normalizeAgentRuntime(newSociety.agents, newSociety.citizens);
  recordAgentMemory(
    newSociety,
    "avatar",
    `社会从场景“${plan.scene}”生成，初始主题是“${plan.sceneText.slice(0, 48)}”。`,
    "world",
    5,
    ["scene-seed"]
  );
  queueAgentInbox(newSociety, {
    scope: "world",
    type: "seed",
    hint: "observe",
    text: composeAgentWorldSummary(newSociety)
  });

  return newSociety;
}

// hydrateSocietyState - provided by game.js

function addSocietyEvent(text, type = "neutral") {
  const society = state.society;
  queueAgentInbox(society, {
    scope: "world",
    type,
    text,
    hint: type === "conflict" ? "repair" : type === "support" ? "support" : "observe"
  });
  society.log.unshift({
    turn: society.turn,
    type,
    text: `${escapeHtml(text)}`,
    at: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  });
  if (society.log.length > MAX_SOCIETY_EVENTS) {
    society.log = society.log.slice(0, MAX_SOCIETY_EVENTS);
  }
}

function randomCitizen(excludeId) {
  const candidates = getAliveCitizens(state.society).filter((citizen) => citizen.id !== excludeId);
  return randomFrom(candidates);
}

function pickNeediestCitizen(excludeId) {
  let lowest = null;
  getAliveCitizens(state.society).forEach((citizen) => {
    if (citizen.id === excludeId) {
      return;
    }
    if (!lowest || citizen.mood < lowest.mood) {
      lowest = citizen;
    }
  });
  return lowest;
}

function pickMostConflicted() {
  return getAliveCitizens(state.society).reduce((acc, citizen) => {
    if (!acc) {
      return citizen;
    }
    return citizen.trust < acc.trust ? citizen : acc;
  }, null);
}

function decideAction(citizen) {
  if (!citizen.alive) {
    return { actorId: citizen.id, type: "rest", targetId: null };
  }
  const society = state.society;
  const activePhase = getWorldPhaseByTurn(society.turn);
  const peerCount = getAliveCitizens(society).length;
  const zone = getCitizenZone(society, citizen);
  const routineAction = getCitizenScheduleAction(society, citizen);
  const routine = pickRoutineZone(society, citizen);

  if (peerCount <= 1 || citizen.energy <= 24) {
    return { actorId: citizen.id, type: "rest", targetId: null };
  }

  if (routine && routine.id) {
    citizen.zoneId = routine.id;
  }

  if (routineAction) {
    const scheduleBias =
      routineAction === "rest"
        ? { proposeRate: 0.08, cooperateRate: 0.25, supportRate: 0.58, listenRate: 0.7, meditateRate: 0.2 }
        : routineAction === "propose"
          ? { proposeRate: 0.58, cooperateRate: 0.5, supportRate: 0.25, listenRate: 0.35, meditateRate: 0.1 }
          : routineAction === "cooperate"
            ? { proposeRate: 0.12, cooperateRate: 0.72, supportRate: 0.48, listenRate: 0.75, meditateRate: 0.18 }
            : routineAction === "listen"
              ? { proposeRate: 0.12, cooperateRate: 0.32, supportRate: 0.52, listenRate: 0.85, meditateRate: 0.28 }
              : { proposeRate: 0.18, cooperateRate: 0.38, supportRate: 0.44, listenRate: 0.62, meditateRate: 0.2 };

    if (Math.random() < scheduleBias.supportRate && citizen.mood < 45) {
      const target = pickNeediestCitizen(citizen.id);
      return { actorId: citizen.id, type: "support", targetId: target?.id || null };
    }
    if (Math.random() < scheduleBias.proposeRate && routineAction === "propose") {
      return { actorId: citizen.id, type: "propose", targetId: randomCitizen(citizen.id)?.id || null };
    }
    if (Math.random() < scheduleBias.cooperateRate && routineAction === "cooperate") {
      return { actorId: citizen.id, type: "cooperate", targetId: randomCitizen(citizen.id)?.id || null };
    }
    if (Math.random() < scheduleBias.listenRate && routineAction === "listen") {
      return { actorId: citizen.id, type: "listen", targetId: randomCitizen(citizen.id)?.id || null };
    }
    if (routineAction === "rest" && Math.random() < 0.75) {
      return { actorId: citizen.id, type: "rest", targetId: null };
    }
  }

  const lowMood = pickNeediestCitizen(citizen.id);
  const lowTrust = pickMostConflicted();
  const conflictMode = society.tension > 64;
  const rand = Math.random();
  const phaseBias = new Set(activePhase?.missionBias || []);

  const openBias = {
    proposeRate: phaseBias.has("propose") ? 0.38 : 0.32,
    cooperateRate: phaseBias.has("cooperate") ? 0.72 : 0.62,
    supportRate: phaseBias.has("support") ? 0.64 : 0.44,
    listenRate: phaseBias.has("listen") ? 0.92 : 0.84,
    meditateRate: 0.24
  };

  if (zone?.role === "heal" || isActorVulnerable(citizen)) {
    openBias.cooperateRate -= 0.24;
    openBias.proposeRate -= 0.18;
  }
  if (zone?.role === "public") {
    openBias.proposeRate += 0.16;
    openBias.listenRate -= 0.18;
  }
  if (zone?.role === "cooperate") {
    openBias.cooperateRate += 0.12;
    openBias.mediateRate = 0.28;
    openBias.supportRate += 0.09;
  }
  if (zone?.role === "support") {
    openBias.supportRate += 0.18;
    openBias.proposeRate -= 0.06;
  }
  if (zone?.role === "meditate") {
    openBias.mediateRate = 0.34;
    openBias.supportRate += 0.06;
  }

  openBias.proposeRate = clamp(openBias.proposeRate, 0.05, 0.95);
  openBias.cooperateRate = clamp(openBias.cooperateRate, 0.1, 0.92);
  openBias.supportRate = clamp(openBias.supportRate, 0.1, 0.92);
  openBias.listenRate = clamp(openBias.listenRate, 0.1, 0.98);
  openBias.meditateRate = clamp(openBias.meditateRate, 0.05, 0.55);

  if (citizen.mood < 28 && lowMood && rand < 0.58) {
    return { actorId: citizen.id, type: "support", targetId: lowMood.id };
  }

  if (conflictMode && rand < 0.28) {
    return { actorId: citizen.id, type: "meditate", targetId: randomCitizen(citizen.id)?.id || null };
  }

  if (citizen.mood > 70 && rand < openBias.proposeRate) {
    return { actorId: citizen.id, type: "propose", targetId: randomCitizen(citizen.id)?.id || null };
  }

  if (citizen.mood < 40 && rand < openBias.supportRate) {
    return { actorId: citizen.id, type: "support", targetId: randomCitizen(citizen.id)?.id || null };
  }

  if (rand < (openBias.meditateRate + (phaseBias.has("meditate") ? 0.12 : 0)) && lowTrust && lowTrust.id !== citizen.id && (lowTrust.trust < 45 || lowTrust.mood < 35)) {
    return { actorId: citizen.id, type: "meditate", targetId: lowTrust.id };
  }

  if (rand < openBias.cooperateRate) {
    return { actorId: citizen.id, type: "cooperate", targetId: randomCitizen(citizen.id)?.id || null };
  }

  if (rand < openBias.listenRate) {
    return { actorId: citizen.id, type: "listen", targetId: randomCitizen(citizen.id)?.id || null };
  }

  return { actorId: citizen.id, type: "rest", targetId: null };
}

function resolveAction(action) {
  const society = state.society;
  const actor = society.citizens.find((citizen) => citizen.id === action.actorId);
  if (!actor) {
    return null;
  }
  if (!actor.alive) {
    return {
      actorId: actor.id,
      type: "rest",
      score: 0,
      text: `${actor.name} 已进入休憩纪念状态。`,
      actor: actor.name,
      conflict: false,
      zone: "安宁公地"
    };
  }
  const zone = getCitizenZone(society, actor);
  const target = action.targetId ? society.citizens.find((citizen) => citizen.id === action.targetId) : null;
  let finalType = action.type;
  let governanceOverride = null;
  if (isActorVulnerable(actor)) {
    finalType = pickAlternativeActionForVulnerable(action.type);
    if (finalType !== action.type) {
      governanceOverride = ` ${actor.name} 处于弱势窗口，按“允许脆弱”规则优先安全互动。`;
      recordGovernanceSignal("safety", `准则执行：${actor.name} 从“${action.type}”被重定向为“${finalType}”。`, actor.name);
      recordAgentAudit(society, actor.name, "redirected", governanceOverride);
      actor.actionCount = actor.actionCount || 0;
      actor.actionStreak = actor.actionStreak || 0;
      actor.lastAction = finalType;
    }
  } else if (isActorDominating(society, actor) && action.type === "propose") {
    finalType = zone?.role === "public" && actor.mood > 60 ? "support" : "listen";
    governanceOverride = `社会准则对“发言垄断”进行治理：${actor.name} 先做支持行为。`;
    recordGovernanceSignal(
      "conflict",
      `准则执行：${actor.name} 的高频公开行为已被降频，改为 ${finalType} 以守住平等。`,
      actor.name
    );
    recordAgentAudit(society, actor.name, "fairness-redirect", governanceOverride);
  } else if (zone?.role === "heal" && action.type === "propose" && actor.mood > 30) {
    finalType = pickAlternativeActionForVulnerable(action.type);
    governanceOverride = `地区约束：静默角落优先协作修复，不直接形成公开提案。`;
    recordAgentAudit(society, actor.name, "zone-redirect", governanceOverride);
  }

  actor.lastAction = finalType;
  actor.lastRound = society.turn + 1;
  actor.actionCount = (actor.actionCount || 0) + 1;
  actor.actionStreak = actor.lastAction === finalType ? (actor.actionStreak || 0) + 1 : 1;
  actor.traces = [...(actor.traces || []), finalType].slice(-8);

  const actorAnchor = `“${actor.name}”`;
  const targetLabel = target ? `“${target.name}”` : "公共广场";
  let result = {
    actorId: actor.id,
    targetId: target?.id || null,
    type: finalType,
    score: 0,
    text: "",
    actor: actor.name,
    target: target?.name || "",
    conflict: false,
    governance: governanceOverride,
    zone: zone?.name || "开放区"
  };

  const pushMotion = (energy, vx, vy) => {
    actor.vx = clamp(actor.vx + vx, -0.03, 0.03);
    actor.vy = clamp(actor.vy + vy, -0.03, 0.03);
    actor.energy = clamp(actor.energy + energy, 0, 100);
  };

  if (finalType === "propose") {
    actor.mood = clamp(actor.mood + 4, 0, 100);
    actor.trust = clamp(actor.trust + 2, 0, 100);
    actor.energy = clamp(actor.energy - 8, 0, 100);
    if (target) {
      target.mood = clamp(target.mood + 4, 0, 100);
      target.trust = clamp(target.trust + 1, 0, 100);
      pushMotion(-8, (target.x - actor.x) * 0.02, (target.y - actor.y) * 0.02);
      result.text = `${actorAnchor} 向 ${targetLabel} 提出一个公开提议，约定了下一次可验证的行动。`;
      result.score = 3;
    } else {
      pushMotion(-8, 0, 0);
      result.text = `${actorAnchor} 在公共空间发布了一个开放提案。`;
      result.score = 2;
    }
    return result;
  }

  if (finalType === "cooperate") {
    actor.mood = clamp(actor.mood + 6, 0, 100);
    actor.energy = clamp(actor.energy - 10, 0, 100);
    actor.trust = clamp(actor.trust + 3, 0, 100);
    if (target) {
      target.mood = clamp(target.mood + 6, 0, 100);
      target.trust = clamp(target.trust + 4, 0, 100);
      target.trust = clamp(target.trust + 4, 0, 100);
      pushMotion(-10, (target.x - actor.x) * 0.02, (target.y - actor.y) * 0.02);
      result.text = `${actorAnchor} 与 ${targetLabel} 完成一次协作任务。`;
      result.score = 5;
    } else {
      pushMotion(-8, 0, 0);
      result.text = `${actorAnchor} 沉默中完成了自我练习。`;
      result.score = 1;
    }
    return result;
  }

  if (finalType === "support") {
    actor.mood = clamp(actor.mood + 4, 0, 100);
    actor.trust = clamp(actor.trust + 2, 0, 100);
    actor.energy = clamp(actor.energy - 7, 0, 100);
    if (target) {
      target.mood = clamp(target.mood + 9, 0, 100);
      target.trust = clamp(target.trust + 5, 0, 100);
      pushMotion(-7, (target.x - actor.x) * 0.021, (target.y - actor.y) * 0.021);
      result.text = `${actorAnchor} 主动陪伴 ${targetLabel}，先将需求转成了可被理解的语言。`;
      result.score = 4;
    } else {
      result.text = `${actorAnchor} 用安静给出支持。`;
      result.score = 1;
    }
    return result;
  }

  if (finalType === "listen") {
    actor.mood = clamp(actor.mood + 2, 0, 100);
    actor.trust = clamp(actor.trust + 1, 0, 100);
    actor.energy = clamp(actor.energy - 4, 0, 100);
    if (target) {
      target.trust = clamp(target.trust + 2, 0, 100);
      pushMotion(-4, (target.x - actor.x) * 0.012, (target.y - actor.y) * 0.012);
      result.text = `${actorAnchor} 听到了 ${targetLabel} 的表达，并复述成更清晰的版本。`;
      result.score = 2;
    } else {
      result.text = `${actorAnchor} 在场域中保持聆听。`;
      result.score = 0;
    }
    return result;
  }

  if (finalType === "meditate") {
    actor.mood = clamp(actor.mood + 2, 0, 100);
    actor.energy = clamp(actor.energy - 6, 0, 100);
    if (target && target.mood < 50) {
      target.mood = clamp(target.mood + 10, 0, 100);
      target.trust = clamp(target.trust + 6, 0, 100);
      pushMotion(-6, (target.x - actor.x) * 0.025, (target.y - actor.y) * 0.025);
      result.text = `${actorAnchor} 以调停者身份和 ${targetLabel} 进行情绪对齐，暂时平复了紧张。`;
      result.score = 6;
    } else {
      result.text = `${actorAnchor} 宣布“暂停冲突”，让场景先冷却。`;
      result.score = 1;
    }
    society.tension = clamp(society.tension - 3, 20, 88);
    return result;
  }

  if (finalType === "rest") {
    actor.mood = clamp(actor.mood + 1, 0, 100);
    actor.energy = clamp(actor.energy + 12, 0, 100);
    actor.vx = clamp(actor.vx * 0.4, -0.02, 0.02);
    actor.vy = clamp(actor.vy * 0.4, -0.02, 0.02);
    result.text = `${actorAnchor} 选择休整，下一次行动会更稳定。`;
    result.score = 0;
    return result;
  }

  return {
    type: finalType,
    text: `${actorAnchor} 保持观察。`,
    score: 0,
    actor: actor.name,
    conflict: false,
    governance: governanceOverride,
    zone: zone?.name || "开放区"
  };
}

function evaluateConflicts() {
  const society = state.society;
  const population = getAliveCitizens(society);
  if (!population.length) {
    return;
  }
  const lowConfidence = population.filter((citizen) => citizen.mood < 35).length;
  if (lowConfidence >= Math.ceil(population.length * 0.55)) {
    society.tension = clamp(society.tension + 6, 20, 90);
    addSocietyEvent("场域压力升高：超过半数分身出现低气场，系统发起安抚机制。", "conflict");
    return;
  }
}

function computeEqualityMetric() {
  const citizens = getAliveCitizens(state.society);
  const counts = citizens.map((citizen) => citizen.actionCount || 0);
  const max = Math.max(...counts, 1);
  const min = Math.min(...counts, 0);
  return clamp(100 - (max - min) * 7, 40, 100);
}

function computeFreedomMetric() {
  const recentConflicts = state.society.log.slice(0, 8).filter((event) => event.type === "conflict").length;
  const citizens = getAliveCitizens(state.society);
  const denominator = Math.max(citizens.length, 1);
  return clamp(
      Math.round(
      state.society.principles.freedom +
        0.2 * citizens.reduce((sum, citizen) => sum + citizen.mood, 0) / denominator -
        recentConflicts * 4 -
        Math.max(0, state.society.tension - 45) * 0.4
    ),
    40,
    100
  );
}

function computeOpennessMetric() {
  const publicAction = state.society.log.filter((event) => event.type === "propose" || event.type === "cooperate").length;
  return clamp(
    Math.round(
      state.society.principles.openness +
      publicAction * 1.3 +
      Math.min(12, state.society.log.length * 0.6) -
      state.society.fairnessPenalty * 2
    ),
    40,
    100
  );
}

function applyMissionProgress(eventType) {
  state.society.missions.forEach((mission) => {
    if (mission.done) {
      return;
    }
    if (mission.key === eventType) {
      mission.progress += 1;
      if (mission.progress >= mission.target) {
        mission.done = true;
        addSocietyEvent(`任务达成：${mission.label}，社会治理评分 +6。`, "support");
        state.society.score += 6;
      }
    }
  });
}

function refreshDominanceWindow() {
  const society = state.society;
  if (!society.engine) {
    society.engine = {
      version: WORLD_ENGINE_VERSION,
      activeTick: 0,
      dominanceWindow: [],
      zoneHistory: [],
      governanceTriggers: []
    };
  }

  const alive = getAliveCitizens(society);
  const countsByCitizen = {};
  alive.forEach((citizen) => {
    countsByCitizen[citizen.id] = 0;
  });
  const recentActors = society.actorActionHistory.slice(-Math.max(1, alive.length * 2));
  recentActors.forEach((actorName) => {
    const actor = society.citizens.find((item) => item.id === actorName || item.name === actorName);
    if (actor && actor.alive !== false) {
      countsByCitizen[actor.id] = (countsByCitizen[actor.id] || 0) + 1;
    }
  });

  const totals = recentActors.length || 1;
  const dominant = Object.entries(countsByCitizen).reduce(
    (best, [id, count]) => {
      if (count > best.count) {
        return { id, count };
      }
      return best;
    },
    { id: null, count: 0 }
  );
  const actor = society.citizens.find((item) => item.id === dominant.id);

  society.engine.dominanceWindow.push({
    turn: society.turn,
    dominant: actor ? actor.name : "暂无",
    ratio: clamp(Math.round((dominant.count / totals) * 100), 0, 100)
  });
  society.engine.dominanceWindow = society.engine.dominanceWindow.slice(-12);

  if (actor && dominant.count / totals > OPEN_WORLD_RULES.hardConstraints.dominanceRatioLimit) {
    society.fairnessPenalty = clamp(society.fairnessPenalty + 1, 0, 12);
    society.engine.governanceTriggers = [...(society.engine.governanceTriggers || []), {
      turn: society.turn,
      type: "fairness",
      text: `平等风险：${actor.name} 在近期动作里占比较高，启动公平补偿。`,
      actor: actor.name
    }].slice(-8);
  }
}

function updateSocietyMetricsFromEvents() {
  state.society.metrics.equality = computeEqualityMetric();
  state.society.metrics.freedom = computeFreedomMetric();
  state.society.metrics.openness = computeOpennessMetric();
  state.society.score = clamp((state.society.score || 0) + 0, 0, 9999);
}

function getMetricTrend(metricKey) {
  const history = state.society.metricHistory || [];
  if (!history.length) {
    return "0";
  }
  if (history.length === 1) {
    return "↗0";
  }

  const previous = history[Math.max(0, history.length - 2)][metricKey];
  const current = history[history.length - 1][metricKey];
  const delta = current - previous;
  if (delta > 0) {
    return `↗ ${Math.abs(delta)}`;
  }
  if (delta < 0) {
    return `↘ ${Math.abs(delta)}`;
  }
  return "→ 0";
}

function applyCityDrift() {
  getAliveCitizens(state.society).forEach((citizen) => {
    citizen.x = clamp(citizen.x + (citizen.vx || 0), 0.06, 0.94);
    citizen.y = clamp(citizen.y + (citizen.vy || 0), 0.06, 0.9);
    citizen.vx = (citizen.vx || 0) * 0.84;
    citizen.vy = (citizen.vy || 0) * 0.84;
  });
}

function applySocietyHomeostasis() {
  const society = state.society;
  getAliveCitizens(society).forEach((citizen) => {
    citizen.mood = clamp(Math.round(citizen.mood * WORLD_EVOLUTION.naturalDecay + 4), 0, 100);
    citizen.energy = clamp(Math.round(citizen.energy * WORLD_EVOLUTION.naturalDecay + 6), 0, 100);
    citizen.trust = clamp(Math.round(citizen.trust * WORLD_EVOLUTION.naturalDecay + 3), 0, 100);
  });
  society.harmony = clamp(Math.round(society.harmony * WORLD_EVOLUTION.naturalDecay + 2), 0, 100);
  society.fairnessPenalty = clamp(Math.round(society.fairnessPenalty * WORLD_EVOLUTION.fairnessDecay), 0, 12);
}

function stepSociety() {
  const society = state.society;
  if (!Array.isArray(society.citizens) || society.citizens.length === 0) {
    return;
  }

  runAgentRuntimeTick(society);
  society.turn += 1;
  advanceWorldClock(society);
  runLifeClockAdvance(society);

  const ordered = shuffle([...getAliveCitizens(society)]);

  ordered.forEach((citizen) => {
    const action = decideAction(citizen);
    const plannedAction = planCitizenAgentAction(society, citizen, action);
    const result = resolveAction(plannedAction);
    if (!result) {
      return;
    }
    applySocietyActionResult(result);
    recordAgentOutbox(society, citizen, result, plannedAction.context || getCitizenAgentContext(society, citizen));
    recordAgentMemory(
      society,
      citizen.id,
      `${citizen.name} 在 ${result.zone || "开放区"} 执行了 ${result.type}，结果：${result.text}`,
      "action",
      result.score + 1,
      [result.type, result.zone].filter(Boolean)
    );
    summarizeAgentReflection(society, citizen, result, plannedAction.context || getCitizenAgentContext(society, citizen));
  });
  refreshDominanceWindow();

  evolveFromTurn();

  // Update entities and weather
  if (typeof updateEntityPositions === "function") updateEntityPositions(society);
  if (typeof updateWeather === "function") updateWeather(society);

  const conflictRatio = state.society.log.slice(-Math.max(1, getAliveCitizens(society).length || 1)).filter((event) => event.type === "conflict").length;
  if (conflictRatio >= 2) {
    society.fairnessPenalty += 2;
    society.tension = clamp(society.tension + 4, 22, 90);
    addSocietyEvent("连锁冲突被检测到，系统将下一轮优先调节对话公平。", "conflict");
  }

  evaluateConflicts();
  updateSocietyMetricsFromEvents();
  if (society.engine) {
    const zoneCounts = {};
    getAliveCitizens(society).forEach((citizen) => {
      const zone = getCitizenZone(society, citizen);
      const key = zone?.name || "开放区";
      zoneCounts[key] = (zoneCounts[key] || 0) + 1;
    });
    society.engine.zoneHistory = [...(society.engine.zoneHistory || []), { turn: society.turn, zones: zoneCounts }].slice(-12);
  }
  applyCityDrift();
  applySocietyHomeostasis();
  recordSocietyMetricsHistory();
  if (typeof renderSocietyViews === "function") renderSocietyViews();
  if (typeof renderSocietyEcho === "function") renderSocietyEcho();
  if (society.turn % 4 === 0) {
    addEcho(`社会余波：第 ${society.turn} 回合 ${society.scene} 维持 ${state.society.metrics.freedom}% 自由指数。`);
  }
  persist();
}

// Expose state initialization (game.js calls init)
function initEngineState() {
  state = loadState();
}

// ── Utility functions needed by game.js ──

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripTags(value) {
  const div = document.createElement("div");
  div.innerHTML = value;
  return div.textContent || div.innerText || "";
}
