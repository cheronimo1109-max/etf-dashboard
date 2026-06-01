import { SECTORS, CYCLE_PHASES, CURRENT_CYCLE_PHASE } from '../etfData'

const VAL_CONFIG = {
  low:  { label:'割安', bg:'#dcfce7', text:'#166534', darkBg:'#14532d', darkText:'#86efac' },
  fair: { label:'適正', bg:'#fef9c3', text:'#854d0e', darkBg:'#422006', darkText:'#fde047' },
  high: { label:'割高', bg:'#fee2e2', text:'#991b1b', darkBg:'#450a0a', darkText:'#fca5a5' },
}

export default function SectorRotation({ isDark }) {
  return (
    <div className="sector-row">
      {/* Rotation Wheel */}
      <div className="card rotation-card">
        <div className="card-header">
          <h2 className="card-title">セクターローテーション</h2>
          <span className="card-sub">景気サイクルマップ</span>
        </div>

        <div className="cycle-container">
          <div className="cycle-ring">
            <div className="cycle-arrow">↻</div>
            <div className="cycle-center-label">景気サイクル</div>
          </div>

          {CYCLE_PHASES.map((phase) => {
            const active = phase.id === CURRENT_CYCLE_PHASE
            const rad    = phase.angle * (Math.PI / 180)
            const x      = 50 + 38 * Math.cos(rad)
            const y      = 50 + 38 * Math.sin(rad)
            return (
              <div
                key={phase.id}
                className={`cycle-phase${active ? ' cycle-active' : ''}`}
                style={{
                  left: `${x}%`,
                  top:  `${y}%`,
                  '--pc': phase.color,
                }}
              >
                <div className="cp-label">{phase.label}</div>
                <div className="cp-sectors">
                  {phase.sectors.map(s => <span key={s}>{s}</span>)}
                </div>
                {active && <div className="cp-now">← 現在</div>}
              </div>
            )
          })}
        </div>

        <div className="cycle-legend">
          {CYCLE_PHASES.map(p => (
            <div key={p.id} className={`cl-item${p.id === CURRENT_CYCLE_PHASE ? ' cl-active' : ''}`}>
              <span className="cl-dot" style={{ background: p.color }} />
              <div>
                <div className="cl-name">{p.label}</div>
                <div className="cl-desc">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Valuation Heatmap */}
      <div className="card heatmap-card">
        <div className="card-header">
          <h2 className="card-title">セクター割安/割高ヒートマップ</h2>
          <span className="card-sub">PERベース評価</span>
        </div>
        <div className="heatmap-grid">
          {SECTORS.map(s => {
            const cfg = VAL_CONFIG[s.valuation]
            return (
              <div key={s.id} className="hm-cell"
                style={{
                  background: isDark ? cfg.darkBg : cfg.bg,
                  color:      isDark ? cfg.darkText : cfg.text,
                }}>
                <div className="hm-etf">{s.etf}</div>
                <div className="hm-name">{s.name.length > 6 ? s.name.slice(0,6) : s.name}</div>
                <div className="hm-val">{cfg.label}</div>
                <div className="hm-pe">PER {s.pe}×</div>
              </div>
            )
          })}
        </div>
        <div className="heatmap-legend">
          {Object.entries(VAL_CONFIG).map(([k, v]) => (
            <div key={k} className="hl-item">
              <span className="hl-dot" style={{ background: isDark ? v.darkText : v.text }} />
              <span>{v.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
