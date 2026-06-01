import { useState, useRef, useEffect } from 'react'
import { ETFS, INTL_ETFS } from '../etfData'

const ALL_ETF_LIST = [...ETFS, ...INTL_ETFS]

export default function PortfolioModal({ modal, onSave, onClose }) {
  const isEdit = modal.mode === 'edit'
  const [form, setForm] = useState(
    isEdit
      ? { ...modal.holding }
      : { ticker: '', shares: '', avgCost: '', note: '' }
  )
  const ref = useRef(null)
  useEffect(() => ref.current?.focus(), [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    onSave({
      ...form,
      id:      form.id ?? crypto.randomUUID(),
      ticker:  form.ticker.toUpperCase().trim(),
      shares:  Number(form.shares),
      avgCost: Number(form.avgCost),
    })
  }

  const totalCost = form.shares && form.avgCost
    ? (Number(form.shares) * Number(form.avgCost)).toLocaleString('en-US', { maximumFractionDigits: 0 })
    : null

  const matched = ALL_ETF_LIST.find(e => e.ticker === form.ticker.toUpperCase())

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? '保有銘柄を編集' : '保有銘柄を追加'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <label>ティッカー <span className="req">*</span></label>
            <input
              ref={ref}
              value={form.ticker}
              onChange={set('ticker')}
              onBlur={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase().trim() }))}
              required
              list="pm-ticker-list"
              placeholder="例: VOO, EWJ, SCHD"
              style={{ textTransform: 'uppercase' }}
            />
            <datalist id="pm-ticker-list">
              {ALL_ETF_LIST.map(e => (
                <option key={e.ticker} value={e.ticker}>{e.name}</option>
              ))}
            </datalist>
            {matched && (
              <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{matched.name}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>保有株数 <span className="req">*</span></label>
              <input type="number" min="0.001" step="any" value={form.shares}
                onChange={set('shares')} required placeholder="20" />
            </div>
            <div className="form-group">
              <label>平均取得単価（$） <span className="req">*</span></label>
              <input type="number" min="0.01" step="any" value={form.avgCost}
                onChange={set('avgCost')} required placeholder="498.52" />
            </div>
          </div>

          {totalCost && (
            <div className="form-preview">
              取得総額: <strong>${totalCost}</strong>
              {matched?.yield > 0 && (
                <span style={{ marginLeft: 12 }}>
                  年間配当見込み: <strong>
                    ${Math.round(Number(form.shares) * Number(form.avgCost) * matched.yield / 100).toLocaleString()}
                  </strong>
                </span>
              )}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>キャンセル</button>
            <button type="submit" className="btn-save">{isEdit ? '保存' : '追加'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
