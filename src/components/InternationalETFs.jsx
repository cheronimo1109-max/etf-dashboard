import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { INTL_ETFS, REGION_LABELS, REGION_COLORS } from '../etfData'

const REGIONS = ['all', ...Object.keys(REGION_LABELS)]

export default function InternationalETFs({ prices, owned, onToggleOwned, isDark }) {
  const [region, setRegion] = useState('all')
  const [sort,   setSort]   = useState({ key: 'ytd', dir: -1 })

  const filtered = INTL_ETFS
    .filter(e => region === 'all' || e.region === region)
    .sort((a, b) => ((b[sort.key] ?? 0) - (a[sort.key] ?? 0)) * sort.dir)

  // Regional average YTD
  const regionPerf = Object.entries(
    INTL_ETFS.reduce((acc, e) => { (acc[e.region] ??= []).push(e.ytd); return acc }, {})
  ).map(([r, vals]) => ({
    label: REGION_LABELS[r] ?? r,
    avg:   parseFloat((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1)),
    color: REGION_COLORS[r] ?? '#94a3b8',
  })).sort((a, b) => b.avg - a.avg)

  const th = (key, label) => (
    <th className="th-sort" onClick={() => setSort(s => s.key === key ? { key, dir: -s.dir } : { key, dir: -1 })}>
      {label}{sort.key === key ? (sort.dir < 0 ? ' ↓' : ' ↑') : ''}
    </th>
  )

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">世界・各国 ETF</h2>
        <span className="card-sub">国際分散投資ガイド</span>
      </div>

      {/* Region bar chart */}
      <p className="section-label">地域別 平均 YTD リターン</p>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={regionPerf} margin={{ top:0, right:4, left:0, bottom:32 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2d3f60' : '#e2e8f0'} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize:10 }}
            axisLine={false} tickLine={false} angle={-20} textAnchor="end" />
          <YAxis tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize:10 }}
            axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={30} />
          <Tooltip formatter={v => [`${v}%`, '平均YTD']} />
          <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
            {regionPerf.map((d, i) => <Cell key={i} fill={d.color} opacity={0.85} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Region filter */}
      <div className="etf-filters" style={{ marginTop: 16 }}>
        {REGIONS.filter(r => r === 'all' || INTL_ETFS.some(e => e.region === r)).map(r => (
          <button key={r}
            className={`etf-filter-btn${region === r ? ' active' : ''}`}
            style={region === r && r !== 'all' ? { background: REGION_COLORS[r], borderColor: REGION_COLORS[r], color: '#fff' } : undefined}
            onClick={() => setRegion(r)}>
            {r === 'all' ? 'すべて' : REGION_LABELS[r] ?? r}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table className="etf-table">
          <thead>
            <tr>
              <th></th>
              <th>ティッカー</th>
              <th>名称</th>
              <th>地域</th>
              {th('yield', '配当利回り')}
              {th('exp',   '経費率')}
              {th('ytd',   'YTD')}
              <th>現在値</th>
              <th>AUM</th>
              <th>概要</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => {
              const live     = prices[e.ticker]
              const isOwned  = owned?.has(e.ticker)
              return (
                <tr key={e.ticker} className={isOwned ? 'tr-owned' : ''}>
                  <td>
                    <button className={`own-btn${isOwned ? ' owned' : ''}`}
                      onClick={() => onToggleOwned?.(e.ticker)}>
                      {isOwned ? '★' : '☆'}
                    </button>
                  </td>
                  <td>
                    <span className="etf-ticker">{e.ticker}</span>
                    {isOwned && <span className="owned-badge">保有</span>}
                  </td>
                  <td className="td-name">{e.name}</td>
                  <td>
                    <span className="cat-badge"
                      style={{ background: REGION_COLORS[e.region] + '22', color: REGION_COLORS[e.region], borderColor: REGION_COLORS[e.region] + '44' }}>
                      {REGION_LABELS[e.region] ?? e.region}
                    </span>
                  </td>
                  <td><span className="yld-val">{e.yield > 0 ? `${e.yield.toFixed(2)}%` : '—'}</span></td>
                  <td><span className={`exp-val ${e.exp >= 0.5 ? 'exp-high' : e.exp >= 0.2 ? 'exp-mid' : 'exp-low'}`}>{e.exp.toFixed(2)}%</span></td>
                  <td><span className={`ytd-val ${e.ytd >= 0 ? 'pos' : 'neg'}`}>{e.ytd > 0 ? '+' : ''}{e.ytd.toFixed(1)}%</span></td>
                  <td>
                    {live ? (
                      <span className="td-live">
                        ${live.price.toFixed(2)}
                        <span className={`live-chg ${live.changePct >= 0 ? 'pos' : 'neg'}`}>
                          {live.changePct >= 0 ? '+' : ''}{live.changePct.toFixed(2)}%
                        </span>
                      </span>
                    ) : (
                      <span className="td-aum">${e.price?.toFixed(2) ?? '—'}</span>
                    )}
                  </td>
                  <td className="td-aum">{e.aum}</td>
                  <td className="td-memo">{e.memo}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
