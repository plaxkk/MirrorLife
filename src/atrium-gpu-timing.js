// Sparse asynchronous GPU samples. Never wait for a query: a saturated pool
// skips a sample, and disjoint samples are discarded instead of reported.
export function createAtriumGpuTiming(gl){
  const ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const pending=[],values=[];let active=null,enabled=false,frame=0,discarded=0;
  function clear(){if(active){gl.endQuery(ext.TIME_ELAPSED_EXT);gl.deleteQuery(active);active=null;}for(const q of pending)gl.deleteQuery(q);pending.length=0;}
  return {
    reset(){if(ext)clear();values.length=0;discarded=0;frame=0;enabled=true;},
    begin(){
      if(!ext||!enabled)return;
      if(gl.getParameter(ext.GPU_DISJOINT_EXT)){discarded+=pending.length;clear();return;}
      while(pending.length&&gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE)){
        const q=pending.shift(),ns=gl.getQueryParameter(q,gl.QUERY_RESULT);gl.deleteQuery(q);
        if(Number.isFinite(ns)&&ns>=0){values.push(ns/1e6);if(values.length>1800)values.shift();}
      }
      if(++frame%10||pending.length>=4)return;
      active=gl.createQuery();if(active)gl.beginQuery(ext.TIME_ELAPSED_EXT,active);
    },
    end(){if(active){gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push(active);active=null;}},
    stats(){const sorted=[...values].sort((a,b)=>a-b);return {supported:!!ext,samples:values.length,discarded,
      p50:sorted[Math.floor(sorted.length*.5)]??null,p95:sorted[Math.floor(sorted.length*.95)]??null,
      method:'Every tenth rendered frame, asynchronous WebGL2 elapsed-time query; GPU render only, excludes presentation/input. Unsupported and disjoint samples are not zero milliseconds.'};},
    dispose(){if(ext)clear();enabled=false;},
  };
}
