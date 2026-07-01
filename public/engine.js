const STORAGE_KEY = "mirror-life-mvp";

let state = null;
let activeMode = "mirror";
let activeRobotMode = "quiet";
let mirrorFrame = null;
let societyFrame = null;
let societyTimer = null;
let lastBottleCheckAt = 0;
let persistHandle = null;
let persistHandleType = "";
let lastPersistSnapshot = "";

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

const LIFE_SCOPE_LABELS = {
  emotion: "情感瞬间",
  career: "职业岔路",
  relationship: "关系片段",
  turning_point: "人生转折"
};

const DEFAULT_LIFE_CAPSULES = [
  {
    id: "capsule-career-river",
    sourceFragmentId: "seed-career-river",
    title: "河岸边的转职者",
    perspectiveRole: "准备离开稳定工作的城市白领",
    lifeStage: "29岁 · 职业岔路",
    themes: ["career", "boundary", "turning_point"],
    anonymizedScenario: "你连续三年接住了团队里最难收尾的工作。今天，新的项目又默认落到你身上。你看见自己想离开，但也害怕这只是一次逃跑。",
    keyChoiceSet: ["留下并谈边界", "立刻离开", "向可信同事求助", "先沉默观察一晚"],
    boundaries: ["不暴露原始公司、姓名、城市", "体验者只能看到重构后的处境"]
  },
  {
    id: "capsule-family-window",
    sourceFragmentId: "seed-family-window",
    title: "窗边说出空间的人",
    perspectiveRole: "第一次想对家人说清边界的人",
    lifeStage: "32岁 · 家庭关系",
    themes: ["relationship", "family", "emotion"],
    anonymizedScenario: "你一直被家人的担心包围。每次解释都会变成争执，所以你习惯先答应。今天你突然意识到，如果再不说出需要空间，爱会继续以亏欠的形式存在。",
    keyChoiceSet: ["慢慢说出需要空间", "继续顺从", "写信而不是当面说", "请第三个人陪同"],
    boundaries: ["不呈现真实家庭成员身份", "不鼓励体验者联系原作者"]
  },
  {
    id: "capsule-love-silence",
    sourceFragmentId: "seed-love-silence",
    title: "沉默前的那句话",
    perspectiveRole: "在亲密关系里害怕开口的人",
    lifeStage: "26岁 · 亲密关系",
    themes: ["relationship", "vulnerability", "emotion"],
    anonymizedScenario: "你不是不在乎，只是每次要解释时都像站在很窄的桥上。对方问你为什么又沉默，你知道如果这次继续退回去，关系会更远。",
    keyChoiceSet: ["承认自己害怕", "解释所有细节", "先离开现场", "请对方给十分钟"],
    boundaries: ["不显示原始关系细节", "体验结果只返回洞见和回声"]
  }
];

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
const LIFE_WEEK_MEMORY_LIMIT = 8;
const LIFE_WEEK_DIARY_LIMIT = 12;
const LIFE_WEEK_LOG_LIMIT = 32;

const LIFE_WEEK_STAGES = [
  {
    id: "plan",
    label: "Plan",
    title: "本周想成为谁",
    description: "分身整理本周方向，把人生胶囊里的身份愿望写成行动意图。"
  },
  {
    id: "contact",
    label: "Contact",
    title: "寻找同频灵魂",
    description: "分身向社区角色、人生胶囊或漂流瓶发起一次低压弱连接。"
  },
  {
    id: "activity",
    label: "Activity",
    title: "发生关键行动",
    description: "虚拟社会执行一段行动，关系、情绪和世界张力随之改变。"
  },
  {
    id: "review",
    label: "Review",
    title: "写下世界回声",
    description: "系统生成本周人生回声、分身反思和轻量人生奖励。"
  },
  {
    id: "settle",
    label: "Settle",
    title: "沉淀记忆",
    description: "周记、关系笔记和机器人信号被写入，下一周重新开始。"
  }
];

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

const ZONE_MODEL_BLUEPRINTS = {
  "public-plaza": { model: "civic-forum", layer: "public", gameplay: "公开提案、共识投票、弱势保护", provides: ["openness", "voice"], buildVerb: "召集" },
  "maternity-hospital": { model: "care-cradle", layer: "life", gameplay: "出生、照护、情绪稳定", provides: ["care", "safety"], buildVerb: "照护" },
  residential: { model: "home-cluster", layer: "daily", gameplay: "回家复盘、低频陪伴、恢复能量", provides: ["rest", "belonging"], buildVerb: "安顿" },
  kindergarten: { model: "play-school", layer: "learning", gameplay: "低压学习、模仿、基础协作", provides: ["learning", "play"], buildVerb: "启蒙" },
  "primary-school": { model: "skill-classroom", layer: "learning", gameplay: "技能练习、平等轮换、同伴互助", provides: ["learning", "fairness"], buildVerb: "练习" },
  "middle-school": { model: "identity-campus", layer: "learning", gameplay: "身份探索、同伴关系、边界表达", provides: ["identity", "peer"], buildVerb: "探索" },
  university: { model: "open-campus", layer: "learning", gameplay: "研究、社团、职业雏形", provides: ["research", "career"], buildVerb: "研究" },
  "office-district": { model: "work-tower", layer: "work", gameplay: "协作项目、边界谈判、职业成长", provides: ["career", "organization"], buildVerb: "组织" },
  factory: { model: "maker-floor", layer: "work", gameplay: "制造、维护、基础设施升级", provides: ["production", "tools"], buildVerb: "制造" },
  "legal-court": { model: "fairness-court", layer: "governance", gameplay: "冲突调停、规则审计、申诉", provides: ["justice", "fairness"], buildVerb: "裁决" },
  "creative-studio": { model: "idea-studio", layer: "creation", gameplay: "设计新物件、叙事资产、技能沉淀", provides: ["creativity", "prototype"], buildVerb: "创造" },
  "commercial-zone": { model: "market-street", layer: "exchange", gameplay: "资源交换、需求发现、职业机会", provides: ["exchange", "resources"], buildVerb: "交换" },
  farm: { model: "living-farm", layer: "ecology", gameplay: "食物生产、生态照护、稳定供给", provides: ["food", "ecology"], buildVerb: "培育" },
  park: { model: "breathing-park", layer: "healing", gameplay: "恢复、散步、轻度社交", provides: ["rest", "nature"], buildVerb: "舒缓" },
  zoo: { model: "empathy-zoo", layer: "ecology", gameplay: "照护训练、尊重差异、非语言陪伴", provides: ["empathy", "ecology"], buildVerb: "照看" },
  "botanical-garden": { model: "botanical-dome", layer: "ecology", gameplay: "植物培育、慢变量观察、情绪修复", provides: ["ecology", "healing"], buildVerb: "栽培" },
  "night-market": { model: "festival-street", layer: "play", gameplay: "娱乐、偶遇、短期快乐", provides: ["joy", "encounter"], buildVerb: "点亮" },
  "quiet-nook": { model: "silence-nook", layer: "healing", gameplay: "独处、低刺激恢复、暂退权", provides: ["safety", "privacy"], buildVerb: "庇护" },
  "repair-station": { model: "repair-hub", layer: "governance", gameplay: "误会修复、关系复盘、调停技能", provides: ["repair", "mediation"], buildVerb: "修复" },
  cemetery: { model: "memory-garden", layer: "memory", gameplay: "纪念、生命回顾、代际传承", provides: ["memory", "continuity"], buildVerb: "纪念" }
};

const EVOLVABLE_SCENE_BLUEPRINTS = [
  { id: "empathy-lab", name: "共情调停屋", role: "meditate", archetype: "support", model: "empathy-lab", trigger: "high_tension", provides: ["repair", "empathy"], profession: "empathy-mediator", professionName: "共情调停师", x: 0.18, y: 0.86, w: 0.17, h: 0.11 },
  { id: "story-archive", name: "开放故事馆", role: "public", archetype: "social", model: "story-archive", trigger: "low_openness", provides: ["voice", "memory"], profession: "story-curator", professionName: "故事策展人", x: 0.08, y: 0.28, w: 0.18, h: 0.12 },
  { id: "commons-workshop", name: "共识工坊", role: "cooperate", archetype: "work", model: "commons-workshop", trigger: "low_equality", provides: ["fairness", "tools"], profession: "commons-builder", professionName: "公共建设师", x: 0.3, y: 0.66, w: 0.17, h: 0.12 },
  { id: "rest-courtyard", name: "慢生活庭院", role: "rest", archetype: "daily", model: "rest-courtyard", trigger: "low_energy", provides: ["rest", "belonging"], profession: "rest-designer", professionName: "恢复设计师", x: 0.66, y: 0.84, w: 0.17, h: 0.1 },
  { id: "mentor-hall", name: "学徒导师厅", role: "cooperate", archetype: "education", model: "mentor-hall", trigger: "learning_need", provides: ["learning", "career"], profession: "mentor", professionName: "人生导师", x: 0.66, y: 0.08, w: 0.16, h: 0.12 },
  { id: "resource-kitchen", name: "资源厨房", role: "heal", archetype: "life", model: "resource-kitchen", trigger: "low_stability", provides: ["food", "care"], profession: "resource-cook", professionName: "资源厨师", x: 0.28, y: 0.48, w: 0.15, h: 0.11 }
];

