import {freshState,normalizeState} from './atrium-content.js';
const KEY='mirrorlife:atrium-pilot:v1';
const OUTBOX='mirrorlife:atrium-memory-outbox:v1';
let flushing=null;
export function loadAtriumState(storage=globalThis.localStorage) {
  try{return {state:normalizeState(JSON.parse(storage.getItem(KEY))),error:null};}
  catch(error){return {state:freshState(),error:String(error.message||error)};}
}
export function saveAtriumState(state,storage=globalThis.localStorage) {
  try {storage.setItem(KEY,JSON.stringify(state));return null;}
  catch(error){return String(error.message||error);}
}
export async function appendAtriumMemory(entry,personId='avatar') {
  const rows=readOutbox();
  const row={id:`atrium:${entry.id}:${entry.ts}`,agentId:personId,kind:'experience',text:entry.text,ts:entry.ts,importance:.7,source:'atrium-pilot',metadata:{scene:'atrium',localScenario:true}};
  if(!rows.some(x=>x.id===row.id))rows.push(row);
  localStorage.setItem(OUTBOX,JSON.stringify(rows));
  return flushAtriumMemories();
}
function readOutbox(){try{const rows=JSON.parse(localStorage.getItem(OUTBOX)||'[]');return Array.isArray(rows)?rows:[];}catch{return [];}}
export async function flushAtriumMemories(){
  if(flushing){await flushing;if(readOutbox().length)return flushAtriumMemories();return;}
  flushing=(async()=>{
    if(typeof window.idbAppendMemories!=='function')throw new Error('本地记忆层未就绪');
    const rows=readOutbox();if(!rows.length)return;
    await window.idbAppendMemories(rows);
    const sent=new Set(rows.map(x=>x.id));
    localStorage.setItem(OUTBOX,JSON.stringify(readOutbox().filter(x=>!sent.has(x.id))));
  })();
  try{await flushing;}finally{flushing=null;}
}
