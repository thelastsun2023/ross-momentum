// Explain why an armed strategy has not executed; never manufacture live fills.
document.querySelector('aside').insertAdjacentHTML('afterbegin',`<div class="card"><h2>运行诊断 / 为什么没有买卖？</h2><div id="engineHealth" class="statebox" role="status" aria-live="polite"></div><p id="engineCounts" class="foot"></p><div class="scroll"><table><thead><tr><th>代码</th><th>当前阻止入场的原因</th></tr></thead><tbody id="entryReasons"></tbody></table></div><button id="demoRoundTrip" class="primary" style="width:100%;margin-top:14px">演示一次自动买入 → 自动卖出</button><p class="foot">演示使用顶部隔离的虚构牛旗实验，约 13 秒完成，不使用真实报价、不改变练习账户资金。真实行情自动模式仍是简化策略；缺乏信号时不会强行生成交易。</p></div>`);
const healthCounters={evaluations:0,polls:0,lastEvaluation:null,lastRequest:null};
const healthStrategy=runStrategy;runStrategy=function(){healthCounters.evaluations++;healthCounters.lastEvaluation=Date.now();return healthStrategy();};
const healthPoll=pollFeed;pollFeed=async function(force=false){if(!feedBusy&&apiKey&&(force||Date.now()-lastPoll>=125000)){healthCounters.polls++;healthCounters.lastRequest=Date.now();}try{return await healthPoll(force);}finally{showHealth();}};
const healthFeedback=renderFeedback;
function entryReason(x){
 if(s.locked)return '亏损上限已锁定';
 if(isLive()&&!marketOpen())return '非美股常规交易时间（纽约 09:30–16:00）';
 if(isLive()&&!apiKey)return '当前未连接 Key';
 if(isLive()&&!recent(x))return '报价过期，禁止模拟成交';
 if(isLive()&&!x.fresh)return '尚未收到新的行情时间点';
 if(s.positions.some(p=>p.symbol===x.symbol))return '已有持仓，等待止损或止盈';
 if(s.positions.length>=3)return '持仓数量已达 3 个上限';
 if((s.autoCount??0)>=20)return '本次自动入场次数已达上限';
 if((s.cooldown?.[x.symbol]??0)>s.tick)return '退出后冷却期';
 if(x.price<1||x.price>500)return '超出简化策略价格范围 $1–$500';
 let h=x.history;if(h.length<6)return '历史价格不足 6 根';
 let pct=(x.price/h.at(-6)-1)*100;if(pct<+$('momentum').value)return `近 5 根涨幅 ${pct.toFixed(2)}%，低于阈值 ${$('momentum').value}%`;
 if(x.price<=Math.max(...h.slice(-6,-1)))return '未突破此前 5 根最高收盘价';
 return autoEnabled?'信号通过，等待下一轮风险检查':'条件通过，但自动模式未启动';
}
function showHealth(){
 let active=autoEnabled&&timer,waiting=isLive()&&(!marketOpen()||!apiKey||!s.stocks.some(recent)),box=$('engineHealth'),title;
 if(s.locked)title='■ 已锁定：达到亏损限制';
 else if(!autoEnabled)title='○ 自动交易未启动';
 else if(!timer)title='Ⅱ 自动交易已暂停';
 else if(isLive()&&!apiKey)title='■ 未连接行情：不会买卖';
 else if(isLive()&&!marketOpen())title='◷ 等待美股开盘：当前不会买卖';
 else if(isLive()&&!s.stocks.some(recent))title='⚠ 行情已过期：当前不会买卖';
 else title='● 正在扫描：满足条件后才会模拟买卖';
 box.className='statebox '+(active&&!waiting?'running':s.locked?'failed':'loading');
 let now=new Date(),et=new Intl.DateTimeFormat('zh-CN',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(now);
 box.textContent=title+'\n纽约时间 '+et+' · 常规时段 09:30–16:00';
 if(autoEnabled&&waiting){$('autoState').className='statebox loading';$('autoState').textContent=title+'\n自动开关已开启，交易执行被拦截。\n自动入场 '+(s.autoCount??0)+'/20 · 持仓 '+s.positions.length+'/3';}
 if(isLive()&&apiKey&&!feedBusy&&connectionState==='success'&&!s.stocks.some(recent)){$('connectionBox').className='statebox loading';$('connectionBox').textContent='⚠ 曾连接成功，但当前报价已过期\n过期报价不会用于自动模拟成交。';}
 let countdown=timer?(isLive()?Math.max(0,Math.ceil((125000-(Date.now()-lastPoll))/1000)):'每帧检查'):'已暂停';
 $('engineCounts').textContent=`本页面策略检查 ${healthCounters.evaluations} 次 · 行情请求轮次 ${healthCounters.polls} · 本次练习已记录 ${(s.trades??[]).length} 条成交 · ${isLive()&&!marketOpen()?'闭市暂停定时请求以节省额度':'下次行情检查 '+countdown+(typeof countdown==='number'?' 秒':'')}。没有成交不等于已下单。`;
 $('entryReasons').innerHTML=s.stocks.map(x=>`<tr><td>${x.symbol}</td><td>${entryReason(x)}</td></tr>`).join('');
}
renderFeedback=function(){healthFeedback();showHealth();};
const healthTick=tick;tick=function(){if(isLive()&&!marketOpen()){showHealth();return;}return healthTick();};
// Existing interval callbacks may reference the previous tick function; restart only
// after a user action in the updated document (reloads already start paused).
$('demoRoundTrip').onclick=()=>{autoEnabled=false;pause();$('labCase').value='win';$('labStart').onclick();$('labStatus').scrollIntoView({behavior:'smooth',block:'center'});note('已启动隔离的虚构牛旗实验：约 7 秒后买入，随后按规则卖出。真实行情模式已暂停。');showHealth();};
setInterval(showHealth,1000);showHealth();
