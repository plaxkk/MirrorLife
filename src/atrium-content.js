export const RESIDENTS = [
  { id: 'lin', name: '林晓', mbti: 'INFP', role: 'listener', position: [-2.2, 0, -1.95], yaw: 0, seated:true, activity: 'listen', hint: '今晚想给大家留一个安静的位置。', need: 'quiet' },
  { id: 'chen', name: '陈屿', mbti: 'ENTJ', role: 'player', position: [1.1, 0, -1.95], yaw: -.15, seated:true, activity: 'talk', hint: '桌边的计划，想听听你的意见。', need: 'gather' },
  { id: 'xu', name: '许禾', mbti: 'ISFJ', role: 'facilitator', position: [9.1, 0, 2], yaw: -1.1, activity: 'idle', hint: '这盆薄荷，有点缺水了。', need: 'care' },
  { id: 'zhou', name: '周宁', mbti: 'INTJ', role: 'mediator', position: [-7.9, 3.5, .4], yaw: 0, activity: 'think', hint: '楼上的声音，和楼下不太一样。', need: 'quiet' },
  { id: 'he', name: '何川', mbti: 'ESFJ', role: 'listener', position: [-7, 0, 1.25], yaw: 1.5, activity: 'idle', hint: '刚煮的茶，一起喝吗？', need: 'gather' },
  { id: 'tang', name: '唐乐', mbti: 'ENFP', role: 'player', position: [2, 3.5, -5.7], yaw: .4, activity: 'idle', hint: '从这里看下去，每个人都在忙自己的事。', need: 'gather', route: [[2,-5.7],[-2,-5.7]] },
];

export const DISCOVERIES = [
  { id:'records', name:'轮值手记', position:[0,0,-5.9], kind:'read', text:'手记上写着：上次分享会很热闹，林晓却提前回了房间。她留下了一张没有读完的诗。', result:'你发现：热闹之外，也有人需要安静。' },
  { id:'tea', name:'泡一杯温茶', position:[-7.9,0,1.3], kind:'care', text:'茶叶慢慢舒展开。何川把第二只杯子推了过来：“留下来坐一会儿吧。”', result:'你为共享桌准备了温茶。' },
  { id:'plant', name:'照料薄荷', position:[9.65,0,3.7], kind:'care', text:'给薄荷浇过水，叶子在日光里轻轻晃动。许禾记住了你的帮忙。', result:'你和许禾的关系近了一点。' },
  { id:'record', name:'听一段旧录音', position:[-7.9,3.5,2.2], kind:'listen', text:'旧唱片里，是大家第一次搬来那天的笑声。周宁说：“我喜欢参与，也需要能暂时退出来的地方。”', result:'你发现：二层可以留给想安静相处的人。' },
  { id:'journal', name:'未寄出的明信片', position:[9.5,3.5,3.6], kind:'read', text:'明信片画着这扇窗。背面写着：“有一天，希望能叫这里自己的家。”没有署名。', result:'一张未寄出的明信片，收入探索记录。' },
  { id:'lookout', name:'从楼上看看', position:[9.35,3.5,5.6], kind:'look', text:'城市在窗外展开。从这里，你也能看见楼下的共享桌。那些刚才陌生的身影，现在都有了名字。', result:'你找到了属于自己的城市视角。' },
  { id:'shortcut', name:'西侧返回楼梯', position:[-9.8,3.5,6.35], kind:'route', text:'这条楼梯通向茶饮角。原来二层的安静角落和大家的餐桌，只隔着一小段路。', result:'你发现了另一条回到共享桌的路。' },
];

export const SHARED_TABLE = { id:'decision', name:'商量今晚的安排', position:[-.65,0,2.2], kind:'decision' };
export const SEATS = [
  { id:'seat-ground', name:'窗边坐一会儿', position:[8.7,0,-5.25], seatedPosition:[8.7,.53,-5.65], yaw:0, kind:'seat' },
  { id:'seat-upper', name:'二层窗边落座', position:[9.4,3.5,5.25], seatedPosition:[9.4,4.03,4.6], yaw:-Math.PI/2, kind:'seat' },
];

