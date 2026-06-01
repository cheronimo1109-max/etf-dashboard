import { useState, useEffect, useRef } from 'react'

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)

export default function StockModal({ modal, onSave, onClose }) {
  const isEdit = modal.mode === 'edit'
  const [form, setForm] = useState(
    isEdit
      ? { ...modal.stock }
      : { name: '', ticker: '', shares: '', purchasePrice: '', dividendYield: '', dividendMonths: [] }
  )
  const ref = useRef(null)
  useEffect(() => ref.current?.focus(), [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const toggleMonth = (m) => setForm(f => {
    const months = f.dividendMonths.includes(m)
      ? f.dividendMonths.filter(x => x !== m)
      : [...f.dividendMonths, m].sort((a, b) => a - b)
    return { ...f, dividendMonths: months }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...form,
      shares: Number(form.shares),
      purchasePrice: Number(form.purchasePrice),
      dividendYield: Number(form.dividendYield),
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? '銘柄を編集' : '銘柄を追加'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>銘柄名 <span className="req">*</span></label>
              <input ref={ref} value={form.name} onChange={set('name')} required placeholder="例: JT（日本たばこ産業）" />
            </div>
            <div className="form-group">
              <label>証券コード</label>
              <input value={form.ticker} onChange={set('ticker')} placeholder="例: 2914" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>保有株数 <span className="req">*</span></label>
              <input type="number" min="1" step="1" value={form.shares} onChange={set('shares')} required placeholder="100" />
            </div>
            <div className="form-group">
              <label>取得単価（円） <span className="req">*</span></label>
              <input type="number" min="1" value={form.purchasePrice} onChange={set('purchasePrice')} required placeholder="2800" />
            </div>
            <div className="form-group">
              <label>配当利回り（%） <span className="req">*</span></label>
              <input type="number" min="0" max="100" step="0.01" value={form.dividendYield} onChange={set('dividendYield')} required placeholder="6.5" />
            </div>
          </div>

          <div className="form-group">
            <label>配当月（複数選択可）</label>
            <div className="month-grid">
              {MONTH_LABELS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  className={`month-btn${form.dividendMonths.includes(i + 1) ? ' active' : ''}`}
                  onClick={() => toggleMonth(i + 1)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {form.shares && form.purchasePrice && form.dividendYield && (
            <div className="form-preview">
              年間配当見込み: <strong>
                ¥{Math.round(Number(form.shares) * Number(form.purchasePrice) * Number(form.dividendYield) / 100).toLocaleString()}
              </strong>
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
