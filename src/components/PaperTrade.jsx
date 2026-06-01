import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { ETFS, INTL_ETFS } from '../etfData'
import TradeModal from './TradeModal'

const ALL_ETFS = [...ETFS, ...INTL_ETFS]
const ETF_MAP  = Object.fromEntries(ALL_ETFS.map(e => [e.ticker, e]))

const INITIAL_CASH = 10000
const STORAGE_KEY  = 'paper-trade-v1'

function loadState() {
  try { const d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : null } catch { return null }
}

function freshState() {
  const now = new Date().toLocaleString('ja-JP', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })
  return {
    cash: INITIAL_CASH,
    positions: {},
    history: [],
    snapshots: [{ date: now, value: INITIAL_CASH }],
  }
}

const fmtD = n => `$${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
const fmtP = (n, digits = 2) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(digits)}%`

export default function PaperTrade({ prices, isDark }) {
  const [state,   setState]   = useState(() => loadState() || freshState())
  const [modal,   setModal]   = useState(null)
  const [confirm, setConfirm] = useState(false)

  const save = next => {
    setState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const handleTrade = (ticker, mode, shares) => {
    const price = prices[ticker]?.price ?? ETF_MAP[ticker]?.price ?? 100
    const total = shares * price
    const prev  = state
    let   next  = { ...prev }

    if (mode === 'buy') {
      const newCash = prev.cash - total
      if (newCash < -0.01) { setModal(null); return }
      const pos       = prev.positions[ticker]
      const newShares = (pos?.shares ?? 0) + shares
      const newAvgCost = pos
        ? ((pos.shares * pos.avgCost) + (shares * price)) / newShares
        : price
      next = { ...prev, cash: newCash, positions: { ...prev.positions, [ticker]: { shares: newShares, avgCost: newAvgCost } } }
    } else {
      const pos = prev.positions[ticker]
      if (!pos || shares > pos.shares + 0.00001) { setModal(null); return }
      const newCash     = prev.cash + total
      const newShares   = pos.shares - shares
      const newPositions = { ...prev.positions }
      if (newShares < 0.0001) delete newPositions[ticker]
      else newPositions[ticker] = { ...pos, shares: newShares }
      next = { ...prev, cash: newCash, positions: newPositions }
    }

    const portValue = Object.entries(next.positions).reduce((s, [t, p]) => {
      const px = prices[t]?.price ?? ETF_MAP[t]?.price ?? 100
      return s + p.shares * px
    }, 0)
    const totalValue = next.cash + portValue

    const dateStr = new Date().toLocaleString('ja-JP', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })
    const trade = {
      id: crypto.randomUUID(),
      date: dateStr,
      type: mode,
      ticker,
      shares:    parseFloat(shares.toFixed(4)),
      price:     parseFloat(price.toFixed(2)),
      total:     parseFloat(total.toFixed(2)),
      cashAfter: parseFloat(next.cash.toFixed(2)),
    }
    const snapshot = { date: dateStr, value: parseFloat(totalValue.toFixed(2)) }

    save({
      ...next,
      history:   [trade, ...prev.history].slice(0, 50),
      snapshots: [...prev.snapshots, snapshot].slice(-30),
    })
    setModal(null)
  }

  const handleReset = () => {
    save(freshState())
    setConfirm(false)
  }

  const enriched = useMemo(() =>
    Object.entries(state.positions).map(([ticker, pos]) => {
      const price        = prices[ticker]?.price ?? ETF_MAP[ticker]?.price ?? pos.avgCost
      const currentValue = price * pos.shares
      const costBasis    = pos.avgCost * pos.shares
      const pnl          = currentValue - costBasis
      const pnlPct       = costBasis > 0 ? (pnl / costBasis) * 100 : 0
      return { ticker, ...pos, price, currentValue, costBasis, pnl, pnlPct }
    }).sort((a, b) => b.currentValue - a.currentValue),
  [state.positions, prices])

  const portValue  = enriched.reduce((s, p) => s + p.currentValue, 0)
  const totalValue = state.cash + portValue
  const totalPnl   = totalValue - INITIAL_CASH
  const totalPnlPct = (totalPnl / INITIAL_CASH) * 100

  const grid = isDark ? '#2d3f60' : '#e2e8f0'
  const text = isDark ? '#94a3b8' : '#64748b'
  const areaFill = totalPnl >= 0 ? (isDark ? '#34d399' : '#10b981') : (isDark ? '#f87171' : '#ef4444')

  const CustomAreaTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const v   = payload[0].value
    const pnl = v - INITIAL_CASH
    return (
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
        <p style={{ color:'var(--muted)', marginBottom:3 }}>{label}</p>
        <p style={{ fontWeight:700, color:'var(--text)' }}>${v.toLocaleString()}</p>
        <p style={{ color: pnl >= 0 ? 'var(--green)' : 'var(--red)', fontSize:11 }}>
          {pnl >= 0 ? '+' : '−'}${Math.abs(pnl).toFixed(2)}
        </p>
      </div>
    )
  }

  return (
    <div className="pt-wrap">
      {/* ── Summary ── */}
      <div className="summary-cards">
        {[
          { label: '現金残高',       value: `$${state.cash.toLocaleString('en-US',{maximumFractionDigits:2})}`,   sub: `初期 $${INITIAL_CASH.toLocaleString()}`,   color: '#3b82f6' },
          { label: 'ポートフォリオ評価額', value: `$${Math.round(portValue).toLocaleString()}`,                    sub: `${enriched.length}銘柄保有`,              color: '#8b5cf6' },
          { label: '総資産',         value: `$${Math.round(totalValue).toLocaleString()}`,                        sub: '',                                        color: '#0ea5e9' },
          {
            label: '損益',
            value: (totalPnl >= 0 ? '+' : '−') + fmtD(totalPnl),
            sub:   fmtP(totalPnlPct),
            color: totalPnl >= 0 ? '#10b981' : '#ef4444',
          },
        ].map((c, i) => (
          <div key={i} className="summary-card">
            <div className="sc-label">{c.label}</div>
            <div className="sc-value" style={{ color: c.color, fontSize: 18 }}>{c.value}</div>
            <div className="sc-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── P&L trend chart ── */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">総資産推移</h2>
          <span className="card-sub">{state.snapshots.length}ポイント</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={state.snapshots} margin={{ top:4, right:4, left:0, bottom:0 }}>
            <defs>
              <linearGradient id="ptGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={areaFill} stopOpacity={0.3} />
                <stop offset="95%" stopColor={areaFill} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="date" tick={{ fill:text, fontSize:10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis
              tick={{ fill:text, fontSize:10 }} axisLine={false} tickLine={false}
              width={52}
              tickFormatter={v => `$${v >= 1000 ? `${Math.round(v/1000)}k` : v}`}
              domain={['auto', 'auto']}
            />
            <ReferenceLine y={INITIAL_CASH} stroke={isDark ? '#4b6285' : '#94a3b8'} strokeDasharray="4 3" label={{ value:'元本', fill:text, fontSize:10, position:'right' }} />
            <Tooltip content={<CustomAreaTooltip />} />
            <Area type="monotone" dataKey="value" stroke={areaFill} strokeWidth={2} fill="url(#ptGrad)" dot={false} activeDot={{ r:4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Positions ── */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">保有ポジション</h2>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn-buy-sm"  onClick={() => setModal({ mode:'buy'  })}>＋ 買い</button>
            <button className="btn-sell-sm" onClick={() => setModal({ mode:'sell' })}>− 売り</button>
          </div>
        </div>

        {enriched.length === 0 ? (
          <p className="empty-msg">保有ポジションなし。「買い」から取引を開始してください。</p>
        ) : (
          <div className="table-wrap">
            <table className="etf-table">
              <thead>
                <tr>
                  <th>ティッカー</th><th>株数</th><th>取得単価</th>
                  <th>現在値</th><th>評価額</th><th>損益</th><th>損益率</th><th></th>
                </tr>
              </thead>
              <tbody>
                {enriched.map(p => (
                  <tr key={p.ticker}>
                    <td><span className="etf-ticker">{p.ticker}</span></td>
                    <td>{p.shares.toFixed(4)}</td>
                    <td>${p.avgCost.toFixed(2)}</td>
                    <td className={prices[p.ticker] ? 'td-live' : ''}>
                      ${p.price.toFixed(2)}
                      {prices[p.ticker] && (
                        <span className={`live-chg ${prices[p.ticker].changePct >= 0 ? 'pos' : 'neg'}`}>
                          {prices[p.ticker].changePct >= 0 ? '+' : ''}{prices[p.ticker].changePct.toFixed(2)}%
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight:700 }}>${Math.round(p.currentValue).toLocaleString()}</td>
                    <td className={`ytd-val ${p.pnl >= 0 ? 'pos' : 'neg'}`}>
                      {p.pnl >= 0 ? '+' : '−'}{fmtD(p.pnl)}
                    </td>
                    <td className={`ytd-val ${p.pnlPct >= 0 ? 'pos' : 'neg'}`}>{fmtP(p.pnlPct)}</td>
                    <td>
                      <div className="row-btns">
                        <button className="btn-buy-sm"  onClick={() => setModal({ mode:'buy',  ticker: p.ticker })}>買い</button>
                        <button className="btn-sell-sm" onClick={() => setModal({ mode:'sell', ticker: p.ticker })}>売り</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Trade history ── */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">取引履歴</h2>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span className="card-sub">{state.history.length}件</span>
            <button className="btn-cancel" style={{ fontSize:12, padding:'4px 12px', minHeight:32 }}
              onClick={() => setConfirm(true)}>
              リセット
            </button>
          </div>
        </div>

        {state.history.length === 0 ? (
          <p className="empty-msg">取引履歴がありません</p>
        ) : (
          <div className="table-wrap">
            <table className="etf-table">
              <thead>
                <tr>
                  <th>日時</th><th>種別</th><th>ティッカー</th>
                  <th>株数</th><th>単価</th><th>合計</th><th>現金残</th>
                </tr>
              </thead>
              <tbody>
                {state.history.map(t => (
                  <tr key={t.id}>
                    <td style={{ color:'var(--muted)', fontSize:11 }}>{t.date}</td>
                    <td>
                      <span className={`trade-badge ${t.type}`}>
                        {t.type === 'buy' ? '買い' : '売り'}
                      </span>
                    </td>
                    <td><span className="etf-ticker">{t.ticker}</span></td>
                    <td>{t.shares}</td>
                    <td>${t.price.toLocaleString()}</td>
                    <td style={{ fontWeight:700 }}>${t.total.toLocaleString()}</td>
                    <td style={{ color:'var(--muted)' }}>${t.cashAfter.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── TradeModal ── */}
      {modal && (
        <TradeModal
          modal={modal}
          cash={state.cash}
          positions={state.positions}
          prices={prices}
          onTrade={handleTrade}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Reset confirm ── */}
      {confirm && (
        <div className="modal-backdrop" onClick={() => setConfirm(false)}>
          <div className="modal" style={{ maxWidth:360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>ペーパートレードをリセット</h2>
              <button className="modal-close" onClick={() => setConfirm(false)}>✕</button>
            </div>
            <div style={{ padding:'16px 24px 24px' }}>
              <p style={{ fontSize:14, color:'var(--muted)', marginBottom:20, lineHeight:1.6 }}>
                全ての取引履歴・ポジション・スナップショットが削除されます。
                仮想資金が $10,000 にリセットされます。この操作は取り消せません。
              </p>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setConfirm(false)}>キャンセル</button>
                <button style={{ padding:'9px 22px', border:'none', borderRadius:8, background:'var(--red)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
                  onClick={handleReset}>
                  リセット実行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