export const DECISIONS = {
  together:{label:'围桌办一场分享会',text:'陈屿开始安排位置，何川添上热茶。林晓愿意先听一会儿，但希望结束得早一些。',changes:{chen:2,he:2,lin:0,zhou:0,xu:1,tang:2}},
  quiet:{label:'分成安静的小组',text:'林晓准备晚点把诗集带上楼，周宁提议把唱片音量调低。陈屿同意把大桌留给想继续交流的人。窗边放上了“安静角”的卡片。',changes:{lin:2,zhou:2,xu:1,chen:0,he:1,tang:0}},
  balanced:{label:'楼下分享，楼上保留安静区',text:'大家一起把两个空间安排好。林晓知道自己可以随时退出，陈屿也有了开场的伙伴。窗边多了一张“安静角”的手写卡。',changes:{lin:2,zhou:2,chen:2,he:2,xu:2,tang:2}},
};

export function freshState() { return {version:1,discovered:[],talked:[],relations:{},decision:null,journal:[],position:null}; }
export function normalizeState(value) {
  const result=freshState();
  if (!value || value.version!==1) return result;
  const discoveryIds=new Set(DISCOVERIES.map(x=>x.id));
  const personIds=new Set(RESIDENTS.map(x=>x.id));
  result.discovered=[...new Set((Array.isArray(value.discovered)?value.discovered:[]).filter(x=>discoveryIds.has(x)))];
  result.talked=[...new Set((Array.isArray(value.talked)?value.talked:[]).filter(x=>personIds.has(x)))];
  for(const id of personIds) result.relations[id]=Math.max(0,Math.min(10,Number(value.relations?.[id])||0));
  result.decision=Object.hasOwn(DECISIONS,value.decision)?value.decision:null;
  result.journal=(Array.isArray(value.journal)?value.journal:[]).filter(x=>typeof x?.text==='string'&&Number.isFinite(x.ts)).slice(-80);
  if(Array.isArray(value.position)&&value.position.length===3&&value.position.every(Number.isFinite))result.position=value.position;
  return result;
}
export function canDecide(state) { return state.talked.length>=2 && state.discovered.length>=2; }
export function applyDecision(state,key,now=Date.now()) {
  if(state.decision||!Object.hasOwn(DECISIONS,key)||!canDecide(state)) return false;
  state.decision=key;
  for(const [id,change]of Object.entries(DECISIONS[key].changes))state.relations[id]=Math.min(10,(state.relations[id]||0)+change);
  state.journal.push({id:'decision',text:DECISIONS[key].label+'。'+DECISIONS[key].text,ts:now});
  return true;
}
export function residentSpeech(person,state) {
  if(state.decision)return `${person.name}：${person.need==='quiet'&&state.decision==='together'?'“我会来听一会儿。累了就到窗边坐坐。”':'“谢谢你把我的想法也放进今晚的安排里。”'}`;
  if(person.id==='lin')return state.discovered.includes('records')?'“你看过那本手记了？我不是不喜欢大家，只是人一多，就不知道什么时候该开口。”':'“我带来了一本诗集。如果可以，我想在安静一点的地方读给你听。”';
  if(person.id==='chen')return '“今晚想把大家聚起来，每人分享一件最近的小事。你也去问问其他人吧，我们一起决定怎么安排。”';
  if(person.id==='xu')return state.discovered.includes('plant')?'“谢谢你照料薄荷。一起生活，好像就是这些小事。”':'“有人说想热闹，有人说想安静。也许这座屋子能同时容得下。”';
  if(person.id==='zhou')return state.discovered.includes('record')?'“你听过录音了。楼上留个安静角，想参与和想休息就不用二选一。”':'“从楼上能看见大家，却不会被所有声音包围。你可以听听桌上的旧录音。”';
  if(person.id==='he')return '“茶都备好了。晚点办什么活动我都愿意帮忙，记得给不喝茶的人留一壶水。”';
  return '“我想讲第一次迷路来这里的故事！你发现西边那条楼梯了吗？走一圈，最后总会回到大家身边。”';
}