const MBTI_ARCHETYPES = [
  { type: "INTJ", label: "战略建筑师", color: "#4e5c8d", body: "angular", socialBias: { propose: 0.18, cooperate: 0.08, listen: -0.04 }, need: "mastery", relationPreference: "market_pricing" },
  { type: "INTP", label: "逻辑发明家", color: "#6d70b8", body: "thin", socialBias: { propose: 0.08, listen: 0.12, rest: 0.06 }, need: "clarity", relationPreference: "equality_matching" },
  { type: "ENTJ", label: "组织指挥者", color: "#e63946", body: "bold", socialBias: { propose: 0.2, cooperate: 0.08, support: -0.03 }, need: "agency", relationPreference: "authority_ranking" },
  { type: "ENTP", label: "可能性辩手", color: "#f1c40f", body: "spark", socialBias: { propose: 0.16, listen: 0.08, cooperate: 0.06 }, need: "novelty", relationPreference: "equality_matching" },
  { type: "INFJ", label: "洞察守望者", color: "#9b5de5", body: "soft", socialBias: { listen: 0.2, support: 0.12, meditate: 0.08 }, need: "meaning", relationPreference: "communal_sharing" },
  { type: "INFP", label: "理想疗愈者", color: "#ff8fab", body: "soft", socialBias: { support: 0.18, rest: 0.08, listen: 0.1 }, need: "authenticity", relationPreference: "communal_sharing" },
  { type: "ENFJ", label: "社群点灯人", color: "#2ecc71", body: "open", socialBias: { support: 0.16, cooperate: 0.12, propose: 0.08 }, need: "belonging", relationPreference: "communal_sharing" },
  { type: "ENFP", label: "灵感漫游者", color: "#ffb703", body: "spark", socialBias: { propose: 0.1, listen: 0.12, cooperate: 0.1 }, need: "freedom", relationPreference: "equality_matching" },
  { type: "ISTJ", label: "秩序守护者", color: "#5f6f52", body: "square", socialBias: { cooperate: 0.14, rest: 0.05, propose: -0.02 }, need: "stability", relationPreference: "authority_ranking" },
  { type: "ISFJ", label: "日常照护者", color: "#86efac", body: "round", socialBias: { support: 0.2, cooperate: 0.08, listen: 0.08 }, need: "security", relationPreference: "communal_sharing" },
  { type: "ESTJ", label: "公共执行官", color: "#b45f45", body: "square", socialBias: { propose: 0.14, cooperate: 0.14, meditate: 0.04 }, need: "order", relationPreference: "authority_ranking" },
  { type: "ESFJ", label: "关系织网者", color: "#fb7185", body: "round", socialBias: { support: 0.16, cooperate: 0.12, listen: 0.08 }, need: "harmony", relationPreference: "communal_sharing" },
  { type: "ISTP", label: "现场修理师", color: "#64748b", body: "compact", socialBias: { cooperate: 0.12, rest: 0.06, meditate: 0.06 }, need: "autonomy", relationPreference: "market_pricing" },
  { type: "ISFP", label: "感官造景师", color: "#a3e635", body: "soft", socialBias: { support: 0.1, rest: 0.08, cooperate: 0.08 }, need: "beauty", relationPreference: "communal_sharing" },
  { type: "ESTP", label: "行动冒险家", color: "#f97316", body: "bold", socialBias: { propose: 0.12, cooperate: 0.12, conflict: 0.03 }, need: "momentum", relationPreference: "market_pricing" },
  { type: "ESFP", label: "快乐连接者", color: "#4ea8de", body: "open", socialBias: { support: 0.1, listen: 0.1, cooperate: 0.12 }, need: "joy", relationPreference: "equality_matching" }
];

const SOCIAL_RELATION_MODELS = {
  communal_sharing: { label: "共同体照护", actions: ["support", "listen", "rest"], trustDelta: 5, reciprocityDelta: 1, disclosureDelta: 5, strainDelta: -4 },
  authority_ranking: { label: "责任排序", actions: ["propose", "meditate"], trustDelta: 2, reciprocityDelta: -1, disclosureDelta: 1, strainDelta: 1 },
  equality_matching: { label: "平等互惠", actions: ["cooperate", "listen", "meditate"], trustDelta: 4, reciprocityDelta: 5, disclosureDelta: 3, strainDelta: -2 },
  market_pricing: { label: "资源交换", actions: ["cooperate", "propose"], trustDelta: 2, reciprocityDelta: 3, disclosureDelta: 0, strainDelta: 0 }
};

const BIG_FIVE_BY_MBTI = {
  INTJ: { openness: 0.82, conscientiousness: 0.78, extraversion: 0.28, agreeableness: 0.46, neuroticism: 0.38 },
  INTP: { openness: 0.88, conscientiousness: 0.48, extraversion: 0.24, agreeableness: 0.52, neuroticism: 0.42 },
  ENTJ: { openness: 0.72, conscientiousness: 0.82, extraversion: 0.76, agreeableness: 0.38, neuroticism: 0.32 },
  ENTP: { openness: 0.9, conscientiousness: 0.46, extraversion: 0.76, agreeableness: 0.5, neuroticism: 0.36 },
  INFJ: { openness: 0.84, conscientiousness: 0.68, extraversion: 0.34, agreeableness: 0.78, neuroticism: 0.48 },
  INFP: { openness: 0.9, conscientiousness: 0.44, extraversion: 0.3, agreeableness: 0.74, neuroticism: 0.56 },
  ENFJ: { openness: 0.76, conscientiousness: 0.66, extraversion: 0.78, agreeableness: 0.82, neuroticism: 0.38 },
  ENFP: { openness: 0.92, conscientiousness: 0.42, extraversion: 0.74, agreeableness: 0.72, neuroticism: 0.44 },
  ISTJ: { openness: 0.34, conscientiousness: 0.86, extraversion: 0.34, agreeableness: 0.56, neuroticism: 0.34 },
  ISFJ: { openness: 0.4, conscientiousness: 0.78, extraversion: 0.36, agreeableness: 0.84, neuroticism: 0.44 },
  ESTJ: { openness: 0.42, conscientiousness: 0.84, extraversion: 0.72, agreeableness: 0.48, neuroticism: 0.3 },
  ESFJ: { openness: 0.44, conscientiousness: 0.72, extraversion: 0.72, agreeableness: 0.86, neuroticism: 0.42 },
  ISTP: { openness: 0.62, conscientiousness: 0.52, extraversion: 0.32, agreeableness: 0.42, neuroticism: 0.3 },
  ISFP: { openness: 0.74, conscientiousness: 0.42, extraversion: 0.34, agreeableness: 0.72, neuroticism: 0.46 },
  ESTP: { openness: 0.62, conscientiousness: 0.42, extraversion: 0.82, agreeableness: 0.44, neuroticism: 0.28 },
  ESFP: { openness: 0.68, conscientiousness: 0.38, extraversion: 0.84, agreeableness: 0.76, neuroticism: 0.34 }
};

const SCHWARTZ_VALUES_BY_NEED = {
  mastery: ["achievement", "self_direction"],
  clarity: ["self_direction", "universalism"],
  agency: ["power", "achievement"],
  novelty: ["stimulation", "self_direction"],
  meaning: ["benevolence", "universalism"],
  authenticity: ["self_direction", "benevolence"],
  belonging: ["benevolence", "conformity"],
  freedom: ["self_direction", "stimulation"],
  stability: ["security", "tradition"],
  security: ["security", "benevolence"],
  order: ["conformity", "security"],
  harmony: ["benevolence", "conformity"],
  autonomy: ["self_direction", "achievement"],
  beauty: ["hedonism", "universalism"],
  momentum: ["stimulation", "achievement"],
  joy: ["hedonism", "benevolence"]
};

