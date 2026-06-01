import { useState, useEffect, useRef, useCallback } from 'react'

const REFRESH_MS   = 30_000
const API_ROUTE    = '/api/quotes'

// ── CORS proxy fallback (local dev / API route unavailable) ──
const YF_V8 = 'https://query2.finance.yahoo.com/v8/finance/chart/'
const PROXIES = [
  {
    build: url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    parse: json => JSON.parse(json.contents),
  },
  {
    build: url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    parse: json => json,
  },
]

async function fetchViaAPIRoute(symbols) {
  const res = await fetch(`${API_ROUTE}?symbols=${symbols.join(',')}`, {
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const json = await res.json()
  if (!json.quotes || json.count === 0) throw new Error('empty')
  return json.quotes // { symbol: { price, changePct, ... } }
}

async function fetchSingleV8(symbol) {
  const url = `${YF_V8}${encodeURIComponent(symbol)}?interval=1m&range=1d`
  for (const proxy of PROXIES) {
    try {
      const res = await fetch(proxy.build(url), { signal: AbortSignal.timeout(8000) })
      if (!res.ok) continue
      const raw  = await res.json()
      const data = proxy.parse(raw)
      const meta = data?.chart?.result?.[0]?.meta
      if (!meta?.regularMarketPrice) continue
      return {
        price:     meta.regularMarketPrice,
        changePct: meta.regularMarketChangePercent ?? 0,
        change:    meta.regularMarketChange ?? 0,
        prev:      meta.chartPreviousClose ?? meta.previousClose,
        high:      meta.regularMarketDayHigh,
        low:       meta.regularMarketDayLow,
      }
    } catch { continue }
  }
  return null
}

// Fallback: fetch core market indicators individually via CORS proxy
async function fetchViaProxyFallback(symbols) {
  const results = await Promise.allSettled(symbols.map(fetchSingleV8))
  const map = {}
  symbols.forEach((sym, i) => {
    const r = results[i]
    if (r.status === 'fulfilled' && r.value) map[sym] = r.value
  })
  return map
}

// ─────────────────────────────────────────────────────────────
export function useMarketData(initMarket, etfTickers = []) {
  const [market,     setMarket]     = useState(initMarket)
  const [prices,     setPrices]     = useState({})
  const [liveStatus, setLiveStatus] = useState('loading')
  const [lastUpdate, setLastUpdate] = useState(null)
  const [fetchMethod, setFetchMethod] = useState(null)
  const timer = useRef(null)

  const allSymbols = ['^VIX', '^TNX', '^GSPC', ...etfTickers]

  const doFetch = useCallback(async () => {
    let map = {}
    let newStatus = 'error'
    let method = null

    // ── Try Vercel API route (production) ────────────────────
    try {
      map = await fetchViaAPIRoute(allSymbols)
      newStatus = 'live'
      method = 'api'
    } catch (err) {
      console.warn('[useMarketData] API route failed:', err.message)

      // ── Fallback: CORS proxy with v8 chart API (local dev) ──
      try {
        const coreSymbols = ['^VIX', '^TNX', '^GSPC', ...etfTickers.slice(0, 20)]
        map = await fetchViaProxyFallback(coreSymbols)
        if (Object.keys(map).length > 0) {
          newStatus = 'live'
          method = 'proxy'
        }
      } catch (err2) {
        console.warn('[useMarketData] proxy fallback failed:', err2.message)
      }
    }

    if (Object.keys(map).length > 0) {
      setMarket(prev => ({
        ...prev,
        ...(map['^VIX']  ? { vix:         map['^VIX'].price   } : {}),
        ...(map['^TNX']  ? { yield10y:    map['^TNX'].price   } : {}),
        ...(map['^GSPC'] ? { sp500Change: map['^GSPC'].changePct } : {}),
        lastUpdate: new Date().toLocaleString('ja-JP'),
      }))
      setPrices(map)
      setLiveStatus(newStatus)
      setFetchMethod(method)
    } else {
      setLiveStatus(s => s === 'loading' ? 'demo' : 'error')
    }

    setLastUpdate(new Date())
  }, [allSymbols.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    doFetch()
    timer.current = setInterval(doFetch, REFRESH_MS)
    return () => clearInterval(timer.current)
  }, [doFetch])

  return { market, setMarket, prices, liveStatus, lastUpdate, fetchMethod, refetch: doFetch }
}
