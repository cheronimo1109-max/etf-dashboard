import { useState, useEffect } from 'react'
import { ETFS, INTL_ETFS, DEFAULT_MARKET, SAMPLE_HOLDINGS } from './etfData'
import { useMarketData } from './hooks/useMarketData'
import MarketOverview    from './components/MarketOverview'
import SectorChart       from './components/SectorChart'
import SectorRotation    from './components/SectorRotation'
import ETFWatchlist      from './components/ETFWatchlist'
import InternationalETFs from './components/InternationalETFs'
import PortfolioManager  from './components/PortfolioManager'
import BuySignals        from './components/BuySignals'
import PaperTrade        from './components/PaperTrade'
import AIAnalysis        from './components/AIAnalysis'
import './App.css'

const ALL_TICKERS = [...ETFS, ...INTL_ETFS].map(e => e.ticker)

function load(key, fb) {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fb } catch { return fb }
}

const SECTIONS = [
  { id: 'market',    label: 'マーケット',     icon: '📊' },
  { id: 'sector',    label: 'セクター',       icon: '🏭' },
  { id: 'global',    label: '世界ETF',       icon: '🌍' },
  { id: 'watchlist', label: 'ウォッチ',       icon: '👁' },
  { id: 'portfolio', label: 'ポートフォリオ', icon: '💼' },
  { id: 'ai',        label: 'AI分析',        icon: '🤖' },
  { id: 'papertrade',label: 'ペーパー取引',   icon: '📝' },
]

export default function App() {
  const [isDark,   setIsDark]   = useState(() => load('etf-dark', false))
  const [owned,    setOwned]    = useState(() => new Set(load('etf-owned', [])))
  const [section,  setSection]  = useState('market')
  const [holdings, setHoldings] = useState(() => load('etf-holdings', SAMPLE_HOLDINGS))

  const { market, setMarket, prices, liveStatus, lastUpdate, refetch } = useMarketData(
    load('etf-market', DEFAULT_MARKET),
    ALL_TICKERS
  )

  useEffect(() => { localStorage.setItem('etf-dark',     JSON.stringify(isDark))         }, [isDark])
  useEffect(() => { localStorage.setItem('etf-market',   JSON.stringify(market))         }, [market])
  useEffect(() => { localStorage.setItem('etf-owned',    JSON.stringify([...owned]))     }, [owned])
  useEffect(() => { localStorage.setItem('etf-holdings', JSON.stringify(holdings))       }, [holdings])

  const toggleOwned = t => setOwned(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n })

  const saveHolding = data => setHoldings(prev => {
    const idx = prev.findIndex(h => h.id === data.id)
    return idx >= 0 ? prev.map(h => h.id === data.id ? data : h) : [...prev, data]
  })
  const deleteHolding = id => setHoldings(prev => prev.filter(h => h.id !== id))

  const updateMarket = updated => setMarket(m => ({
    ...m, ...updated, lastUpdate: new Date().toLocaleString('ja-JP') + ' JST'
  }))

  const vixHigh   = market.vix >= 25
  const sp500Chg  = prices['^GSPC']?.changePct ?? market.sp500Change

  const liveDot = {
    live:    '🟢',
    demo:    '🟡',
    loading: '⏳',
    error:   '🔴',
  }[liveStatus] ?? '⏳'

  return (
    <div className={`root${isDark ? ' dark' : ''}`}>
      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <h1>📈 株ウォッチ</h1>
          <span className="header-sub">US ETF Investment Dashboard</span>
        </div>

        {/* Desktop nav */}
        <nav className="header-center">
          {SECTIONS.map(s => (
            <button key={s.id}
              className={`nav-btn${section === s.id ? ' active' : ''}`}
              onClick={() => setSection(s.id)}>
              {s.label}
            </button>
          ))}
        </nav>

        <div className="header-right">
          {vixHigh && <span className="vix-alert-badge">⚠️ VIX高</span>}

          <div className="header-market-quick">
            <span title={`${liveStatus === 'live' ? 'LIVE' : 'デモ'} ${lastUpdate?.toLocaleTimeString('ja-JP', { hour:'2-digit', minute:'2-digit' }) ?? ''}`}>
              {liveDot}
            </span>
            <span>
              VIX <strong style={{ color: market.vix >= 25 ? '#ef4444' : market.vix >= 20 ? '#f59e0b' : '#10b981' }}>
                {market.vix.toFixed(1)}
              </strong>
            </span>
            <span>10Y <strong>{market.yield10y.toFixed(2)}%</strong></span>
            {sp500Chg !== undefined && (
              <span>S&P <strong style={{ color: sp500Chg >= 0 ? '#10b981' : '#ef4444' }}>
                {sp500Chg >= 0 ? '+' : ''}{sp500Chg.toFixed(2)}%
              </strong></span>
            )}
          </div>

          <button className="btn-refresh" onClick={refetch} title="データ更新">↻</button>
          <button className="btn-theme"   onClick={() => setIsDark(d => !d)}>{isDark ? '☀️' : '🌙'}</button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="main">
        {section === 'market' && (
          <>
            <MarketOverview market={market} onUpdate={updateMarket} />
            <BuySignals market={market} isDark={isDark} />
          </>
        )}
        {section === 'sector' && (
          <>
            <SectorChart isDark={isDark} />
            <SectorRotation isDark={isDark} />
          </>
        )}
        {section === 'global' && (
          <InternationalETFs prices={prices} owned={owned} onToggleOwned={toggleOwned} isDark={isDark} />
        )}
        {section === 'watchlist' && (
          <ETFWatchlist owned={owned} onToggleOwned={toggleOwned} />
        )}
        {section === 'portfolio' && (
          <PortfolioManager
            holdings={holdings}
            onSave={saveHolding}
            onDelete={deleteHolding}
            prices={prices}
            isDark={isDark}
          />
        )}
        {section === 'ai' && (
          <AIAnalysis holdings={holdings} prices={prices} market={market} isDark={isDark} />
        )}
        {section === 'papertrade' && (
          <PaperTrade prices={prices} isDark={isDark} />
        )}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="bottom-nav">
        {SECTIONS.map(s => (
          <button key={s.id}
            className={`bottom-nav-btn${section === s.id ? ' active' : ''}`}
            onClick={() => setSection(s.id)}>
            <span className="bn-icon">{s.icon}</span>
            <span className="bn-label">{s.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
