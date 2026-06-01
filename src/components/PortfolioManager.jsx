import { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { ETFS, INTL_ETFS, CAT_LABELS, CAT_COLORS, REGION_LABELS, REGION_COLORS } from '../etfData'
import PortfolioModal from './PortfolioModal'

const ALL_ETFS = [...ETFS, ...INTL_ETFS]
const ETF_MAP  = Object.fromEntries(ALL_ETFS.map(e => [e.ticker, e]))

const fmtD = n => `$${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
const fmtP = n => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}%`

const PIE_COLORS_LIGHT = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#84cc16','#ec4899']
const PIE_COLORS_DARK  = ['#60a5fa','#34d399','#fbbf24','#a78bfa','#f87171','#22d3ee','#a3e635','#f9a8d4']

const TABS = ['保有銘柄', 'チャート', 'リバランス']
const REBAL_KEY = 'portfolio-targets-v1'

function loadTargets() {
  try { const d = localStorage.getItem(REBAL_KEY); return d ? JSON.parse(d) : {} } catch { return {} }
}

function exportCSV(enriched) {
  const BOM = '﻿'
  const header = ['ティッカー','銘柄名','株数','取得単価($)','現在値($)','評価額($)','損益($)','損益率(%)','年間配当見込み($)']
  const rows = enriched.map(h => [
    h.ticker,
    h.etf?.name ?? '',
    h.shares,
    h.avgCost.toFixed(2),
    h.currentPrice.toFixed(2),
    Math.round(h.currentValue),
    Math.round(h.pnl),
    h.pnlPct.toFixed(2),
    Math.round(h.annualDiv),
  ])
  const csv = BOM + [header, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `portfolio_${new Date().toLocaleDateString('ja-JP').replace(/\//g, '')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function PortfolioManager({ holdings, onSave, onDelete, prices, isDark }) {
  const [modal,     setModal]     = useState(null)
  const [allocView, setAllocView] = useState('category')
  const [tab,       setTab]       = useState(0)
  const [targets,   setTargets]   = useState(loadTargets)

  const pc = isDark ? PIE_COLORS_DARK : PIE_COLORS_LIGHT

  const enriched = useMemo(() => holdings.map(h => {
    const etf          = ETF_MAP[h.ticker]
    const currentPrice = prices[h.ticker]?.price ?? etf?.price ?? h.avgCost
    const costBasis    = h.avgCost * h.shares
    const currentValue = currentPrice * h.shares
    const pnl          = currentValue - costBasis
    const pnlPct       = costBasis > 0 ? (pnl / costBasis) * 100 : 0
    const annualDiv    = etf ? currentValue * ((etf.yield ?? 0) / 100) : 0
    return { ...h, etf, currentPrice, costBasis, currentValue, pnl, pnlPct, annualDiv }
  }).sort((a, b) => b.currentValue - a.currentValue), [holdings, prices])

  const totalValue = enriched.reduce((s, h) => s + h.currentValue, 0)
  const totalCost  = enriched.reduce((s, h) => s + h.costBasis, 0)
  const totalPnl   = totalValue - totalCost
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
  const totalDiv   = enriched.reduce((s, h) => s + h.annualDiv, 0)
  const portYield  = totalValue > 0 ? (totalDiv / totalValue) * 100 : 0

  const byCat = {}
  enriched.forEach(h => {
    const key = h.etf?.cat || h.etf?.region || 'other'
    byCat[key] = (byCat[key] || 0) + h.currentValue
  })
  const catData = Object.entries(byCat)
    .map(([k, v]) => ({ name: CAT_LABELS[k] || REGION_LABELS[k] || k, value: Math.round(v) }))
    .sort((a, b) => b.value - a.value)

  const tickerData = enriched.map(h => ({ name: h.ticker, value: Math.round(h.currentValue) }))
  const pieData    = allocView === 'category' ? catData : tickerData

  const pnlData = enriched.map(h => ({
    ticker: h.ticker, pnl: Math.round(h.pnl), pnlPct: parseFloat(h.pnlPct.toFixed(2)),
  }))

  const grid = isDark ? '#2d3f60' : '#e2e8f0'
  const text = isDark ? '#94a3b8' : '#64748b'

  const saveTargets = next => {
    setTargets(next)
    localStorage.setItem(REBAL_KEY, JSON.stringify(next))
  }

  const rebalRows = useMemo(() => enriched.map(h => {
    const actual  = totalValue > 0 ? h.currentValue / totalValue * 100 : 0
    const target  = targets[h.ticker] ?? actual
    const drift   = actual - target
    return { ...h, actual, target, drift }
  }), [enriched, totalValue, targets])

  const totalTarget = Object.values(targets).reduce((s, v) => s + v, 0)
  const unallocated = Math.max(0, 100 - totalTarget)

  const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const pct = totalValue > 0 ? (payload[0].value / totalValue * 100).toFixed(1) : 0
    return (
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
        <p style={{ fontWeight:700 }}>{payload[0].name}</p>
        <p>${payload[0].value.toLocaleString()} ({pct}%)</p>
      </div>
    )
  }

  return (
    <div className="portfolio-wrap">
      {/* ── Summary ── */}
      <div className="summary-cards">
        {[
          { label:'評価総額',             value:`$${Math.round(totalValue).toLocaleString()}`,          sub:`取得 $${Math.round(totalCost).toLocaleString()}`,       color:'#3b82f6' },
          { label:'総損益',               value:(totalPnl >= 0 ? '+' : '−') + fmtD(totalPnl),          sub:fmtP(totalPnlPct),                                       color: totalPnl >= 0 ? '#10b981' : '#ef4444' },
          { label:'年間配当見込み',       value:`$${Math.round(totalDiv).toLocaleString()}`,             sub:`月平均 $${Math.round(totalDiv / 12).toLocaleString()}`,  color:'#f59e0b' },
          { label:'ポートフォリオ利回り', value:`${portYield.toFixed(2)}%`,                             sub:`${holdings.length}銘柄`,                                color:'#8b5cf6' },
        ].map((c, i) => (
          <div key={i} className="summary-card">
            <div className="sc-label">{c.label}</div>
            <div className="sc-value" style={{ color: c.color }}>{c.value}</div>
            <div className="sc-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className="pm-tabs">
        {TABS.map((t, i) => (
          <button key={t} className={`pm-tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
        <div style={{ flex: 1 }} />
        {enriched.length > 0 && (
          <button className="pm-export-btn" onClick={() => exportCSV(enriched)} title="CSVエクスポート">
            ↓ CSV
          </button>
        )}
      </div>

      {/* ── Tab 0: 保有銘柄 ── */}
      {tab === 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">保有銘柄</h2>
            <button className="btn-save" onClick={() => setModal({ mode: 'add' })}>＋ 追加</button>
          </div>

          {enriched.length === 0 ? (
            <p className="empty-msg">まだ保有銘柄がありません。「＋ 追加」から登録してください。</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="table-wrap pm-table-desktop">
                <table className="etf-table">
                  <thead>
                    <tr>
                      <th>ティッカー</th><th>銘柄名</th><th>株数</th>
                      <th>取得単価</th><th>現在値</th><th>評価額</th>
                      <th>損益</th><th>損益率</th><th>構成比</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {enriched.map(h => {
                      const weight = totalValue > 0 ? h.currentValue / totalValue * 100 : 0
                      const isLive = !!prices[h.ticker]
                      return (
                        <tr key={h.id}>
                          <td><span className="etf-ticker">{h.ticker}</span></td>
                          <td className="td-name">{h.etf?.name ?? h.ticker}</td>
                          <td>{h.shares.toLocaleString()}</td>
                          <td>${h.avgCost.toFixed(2)}</td>
                          <td className={isLive ? 'td-live' : ''}>
                            ${h.currentPrice.toFixed(2)}
                            {isLive && (
                              <span className={`live-chg ${prices[h.ticker].changePct >= 0 ? 'pos' : 'neg'}`}>
                                {prices[h.ticker].changePct >= 0 ? '+' : ''}{prices[h.ticker].changePct.toFixed(2)}%
                              </span>
                            )}
                          </td>
                          <td style={{ fontWeight:700 }}>${Math.round(h.currentValue).toLocaleString()}</td>
                          <td className={`ytd-val ${h.pnl >= 0 ? 'pos' : 'neg'}`}>
                            {h.pnl >= 0 ? '+' : '−'}{fmtD(h.pnl)}
                          </td>
                          <td className={`ytd-val ${h.pnlPct >= 0 ? 'pos' : 'neg'}`}>{fmtP(h.pnlPct)}</td>
                          <td>
                            <div className="weight-bar-wrap">
                              <div className="weight-bar-fill" style={{ width:`${weight}%` }} />
                              <span className="weight-label">{weight.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td>
                            <div className="row-btns">
                              <button className="btn-edit"   onClick={() => setModal({ mode:'edit', holding: h })}>編集</button>
                              <button className="btn-delete" onClick={() => onDelete(h.id)}>削除</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="pm-mobile-cards">
                {enriched.map(h => {
                  const weight = totalValue > 0 ? h.currentValue / totalValue * 100 : 0
                  const isLive = !!prices[h.ticker]
                  return (
                    <div key={h.id} className="pm-mobile-card">
                      <div className="pm-mc-top">
                        <div>
                          <span className="etf-ticker">{h.ticker}</span>
                          <span className="pm-mc-name">{h.etf?.name ?? h.ticker}</span>
                        </div>
                        <div className="row-btns">
                          <button className="btn-edit"   onClick={() => setModal({ mode:'edit', holding: h })}>編集</button>
                          <button className="btn-delete" onClick={() => onDelete(h.id)}>削除</button>
                        </div>
                      </div>
                      <div className="pm-mc-grid">
                        <div className="pm-mc-cell">
                          <span className="pm-mc-label">評価額</span>
                          <span className="pm-mc-val" style={{ fontWeight:700 }}>${Math.round(h.currentValue).toLocaleString()}</span>
                        </div>
                        <div className="pm-mc-cell">
                          <span className="pm-mc-label">損益</span>
                          <span className={`pm-mc-val ytd-val ${h.pnl >= 0 ? 'pos':'neg'}`}>{h.pnl >= 0 ? '+':'-'}{fmtD(h.pnl)} ({fmtP(h.pnlPct)})</span>
                        </div>
                        <div className="pm-mc-cell">
                          <span className="pm-mc-label">現在値</span>
                          <span className="pm-mc-val">
                            ${h.currentPrice.toFixed(2)}
                            {isLive && (
                              <span className={`live-chg ${prices[h.ticker].changePct >= 0 ? 'pos':'neg'}`}>
                                {prices[h.ticker].changePct >= 0 ? '+':''}{prices[h.ticker].changePct.toFixed(2)}%
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="pm-mc-cell">
                          <span className="pm-mc-label">構成比</span>
                          <span className="pm-mc-val">{weight.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="weight-bar-wrap" style={{ marginTop:6 }}>
                        <div className="weight-bar-fill" style={{ width:`${weight}%`, maxWidth:'100%' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab 1: チャート ── */}
      {tab === 1 && enriched.length > 1 && (
        <div className="portfolio-charts">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">アロケーション</h2>
              <div style={{ display:'flex', gap:4 }}>
                {['category','ticker'].map(v => (
                  <button key={v} className={`etf-filter-btn${allocView === v ? ' active' : ''}`}
                    onClick={() => setAllocView(v)}>
                    {v === 'category' ? 'カテゴリ' : '銘柄別'}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                  dataKey="value" paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={pc[i % pc.length]} />)}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">銘柄別 損益</h2>
              <span className="card-sub">取得価額との比較</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={pnlData} margin={{ top:4, right:4, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="ticker" tick={{ fill:text, fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:text, fontSize:10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v >= 0 ? '' : '-'}${Math.abs(v) >= 1000 ? `${Math.round(Math.abs(v)/1000)}k` : Math.abs(v)}`}
                  width={42} />
                <Tooltip
                  formatter={(v, n) => n === 'pnl' ? [`$${v.toLocaleString()}`, '損益'] : [`${v}%`, '損益率']}
                  labelStyle={{ color:'var(--text)' }}
                  contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}
                />
                <Bar dataKey="pnl" radius={[4,4,0,0]}>
                  {pnlData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#10b981' : '#ef4444'} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && enriched.length <= 1 && (
        <div className="card"><p className="empty-msg">チャートは2銘柄以上から表示されます</p></div>
      )}

      {/* ── Tab 2: リバランス ── */}
      {tab === 2 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">リバランス管理</h2>
            <span className="card-sub">目標比率との乖離を確認</span>
          </div>

          {enriched.length === 0 ? (
            <p className="empty-msg">保有銘柄を追加するとリバランス分析が表示されます</p>
          ) : (
            <>
              <div className="rebal-hint">
                各銘柄の目標比率(%)を入力してください。未入力の場合は現在の比率が目標として表示されます。
                {totalTarget > 100 && (
                  <span className="rebal-over"> ⚠️ 合計{totalTarget.toFixed(1)}%（100%超過）</span>
                )}
              </div>
              <div className="rebal-table">
                <div className="rebal-header">
                  <span>銘柄</span>
                  <span>現在比率</span>
                  <span>目標比率</span>
                  <span>乖離</span>
                  <span>推奨アクション</span>
                </div>
                {rebalRows.map(h => {
                  const absDrift = Math.abs(h.drift)
                  const driftColor = absDrift <= 2 ? '#10b981' : absDrift <= 5 ? '#f59e0b' : '#ef4444'
                  const action = absDrift <= 1
                    ? '適正'
                    : h.drift > 0
                      ? `$${Math.round(Math.abs(h.drift/100 * totalValue)).toLocaleString()} 売り`
                      : `$${Math.round(Math.abs(h.drift/100 * totalValue)).toLocaleString()} 買い`
                  const actionColor = absDrift <= 1 ? '#10b981' : h.drift > 0 ? '#ef4444' : '#3b82f6'
                  return (
                    <div key={h.id} className="rebal-row">
                      <span className="etf-ticker">{h.ticker}</span>
                      <span className="rebal-actual">{h.actual.toFixed(1)}%</span>
                      <div className="rebal-target-input-wrap">
                        <input
                          type="number" min="0" max="100" step="0.5"
                          className="rebal-target-input"
                          value={targets[h.ticker] !== undefined ? targets[h.ticker] : ''}
                          placeholder={h.actual.toFixed(1)}
                          onChange={e => {
                            const v = e.target.value === '' ? undefined : Number(e.target.value)
                            const next = { ...targets }
                            if (v === undefined) delete next[h.ticker]
                            else next[h.ticker] = v
                            saveTargets(next)
                          }}
                        />
                        <span className="rebal-pct">%</span>
                      </div>
                      <span style={{ color: driftColor, fontWeight:700 }}>
                        {h.drift >= 0 ? '+' : ''}{h.drift.toFixed(1)}%
                      </span>
                      <span style={{ color: actionColor, fontSize:12, fontWeight:600 }}>{action}</span>
                    </div>
                  )
                })}
                {totalTarget > 0 && unallocated > 0 && (
                  <div className="rebal-unalloc">
                    未配分: <strong>{unallocated.toFixed(1)}%</strong>
                    （${Math.round(unallocated / 100 * totalValue).toLocaleString()}相当）
                  </div>
                )}
              </div>

              <div className="rebal-legend">
                <span style={{ color:'#10b981' }}>● 乖離±2%以内（適正）</span>
                <span style={{ color:'#f59e0b' }}>● 乖離2〜5%（要注意）</span>
                <span style={{ color:'#ef4444' }}>● 乖離5%超（要リバランス）</span>
              </div>
            </>
          )}
        </div>
      )}

      {modal && (
        <PortfolioModal
          modal={modal}
          onSave={data => { onSave(data); setModal(null) }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
