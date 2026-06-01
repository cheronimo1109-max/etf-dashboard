// Vercel Serverless Function — Yahoo Finance proxy
// Runs server-side: no CORS, proper User-Agent, cached responses

const YF_CHART = 'https://query2.finance.yahoo.com/v8/finance/chart/'
const YF_QUOTE = 'https://query1.finance.yahoo.com/v7/finance/quote'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

// ── Yahoo Finance crumb (cached per warm instance) ───────────
let _cache = { crumb: null, cookie: null, at: 0 }

async function getCrumb() {
  const now = Date.now()
  if (_cache.crumb && now - _cache.at < 4 * 60 * 1000) return _cache

  try {
    // 1. Get consent cookie
    const r1 = await fetch('https://finance.yahoo.com/', {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
    })
    const setCookies = r1.headers.getSetCookie?.() ?? []
    const cookie = setCookies.map(c => c.split(';')[0]).join('; ')

    // 2. Get crumb
    const r2 = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'User-Agent': UA, Cookie: cookie },
      signal: AbortSignal.timeout(5000),
    })
    const crumb = await r2.text()

    if (crumb && !crumb.includes('<')) {
      _cache = { crumb, cookie, at: now }
      return _cache
    }
  } catch (_) { /* crumb fetch failed, fall through */ }

  return { crumb: null, cookie: null }
}

// ── Fetch via v7 batch (with crumb) ─────────────────────────
async function fetchBatch(symbols, crumb, cookie) {
  const url = `${YF_QUOTE}?symbols=${symbols.map(encodeURIComponent).join(',')}&crumb=${encodeURIComponent(crumb)}`
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
      Cookie: cookie,
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`v7 ${res.status}`)
  const json = await res.json()
  const result = json?.quoteResponse?.result
  if (!result?.length) throw new Error('empty v7 response')
  return result
}

// ── Fetch via v8 chart (individual, no auth) ─────────────────
async function fetchChart(symbol) {
  const url = `${YF_CHART}${encodeURIComponent(symbol)}?interval=1m&range=1d&includePrePost=false`
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
      Referer: 'https://finance.yahoo.com/',
    },
    signal: AbortSignal.timeout(6000),
  })
  if (!res.ok) return null
  const json = await res.json()
  const meta = json?.chart?.result?.[0]?.meta
  if (!meta?.regularMarketPrice) return null
  return {
    symbol,
    regularMarketPrice:          meta.regularMarketPrice,
    regularMarketChangePercent:  meta.regularMarketChangePercent ?? 0,
    regularMarketChange:         meta.regularMarketChange ?? 0,
    regularMarketPreviousClose:  meta.chartPreviousClose ?? meta.previousClose,
    regularMarketDayHigh:        meta.regularMarketDayHigh,
    regularMarketDayLow:         meta.regularMarketDayLow,
    regularMarketVolume:         meta.regularMarketVolume,
  }
}

// ── Normalize quote to unified shape ─────────────────────────
function normalize(q) {
  return {
    price:     q.regularMarketPrice,
    changePct: q.regularMarketChangePercent ?? 0,
    change:    q.regularMarketChange ?? 0,
    prev:      q.regularMarketPreviousClose,
    high:      q.regularMarketDayHigh,
    low:       q.regularMarketDayLow,
    volume:    q.regularMarketVolume,
  }
}

// ── Handler ───────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { symbols } = req.query
  if (!symbols) return res.status(400).json({ error: 'symbols required' })

  const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean)
  const quotes = {}
  let method = 'v8'

  // ── Strategy 1: v7 batch with crumb ──────────────────────
  try {
    const { crumb, cookie } = await getCrumb()
    if (crumb) {
      const CHUNK = 20
      const chunks = []
      for (let i = 0; i < symbolList.length; i += CHUNK) {
        chunks.push(symbolList.slice(i, i + CHUNK))
      }
      const batches = await Promise.allSettled(
        chunks.map(c => fetchBatch(c, crumb, cookie))
      )
      batches.forEach(b => {
        if (b.status === 'fulfilled') {
          b.value.forEach(q => { quotes[q.symbol] = normalize(q) })
        }
      })
      if (Object.keys(quotes).length > 0) method = 'v7'
    }
  } catch (_) { /* fall through to v8 */ }

  // ── Strategy 2: v8 chart (per ticker, parallel) ───────────
  if (Object.keys(quotes).length === 0) {
    const missing = symbolList.filter(s => !quotes[s])
    const results = await Promise.allSettled(missing.map(fetchChart))
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value) {
        quotes[r.value.symbol] = normalize(r.value)
      }
    })
  } else {
    // Fill any gaps with v8
    const missing = symbolList.filter(s => !quotes[s])
    if (missing.length > 0) {
      const results = await Promise.allSettled(missing.map(fetchChart))
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value) {
          quotes[r.value.symbol] = normalize(r.value)
        }
      })
    }
  }

  const count = Object.keys(quotes).length
  if (count === 0) {
    return res.status(502).json({ error: 'Yahoo Finance unreachable' })
  }

  // Cache at CDN edge for 28s (updates ~every 30s)
  res.setHeader('Cache-Control', 's-maxage=28, stale-while-revalidate=60')
  res.status(200).json({ quotes, method, count, ts: Date.now() })
}
