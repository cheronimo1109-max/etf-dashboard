import { totalAnnual, totalInvestment, fmt } from '../utils'

export default function SummaryCards({ stocks }) {
  const annual     = totalAnnual(stocks)
  const monthly    = annual / 12
  const investment = totalInvestment(stocks)
  const yld        = investment > 0 ? (annual / investment) * 100 : 0

  const cards = [
    { label: '年間配当収入',  value: fmt(annual),     sub: `月平均 ${fmt(monthly)}`,     color: '#10b981' },
    { label: '月平均配当',    value: fmt(monthly),    sub: `年間合計 ${fmt(annual)}`,     color: '#3b82f6' },
    { label: '保有銘柄数',    value: `${stocks.length}銘柄`, sub: `投資総額 ${fmt(investment)}`, color: '#8b5cf6' },
    { label: '総合利回り',    value: `${yld.toFixed(2)}%`, sub: `投資元本 ${fmt(investment)}`, color: '#f59e0b' },
  ]

  return (
    <div className="summary-cards">
      {cards.map((c, i) => (
        <div key={i} className="summary-card">
          <div className="sc-label">{c.label}</div>
          <div className="sc-value" style={{ color: c.color }}>{c.value}</div>
          <div className="sc-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
