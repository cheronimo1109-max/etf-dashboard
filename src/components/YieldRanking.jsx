import { annualDividend, fmt } from '../utils'

export default function YieldRanking({ stocks, onEdit, onDelete }) {
  const sorted = [...stocks].sort((a, b) => b.dividendYield - a.dividendYield)

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">配当利回りランキング</h2>
        <span className="card-sub">{stocks.length}銘柄 / 利回り降順</span>
      </div>

      {stocks.length === 0 ? (
        <p className="empty-msg">銘柄が登録されていません。「＋ 銘柄追加」から追加してください。</p>
      ) : (
        <div className="table-wrap">
          <table className="rank-table">
            <thead>
              <tr>
                <th>順位</th>
                <th>銘柄名</th>
                <th>コード</th>
                <th>利回り</th>
                <th>保有株数</th>
                <th>取得単価</th>
                <th>年間配当</th>
                <th>配当月</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr key={s.id}>
                  <td>
                    <span className={`rank-badge r${i < 3 ? i + 1 : 'n'}`}>{i + 1}</span>
                  </td>
                  <td className="td-name">{s.name}</td>
                  <td className="td-code">{s.ticker || '—'}</td>
                  <td>
                    <span className="yield-pill">{s.dividendYield.toFixed(2)}%</span>
                  </td>
                  <td>{s.shares.toLocaleString()}株</td>
                  <td>{fmt(s.purchasePrice)}</td>
                  <td className="td-amount">{fmt(annualDividend(s))}</td>
                  <td>
                    <div className="month-tags">
                      {s.dividendMonths?.map(m => (
                        <span key={m} className="cal-tag">{m}月</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="row-btns">
                      <button className="btn-edit"   onClick={() => onEdit(s)}>編集</button>
                      <button className="btn-delete" onClick={() => onDelete(s.id)}>削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
