// Next.js API route for /api/price (compatible with Vercel)
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { symbol, from = '', to = '' } = req.query;
    let pair = symbol;
    const fromU = from.toUpperCase();
    const toU = to.toUpperCase();
    if (!pair) {
      if (!fromU || !toU) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(400).json({ error: 'Provide symbol or from and to params' });
        return;
      }
      pair = `${fromU}${toU}`;
    }
    const candidates = [pair, `${pair}USDT`, `${pair}BUSD`, pair.replace('USDT', ''), pair.replace('BUSD', '')];
    let data = null;
    for (const cand of candidates) {
      if (!cand) continue;
      try {
        const url = `https://api.binance.com/api/v3/ticker/price?symbol=${cand}`;
        const resp = await fetch(url);
        if (resp.ok) {
          const json = await resp.json();
          if (json && json.price) {
            data = { symbol: json.symbol, price: json.price };
            break;
          }
        }
      } catch (e) {}
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (!data) {
      res.status(404).json({ error: 'Price not found for symbol' });
      return;
    }
    res.status(200).json(data);
  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: err.message });
  }
}
