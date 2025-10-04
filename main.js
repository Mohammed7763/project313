// main frontend script: calls backend endpoints, renders charts and UI
const selectors = {
  yerCard: document.getElementById('yer-card'),
  iqdCard: document.getElementById('iqd-card'),
  irrCard: document.getElementById('irr-card'),
  sarCard: document.getElementById('sar-card'),
  ratesTable: document.getElementById('ratesTable'),
  timeNow: document.getElementById('timeNow'),
  convertBtn: document.getElementById('convertBtn'),
  convertResult: document.getElementById('convertResult'),
  amount: document.getElementById('amount'),
  from: document.getElementById('from'),
  to: document.getElementById('to'),
  currencyChartEl: document.getElementById('currencyChart'),
  goldChartEl: document.getElementById('goldChart'),
  goldOz: document.getElementById('gold-oz'),
  goldGram: document.getElementById('gold-gram'),
  silverOz: document.getElementById('silver-oz'),
  silverGram: document.getElementById('silver-gram'),
  notifEnable: document.getElementById('notifEnable'),
  themeToggle: document.getElementById('themeToggle'),
  downloadBtn: document.getElementById('downloadBtn'),
  year: document.getElementById('year')
};

selectors.year.textContent = new Date().getFullYear();

// utility
function fmt(v){
  return Number(v).toLocaleString('en-US',{maximumFractionDigits:4});
}

async function api(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error('شبكة');
  return res.json();
}

let prevRates = {};

async function fetchLatest(){
  try{
    const symbols = 'USD,YER,IQD,IRR,SAR';
    const data = await api(`/api/latest?base=USD&symbols=${symbols}`);
    if(data && data.rates){
      const r = data.rates;
      selectors.yerCard.textContent = fmt(r.YER || '—');
      selectors.iqdCard.textContent = fmt(r.IQD || '—');
      selectors.irrCard.textContent = fmt(r.IRR || '—');
      selectors.sarCard.textContent = fmt(r.SAR || '—');
      // table
      selectors.ratesTable.innerHTML = '';
      for(const key of Object.keys(r)){
        const tr = document.createElement('tr');
        const change = prevRates[key] ? (((r[key]-prevRates[key])/prevRates[key])*100).toFixed(2) + '%' : '—';
        tr.innerHTML = `<td class="p-2">${key}</td><td class="p-2">${fmt(r[key])}</td><td class="p-2">${change}</td>`;
        selectors.ratesTable.appendChild(tr);
        prevRates[key] = r[key];
      }
    }
  }catch(e){ console.error('fetchLatest',e); }
}

async function fetchMetals(){
  try{
    const data = await api('/api/metals');
    if(data && data.rates){
      if(data.rates.XAU){
        const usdPerOz = 1 / data.rates.XAU;
        selectors.goldOz.textContent = `$${usdPerOz.toFixed(2)}`;
        selectors.goldGram.textContent = `$${(usdPerOz/31.1034768).toFixed(2)}`;
      }
      if(data.rates.XAG){
        const usdPerOz = 1 / data.rates.XAG;
        selectors.silverOz.textContent = `$${usdPerOz.toFixed(2)}`;
        selectors.silverGram.textContent = `$${(usdPerOz/31.1034768).toFixed(2)}`;
      }
    }
  }catch(e){ console.error('fetchMetals',e); }
}

selectors.convertBtn.addEventListener('click', async ()=>{
  const amount = selectors.amount.value || 0;
  const from = selectors.from.value;
  const to = selectors.to.value;
  selectors.convertResult.textContent = 'جارٍ التحويل...';
  try{
    const data = await api(`/api/convert?from=${from}&to=${to}&amount=${amount}`);
    if(data && data.result!==undefined){
      selectors.convertResult.textContent = `النتيجة: ${fmt(data.result)} ${to}`;
    } else selectors.convertResult.textContent = 'خطأ في التحويل';
  }catch(e){ selectors.convertResult.textContent = 'فشل اتصال'; }
});

// Charts
let currencyChart = null;
let goldChart = null;

async function loadCurrencyHistory(symbol='YER', days=30){
  const end = new Date();
  const start = new Date(); start.setDate(end.getDate()-days);
  const startS = start.toISOString().slice(0,10);
  const endS = end.toISOString().slice(0,10);
  try{
    const data = await api(`/api/timeseries?start_date=${startS}&end_date=${endS}&base=USD&symbols=${symbol}`);
    if(data && data.rates){
      const labels = Object.keys(data.rates).sort();
      const values = labels.map(d => data.rates[d][symbol]);
      renderLineChart(selectors.currencyChartEl, labels, values, `${symbol} مقابل USD`, (chart)=> currencyChart = chart);
    }
  }catch(e){ console.error(e); }
}

async function loadGoldHistory(days=30){
  const end = new Date();
  const start = new Date(); start.setDate(end.getDate()-days);
  const startS = start.toISOString().slice(0,10);
  const endS = end.toISOString().slice(0,10);
  try{
    const data = await api(`/api/timeseries?start_date=${startS}&end_date=${endS}&base=USD&symbols=XAU`);
    if(data && data.rates){
      const labels = Object.keys(data.rates).sort();
      const values = labels.map(d => 1 / data.rates[d].XAU); // USD per oz
      renderLineChart(selectors.goldChartEl, labels, values, `سعر الذهب (USD/oz)`, (chart)=> goldChart = chart);
    }
  }catch(e){ console.error(e); }
}

function renderLineChart(canvas, labels, values, label, assign){
  const ctx = canvas.getContext('2d');
  if(assign && typeof assign === 'function' && canvas._chart) { canvas._chart.destroy(); }
  const chart = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[{ label, data:values, fill:false, tension:0.2 }]},
    options:{ responsive:true, plugins:{legend:{display:true}}, scales:{x:{display:true}, y:{display:true}} }
  });
  canvas._chart = chart;
  if(assign) assign(chart);
}

// Notifications
selectors.notifEnable.addEventListener('click', async ()=>{
  if(!('Notification' in window)) return alert('المتصفح لا يدعم الإشعارات');
  const perm = await Notification.requestPermission();
  if(perm==='granted') alert('تم تفعيل الإشعارات');
});

// Dark mode toggle
selectors.themeToggle.addEventListener('click', ()=>{
  const dark = document.documentElement.classList.toggle('dark');
  if(dark){
    document.body.classList.add('bg-slate-900','text-slate-100');
    selectors.themeToggle.textContent = 'وضع نهاري';
  } else {
    document.body.classList.remove('bg-slate-900','text-slate-100');
    selectors.themeToggle.textContent = 'وضع مظلم';
  }
});

// periodic updates
function updateTime(){ selectors.timeNow.textContent = new Date().toLocaleTimeString(); }
setInterval(updateTime, 1000);

async function init(){
  updateTime();
  await fetchLatest();
  await fetchMetals();
  await loadCurrencyHistory('YER',30);
  await loadGoldHistory(30);
  setInterval(()=>{ fetchLatest(); fetchMetals(); }, 30_000);
}

init();

// Download ZIP (server serves a static zip if exists)
selectors.downloadBtn.addEventListener('click', ()=>{
  // if the server provides a zip at /site.zip (not included by default), open it. Fallback: suggest to download from server root.
  window.open('/site.zip', '_blank');
});

// contact form
document.getElementById('contactForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  alert('تم استلام رسالتك (نسخة تجريبية).');
});
