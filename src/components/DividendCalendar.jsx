import { MONTHS, paymentPerMonth, fmt } from '../utils'

export default function DividendCalendar({ stocks }) {
  const monthData = MONTHS.map((label, i) => {
    const month  = i + 1
    const payers = stocks.filter(s => s.dividendMonths?.includes(month))
    const total  = payers.reduce((sum, s) => sum + paymentPerMonth(s), 0)
    return { label, payers, total }
  })

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">配当カレンダー</h2>
        <span className="card-sub">月別入金スケジュール</span>
      </div>
      <div className="cal-grid">
        {monthData.map(({ label, total, payers }) => (
          <div key={label} className={`cal-cell${total > 0 ? ' cal-active' : ''}`}>
            <div className="cal-month">{label}</div>
            {total > 0 ? (
              <>
                <div className="cal-amount">{fmt(total)}</div>
                <div className="cal-payers">
                  {payers.map(s => (
                    <span key={s.id} className="cal-tag">
                      {s.name.split('（')[0].replace('（', '').split(' ')[0].slice(0, 6)}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="cal-dash">—</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
