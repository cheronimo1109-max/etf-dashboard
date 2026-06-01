import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { SECTORS } from '../etfData'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const s = payload[0].payload
  const valMap = { high:'割高', fair:'適正', low:'割安' }
  return (
    <div style={{
      background:'var(--surface)', border:'1px solid var(--border)',
      borderRadius:8, padding:'10px 14px', fontSize:13, minWidth:160,
    }}>
      <p style={{ fontWeight:700, color:'var(--text)', marginBottom:4 }}>{s.name}</p>
      <p style={{ color:'var(--muted)', fontSize:11, marginBottom:6 }}>代表ETF: {s.etf}</p>
      <p style={{ color: s.ytd >= 0 ? '#10b981' : '#ef4444', fontWeight:700 }}>
        YTD {s.ytd > 0 ? '+' : ''}{s.ytd}%
      </p>
      <p style={{ color:'var(--muted)', fontSize:11, marginTop:4 }}>
        PER {s.pe}× ・ {valMap[s.valuation] ?? s.valuation}
      </p>
    </div>
  )
}

export default function SectorChart({ isDark }) {
  const data    = [...SECTORS].sort((a, b) => b.ytd - a.ytd)
  const text    = isDark ? '#94a3b8' : '#64748b'
  const grid    = isDark ? '#2d3f60' : '#e2e8f0'

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">S&P500 セクター別パフォーマンス</h2>
        <span className="card-sub">YTD リターン (%)</span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top:4, right:4, left:0, bottom:60 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
          <XAxis
            type="number" domain={['auto','auto']}
            tick={{ fill:text, fontSize:11 }}
            axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`}
          />
          <YAxis
            type="category" dataKey="name" width={100}
            tick={{ fill:text, fontSize:11 }}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />
          <ReferenceLine x={0} stroke={grid} strokeWidth={1.5} />
          <Bar dataKey="ytd" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.ytd >= 0 ? d.color : '#94a3b8'} opacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* ETF badge row */}
      <div className="sector-etf-row">
        {data.map(s => (
          <span key={s.id} className="sector-etf-badge"
            style={{ borderColor: s.ytd >= 0 ? s.color : '#94a3b8', color: s.ytd >= 0 ? s.color : '#94a3b8' }}>
            {s.etf}
          </span>
        ))}
      </div>
    </div>
  )
}
