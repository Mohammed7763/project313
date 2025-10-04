const express = require('express');
const fetch = require('node-fetch');
const LRU = require('lru-cache');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE = process.env.API_BASE || 'https://api.exchangerate.host';
const CACHE_TTL = Number(process.env.CACHE_TTL || 60); // seconds

app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const cache = new LRU({ max: 500, ttl: CACHE_TTL * 1000 });

async function cachedFetch(url){
  const key = url;
  const cached = cache.get(key);
  if(cached) return cached;
  const res = await fetch(url);
  const data = await res.json();
  cache.set(key, data);
  return data;
}

app.get('/api/latest', async (req, res) => {
  try{
    const symbols = req.query.symbols || 'USD,YER,IQD,IRR,SAR';
    const base = req.query.base || 'USD';
    const url = `${API_BASE}/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbols)}`;
    const data = await cachedFetch(url);
    res.json(data);
  }catch(e){ console.error(e); res.status(500).json({error: 'failed'}); }
});

app.get('/api/convert', async (req, res) => {
  try{
    const { from='USD', to='YER', amount=1 } = req.query;
    const url = `${API_BASE}/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`;
    const data = await cachedFetch(url);
    res.json(data);
  }catch(e){ console.error(e); res.status(500).json({error:'failed'}); }
});

app.get('/api/timeseries', async (req, res) => {
  try{
    const { start_date, end_date, base='USD', symbols='YER' } = req.query;
    if(!start_date || !end_date) return res.status(400).json({ error:'start_date and end_date required' });
    const url = `${API_BASE}/timeseries?start_date=${encodeURIComponent(start_date)}&end_date=${encodeURIComponent(end_date)}&base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbols)}`;
    const data = await cachedFetch(url);
    res.json(data);
  }catch(e){ console.error(e); res.status(500).json({error:'failed'}); }
});

app.get('/api/metals', async (req, res) => {
  try{
    // request XAU and XAG from exchangerate.host (returns rates like XAU per 1 USD)
    const url = `${API_BASE}/latest?base=USD&symbols=XAU,XAG`;
    const data = await cachedFetch(url);
    res.json(data);
  }catch(e){ console.error(e); res.status(500).json({error:'failed'}); }
});

// fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, ()=> console.log(`Server listening on http://localhost:${PORT}`));
