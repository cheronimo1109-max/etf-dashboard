import { totalAnnual, fmt } from '../utils'

export default function GoalProgress({ stocks, goal, editing, goalInput, onStartEdit, onInput, onCommit, onCancel }) {
  const monthly   = totalAnnual(stocks) / 12
  const pct       = Math.min((monthly / goal) * 100, 100)
  const remaining = Math.max(goal - monthly, 0)

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">月次配当収入の目標達成率</h2>
        {!editing ? (
          <button className="btn-text" onClick={onStartEdit}>目標を変更</button>
        ) : (
          <div className="goal-edit">
            <span>¥</span>
            <input
              type="number"
              value={goalInput}
              onChange={onInput}
              onKeyDown={e => e.key === 'Enter' && onCommit()}
              autoFocus
            />
            <button className="btn-sm-save" onClick={onCommit}>保存</button>
            <button className="btn-sm-cancel" onClick={onCancel}>×</button>
          </div>
        )}
      </div>

      <div className="goal-numbers">
        <span className="goal-current">{fmt(monthly)}<span className="goal-unit">/月</span></span>
        <span className="goal-div">/</span>
        <span className="goal-target">目標 {fmt(goal)}<span className="goal-unit">/月</span></span>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="goal-stats">
        <span className="goal-pct">{pct.toFixed(1)}% 達成</span>
        {remaining > 0
          ? <span className="goal-remaining">あと {fmt(remaining)}/月 で達成</span>
          : <span className="goal-achieved">🎉 目標達成！</span>
        }
      </div>
    </div>
  )
}