const UTILITY_ACTION_PROFILES = {
  propose: { physiological: -0.1, safety: 0.05, belonging: 0.06, esteem: 0.28, selfActualization: 0.24, autonomy: 0.22, competence: 0.2, relatedness: 0.05, arousal: 0.15, dominance: 0.24, warmth: 0.02, extraversion: 0.18, conscientiousness: 0.08, agreeableness: -0.04, openness: 0.12, neuroticism: -0.1, values: ["achievement", "power", "self_direction"] },
  cooperate: { physiological: -0.08, safety: 0.12, belonging: 0.26, esteem: 0.18, selfActualization: 0.16, autonomy: 0.08, competence: 0.22, relatedness: 0.24, arousal: 0.08, dominance: 0.08, warmth: 0.16, extraversion: 0.08, conscientiousness: 0.12, agreeableness: 0.16, openness: 0.04, neuroticism: -0.08, values: ["benevolence", "achievement", "universalism"] },
  support: { physiological: 0.02, safety: 0.22, belonging: 0.28, esteem: 0.08, selfActualization: 0.08, autonomy: 0.02, competence: 0.08, relatedness: 0.3, arousal: -0.04, dominance: -0.08, warmth: 0.28, extraversion: 0.02, conscientiousness: 0.06, agreeableness: 0.28, openness: 0.02, neuroticism: 0.02, values: ["benevolence", "security", "universalism"] },
  listen: { physiological: 0.02, safety: 0.2, belonging: 0.24, esteem: 0.06, selfActualization: 0.14, autonomy: 0.06, competence: 0.08, relatedness: 0.26, arousal: -0.08, dominance: -0.18, warmth: 0.24, extraversion: -0.06, conscientiousness: 0.04, agreeableness: 0.24, openness: 0.12, neuroticism: 0.0, values: ["benevolence", "universalism", "tradition"] },
  meditate: { physiological: 0.04, safety: 0.28, belonging: 0.18, esteem: 0.12, selfActualization: 0.12, autonomy: 0.08, competence: 0.18, relatedness: 0.18, arousal: -0.12, dominance: 0.08, warmth: 0.16, extraversion: 0.02, conscientiousness: 0.16, agreeableness: 0.2, openness: 0.06, neuroticism: -0.12, values: ["security", "benevolence", "conformity"] },
  rest: { physiological: 0.34, safety: 0.24, belonging: 0.02, esteem: -0.04, selfActualization: 0.04, autonomy: 0.14, competence: -0.02, relatedness: 0.0, arousal: -0.22, dominance: -0.08, warmth: 0.02, extraversion: -0.16, conscientiousness: -0.06, agreeableness: 0.02, openness: 0.04, neuroticism: 0.1, values: ["security", "hedonism", "self_direction"] }
};

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

function hashString(value) {
  return String(value || "").split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function getMbtiArchetype(seed = {}) {
  const explicit = seed.mbtiType || seed.personalityType;
  if (explicit) {
    const found = MBTI_ARCHETYPES.find((item) => item.type === explicit);
    if (found) return found;
  }
  return MBTI_ARCHETYPES[hashString(seed.id || seed.name || seed.role) % MBTI_ARCHETYPES.length];
}

function buildBigFiveProfile(seed = {}, persona = getMbtiArchetype(seed)) {
  const base = BIG_FIVE_BY_MBTI[persona.type] || BIG_FIVE_BY_MBTI.INFP;
  const source = seed.bigFive || {};
  return {
    openness: clamp(Number(source.openness ?? base.openness), 0, 1),
    conscientiousness: clamp(Number(source.conscientiousness ?? base.conscientiousness), 0, 1),
    extraversion: clamp(Number(source.extraversion ?? base.extraversion), 0, 1),
    agreeableness: clamp(Number(source.agreeableness ?? base.agreeableness), 0, 1),
    neuroticism: clamp(Number(source.neuroticism ?? base.neuroticism), 0, 1)
  };
}

function buildMaslowNeeds(seed = {}) {
  const source = seed.needs || {};
  return {
    physiological: clamp(Number(source.physiological ?? (seed.energy ?? 66) / 100), 0, 1),
    safety: clamp(Number(source.safety ?? (seed.trust ?? 62) / 100), 0, 1),
    belonging: clamp(Number(source.belonging ?? 0.56), 0, 1),
    esteem: clamp(Number(source.esteem ?? 0.5), 0, 1),
    selfActualization: clamp(Number(source.selfActualization ?? 0.48), 0, 1),
    autonomy: clamp(Number(source.autonomy ?? 0.55), 0, 1),
    competence: clamp(Number(source.competence ?? 0.52), 0, 1),
    relatedness: clamp(Number(source.relatedness ?? 0.55), 0, 1)
  };
}

function buildPadEmotion(seed = {}) {
  const source = seed.pad || {};
  return {
    pleasure: clamp(Number(source.pleasure ?? ((seed.mood ?? 58) - 50) / 50), -1, 1),
    arousal: clamp(Number(source.arousal ?? ((seed.energy ?? 64) - 50) / 50), -1, 1),
    dominance: clamp(Number(source.dominance ?? ((seed.trust ?? 58) - 50) / 50), -1, 1)
  };
}

function buildValueProfile(seed = {}, persona = getMbtiArchetype(seed)) {
  const preferred = SCHWARTZ_VALUES_BY_NEED[persona.need] || ["self_direction", "benevolence"];
  const values = {
    power: 0.2,
    achievement: 0.25,
    hedonism: 0.22,
    stimulation: 0.22,
    self_direction: 0.28,
    universalism: 0.24,
    benevolence: 0.28,
    tradition: 0.18,
    conformity: 0.18,
    security: 0.25,
    ...(seed.values || {})
  };
  preferred.forEach((key, index) => {
    values[key] = clamp(Math.max(Number(values[key]) || 0, index === 0 ? 0.78 : 0.64), 0, 1);
  });
  Object.keys(values).forEach((key) => {
    values[key] = clamp(Number(values[key]) || 0, 0, 1);
  });
  return values;
}

function buildAttachmentStyle(seed = {}, bigFive = buildBigFiveProfile(seed)) {
  if (seed.attachmentStyle) return seed.attachmentStyle;
  if (bigFive.neuroticism > 0.62 && bigFive.agreeableness > 0.58) return "anxious";
  if (bigFive.neuroticism > 0.58 && bigFive.agreeableness < 0.48) return "avoidant";
  if (bigFive.neuroticism > 0.68 && bigFive.conscientiousness < 0.45) return "disorganized";
  return "secure";
}

function buildInterpersonalStyle(seed = {}, bigFive = buildBigFiveProfile(seed)) {
  const source = seed.interpersonal || {};
  return {
    warmth: clamp(Number(source.warmth ?? bigFive.agreeableness), 0, 1),
    dominance: clamp(Number(source.dominance ?? (bigFive.extraversion * 0.7 + bigFive.conscientiousness * 0.3)), 0, 1)
  };
}

function getZoneModel(zoneId) {
  return ZONE_MODEL_BLUEPRINTS[zoneId] || {
    model: "open-tile",
    layer: "emergent",
    gameplay: "自演化社会空间",
    provides: ["adaptation"],
    buildVerb: "生成"
  };
}

function buildGrowthState(source = {}) {
  return {
    deficits: source.deficits || {},
    unlockedScenes: Array.isArray(source.unlockedScenes) ? source.unlockedScenes.slice(0, 6) : [],
    emergentProfessions: Array.isArray(source.emergentProfessions) ? source.emergentProfessions.slice(0, 12) : [],
    constructionQueue: Array.isArray(source.constructionQueue) ? source.constructionQueue.slice(0, 8) : [],
    lastGrowthTurn: Number(source.lastGrowthTurn) || 0
  };
}

function getAvailableProfessions(society = state?.society) {
  const emergent = society?.growth?.emergentProfessions || [];
  const byId = new Map(WORLD_PROFESSIONS.map((profession) => [profession.id, profession]));
  emergent.forEach((profession) => {
    if (profession?.id) byId.set(profession.id, profession);
  });
  return [...byId.values()];
}

function getLifeWeekStageInfo(stageId) {
  return LIFE_WEEK_STAGES.find((stage) => stage.id === stageId) || LIFE_WEEK_STAGES[0];
}

function buildDefaultLifeReward(reason = "世界还在等待第一段人生回声。") {
  return {
    socialResonance: 50,
    selfFulfillment: 50,
    lifeStability: 50,
    total: 50,
    reason
  };
}

function buildLifeWeekSystem() {
  return {
    week: 1,
    stage: "plan",
    stageTurn: 0,
    currentReward: buildDefaultLifeReward(),
    rewardHistory: [],
    observableLog: [],
    schedulerLog: []
  };
}

function normalizeLifeReward(reward) {
  if (!reward || typeof reward !== "object") {
    return buildDefaultLifeReward();
  }
  return {
    socialResonance: clamp(Math.round(Number(reward.socialResonance) || 50), 0, 100),
    selfFulfillment: clamp(Math.round(Number(reward.selfFulfillment) || 50), 0, 100),
    lifeStability: clamp(Math.round(Number(reward.lifeStability) || 50), 0, 100),
    total: clamp(Math.round(Number(reward.total) || 50), 0, 100),
    reason: typeof reward.reason === "string" ? reward.reason : "本周人生回声已经生成。"
  };
}

function normalizeLifeWeekSystem(source) {
  const base = buildLifeWeekSystem();
  const stage = LIFE_WEEK_STAGES.some((item) => item.id === source?.stage) ? source.stage : base.stage;
  return {
    ...base,
    ...(source || {}),
    week: Math.max(1, Number(source?.week) || 1),
    stage,
    stageTurn: Math.max(0, Number(source?.stageTurn) || 0),
    currentReward: normalizeLifeReward(source?.currentReward),
    rewardHistory: Array.isArray(source?.rewardHistory)
      ? source.rewardHistory.map(normalizeLifeReward).slice(-LIFE_WEEK_DIARY_LIMIT)
      : [],
    observableLog: Array.isArray(source?.observableLog) ? source.observableLog.slice(0, LIFE_WEEK_LOG_LIMIT) : [],
    schedulerLog: Array.isArray(source?.schedulerLog) ? source.schedulerLog.slice(0, LIFE_WEEK_LOG_LIMIT) : []
  };
}

function buildAgentMemoryFile(ownerId) {
  return {
    ownerId,
    general: [],
    relationships: {},
    lifeCapsules: {},
    weeklyDiary: []
  };
}

function normalizeMemoryItems(items, limit = LIFE_WEEK_MEMORY_LIMIT) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item.text === "string")
    .map((item) => ({
      id: item.id || `mem-${randomInt(1000, 9999)}`,
      ownerId: item.ownerId || "",
      kind: item.kind || "event",
      text: item.text,
      importance: clamp(Number(item.importance) || 1, 1, 10),
      createdAtTurn: Number(item.createdAtTurn) || 0,
      references: Array.isArray(item.references) ? item.references.slice(0, 4) : []
    }))
    .slice(0, limit);
}

