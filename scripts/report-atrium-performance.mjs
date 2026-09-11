import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='evidence/atrium';
const read=async name=>JSON.parse(await fs.readFile(`${out}/${name}.json`,'utf8'));
const [desktop,mobile,assets,video,walk]=await Promise.all(['performance-measurement','mobile-measurement','assets','video-validation','walkthrough-stats'].map(read));
for(const report of [desktop,mobile,video,walk])assert.equal(report.runtimeFingerprint,assets.runtimeFingerprint,'Mixed candidate evidence');
const d=desktop.measured,m=mobile.measured;
const value=v=>typeof v==='number'?Number(v.toFixed(2)):String(v??'未获取');
const sum=(r,key)=>r.resources.reduce((n,item)=>n+(item[key]||0),0);
const rows=[
  ['帧样本数',r=>r.frames],['P50 ms',r=>r.frameMs.p50],['P95 ms',r=>r.frameMs.p95],['P99 ms',r=>r.frameMs.p99],
  ['CPU 脚本 P95 ms',r=>r.cpuMs.script.p95],['CPU 渲染提交 P95 ms',r=>r.cpuMs.render.p95],
  ['GPU 样本数',r=>r.gpuMs.samples],['GPU P50 ms',r=>r.gpuMs.p50],['GPU P95 ms',r=>r.gpuMs.p95],
  ['峰值 draw calls',r=>r.renderPeaks.calls],['峰值 triangles',r=>r.renderPeaks.triangles],['峰值 geometries',r=>r.renderPeaks.geometries],
  ['JS heap bytes',r=>r.memory.jsHeapBytes],['导航至就绪 ms',r=>r.navigationToReadyMs],['模块启动至就绪 ms',r=>r.loadingMs],['点击至活动帧 ms',r=>r.enterToActiveMs],
  ['镜头查询索引 triangles',r=>r.cameraGeometry?.triangles],['镜头索引构建 ms',r=>r.cameraGeometry?.buildMs],
  ['资源 transferBytes',r=>sum(r,'transferBytes')],['资源 decodedBytes',r=>sum(r,'decodedBytes')],
];
const budget=r=>r.renderPeaks.calls<=180&&r.renderPeaks.triangles<=500000&&r.renderPeaks.geometries<=220;
const describe=r=>`${r.device.viewport.join('×')}，页面 DPR ${r.device.dpr}，渲染 DPR ${r.device.renderPixelRatio}`;
const text=`# 天井试点 · 当前候选性能与运行记录

构建指纹：\`${assets.runtimeFingerprint}\`。本文件从同候选原始 JSON 生成，不以构建成功代替玩家体验或美术验收。

## 实测条件

- 浏览器：${d.device.userAgent}
- GPU：${d.device.gpu}
- 桌面：${describe(d)}；移动模拟：${describe(m)}。
- 本机设备登记沿用 MacBookPro16,1 / i7-9750H / 16GiB。移动档由同一桌面 GPU 模拟触屏、视口和 DPR，不是真实手机。
- 桌面采样时间：${desktop.capturedAt}；移动采样时间：${mobile.capturedAt}。本机 production preview，可见 Chrome，进入后预热，再实际拖动环绕 30 多秒。采样与 Blender、录像顺序执行。
- 未清空系统文件缓存，未测公网弱网、热降频、功耗或长时稳定性。

## 数据

| 指标 | 桌面 | 移动模拟 |
|---|---:|---:|
${rows.map(([label,get])=>`| ${label} | ${value(get(d))} | ${value(get(m))} |`).join('\n')}

整处双层合计预算仍为 180 draw calls / 500,000 triangles / 220 geometries。桌面预算${budget(d)?'通过':'未通过'}，移动模拟预算${budget(m)?'通过':'未通过'}。严格桌面 P95 ≤ 16.67ms ${d.frameMs.p95<=1000/60?'通过':'未通过'}；移动模拟 P95 ≤ 33.33ms ${m.frameMs.p95<=1000/30?'通过':'未通过'}。短时样本不能证明稳定 60fps 或手机达标。

renderer.info 包含主画面与动态人物阴影，三角面含通道重复，geometries 是 GPU 对象数。镜头索引三角面是 CPU/WASM 查询结构，不能与渲染三角面相加混作 GPU 预算。静态建筑阴影加载时生成一次。近镜头人物透明属于可见性处理，人物模型仍提交渲染，不作为性能降档。

GPU 每十帧异步计时，仅覆盖 WebGL 渲染，不包括浏览器完整合成、显示呈现或输入；不能用相减分位数计算其他阶段。JS heap 不是进程、WASM 或显存总量，这些数据未获取。进入点击到活动帧不是所有交互的输入延迟分布。

资产清单 ${assets.assets.length} 项，public ${assets.totalPublicBytes} bytes，source/master ${assets.totalSourceBytes} bytes。Resource Timing 合计不含导航文档，不等于整个发布体积。镜头索引复用已解码 GLB，不额外下载模型；其 CPU 和 native 内存成本仍需考虑。

## 连续流程与边界

录像 ${value(video.durationSeconds)} 秒 / ${video.decodedFrames} 帧 / ${video.bytes} bytes，全片解码 exit ${video.fullDecodeExitCode}。SHA-256：\`${video.sha256}\`。录像使用本机 Chrome headless 实际 WebGL，按真实时间编码 15fps，不用于替代独立性能采样，也不代表人类 3–5 分钟阅读决策时间。

回游峰值 ${walk.stats.renderPeaks.calls} calls / ${walk.stats.renderPeaks.triangles} triangles / ${walk.stats.renderPeaks.geometries} geometries。步骤、异常和前后指纹见 acceptance.json，各用例日志在 validation/。方向、家具和触摸专项见 controls/report.json。视频画幅、内容与自然度仍需要独立视觉检查。

改动前数据保留于 PERFORMANCE-before-controls.md；这不是控制所有变量的严格 A/B。具体用户反馈、五视角审查和残余问题见 ../../docs/ATRIUM_CONTROLS_REVIEW.md。最终美术、真实手机、长期稳定性及主世界完整集成仍未通过。
`;
await fs.writeFile(`${out}/PERFORMANCE.md`,text);console.log('PERFORMANCE_REPORT_READY',assets.runtimeFingerprint);
