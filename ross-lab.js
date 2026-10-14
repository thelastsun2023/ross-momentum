/* Controlled, explicitly synthetic experiments. No API key or broker connection. */
const RossLab=(()=>{
 const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
 function analyze(bars,meta){
  const last=bars.at(-1),checks=[];const check=(name,value,pass)=>checks.push({name,value,pass});
  check('价格 $2–$20',last?last.close.toFixed(2):'缺数据',!!last&&last.close>=2&&last.close<=20);
  const change=last&&meta.previousClose>0?(last.close/meta.previousClose-1)*100:null;
  check('当日涨幅 ≥10%',change===null?'缺前收盘':change.toFixed(1)+'%',change!==null&&change>=10);
  check('相对量 ≥5×',Number.isFinite(meta.rvol)?meta.rvol+'×':'缺历史基准量',Number.isFinite(meta.rvol)&&meta.rvol>=5);
  check('流通股 <20M',Number.isFinite(meta.float)?meta.float+'M':'缺流通股数',Number.isFinite(meta.float)&&meta.float>0&&meta.float<20);
  check('已确认新闻催化剂',meta.catalyst===true?'已确认（示例）':'缺新闻或未确认',meta.catalyst===true);
  if(bars.length<9)return {checks,eligible:false,reason:'等待蜡烛积累'};
  const current=last,pull=bars.slice(-3,-1),pole=bars.slice(-7,-3),high=Math.max(...pole.map(b=>b.high)),low=Math.min(...pole.map(b=>b.low)),pullLow=Math.min(...pull.map(b=>b.low)),range=high-low;
  let denominator=bars.reduce((s,b)=>s+b.volume,0),vwap=denominator?bars.reduce((s,b)=>s+(b.high+b.low+b.close)/3*b.volume,0)/denominator:null;
  let shape=pull.every(b=>b.close<b.open)&&pole.at(-1).close>pole[0].open&&range>0&&(high-pullLow)/range<=.5;
  check('两根回调 / 回撤 ≤50%',shape?'通过':'未形成',shape);
  const above=vwap!==null&&pullLow>=vwap;check('回调不破会话 VWAP',vwap===null?'缺成交量':vwap.toFixed(2),above);
  const volume=mean(pull.map(b=>b.volume))<mean(pole.map(b=>b.volume))&&current.volume>mean(pull.map(b=>b.volume));check('回调缩量 / 突破放量',volume?'通过':'未通过',volume);
  const breakout=current.close>current.open&&current.close>pull.at(-1).high;check('首次突破回调高点',breakout?'通过':'等待突破',breakout);
  const entry=current.close+.01,stop=pullLow-.01,risk=entry-stop,target=entry+2*risk;const room=risk>0&&high-entry>=2*risk;check('到前高空间 ≥2R',room?'通过':'空间不足',room);
  return {checks,eligible:checks.every(c=>c.pass),reason:checks.find(c=>!c.pass)?.name||'所有实验规则通过',entry,stop,target,risk,vwap};
 }
 function candle(open,close,volume,high=Math.max(open,close)+.02,low=Math.min(open,close)-.02){return {open,close,volume,high,low};}
 function fixture(kind){let bars=Array.from({length:20},(_,i)=>candle(5+i*.002,5+(i+1)*.002,1000));bars.push(candle(5.04,5.3,10000),candle(5.3,5.65,12000),candle(5.65,6.0,15000),candle(6,6.2,15000,6.50,5.99),candle(6.2,6.02,3000,6.21,5.98),candle(6.02,5.97,2000,6.04,5.92),candle(5.97,6.07,13000,6.10,5.95));let next=kind==='loss'?[candle(6.07,5.85,18000,6.08,5.80)]:[candle(6.07,6.3,15000),candle(6.3,6.50,15000),candle(6.5,6.60,15000),candle(6.6,6.55,6000),candle(6.55,6.70,8000),candle(6.7,6.02,18000,6.72,6)];return {bars:bars.concat(next),meta:{previousClose:5,rvol:kind==='missing'?null:6,float:8,catalyst:kind!=='missing'},entryIndex:26};}
 function step(state,bar,analysis){
  if(state.position){let p=state.position;if(bar.low<=p.stop){let fill=Math.min(bar.open,p.stop)-.01;exit(state,p.qty,fill,'止损（同根双触发优先止损）');}
   else if(!p.scaled&&bar.high>=p.target){exit(state,Math.floor(p.qty/2),p.target-.01,'2R 卖出一半');if(state.position){state.position.scaled=true;state.position.stop=state.position.entry+.01;}}
   else if(p.scaled&&bar.close<bar.open)exit(state,p.qty,bar.close-.01,'首根红蜡烛退出余仓');
   return;
  }
  if(state.entered||!analysis.eligible)return;
  const qty=Math.min(Math.floor(25/(analysis.risk+.01)),Math.floor(state.cash/analysis.entry));if(qty<2)return;
  state.cash-=qty*analysis.entry;state.position={qty,entry:analysis.entry,stop:analysis.stop,target:analysis.target,scaled:false};state.entered=true;state.events.push({action:'牛旗模拟入场',qty,price:analysis.entry,pnl:0});
 }
 function exit(state,qty,price,action){let p=state.position,pnl=qty*(price-p.entry);state.cash+=qty*price;state.realized+=pnl;state.events.push({action,qty,price,pnl});p.qty-=qty;if(!p.qty)state.position=null;}
 return {analyze,fixture,step};
})();
if(typeof module!=='undefined')module.exports=RossLab;
if(typeof document!=='undefined'){
 document.querySelector('section').insertAdjacentHTML('afterbegin',`<div class="card"><h2>Ross 公开牛旗规则 · 小范围实验</h2><p class="foot">本实验使用人工构造的虚构 OHLCV、流通股和新闻，验证代码行为，不代表历史回测或盈利证明。与下方练习账户完全隔离。每次虚拟资金 $1,000、风险 $25，只允许一笔入场，不加仓。</p><label for="labCase">实验场景</label><select id="labCase"><option value="win">牛旗通过 → 分批获利</option><option value="loss">牛旗通过 → 止损退出</option><option value="missing">缺少新闻 / 相对量 → 禁止入场</option></select><div class="controls"><button id="labStart" class="primary">启动规则实验</button><button id="labNext">前进一根蜡烛</button><button id="labStop">暂停实验</button><button id="labAudit">检查当前真实行情的指标缺口</button></div><div id="labStatus" class="statebox" role="status" aria-live="polite">○ 实验未启动</div><div class="scroll"><table><thead><tr><th>规则</th><th>当前数据</th><th>判定</th></tr></thead><tbody id="labChecks"></tbody></table></div><div id="labEvents" class="foot"></div><p class="foot">机器化边界：两根回调、以蜡烛收盘确认突破、首个 2R 卖半、余仓保本并在首根红蜡烛退出；这些是本实验的明确实现选择，不能代表 Ross 的全部临场判断。Level 2、逐笔、加仓、盘前 Gap & Go 及全市场扫描尚未接入。<a href="https://www.warriortrading.com/bull-flag-trading/" target="_blank" rel="noopener">公开规则来源</a></p></div>`);
 let labTimer=null,lab=null;function pauseLab(){clearInterval(labTimer);labTimer=null;}
 function labRender(){let analysis=RossLab.analyze(lab.scenario.bars.slice(0,lab.index+1),lab.scenario.meta);$('labChecks').innerHTML=analysis.checks.map(c=>`<tr><td>${c.name}</td><td>${c.value}</td><td class="${c.pass?'positive':'negative'}">${c.pass?'✓ 通过':'✕ 未通过'}</td></tr>`).join('');let p=lab.state.position,equity=lab.state.cash+(p?p.qty*lab.scenario.bars[lab.index].close:0);$('labStatus').className='statebox '+(labTimer?'running':'');$('labStatus').textContent=`${labTimer?'● 规则实验已启动':lab.done?'✓ 实验已完成':'Ⅱ 实验已暂停'} · 纯虚构数据\n蜡烛 ${lab.index+1}/${lab.scenario.bars.length} · ${analysis.reason}\n虚拟净值 ${money(equity)} · 已实现 ${money(lab.state.realized)} · 持仓 ${p?p.qty:0} 股`;$('labEvents').textContent=lab.state.events.map(e=>`${e.action}：${e.qty} 股 @ ${money(e.price)} · 损益 ${money(e.pnl)}`).join(' | ')||'尚无模拟成交';}
 function advance(){if(!lab)return;if(lab.index>=lab.scenario.bars.length-1){lab.done=true;pauseLab();labRender();return;}lab.index++;let bars=lab.scenario.bars.slice(0,lab.index+1);RossLab.step(lab.state,bars.at(-1),RossLab.analyze(bars,lab.scenario.meta));if(lab.index===lab.scenario.bars.length-1){lab.done=true;pauseLab();}labRender();}
 $('labStart').onclick=()=>{pauseLab();lab={scenario:RossLab.fixture($('labCase').value),index:19,state:{cash:1000,realized:0,events:[],position:null,entered:false},done:false};labTimer=setInterval(advance,1000);labRender();};$('labNext').onclick=()=>{if(!lab)$('labStart').onclick();pauseLab();advance();};$('labStop').onclick=()=>{pauseLab();if(lab)labRender();};$('labCase').onchange=()=>{pauseLab();lab=null;$('labStatus').textContent='○ 场景已切换，请启动实验。';$('labChecks').innerHTML='';$('labEvents').textContent='';};
 $('labAudit').onclick=()=>{pauseLab();let messages=s.stocks.map(x=>`${x.symbol}：${x.price>=2&&x.price<=20?'价格范围通过':'价格范围不通过'}；前收盘、可比历史相对量、流通股、新闻确认、完整会话 OHLCV / VWAP ${isLive()?'缺失':'均为模拟数据'}`);$('labStatus').className='statebox failed';$('labStatus').textContent='■ 当前行情不能用于完整 Ross 规则交易\n'+messages.join('\n');$('labChecks').innerHTML='';$('labEvents').textContent='实验不会使用这些缺项数据生成真实行情入场。下方原自动模式仍是简化策略。';};
}