function normalizeMemoryFileMap(sourceMap, citizens) {
  const result = {};
  citizens.forEach((citizen) => {
    if (!citizen?.id) return;
    const source = sourceMap?.[citizen.id] || {};
    const file = buildAgentMemoryFile(citizen.id);
    file.general = normalizeMemoryItems(source.general);
    file.weeklyDiary = normalizeMemoryItems(source.weeklyDiary, LIFE_WEEK_DIARY_LIMIT);

    const relationshipEntries = source.relationships && typeof source.relationships === "object"
      ? Object.entries(source.relationships)
      : [];
    relationshipEntries.forEach(([key, items]) => {
      file.relationships[key] = normalizeMemoryItems(items);
    });

    const capsuleEntries = source.lifeCapsules && typeof source.lifeCapsules === "object"
      ? Object.entries(source.lifeCapsules)
      : [];
    capsuleEntries.forEach(([key, items]) => {
      file.lifeCapsules[key] = normalizeMemoryItems(items);
    });

    result[citizen.id] = file;
  });
  return result;
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
    lifeWeek: buildLifeWeekSystem(),
    relationships: {},
    growth: buildGrowthState(),
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
    const direct = getAvailableProfessions().find((profession) => profession.id === seed.professionId);
    if (direct) {
      return direct;
    }
  }
  const options = getAvailableProfessions().slice();
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
  const persona = getMbtiArchetype(seed);
  const bigFive = buildBigFiveProfile(seed, persona);
  const needs = buildMaslowNeeds(seed);
  const pad = buildPadEmotion(seed);
  const values = buildValueProfile(seed, persona);
  const interpersonal = buildInterpersonalStyle(seed, bigFive);
  return {
    id: seed.id || `c-${Date.now().toString(36)}-${randomInt(1000, 9999)}`,
    name: seed.name || "分身",
    role: seed.role || "参与者",
    color: seed.color || persona.color || "#296c68",
    mood: clamp(Math.round(seed.mood ?? randomInt(34, 88)), 0, 100),
    energy: clamp(Math.round(seed.energy ?? randomInt(42, 96)), 0, 100),
    trust: clamp(Math.round(seed.trust ?? randomInt(35, 92)), 0, 100),
    purpose: seed.purpose || "共同生活",
    mbtiType: persona.type,
    personaLabel: persona.label,
    personaNeed: persona.need,
    relationPreference: persona.relationPreference,
    avatarShape: persona.body,
    socialBias: { ...(persona.socialBias || {}), ...(seed.socialBias || {}) },
    bigFive,
    needs,
    pad,
    values,
    attachmentStyle: buildAttachmentStyle(seed, bigFive),
    interpersonal,
    intention: seed.intention || "",
    decisionTrace: Array.isArray(seed.decisionTrace) ? seed.decisionTrace.slice(0, 6) : [],
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
  return OPEN_WORLD_ZONES.map((zone) => ({ ...zone, zoneModel: getZoneModel(zone.id) }));
}

