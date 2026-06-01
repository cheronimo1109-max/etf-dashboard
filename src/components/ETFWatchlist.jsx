import { useState } from 'react'
import { ETFS, CAT_LABELS, CAT_COLORS } from '../etfData'

const CATS = ['all', 'broad', 'growth', 'dividend', 'sector', 'bond', 'commodity', 'intl']

export default function ETFWatchlist({ owned, onToggleOwned }) {
  const [filter, setFilter] = useState('all')
  const [sort,   setSort]   = useState({ key: 'ytd', dir: -1 })

  const displayed = ETFS
    .filter(e => filter === 'all' || e.cat === filter)
    .sort((a, b) => {
      const va = a[sort.key] ?? 0, vb = b[sort.key] ?? 0
      return (vb - va) * sort.dir
    })

  const toggleSort = (key) => {
    setSort(s => s.key === key ? { key, dir: -s.dir } : { key, dir: -1 })
  }

  const sortIcon = (key) => sort.key === key ? (sort.dir < 0 ? ' ↓' : ' ↑') : ''

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">ETF ウォッチリスト</h2>
        <span className="card-sub">★ をクリックで保有マーク</span>
      </div>

      {/* Category filter */}
      <div className="etf-filters">
        {CATS.map(c => (
          <button
            key={c}
            className={`etf-filter-btn${filter === c ? ' active' : ''}`}
            style={filter === c && c !== 'all' ? { background: CAT_COLORS[c], borderColor: CAT_COLORS[c], color:'#fff' } : undefined}
            onClick={() => setFilter(c)}
          >
            {c === 'all' ? 'すべて' : CAT_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="etf-table">
          <thead>
            <tr>
              <th></th>
              <th>ティッカー</th>
              <th>名称</th>
              <th>カテゴリ</th>
              <th className="th-sort" onClick={() => toggleSort('yield')}>配当利回り{sortIcon('yield')}</th>
              <th className="th-sort" onClick={() => toggleSort('exp')}>経費率{sortIcon('exp')}</th>
              <th className="th-sort" onClick={() => toggleSort('ytd')}>YTD{sortIcon('ytd')}</th>
              <th>AUM</th>
              <th>概要</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(e => {
              const isOwned = owned.has(e.ticker)
              return (
                <tr key={e.ticker} className={isOwned ? 'tr-owned' : ''}>
                  <td>
                    <button
                      className={`own-btn${isOwned ? ' owned' : ''}`}
                      onClick={() => onToggleOwned(e.ticker)}
                      title={isOwned ? '保有解除' : '保有マーク'}
                    >
                      {isOwned ? '★' : '☆'}
                    </button>
                  </td>
                  <td>
                    <span className="etf-ticker">{e.ticker}</span>
                    {isOwned && <span className="owned-badge">保有</span>}
                  </td>
                  <td className="td-name">{e.name}</td>
                  <td>
                    <span className="cat-badge" style={{ background: CAT_COLORS[e.cat] + '22', color: CAT_COLORS[e.cat], borderColor: CAT_COLORS[e.cat] + '44' }}>
                      {CAT_LABELS[e.cat]}
                    </span>
                  </td>
                  <td>
                    <span className="yld-val">{e.yield > 0 ? `${e.yield.toFixed(2)}%` : '—'}</span>
                  </td>
                  <td>
                    <span className={`exp-val ${e.exp >= 0.5 ? 'exp-high' : e.exp >= 0.2 ? 'exp-mid' : 'exp-low'}`}>
                      {e.exp.toFixed(2)}%
                    </span>
                  </td>
                  <td>
                    <span className={`ytd-val ${e.ytd >= 0 ? 'pos' : 'neg'}`}>
                      {e.ytd > 0 ? '+' : ''}{e.ytd.toFixed(1)}%
                    </span>
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
