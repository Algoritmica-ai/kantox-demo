(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const money = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0,10);

  const defaults = {
    orders: [
      {id:1,type:'Limit',pair:'EUR / USD',side:'Buy EUR',amount:1000000,rate:1.0800,expiry:'2026-08-22',status:'Active'},
      {id:2,type:'Limit',pair:'EUR / GBP',side:'Buy EUR',amount:500000,rate:0.8600,expiry:'2026-08-22',status:'Active'},
      {id:3,type:'Stop',pair:'EUR / JPY',side:'Sell EUR',amount:300000,rate:170.5000,expiry:'2026-08-20',status:'Active'},
      {id:4,type:'Limit',pair:'EUR / CHF',side:'Buy EUR',amount:750000,rate:0.9750,expiry:'2026-08-25',status:'Active'},
      {id:5,type:'Limit',pair:'EUR / USD',side:'Sell EUR',amount:1000000,rate:1.0950,expiry:'2026-08-22',status:'Active'}
    ],
    transactions: [
      {id:1,action:'Bought',amount:1000000,currency:'USD',rate:1.0865,time:'Today, 10:15'},
      {id:2,action:'Sold',amount:750000,currency:'GBP',rate:0.8620,time:'Today, 09:42'},
      {id:3,action:'Bought',amount:500000,currency:'CHF',rate:0.9810,time:'Yesterday, 16:20'},
      {id:4,action:'Sold',amount:1200000,currency:'JPY',rate:168.75,time:'Yesterday, 14:05'},
      {id:5,action:'Bought',amount:1000000,currency:'USD',rate:1.0840,time:'Aug 10, 11:30'}
    ],
    alerts: [
      {id:1,title:'USD exposure above threshold',detail:'Current: 5,250,000 USD',kind:'warning'},
      {id:2,title:'Order EUR / USD 1,000,000',detail:'Target: 1.0800 • Good till 22 Aug',kind:'info'}
    ],
    watchlist:['EUR / USD','EUR / GBP','EUR / JPY','EUR / CHF','EUR / CNY']
  };

  const state = {
    orders: load('kantox-orders', defaults.orders),
    transactions: load('kantox-transactions', defaults.transactions),
    alerts: load('kantox-alerts', defaults.alerts),
    watchlist: load('kantox-watchlist', defaults.watchlist),
    rates: {
      'EUR / USD':{sell:1.0887,buy:1.0890,dec:4},
      'EUR / GBP':{sell:0.8612,buy:0.8616,dec:4},
      'EUR / JPY':{sell:169.21,buy:169.25,dec:2},
      'EUR / CHF':{sell:0.9803,buy:0.9807,dec:4},
      'EUR / CNY':{sell:7.8321,buy:7.8365,dec:4},
      'EUR / CAD':{sell:1.5021,buy:1.5027,dec:4},
      'EUR / AUD':{sell:1.6784,buy:1.6791,dec:4}
    },
    exposure:[
      {currency:'USD',value:5250000,color:'#167be9'},
      {currency:'GBP',value:2200000,color:'#1ec7c9'},
      {currency:'JPY',value:1800000,color:'#8d58d7'},
      {currency:'CHF',value:1350000,color:'#f5a43c'},
      {currency:'CNY',value:1150000,color:'#e94f70'},
      {currency:'Other',value:1000000,color:'#718096'}
    ]
  };

  function load(key, fallback){
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : structuredClone(fallback); }
    catch { return structuredClone(fallback); }
  }
  function save(){
    localStorage.setItem('kantox-orders', JSON.stringify(state.orders));
    localStorage.setItem('kantox-transactions', JSON.stringify(state.transactions));
    localStorage.setItem('kantox-alerts', JSON.stringify(state.alerts));
    localStorage.setItem('kantox-watchlist', JSON.stringify(state.watchlist));
  }
  function toast(message){
    const el = document.createElement('div'); el.className='toast'; el.textContent=message; $('#toastStack').append(el);
    setTimeout(() => el.remove(), 2600);
  }

  function renderExposure(){
    const unit = $('#exposureUnit').value;
    const factor = unit === 'USD' ? 1.089 : 1;
    const max = Math.max(...state.exposure.map(x=>x.value*factor));
    $('#exposureBars').innerHTML = state.exposure.map(x => {
      const val=x.value*factor; return `<div class="bar-row" data-search="${x.currency}"><span>${x.currency}</span><div class="bar-track"><div class="bar-fill" style="width:${(val/max)*100}%;background:${x.color}"></div></div><span class="bar-value">${money(val)}</span></div>`;
    }).join('');
  }

  function trendData(days){
    const count = days===30 ? 30 : days===90 ? 45 : 60;
    const arr=[]; let v=12.15;
    for(let i=0;i<count;i++){
      const wave=Math.sin(i/4)*.14 + Math.sin(i/9)*.08;
      const hump = i>5 && i<count*.45 ? Math.sin((i-5)/(count*.4)*Math.PI)*1.55 : 0;
      const drop = i>count*.48 ? -0.35 : 0;
      v = 12.05 + wave + hump + drop + ((i*17)%11)/100;
      arr.push(v);
    }
    return arr;
  }
  function renderTrend(){
    const days=Number($('#trendRange').value), data=trendData(days), svg=$('#trendChart');
    const w=720,h=280,pad={l:46,r:12,t:12,b:34}; const min=8,max=16;
    const x=i=>pad.l+i*(w-pad.l-pad.r)/(data.length-1); const y=v=>pad.t+(max-v)*(h-pad.t-pad.b)/(max-min);
    const pts=data.map((v,i)=>`${x(i)},${y(v)}`).join(' ');
    const area=`${x(0)},${h-pad.b} ${pts} ${x(data.length-1)},${h-pad.b}`;
    const yTicks=[8,10,12,14,16];
    const tickLabels = days===30 ? ['Jul 14','Jul 21','Jul 28','Aug 4','Aug 11'] : days===90 ? ['May','Jun','Jul','Aug'] : ['Jan','Mar','May','Jul','Aug'];
    svg.innerHTML=`<defs><linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#2679ee" stop-opacity=".13"/><stop offset="100%" stop-color="#2679ee" stop-opacity="0"/></linearGradient></defs>
      ${yTicks.map(v=>`<line class="grid-line" x1="${pad.l}" x2="${w-pad.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis-label" x="4" y="${y(v)+4}">${v}M</text>`).join('')}
      ${tickLabels.map((t,i)=>`<text class="axis-label" text-anchor="middle" x="${pad.l+i*(w-pad.l-pad.r)/(tickLabels.length-1)}" y="${h-8}">${t}</text>`).join('')}
      <polygon class="trend-area" points="${area}"/><polyline class="trend-line" points="${pts}"/>
      <circle class="trend-dot" cx="${x(data.length-1)}" cy="${y(data.at(-1))}" r="3.5"/>`;
  }

  function renderOrders(filter=''){
    const f=filter.trim().toLowerCase();
    const rows=state.orders.filter(o=>!f || Object.values(o).join(' ').toLowerCase().includes(f));
    $('#ordersBody').innerHTML=rows.length?rows.map(o=>`<tr data-id="${o.id}"><td>${o.type}</td><td>${o.pair}</td><td class="${o.side.startsWith('Buy')?'side-buy':'side-sell'}">${o.side}</td><td>${money(o.amount)}</td><td>${Number(o.rate).toFixed(o.pair.includes('JPY')?2:4)}</td><td>${formatDate(o.expiry)}</td><td><span class="status">${o.status}</span></td><td><div class="order-actions"><button class="tiny-btn duplicate-order" data-id="${o.id}">Copy</button><button class="tiny-btn cancel-order" data-id="${o.id}">Cancel</button></div></td></tr>`).join(''):`<tr><td colspan="8" style="text-align:center;color:#7b8a9f;padding:28px">No matching open orders.</td></tr>`;
    $$('.cancel-order').forEach(b=>b.onclick=()=>cancelOrder(Number(b.dataset.id)));
    $$('.duplicate-order').forEach(b=>b.onclick=()=>duplicateOrder(Number(b.dataset.id)));
  }
  function formatDate(s){ return new Date(`${s}T00:00:00`).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
  function cancelOrder(id){ state.orders=state.orders.filter(o=>o.id!==id); save(); renderOrders($('#globalSearch').value); toast('Order cancelled'); }
  function duplicateOrder(id){ const o=state.orders.find(x=>x.id===id); if(!o)return; state.orders.unshift({...o,id:Date.now(),amount:Math.max(1000,Math.round(o.amount/2))});save();renderOrders($('#globalSearch').value);toast('Order copied'); }

  function renderRates(){
    $('#ratesList').innerHTML=state.watchlist.map(pair=>{ const r=state.rates[pair]; if(!r)return''; return `<div class="rate-row" data-pair="${pair}"><span>${pair}</span><span>${r.sell.toFixed(r.dec)}</span><span>${r.buy.toFixed(r.dec)}</span></div>`; }).join('');
  }
  function refreshRates(){
    state.watchlist.forEach(pair=>{const r=state.rates[pair], spread=r.buy-r.sell; const delta=(Math.random()-.5)*(pair.includes('JPY')?.08:.0014); r.sell=Math.max(.0001,r.sell+delta); r.buy=r.sell+spread;});
    renderRates(); $$('.rate-row').forEach(x=>x.classList.add('changed')); updateTimestamp(); toast('Live rates refreshed');
  }

  function renderTransactions(filter=''){
    const f=filter.trim().toLowerCase();
    const txs=state.transactions.filter(t=>!f || Object.values(t).join(' ').toLowerCase().includes(f)).slice(0,6);
    $('#transactionsList').innerHTML=txs.length?txs.map(t=>`<div class="tx-row"><span class="tx-check">◉</span><div><strong>${t.action} ${money(t.amount)} ${t.currency}</strong><small>@ ${Number(t.rate).toFixed(t.currency==='JPY'?2:4)}</small></div><span class="tx-time">${t.time}</span></div>`).join(''):`<div style="padding:20px;color:#7b8a9f;font-size:12px">No matching transactions.</div>`;
  }
  function renderAlerts(){
    $('#alertsList').innerHTML=state.alerts.length?state.alerts.map(a=>`<div class="alert-row"><span class="alert-icon">${a.kind==='warning'?'▲':'ⓘ'}</span><div><strong>${a.title}</strong><small>${a.detail}</small></div><button class="dismiss-alert" data-id="${a.id}" title="Dismiss">×</button></div>`).join(''):`<div style="padding:18px;color:#7b8a9f;font-size:12px">No active alerts.</div>`;
    $$('.dismiss-alert').forEach(b=>b.onclick=()=>{state.alerts=state.alerts.filter(a=>a.id!==Number(b.dataset.id));save();renderAlerts();toast('Alert dismissed');});
  }
  function renderRatesChecklist(){
    $('#ratesChecklist').innerHTML=Object.keys(state.rates).map(pair=>`<label class="check-row"><span>${pair}</span><input type="checkbox" value="${pair}" ${state.watchlist.includes(pair)?'checked':''}></label>`).join('');
  }
  function updateTimestamp(){ $('#lastUpdated').textContent=`Last updated: ${new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}`; }

  function showView(name){
    $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    $('#pageTitle').textContent=name;
    if(name==='Dashboard'){
      $('#pageSubtitle').textContent='Overview of your FX exposure, risk and transactions'; $('#dashboardView').classList.remove('hidden'); $('#genericView').classList.add('hidden'); return;
    }
    const copy={
      'Live Rates':'Monitor indicative market rates and your configured currency watchlist.',Transactions:'Review executed FX trades and settlement activity.',Orders:'Manage simulated limit and stop orders.',Exposure:'Analyse currency exposures by entity, maturity and currency.',Hedging:'Review hedge coverage and proposed hedge actions.',Analytics:'Explore FX risk trends and performance metrics.',Payments:'Manage simulated upcoming international payments.',Counterparties:'Review configured banks and trading counterparties.',Reports:'Generate management and treasury reporting packs.',Automation:'Configure rule-based FX workflows and hedge triggers.',Settings:'Manage demo preferences, notifications and controls.'
    };
    $('#pageSubtitle').textContent=copy[name]||''; $('#genericTitle').textContent=name; $('#genericDescription').textContent=`${copy[name]||''} This concept module is intentionally lightweight; the dashboard interactions remain fully available.`; $('#dashboardView').classList.add('hidden');$('#genericView').classList.remove('hidden');
  }

  $$('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  $('#backDashboardBtn').onclick=()=>showView('Dashboard');
  $('#collapseBtn').onclick=()=>{ $('#sidebar').classList.toggle('collapsed'); document.querySelector('.app-shell').style.gridTemplateColumns=$('#sidebar').classList.contains('collapsed')?'76px 1fr':'220px 1fr'; };

  $$('.tab').forEach(btn=>btn.onclick=()=>{
    $$('.tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    $$('.tab-content').forEach(c=>c.classList.remove('active'));
    const id=btn.dataset.tab; const el=$(`#${id}Tab`); el.classList.add('active');
    if(id!=='orders') el.innerHTML=`<h3 style="margin:0 0 7px;color:#213b5b">${btn.textContent}</h3><p style="margin:0">Interactive placeholder for the ${btn.textContent.toLowerCase()} module.</p>`;
  });

  $('#globalSearch').addEventListener('input',e=>{renderOrders(e.target.value);renderTransactions(e.target.value);});

  $$('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());
  $('#newOrderBtn').onclick=()=>{const d=new Date();d.setDate(d.getDate()+10);$('#orderExpiry').value=iso(d);$('#orderDialog').showModal();};
  $('#addTransactionBtn').onclick=()=>$('#transactionDialog').showModal();
  $('#editRatesBtn').onclick=()=>{renderRatesChecklist();$('#ratesDialog').showModal();};

  $('#orderForm').addEventListener('submit',e=>{
    e.preventDefault();
    const order={id:Date.now(),type:$('#orderType').value,pair:$('#orderPair').value,side:$('#orderSide').value,amount:Number($('#orderAmount').value),rate:Number($('#orderRate').value),expiry:$('#orderExpiry').value,status:'Active'};
    state.orders.unshift(order); save(); renderOrders($('#globalSearch').value); $('#orderDialog').close(); toast('New FX order created');
  });
  $('#transactionForm').addEventListener('submit',e=>{
    e.preventDefault(); const tx={id:Date.now(),action:$('#txAction').value,currency:$('#txCurrency').value,amount:Number($('#txAmount').value),rate:Number($('#txRate').value),time:'Just now'};
    state.transactions.unshift(tx); save(); renderTransactions($('#globalSearch').value); $('#transactionDialog').close(); toast('Transaction added');
  });
  $('#ratesForm').addEventListener('submit',e=>{
    e.preventDefault(); const selected=[...$('#ratesChecklist').querySelectorAll('input:checked')].map(x=>x.value); if(!selected.length){toast('Select at least one currency pair');return;} state.watchlist=selected;save();renderRates();$('#ratesDialog').close();toast('Watchlist updated');
  });

  $('#refreshRates').onclick=refreshRates; $('#exposureUnit').onchange=renderExposure; $('#trendRange').onchange=renderTrend;
  $('#clearAlertsBtn').onclick=()=>{state.alerts=[];save();renderAlerts();toast('Alerts cleared');};
  $('#viewAllOrders').onclick=()=>{showView('Orders');toast('Orders module opened');};
  $('#viewAllTransactions').onclick=()=>{showView('Transactions');toast('Transactions module opened');};
  $('#notificationsBtn').onclick=()=>toast(state.alerts.length?`${state.alerts.length} active alert${state.alerts.length===1?'':'s'}`:'No active alerts');
  $('#helpBtn').onclick=()=>toast('Demo help: create orders, add transactions, refresh rates, edit the watchlist, search and navigate.');
  $('#profileBtn').onclick=()=>toast('Demo profile: John Smith · ACME Corp.');
  $('#accountManagerBtn').onclick=()=>toast('Account-manager contact flow would open here.');

  renderExposure(); renderTrend(); renderOrders(); renderRates(); renderTransactions(); renderAlerts(); updateTimestamp();
})();