function buildAgentRuntime(citizens = []) {
  const memoryStore = {};
  const reflectionStore = {};
  const skillStore = {};
  const memoryFiles = {};
  citizens.forEach((citizen) => {
    if (!citizen?.id) {
      return;
    }
    memoryStore[citizen.id] = [];
    reflectionStore[citizen.id] = [];
    skillStore[citizen.id] = [];
    memoryFiles[citizen.id] = buildAgentMemoryFile(citizen.id);
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
    memoryFiles,
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
    skillStore: normalizeAgentMap(source.skillStore || {}, citizens, AGENT_REFLECTION_LIMIT),
    memoryFiles: normalizeMemoryFileMap(source.memoryFiles || {}, citizens)
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
  const baseZones = buildOpenWorldZones();
  const zoneMap = new Map(baseZones.map((zone) => [zone.id, zone]));
  if (Array.isArray(society.zones)) {
    society.zones.forEach((zone) => {
      if (!zone?.id) return;
      const baseZone = zoneMap.get(zone.id) || {};
      zoneMap.set(zone.id, {
        ...baseZone,
        ...zone,
        zoneModel: zone.zoneModel || baseZone.zoneModel || getZoneModel(zone.id)
      });
    });
  }
  const zones = Array.from(zoneMap.values());
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
    lifeWeek: normalizeLifeWeekSystem(society.lifeWeek),
    relationships: society.relationships && typeof society.relationships === "object" ? society.relationships : {},
    growth: buildGrowthState(society.growth),
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

  merged.zones = merged.zones.filter((zone) => zone && zone.id).map((zone) => ({
    ...base.zones.find((source) => source.id === zone.id),
    ...zone,
    zoneModel: zone.zoneModel || getZoneModel(zone.id)
  }));
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

function mergeLifeCapsules(savedCapsules) {
  const byId = new Map(DEFAULT_LIFE_CAPSULES.map((capsule) => [capsule.id, capsule]));
  savedCapsules.forEach((capsule) => {
    if (capsule?.id) {
      byId.set(capsule.id, capsule);
    }
  });
  return [...byId.values()].slice(0, 16);
}

function loadState() {
  const defaults = {
    profile: {},
    echoes: [],
    bottle: "",
    lifeFragments: [],
    lifeCapsules: DEFAULT_LIFE_CAPSULES,
    activeLifeCapsuleId: "capsule-career-river",
    robotSignals: [],
    driftBottles: [],
    soulMatches: [],
    firstSessionStage: "",
    firstSessionQuest: null,
    continuation: null,
    firstLoop: null,
    causalGraph: null,
    hasSeenTutorial: false,
    isFirstVisit: false,
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
      lifeFragments: Array.isArray(saved.lifeFragments) ? saved.lifeFragments : defaults.lifeFragments,
      lifeCapsules: Array.isArray(saved.lifeCapsules) && saved.lifeCapsules.length
        ? mergeLifeCapsules(saved.lifeCapsules)
        : defaults.lifeCapsules,
      activeLifeCapsuleId: typeof saved.activeLifeCapsuleId === "string"
        ? saved.activeLifeCapsuleId
        : defaults.activeLifeCapsuleId,
      robotSignals: Array.isArray(saved.robotSignals) ? saved.robotSignals.slice(0, 12) : defaults.robotSignals,
      driftBottles: Array.isArray(saved.driftBottles) ? saved.driftBottles.slice(0, 12) : defaults.driftBottles,
      soulMatches: Array.isArray(saved.soulMatches) ? saved.soulMatches.slice(0, 8) : defaults.soulMatches,
      firstSessionStage: typeof saved.firstSessionStage === "string" ? saved.firstSessionStage : "",
      firstSessionQuest: saved.firstSessionQuest && typeof saved.firstSessionQuest === "object" ? saved.firstSessionQuest : null,
      continuation: saved.continuation && typeof saved.continuation === "object" ? saved.continuation : null,
      firstLoop: saved.firstLoop && typeof saved.firstLoop === "object" ? saved.firstLoop : null,
      causalGraph: saved.causalGraph && typeof saved.causalGraph === "object" ? saved.causalGraph : null,
      hasSeenTutorial: !!saved.hasSeenTutorial,
      isFirstVisit: !!saved.isFirstVisit,
      society: normalizeSocietyState(loadedSociety)
    };
  } catch {
    return defaults;
  }
}

function buildPersistSnapshot() {
  return JSON.stringify({
    profile: state.profile,
    echoes: state.echoes,
    bottle: state.bottle || "",
    lifeFragments: state.lifeFragments || [],
    lifeCapsules: state.lifeCapsules || DEFAULT_LIFE_CAPSULES,
    activeLifeCapsuleId: state.activeLifeCapsuleId || "",
    robotSignals: state.robotSignals || [],
    driftBottles: state.driftBottles || [],
    soulMatches: state.soulMatches || [],
    firstSessionStage: state.firstSessionStage || "",
    firstSessionQuest: state.firstSessionQuest || null,
    continuation: state.continuation || null,
    firstLoop: state.firstLoop || null,
    causalGraph: state.causalGraph || null,
    hasSeenTutorial: !!state.hasSeenTutorial,
    isFirstVisit: !!state.isFirstVisit,
    society: state.society
  });
}

function clearPersistHandle() {
  if (!persistHandle) return;
  if (persistHandleType === "idle" && typeof cancelIdleCallback === "function") {
    cancelIdleCallback(persistHandle);
  } else {
    clearTimeout(persistHandle);
  }
  persistHandle = null;
  persistHandleType = "";
}

function flushPersist() {
  clearPersistHandle();
  const snapshot = buildPersistSnapshot();
  if (snapshot === lastPersistSnapshot) return;
  localStorage.setItem(STORAGE_KEY, snapshot);
  lastPersistSnapshot = snapshot;
}

function persist(immediate = false) {
  if (immediate) {
    flushPersist();
    return;
  }
  if (persistHandle) return;
  if (typeof requestIdleCallback === "function") {
    persistHandleType = "idle";
    persistHandle = requestIdleCallback(() => {
      persistHandle = null;
      persistHandleType = "";
      flushPersist();
    }, { timeout: 800 });
    return;
  }
  persistHandleType = "timeout";
  persistHandle = setTimeout(() => {
    persistHandle = null;
    persistHandleType = "";
    flushPersist();
  }, 250);
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
  const actor = society.citizens.find(c => c.id === result.actorId);
  const target = result.targetId ? society.citizens.find(c => c.id === result.targetId) : null;
  const relation = updateRelationshipModel(society, actor, target, result);
  const relationModel = relation
    ? SOCIAL_RELATION_MODELS[relation.model]
    : null;
  updateCitizenPsychState(actor, society);
  if (target) updateCitizenPsychState(target, society);
  addSocietyEvent(
    `${text}${relation ? ` 关系模型：${relationModel?.label || relation.model}。` : ""}${eventSuffix ? ` ${eventSuffix}` : ""}`,
    result.type === "conflict" ? "conflict" : "support"
  );
  updateSocietyMetricsFromEvents();

  // Speech bubble hook (called from game.js)
  if (typeof addSpeechBubble === "function") {
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

function getRelationshipKey(aId, bId) {
  return [aId, bId].filter(Boolean).sort().join("__");
}

function inferRelationModel(actor, target, result) {
  const actionType = result?.type || "listen";
  const zone = getCitizenZone(state.society, actor);
  if (actionType === "support" || actionType === "listen" || isActorVulnerable(actor) || isActorVulnerable(target || {})) {
    return "communal_sharing";
  }
  if (actionType === "meditate" || actionType === "cooperate") {
    return "equality_matching";
  }
  if (actionType === "propose" && ["teacher", "judge", "lawyer", "caretaker"].includes(actor?.professionId)) {
    return "authority_ranking";
  }
  if (zone?.archetype === "commerce" || zone?.archetype === "work" || ["worker", "engineer", "programmer", "architect"].includes(actor?.professionId)) {
    return "market_pricing";
  }
  return actor?.relationPreference || "equality_matching";
}

function updateRelationshipModel(society, actor, target, result) {
  if (!society || !actor || !target || actor.id === target.id) return null;
  if (!society.relationships || typeof society.relationships !== "object") {
    society.relationships = {};
  }
  const modelId = inferRelationModel(actor, target, result);
  const model = SOCIAL_RELATION_MODELS[modelId] || SOCIAL_RELATION_MODELS.equality_matching;
  const key = getRelationshipKey(actor.id, target.id);
  const current = society.relationships[key] || {
    id: key,
    a: actor.id,
    b: target.id,
    model: modelId,
    familiarity: 0.08,
    trust: Math.round((actor.trust + target.trust) / 2),
    trustAB: clamp(Math.round(actor.trust - 50), -100, 100),
    trustBA: clamp(Math.round(target.trust - 50), -100, 100),
    affection: 0,
    powerBalance: Math.round(((actor.interpersonal?.dominance || 0.5) - (target.interpersonal?.dominance || 0.5)) * 100),
    reciprocity: 50,
    disclosureDepth: 8,
    mutuality: 50,
    strain: Math.max(0, Math.round(society.tension * 0.35)),
    eventLog: [],
    history: []
  };
  const benefit = clamp((result.score || 0) * 7 + model.trustDelta, -12, 18);
  const cost = result.type === "conflict" ? 12 : result.type === "propose" ? 5 : result.type === "cooperate" ? 4 : 2;
  const warmthA = actor.interpersonal?.warmth ?? actor.bigFive?.agreeableness ?? 0.5;
  const warmthB = target.interpersonal?.warmth ?? target.bigFive?.agreeableness ?? 0.5;
  const dominanceA = actor.interpersonal?.dominance ?? actor.bigFive?.extraversion ?? 0.5;
  const dominanceB = target.interpersonal?.dominance ?? target.bigFive?.extraversion ?? 0.5;
  const warmthMatch = 1 - Math.abs(warmthA - warmthB);
  const dominanceComplementarity = Math.abs(dominanceA - dominanceB);
  const compatibility = Math.round((warmthMatch * 0.62 + dominanceComplementarity * 0.38) * 20 - 10);
  const attachmentMod =
    actor.attachmentStyle === "secure" ? 2 :
      actor.attachmentStyle === "anxious" ? (result.type === "support" ? 3 : -1) :
        actor.attachmentStyle === "avoidant" ? (result.type === "listen" ? 1 : -2) : -2;
  const interdependenceOutcome = benefit - cost + compatibility + attachmentMod + Math.round((current.mutuality - 50) / 12);

  current.model = modelId;
  current.familiarity = clamp(Number(current.familiarity || 0) + 0.035 + (result.type === "listen" ? 0.025 : 0), 0, 1);
  current.trust = clamp(Math.round(current.trust + model.trustDelta + interdependenceOutcome * 0.25), 0, 100);
  current.trustAB = clamp(Math.round((current.trustAB || 0) + interdependenceOutcome * 0.45), -100, 100);
  current.trustBA = clamp(Math.round((current.trustBA || 0) + interdependenceOutcome * 0.28), -100, 100);
  current.affection = clamp(Number(current.affection || 0) + interdependenceOutcome / 120, -1, 1);
  current.powerBalance = clamp(Math.round(((dominanceA - dominanceB) * 72) + (result.type === "propose" ? 8 : 0)), -100, 100);
  current.reciprocity = clamp(Math.round(current.reciprocity + model.reciprocityDelta + (result.type === "cooperate" ? 4 : 0)), 0, 100);
  current.disclosureDepth = clamp(Math.round(current.disclosureDepth + model.disclosureDelta + (result.type === "listen" ? 3 : 0)), 0, 100);
  current.mutuality = clamp(Math.round((current.trust + current.reciprocity + current.disclosureDepth) / 3), 0, 100);
  current.strain = clamp(Math.round(current.strain + model.strainDelta - (result.score || 0)), 0, 100);
  current.tension = clamp(current.strain / 100, 0, 1);
  current.lastAction = result.type;
  current.updatedTurn = society.turn;
  const event = {
    turn: society.turn,
    model: modelId,
    action: result.type,
    outcome: interdependenceOutcome,
    compatibility,
    depth: current.familiarity < 0.28 ? "surface" : current.familiarity < 0.62 ? "personal" : "core",
    text: `${actor.name} 与 ${target.name} 形成“${model.label}”互动。`
  };
  current.eventLog = [event, ...(current.eventLog || [])].slice(0, 16);
  current.history = [
    {
      ...event
    },
    ...(current.history || [])
  ].slice(0, 8);
  society.relationships[key] = current;
  result.relationshipModel = model.label;
  result.relationshipOutcome = interdependenceOutcome;
  return current;
}

function ensureLifeWeekSystem(society = state?.society) {
  if (!society) return null;
  society.lifeWeek = normalizeLifeWeekSystem(society.lifeWeek);
  const citizens = Array.isArray(society.citizens) ? society.citizens : [];
  const runtime = ensureAgentRuntime(society);
  runtime.memoryFiles = normalizeMemoryFileMap(runtime.memoryFiles || {}, citizens);
  return society.lifeWeek;
}

function addLifeWeekLog(kind, text, meta = {}) {
  const lifeWeek = ensureLifeWeekSystem();
  if (!lifeWeek || !text) return null;
  const entry = {
    id: `lw-${state.society.turn}-${randomInt(100, 999)}`,
    kind,
    text,
    week: lifeWeek.week,
    stage: lifeWeek.stage,
    turn: state.society.turn,
    at: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    meta
  };
  lifeWeek.observableLog = [entry, ...(lifeWeek.observableLog || [])].slice(0, LIFE_WEEK_LOG_LIMIT);
  lifeWeek.schedulerLog = [
    {
      ...entry,
      text: `${getLifeWeekStageInfo(lifeWeek.stage).label}：${text}`
    },
    ...(lifeWeek.schedulerLog || [])
  ].slice(0, LIFE_WEEK_LOG_LIMIT);
  return entry;
}

function getAverageCitizenValue(society, key, fallback = 50) {
  const alive = getAliveCitizens(society);
  if (!alive.length) return fallback;
  return Math.round(alive.reduce((sum, citizen) => sum + (Number(citizen[key]) || fallback), 0) / alive.length);
}

function calculateLifeReward(society) {
  const avgTrust = getAverageCitizenValue(society, "trust");
  const avgMood = getAverageCitizenValue(society, "mood");
  const avgEnergy = getAverageCitizenValue(society, "energy");
  const socialResonance = clamp(Math.round((avgTrust * 0.45) + (society.harmony * 0.35) + (society.metrics.openness * 0.2)), 0, 100);
  const selfFulfillment = clamp(Math.round((avgMood * 0.48) + (avgEnergy * 0.22) + (society.metrics.freedom * 0.3)), 0, 100);
  const lifeStability = clamp(Math.round(((100 - society.tension) * 0.44) + (society.metrics.equality * 0.34) + (society.principleHealth.openness * 0.22)), 0, 100);
  const total = clamp(Math.round((socialResonance + selfFulfillment + lifeStability) / 3), 0, 100);
  const reason = total >= 72
    ? "本周的社会关系比较亮，分身既被看见，也能把选择转成稳定行动。"
    : total >= 54
      ? "本周仍有张力，但世界给出了可继续尝试的关系回声。"
      : "本周人生回声偏紧，系统会把下一轮优先交给安抚、倾听和修复。";
  return { socialResonance, selfFulfillment, lifeStability, total, reason };
}

function pushMemoryItem(list, item, limit = LIFE_WEEK_MEMORY_LIMIT) {
  list.unshift(item);
  if (list.length > limit) list.length = limit;
}

function recordAgentMemoryFileItem(society, ownerId, bucket, text, options = {}) {
  const runtime = ensureAgentRuntime(society);
  const citizen = (society.citizens || []).find((item) => item.id === ownerId);
  if (!runtime || !citizen || !text) return null;
  runtime.memoryFiles = normalizeMemoryFileMap(runtime.memoryFiles || {}, society.citizens || []);
  const file = runtime.memoryFiles[ownerId] || buildAgentMemoryFile(ownerId);
  runtime.memoryFiles[ownerId] = file;
  const item = {
    id: `life-mem-${society.turn}-${randomInt(100, 999)}`,
    ownerId,
    kind: options.kind || bucket || "event",
    text,
    importance: clamp(Number(options.importance) || 5, 1, 10),
    createdAtTurn: society.turn,
    references: Array.isArray(options.references) ? options.references.slice(0, 4) : []
  };

  if (bucket === "weeklyDiary") {
    pushMemoryItem(file.weeklyDiary, item, LIFE_WEEK_DIARY_LIMIT);
  } else if (bucket === "relationships") {
    const key = options.key || options.targetId || "community";
    if (!file.relationships[key]) file.relationships[key] = [];
    pushMemoryItem(file.relationships[key], item);
  } else if (bucket === "lifeCapsules") {
    const key = options.key || state.activeLifeCapsuleId || "capsule";
    if (!file.lifeCapsules[key]) file.lifeCapsules[key] = [];
    pushMemoryItem(file.lifeCapsules[key], item);
  } else {
    pushMemoryItem(file.general, item);
  }
  return item;
}

function recordLifeWeekMemorySnapshot(society, reward) {
  const lifeWeek = ensureLifeWeekSystem(society);
  const alive = getAliveCitizens(society).slice(0, 8);
  const capsuleTitle = (state.lifeCapsules || DEFAULT_LIFE_CAPSULES)
    .find((capsule) => capsule.id === state.activeLifeCapsuleId)?.title || "当前人生胶囊";
  alive.forEach((citizen, index) => {
    const diaryText = `第 ${lifeWeek.week} 周，${citizen.name}在${society.scene}经历了 ${getLifeWeekStageInfo("review").title}：${reward.reason}`;
    recordAgentMemoryFileItem(society, citizen.id, "weeklyDiary", diaryText, {
      kind: "weekly_diary",
      importance: Math.max(4, Math.round(reward.total / 14)),
      references: [`week-${lifeWeek.week}`, "life-reward"]
    });
    recordAgentMemoryFileItem(society, citizen.id, "lifeCapsules", `围绕“${capsuleTitle}”，我看见了：${reward.reason}`, {
      kind: "life_capsule",
      key: state.activeLifeCapsuleId || "default",
      importance: 6,
      references: [`week-${lifeWeek.week}`]
    });
    if (index < 4) {
      const target = alive[(index + 1) % alive.length];
      if (target && target.id !== citizen.id) {
        recordAgentMemoryFileItem(society, citizen.id, "relationships", `${target.name}与我在本周产生了一次同频线索：关系不是胜负，而是能否继续靠近。`, {
          kind: "relationship",
          key: target.id,
          targetId: target.id,
          importance: 5,
          references: [`week-${lifeWeek.week}`]
        });
      }
    }
  });
}

function evaluateSocietyDeficits(society) {
  const alive = getAliveCitizens(society);
  const avgEnergy = getAverageCitizenValue(society, "energy");
  const avgMood = getAverageCitizenValue(society, "mood");
  const youngCount = alive.filter((citizen) => ["child", "teen", "young"].includes(citizen.lifeStage)).length;
  const conflictEvents = (society.log || []).filter((event) => event.type === "conflict").length;
  return {
    high_tension: society.tension > 62 || conflictEvents >= 2,
    low_openness: (society.metrics?.openness || 0) < 72,
    low_equality: (society.metrics?.equality || 0) < 72 || (society.fairnessPenalty || 0) >= 5,
    low_energy: avgEnergy < 48 || avgMood < 44,
    learning_need: youngCount >= 4,
    low_stability: calculateLifeReward(society).lifeStability < 56
  };
}

function createEvolvedSceneFromBlueprint(blueprint, index = 0) {
  const offset = index * 0.025;
  return {
    id: blueprint.id,
    name: blueprint.name,
    openness: 0.78,
    tolerance: 0.9,
    mobility: 0.62,
    role: blueprint.role,
    x: clamp(blueprint.x + offset, 0.04, 0.9),
    y: clamp(blueprint.y + offset, 0.04, 0.86),
    w: blueprint.w,
    h: blueprint.h,
    archetype: blueprint.archetype,
    evolved: true,
    trigger: blueprint.trigger,
    zoneModel: {
      model: blueprint.model,
      layer: "evolved",
      gameplay: `社会缺口触发的新场景：${blueprint.name}`,
      provides: blueprint.provides,
      buildVerb: "生长"
    }
  };
}

function createEmergentProfessionFromBlueprint(blueprint) {
  return {
    id: blueprint.profession,
    name: blueprint.professionName,
    zoneIds: [blueprint.id],
    minLifeAge: 18,
    maxLifeAge: 88,
    tone: blueprint.trigger.replace("_", "-"),
    evolved: true
  };
}

function evolveSocietyGrowth(society, reason = "life_week") {
  if (!society) return null;
  society.growth = buildGrowthState(society.growth);
  const previousDeficits = society.growth.deficits || {};
  const evaluatedDeficits = evaluateSocietyDeficits(society);
  society.growth.deficits = { ...evaluatedDeficits };
  Object.entries(previousDeficits).forEach(([key, value]) => {
    society.growth.deficits[key] = Math.max(Number(value) || 0, Number(evaluatedDeficits[key]) || 0);
  });
  if (society.growth.unlockedScenes.length >= 6) return null;
  const playerDrivenGrowth = OPEN_WORLD_ACTIONS.some((action) => action.id === reason);
  if (!playerDrivenGrowth && society.turn - (society.growth.lastGrowthTurn || 0) < 4 && society.growth.unlockedScenes.length > 0) {
    return null;
  }

  const blueprint = EVOLVABLE_SCENE_BLUEPRINTS.find((candidate) =>
    society.growth.deficits[candidate.trigger] &&
    !society.growth.unlockedScenes.includes(candidate.id) &&
    !(society.zones || []).some((zone) => zone.id === candidate.id)
  );
  if (!blueprint) return null;

  const zone = createEvolvedSceneFromBlueprint(blueprint, society.growth.unlockedScenes.length);
  const profession = createEmergentProfessionFromBlueprint(blueprint);
  society.zones = [...(society.zones || []), zone];
  society.growth.unlockedScenes = [...society.growth.unlockedScenes, zone.id].slice(0, 6);
  society.growth.emergentProfessions = [
    profession,
    ...(society.growth.emergentProfessions || []).filter((item) => item.id !== profession.id)
  ].slice(0, 12);
  society.growth.constructionQueue = [
    {
      id: `build-${zone.id}-${society.turn}`,
      sceneId: zone.id,
      professionId: profession.id,
      reason,
      trigger: blueprint.trigger,
      text: `社会缺口“${blueprint.trigger}”生成了${zone.name}与新职业${profession.name}。`
    },
    ...(society.growth.constructionQueue || [])
  ].slice(0, 8);
  society.growth.lastGrowthTurn = society.turn;

  const candidates = getAliveCitizens(society)
    .filter((citizen) => citizen.alive !== false && citizen.id !== "avatar")
    .sort((a, b) => (b.energy + b.trust) - (a.energy + a.trust));
  const builder = candidates[0];
  if (builder) {
    builder.professionId = profession.id;
    builder.profession = profession.name;
    builder.zoneAffinity = [zone.id, ...(builder.zoneAffinity || [])].slice(0, 4);
    builder.zoneId = zone.id;
    builder.role = `${builder.personaLabel || "分身"}-${profession.name}`;
    setCitizenZonePosition(builder, zone);
    recordAgentMemoryFileItem(society, builder.id, "general", `我因为社会缺口成为了${profession.name}，开始建设${zone.name}。`, {
      kind: "growth",
      importance: 8,
      references: [zone.id, profession.id]
    });
  }

  addLifeWeekLog("growth", `社会自动生长出 ${zone.name}，新职业：${profession.name}。`, { sceneId: zone.id, professionId: profession.id });
  addSocietyEvent(`社会自动生长：${zone.name} 已出现，${profession.name} 开始承担新的公共任务。`, "support");
  return { zone, profession, builder };
}

const OPEN_WORLD_ACTIONS = [
  {
    id: "survey-deficits",
    label: "走访社区缺口",
    verb: "走访",
    actionType: "listen",
    metricDelta: { openness: 2 },
    tensionDelta: -2,
    growthBias: { learning_need: 18, low_openness: 12 },
    log: "你和分身走访城市边缘，把还没有被看见的需求写进调度日志。"
  },
  {
    id: "host-commons",
    label: "发起公共共建",
    verb: "共建",
    actionType: "cooperate",
    metricDelta: { equality: 3, openness: 1 },
    tensionDelta: -1,
    growthBias: { low_equality: 20, low_stability: 10 },
    log: "一场小型公共共建开始了，几位分身把资源、时间和责任摊开协商。"
  },
  {
    id: "mediate-relation",
    label: "调停紧张关系",
    verb: "调停",
    actionType: "support",
    metricDelta: { freedom: 1, equality: 1 },
    tensionDelta: -5,
    growthBias: { high_tension: 24 },
    log: "你没有直接判定谁对谁错，而是让两个分身先说出各自真正害怕的事。"
  },
  {
    id: "night-watch",
    label: "夜间观察世界",
    verb: "观察",
    actionType: "meditate",
    metricDelta: { freedom: 1 },
    tensionDelta: -3,
    growthBias: { low_energy: 22, low_stability: 8 },
    log: "夜间观察让城市慢下来，系统捕捉到几个白天看不见的恢复需求。"
  }
];

function getOpenWorldActions() {
  return OPEN_WORLD_ACTIONS.slice();
}

function getEvolutionRoadmap(society = state?.society) {
  const unlocked = new Set(society?.growth?.unlockedScenes || []);
  return EVOLVABLE_SCENE_BLUEPRINTS.map((blueprint) => ({
    id: blueprint.id,
    name: blueprint.name,
    trigger: blueprint.trigger,
    professionName: blueprint.professionName,
    provides: blueprint.provides,
    unlocked: unlocked.has(blueprint.id),
    suggestedAction: OPEN_WORLD_ACTIONS.find((action) => action.growthBias?.[blueprint.trigger])?.id || ""
  }));
}

function getNextEvolutionHint(society = state?.society) {
  const roadmap = getEvolutionRoadmap(society);
  const next = roadmap.find((item) => !item.unlocked);
  if (!next) {
    return "6 个自演化场景都已经出现，城市会继续通过周记、关系和职业成长扩写。";
  }
  const action = OPEN_WORLD_ACTIONS.find((item) => item.id === next.suggestedAction);
  return `下一座可能生长的场景：${next.name}。建议行动：${action?.label || "继续观察世界"}。`;
}

function applyGrowthBias(society, bias = {}) {
  society.growth = buildGrowthState(society.growth);
  society.growth.deficits = {
    ...evaluateSocietyDeficits(society),
    ...(society.growth.deficits || {})
  };
  Object.entries(bias).forEach(([key, amount]) => {
    society.growth.deficits[key] = clamp((Number(society.growth.deficits[key]) || 0) + Number(amount || 0), 0, 100);
  });
}

function runOpenWorldAction(actionId) {
  const society = state?.society;
  if (!society) return null;
  const action = OPEN_WORLD_ACTIONS.find((item) => item.id === actionId);
  if (!action) return null;
  if (!society.citizens?.length && typeof launchSocietyFromInput === "function") {
    launchSocietyFromInput();
  }

  society.turn = (Number(society.turn) || 0) + 1;
  society.metrics = {
    freedom: clamp((society.metrics?.freedom || 60) + (action.metricDelta.freedom || 0), 0, 100),
    equality: clamp((society.metrics?.equality || 60) + (action.metricDelta.equality || 0), 0, 100),
    openness: clamp((society.metrics?.openness || 60) + (action.metricDelta.openness || 0), 0, 100)
  };
  society.tension = clamp((society.tension || 0) + action.tensionDelta, 0, 100);
  society.harmony = clamp((society.harmony || 0) + 3, 0, 100);
  applyMissionProgress(action.actionType);
  applyGrowthBias(society, action.growthBias);

  const actor = getAliveCitizens(society).find((citizen) => citizen.id === "avatar") || getAliveCitizens(society)[0];
  if (actor) {
    recordAgentMemoryFileItem(society, actor.id, "general", `我参与了开放世界行动：${action.label}。`, {
      kind: "open_world_action",
      importance: 6,
      references: [action.id]
    });
  }

  addLifeWeekLog("open-world", action.log, { actionId: action.id, bias: action.growthBias });
  addSocietyEvent(`${action.log} 城市缺口被重新计算，可能长出新的场景。`, "support");
  const growth = evolveSocietyGrowth(society, action.id);
  if (growth && typeof pushRobotSignal === "function") {
    pushRobotSignal("system", "summon", `城市回应了你的${action.verb}：${growth.zone.name} 开始生长。`);
  } else if (typeof pushRobotSignal === "function") {
    pushRobotSignal("system", "soft", `城市记录了你的${action.verb}，新的场景还在酝酿。`);
  }

  return { action, growth };
}

function advanceLifeWeekStage(trigger = "auto") {
  const society = state?.society;
  const lifeWeek = ensureLifeWeekSystem(society);
  if (!society || !lifeWeek) return null;
  const currentStage = getLifeWeekStageInfo(lifeWeek.stage);
  const alive = getAliveCitizens(society);
  const avatar = alive.find((citizen) => citizen.id === "avatar") || alive[0];

  if (lifeWeek.stage === "plan") {
    addLifeWeekLog("plan", `${avatar?.name || "分身"}把本周目标写成：先用另一种身份理解自己。`, { trigger });
    if (avatar) {
      recordAgentMemoryFileItem(society, avatar.id, "general", "本周计划：先体验一段人生，再观察关系如何回应。", {
        kind: "plan",
        importance: 5,
        references: [`week-${lifeWeek.week}`]
      });
    }
  } else if (lifeWeek.stage === "contact") {
    const target = randomFrom(alive.filter((citizen) => citizen.id !== avatar?.id)) || alive[0];
    addLifeWeekLog("contact", `${avatar?.name || "分身"}向${target?.name || "同频灵魂"}发出弱连接，等待对方是否靠近。`, { trigger, targetId: target?.id || "" });
    if (avatar && target) {
      recordAgentMemoryFileItem(society, avatar.id, "relationships", `我向${target.name}发出了一次低压联系，系统只交换回声，不强迫聊天。`, {
        kind: "relationship",
        key: target.id,
        targetId: target.id,
        importance: 5,
        references: [`week-${lifeWeek.week}`]
      });
    }
  } else if (lifeWeek.stage === "activity") {
    const recent = society.log?.[0]?.text || "城市完成了一次关键行动，关系和情绪开始移动。";
    addLifeWeekLog("activity", recent, { trigger });
  } else if (lifeWeek.stage === "review") {
    const reward = calculateLifeReward(society);
    lifeWeek.currentReward = reward;
    lifeWeek.rewardHistory = [reward, ...(lifeWeek.rewardHistory || [])].slice(0, LIFE_WEEK_DIARY_LIMIT);
    addLifeWeekLog("review", `本周人生回声：${reward.reason}`, { trigger, reward });
    recordLifeWeekMemorySnapshot(society, reward);
    addEcho(`本周人生回声：同频度 ${reward.socialResonance}，满足感 ${reward.selfFulfillment}，稳定感 ${reward.lifeStability}。${reward.reason}`);
    if (typeof pushRobotSignal === "function") {
      pushRobotSignal("avatar", reward.total >= 70 ? "soft" : "summon", `第 ${lifeWeek.week} 周的另一个我传来回声：${reward.reason}`);
    }
  } else if (lifeWeek.stage === "settle") {
    addLifeWeekLog("settle", `第 ${lifeWeek.week} 周已沉淀进周记，下一周会从新的计划开始。`, { trigger });
    evolveSocietyGrowth(society, trigger);
  }

  const activeLifeWeek = society.lifeWeek || lifeWeek;
  const currentIndex = LIFE_WEEK_STAGES.findIndex((stage) => stage.id === activeLifeWeek.stage);
  const nextIndex = (currentIndex + 1) % LIFE_WEEK_STAGES.length;
  const wrapped = nextIndex === 0;
  activeLifeWeek.stage = LIFE_WEEK_STAGES[nextIndex].id;
  activeLifeWeek.stageTurn = society.turn;
  if (wrapped) {
    activeLifeWeek.week += 1;
  }
  return { previous: currentStage, current: getLifeWeekStageInfo(activeLifeWeek.stage), wrapped };
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

function updateCitizenPsychState(citizen, society = state.society) {
  if (!citizen) return;
  citizen.needs = buildMaslowNeeds({
    ...citizen,
    needs: {
      ...(citizen.needs || {}),
      physiological: clamp((citizen.energy || 0) / 100, 0, 1),
      safety: clamp(((citizen.trust || 0) / 100) - (society.tension || 0) / 240, 0, 1),
      belonging: clamp(((citizen.trust || 0) + (citizen.mood || 0)) / 220, 0, 1),
      esteem: clamp(((citizen.trust || 0) + (citizen.actionCount || 0) * 2) / 140, 0, 1),
      selfActualization: clamp(((citizen.mood || 0) + (citizen.energy || 0)) / 220 + (citizen.values?.self_direction || 0) * 0.18, 0, 1),
      autonomy: clamp((citizen.values?.self_direction || 0.5) * 0.55 + (citizen.energy || 0) / 220, 0, 1),
      competence: clamp((citizen.bigFive?.conscientiousness || 0.5) * 0.55 + (citizen.trust || 0) / 220, 0, 1),
      relatedness: clamp((citizen.interpersonal?.warmth || 0.5) * 0.5 + (citizen.trust || 0) / 220, 0, 1)
    }
  });
  citizen.pad = buildPadEmotion({
    ...citizen,
    pad: {
      pleasure: ((citizen.mood || 50) - 50) / 50,
      arousal: ((citizen.energy || 50) - 50) / 50,
      dominance: ((citizen.trust || 50) - 50) / 50
    }
  });
}

function getRelationshipBetween(society, aId, bId) {
  if (!society?.relationships || !aId || !bId) return null;
  return society.relationships[getRelationshipKey(aId, bId)] || null;
}

function scoreValueMatch(citizen, values = []) {
  return values.reduce((sum, key) => sum + (Number(citizen.values?.[key]) || 0), 0) / Math.max(values.length, 1);
}

function scoreRelationshipOpportunity(society, citizen, actionType) {
  if (actionType === "rest") return { target: null, score: 0 };
  const candidates = getAliveCitizens(society).filter((item) => item.id !== citizen.id);
  if (!candidates.length) return { target: null, score: -0.2 };
  const ranked = candidates.map((target) => {
    const rel = getRelationshipBetween(society, citizen.id, target.id);
    const needsHelp = (target.mood || 50) < 45 || (target.energy || 50) < 40;
    const trust = rel ? (rel.trust - 50) / 100 : 0;
    const tension = rel ? (rel.strain || 0) / 100 : (society.tension || 0) / 160;
    const score =
      (actionType === "support" || actionType === "listen" ? (needsHelp ? 0.28 : 0.08) : 0) +
      (actionType === "meditate" ? tension * 0.35 : 0) +
      (actionType === "cooperate" ? trust * 0.18 + 0.08 : 0) +
      (actionType === "propose" ? ((citizen.interpersonal?.dominance || 0.5) - tension) * 0.16 : 0) +
      Math.random() * 0.04;
    return { target, score };
  }).sort((a, b) => b.score - a.score);
  return ranked[0] || { target: candidates[0], score: 0 };
}

function calculateActionUtility(citizen, actionType, context) {
  const profile = UTILITY_ACTION_PROFILES[actionType] || UTILITY_ACTION_PROFILES.listen;
  const needs = citizen.needs || buildMaslowNeeds(citizen);
  const bigFive = citizen.bigFive || buildBigFiveProfile(citizen);
  const pad = citizen.pad || buildPadEmotion(citizen);
  const zoneRole = context.zone?.role || "";
  const needScore =
    Object.entries(needs).reduce((sum, [key, value]) => {
      const urgency = key === "physiological" || key === "safety" ? 1 - value : 0.55 + (1 - value) * 0.45;
      return sum + urgency * (profile[key] || 0);
    }, 0);
  const traitScore =
    (bigFive.openness || 0) * (profile.openness || 0) +
    (bigFive.conscientiousness || 0) * (profile.conscientiousness || 0) +
    (bigFive.extraversion || 0) * (profile.extraversion || 0) +
    (bigFive.agreeableness || 0) * (profile.agreeableness || 0) +
    (bigFive.neuroticism || 0) * (profile.neuroticism || 0);
  const emotionScore =
    (pad.pleasure || 0) * 0.1 +
    (pad.arousal || 0) * (profile.arousal || 0) +
    (pad.dominance || 0) * (profile.dominance || 0);
  const styleScore =
    (citizen.interpersonal?.warmth || 0.5) * (profile.warmth || 0) +
    (citizen.interpersonal?.dominance || 0.5) * (profile.dominance || 0);
  const valueScore = scoreValueMatch(citizen, profile.values || []) * 0.28;
  const phaseScore = context.phaseBias.has(actionType) ? 0.22 : 0;
  const scheduleScore = context.routineAction === actionType ? 0.26 : 0;
  const zoneScore =
    (zoneRole === "public" && actionType === "propose" ? 0.18 : 0) +
    (zoneRole === "cooperate" && actionType === "cooperate" ? 0.18 : 0) +
    (zoneRole === "heal" && (actionType === "support" || actionType === "rest") ? 0.2 : 0) +
    (zoneRole === "meditate" && actionType === "meditate" ? 0.22 : 0);
  const tensionScore =
    actionType === "meditate" ? (context.society.tension || 0) / 180 :
      actionType === "support" || actionType === "listen" ? (context.society.tension || 0) / 260 : 0;
  const socialBias = Number(citizen.socialBias?.[actionType] || 0);
  return needScore + traitScore + emotionScore + styleScore + valueScore + phaseScore + scheduleScore + zoneScore + tensionScore + socialBias + Math.random() * 0.05;
}

function chooseUtilityAction(citizen, context) {
  const actionTypes = ["propose", "cooperate", "support", "listen", "meditate", "rest"];
  const scored = actionTypes.map((type) => {
    const relation = scoreRelationshipOpportunity(context.society, citizen, type);
    return {
      type,
      target: relation.target,
      score: calculateActionUtility(citizen, type, context) + relation.score
    };
  }).sort((a, b) => b.score - a.score);
  const picked = scored[0] || { type: "rest", target: null, score: 0 };
  citizen.intention = `${picked.type}:${Math.round(picked.score * 100)}`;
  citizen.decisionTrace = scored.slice(0, 3).map((item) => `${item.type}:${Math.round(item.score * 100)}`);
  return { actorId: citizen.id, type: picked.type, targetId: picked.target?.id || null };
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
  updateCitizenPsychState(citizen, society);

  if (peerCount <= 1 || citizen.energy <= 24) {
    return { actorId: citizen.id, type: "rest", targetId: null };
  }

  if (routine && routine.id) {
    citizen.zoneId = routine.id;
  }

  const lowMood = pickNeediestCitizen(citizen.id);
  const lowTrust = pickMostConflicted();
  const conflictMode = society.tension > 64;
  const phaseBias = new Set(activePhase?.missionBias || []);
  const rand = Math.random();

  if (citizen.mood < 28 && lowMood && rand < 0.48 + (citizen.bigFive?.agreeableness || 0.5) * 0.18) {
    return { actorId: citizen.id, type: "support", targetId: lowMood.id };
  }

  if (conflictMode && rand < 0.18 + (citizen.bigFive?.conscientiousness || 0.5) * 0.18) {
    return { actorId: citizen.id, type: "meditate", targetId: randomCitizen(citizen.id)?.id || null };
  }

  if (lowTrust && lowTrust.id !== citizen.id && (lowTrust.trust < 45 || lowTrust.mood < 35) && rand < 0.24 + (phaseBias.has("meditate") ? 0.12 : 0)) {
    return { actorId: citizen.id, type: "meditate", targetId: lowTrust.id };
  }

  return chooseUtilityAction(citizen, { society, zone, routineAction, phaseBias });
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
  advanceLifeWeekStage("society_step");
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
