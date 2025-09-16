// Next.js App Router API route (Edge runtime)
export const runtime = "edge";

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// Main GET handler
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolParam = searchParams.get('symbol');
    let symbol = symbolParam;

    const from = (searchParams.get('from') || '').toUpperCase();
    const to = (searchParams.get('to') || '').toUpperCase();

    if (!symbol) {
      if (!from || !to) {
        return new Response(JSON.stringify({ error: 'Provide symbol or from/to params' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
      symbol = `${from}${to}`;
    }

    // Try common variants for Binance
    const candidates = [
      symbol,
      `${symbol}USDT`,
      `${symbol}BUSD`,
      symbol.replace('USDT', ''),
      symbol.replace('BUSD', ''),
    ];

    let data = null;
    for (const cand of candidates) {
      if (!cand) continue;
      try {
        const url = `https://api.binance.com/api/v3/ticker/price?symbol=${cand}`;
        // fetch ใน Edge runtime ใช้ built-in fetch ได้เลย
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json && json.price) {
            data = { symbol: json.symbol, price: json.price };
            break;
          }
        }
      } catch (e) {
        // ignore fetch error, try next candidate
      }
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Price not found for symbol' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
