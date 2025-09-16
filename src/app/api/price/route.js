

// Simple in-memory cache for latest rates
const latestRates = {};

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function OPTIONS() {
  // Respond to CORS preflight
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    // Accept either symbol (e.g., BTCUSDT) or from/to (e.g., USDT,THB)
    const symbolParam = searchParams.get('symbol');
    let symbol = symbolParam;

    const from = (searchParams.get('from') || '').toUpperCase();
    const to = (searchParams.get('to') || '').toUpperCase();

    if (!symbol) {
      if (!from || !to) {
        return new Response(JSON.stringify({ error: 'Provide symbol or from and to params' }), { status: 400, headers: corsHeaders });
      }
      symbol = `${from}${to}`;
    }

    // Try common variants
    const candidates = [symbol, `${symbol}USDT`, `${symbol}BUSD`, symbol.replace('USDT', ''), symbol.replace('BUSD', '')];

    let data = null;
    for (const cand of candidates) {
      if (!cand) continue;
      try {
        const url = `https://api.binance.com/api/v3/ticker/price?symbol=${cand}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json && json.price) {
            data = { symbol: json.symbol, price: json.price };
            break;
          }
        }
      } catch (e) {
        // ignore and try next
      }
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Price not found for symbol' }), { status: 404, headers: corsHeaders });
    }

    // Save latest rate in cache
    latestRates[data.symbol] = { price: data.price, timestamp: Date.now() };

    return new Response(JSON.stringify({ symbol: data.symbol, price: data.price }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
