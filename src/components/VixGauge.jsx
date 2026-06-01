const CX = 100, CY = 100, R = 78, MAX_VIX = 60

const ZONES = [
  { v1:  0, v2: 15, color:'#10b981', label:'低',   desc:'安心' },
  { v1: 15, v2: 25, color:'#eab308', label:'中',   desc:'注意' },
  { v1: 25, v2: 35, color:'#f97316', label:'高',   desc:'恐怖' },
  { v1: 35, v2: MAX_VIX, color:'#ef4444', label:'極高', desc:'パニック' },
]

function toXY(v, r = R) {
  const deg = (1 - Math.min(v, MAX_VIX) / MAX_VIX) * 180
  const rad = deg * Math.PI / 180
  return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) }
}

function arcPath(v1, v2) {
  const s = toXY(v1)
  const e = toXY(v2)
  const large = (v2 - v1) / MAX_VIX >= 0.5 ? 1 : 0
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${large} 0 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

export default function VixGauge({ value }) {
  const clamped = Math.min(Math.max(value, 0), MAX_VIX)
  const zone    = ZONES.find(z => clamped <= z.v2) ?? ZONES[ZONES.length - 1]
  const tip     = toXY(clamped, R - 8)

  return (
    <div className="vix-gauge">
      <svg viewBox="0 0 200 108" style={{ width: '100%', maxWidth: 200 }}>
        {/* Background track */}
        <path d={arcPath(0, MAX_VIX)} fill="none" stroke="var(--surface2)" strokeWidth="14" strokeLinecap="round" />

        {/* Zone arcs */}
        {ZONES.map((z, i) => (
          <path
            key={i}
            d={arcPath(z.v1, z.v2)}
            fill="none"
            stroke={z.color}
            strokeWidth="14"
            strokeLinecap="butt"
            opacity="0.35"
          />
        ))}

        {/* Filled arc up to current value */}
        {clamped > 0 && (
          <path
            d={arcPath(0, clamped)}
            fill="none"
            stroke={zone.color}
            strokeWidth="14"
            strokeLinecap="round"
          />
        )}

        {/* Zone tick marks */}
        {[15, 25, 35].map(v => {
          const outer = toXY(v, R + 2)
          const inner = toXY(v, R - 14)
          return (
            <line key={v} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
              stroke="var(--surface)" strokeWidth="2" />
          )
        })}

        {/* Needle */}
        <line x1={CX} y1={CY} x2={tip.x} y2={tip.y}
          stroke={zone.color} strokeWidth="3" strokeLinecap="round" />
        <circle cx={CX} cy={CY} r="6" fill={zone.color} />
        <circle cx={CX} cy={CY} r="3" fill="var(--surface)" />

        {/* Value */}
        <text x={CX} y={CY + 20} textAnchor="middle" fontSize="22" fontWeight="800"
          fill={zone.color} fontFamily="system-ui">
          {value.toFixed(1)}
        </text>
      </svg>

      {/* Zone legend */}
      <div className="vix-zone-row">
        {ZONES.map((z, i) => (
          <div key={i} className={`vix-zone-item${zone === z ? ' active' : ''}`}
            style={{ '--zc': z.color }}>
            <span className="vz-dot" style={{ background: z.color }} />
            {z.label}
          </div>
        ))}
      </div>

      <div className="vix-badge" style={{ background: zone.color }}>
        VIX {zone.label}水準 — {zone.desc}
      </div>
    </div>
  )
}
