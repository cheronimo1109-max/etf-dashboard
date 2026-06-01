import { useState } from 'react'
import VixGauge from './VixGauge'

const MATRIX = [
  // [vixHigh, yieldHigh, label, stars, color, advice]
  [false, false, '強気相場',     3, '#10b981', 'グロースETFを積極的に積み立て'],
  [false, true,  '割高に注意',   2, '#eab308', '高配当・バリュー株ETFを優先'],
  [true,  false, '絶好の買い時', 5, '#3b82f6', 'VIX高時は歴史的な買いチャンス'],
  [true,  true,  '最高の仕込み時',5,'#6366f1','恐怖×高利回り＝長期最適タイミング'],
]

export default function MarketOverview({ market, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ vix: market.vix, yield10y: market.yield10y })

  const vixHigh   = market.vix > 20
  const yieldHigh = market.yield10y > 4.0
  const cell      = MATRIX.find(r => r[0] === vixHigh && r[1] === yieldHigh)

  const commit = () => {
    onUpdate({ vix: Number(form.vix), yield10y: Number(form.yield10y) })
    setEditing(false)
  }

  return (
    <div className="market-overview">
      {/* VIX Gauge */}
      <div className="card mo-vix">
        <div className="card-header">
          <h2 className="card-title">VIX 恐怖指数</h2>
          <button className="btn-text" onClick={() => { setForm({ vix: market.vix, yield10y: market.yield10y }); setEditing(true) }}>
            更新
          </button>
        </div>
        <VixGauge value={market.vix} />
        <p className="mo-update">最終更新: {market.lastUpdate}</p>
      </div>

      {/* 10Y Yield */}
      <div className="card mo-yield">
        <div className="card-header">
          <h2 className="card-title">米10年国債利回り</h2>
        </div>
        <div className="yield-display">
          <span className="yield-value" style={{ color: yieldHigh ? '#ef4444' : '#10b981' }}>
            {market.yield10y.toFixed(2)}
            <span className="yield-unit">%</span>
          </span>
          <span className={`yield-badge ${yieldHigh ? 'high' : 'low'}`}>
            {yieldHigh ? '高金利圏' : '低金利圏'}
          </span>
        </div>
        <div className="yield-context">
          <div className="yc-row">
            <span>基準閾値</span><span>4.00%</span>
          </div>
          <div className="yc-row">
            <span>現在</span>
            <span style={{ color: yieldHigh ? '#ef4444' : '#10b981', fontWeight:700 }}>
              {market.yield10y.toFixed(2)}%
            </span>
          </div>
          <div className="yc-row">
            <span>株式への影響</span>
            <span>{yieldHigh ? '逆風（割引率↑）' : '追い風（割引率↓）'}</span>
          </div>
        </div>
        <div className="yield-bar-track">
          <div className="yield-bar-fill" style={{
            width: `${Math.min(market.yield10y / 6 * 100, 100)}%`,
            background: yieldHigh ? '#ef4444' : '#10b981',
          }} />
          <div className="yield-bar-mark" style={{ left: `${4/6*100}%` }} />
        </div>
        <div className="yield-bar-labels"><span>0%</span><span>4%基準</span><span>6%</span></div>
      </div>

      {/* Buy Signal Matrix */}
      <div className="card mo-matrix">
        <div className="card-header">
          <h2 className="card-title">VIX×金利 買い判定</h2>
          <span className="card-sub">2×2マトリクス</span>
        </div>
        <div className="matrix-grid">
          {MATRIX.map((row, i) => {
            const isActive = row[0] === vixHigh && row[1] === yieldHigh
            return (
              <div key={i} className={`matrix-cell${isActive ? ' matrix-active' : ''}`}
                style={{ '--mc': row[4] }}>
                <div className="mc-axes">
                  <span className={`mc-tag ${row[0] ? 'danger' : 'safe'}`}>VIX {row[0] ? '高' : '低'}</span>
                  <span className={`mc-tag ${row[1] ? 'danger' : 'safe'}`}>金利 {row[1] ? '高' : '低'}</span>
                </div>
                <div className="mc-label" style={{ color: isActive ? row[4] : undefined }}>{row[2]}</div>
                <div className="mc-stars">{'★'.repeat(row[3])}{'☆'.repeat(5 - row[3])}</div>
                {isActive && <div className="mc-advice">{row[5]}</div>}
              </div>
            )
          })}
        </div>
        <div className="matrix-current" style={{ background: cell[4] + '22', borderColor: cell[4] }}>
          <span className="mc-now-label">現在の判定</span>
          <span className="mc-now-value" style={{ color: cell[4] }}>{cell[2]}</span>
          <span className="mc-now-stars" style={{ color: cell[4] }}>{'★'.repeat(cell[3])}</span>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(false)}>
          <div className="modal" style={{ maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>マーケットデータを更新</h2>
              <button className="modal-close" onClick={() => setEditing(false)}>✕</button>
            </div>
            <form style={{ padding: '16px 24px 24px', display:'flex', flexDirection:'column', gap:14 }}
              onSubmit={e => { e.preventDefault(); commit() }}>
              <div className="form-group">
                <label>VIX 指数</label>
                <input type="number" step="0.01" min="5" max="100"
                  value={form.vix} onChange={e => setForm(f => ({ ...f, vix: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>米10年国債利回り（%）</label>
                <input type="number" step="0.01" min="0" max="15"
                  value={form.yield10y} onChange={e => setForm(f => ({ ...f, yield10y: e.target.value }))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setEditing(false)}>キャンセル</button>
                <button type="submit" className="btn-save">更新</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
