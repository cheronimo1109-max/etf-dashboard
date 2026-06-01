import { useState, useEffect, useRef } from 'react'
import { ETFS, INTL_ETFS } from '../etfData'

const ALL_ETFS = [...ETFS, ...INTL_ETFS]
const ETF_MAP  = Object.fromEntries(ALL_ETFS.map(e => [e.ticker, e]))

function livePrice(ticker, prices) {
  return prices[ticker]?.price ?? ETF_MAP[ticker]?.price ?? 100
}

export default function TradeModal({ modal, cash, positions, prices, onTrade, onClose }) {
  const isBuy = modal.mode === 'buy'
  const [ticker,    setTicker]    = useState(modal.ticker ?? '')
  const [qty,       setQty]       = useState('')
  const [qtyMode,   setQtyMode]   = useState('shares') // 'shares' | 'usd'
  const ref = useRef(null)
  useEffect(() => ref.current?.focus(), [])

  const sym   = ticker.toUpperCase().trim()
  const price = livePrice(sym, prices)
  const etf   = ETF_MAP[sym]
  const pos   = positions[sym]

  const sharesNum = qtyMode === 'shares'
    ? Number(qty)
    : price > 0 ? Number(qty) / price : 0
  const total     = sharesNum * price
  const cashAfter = cash - (isBuy ? total : -total)

  const valid = isBuy
    ? sharesNum > 0 && total <= cash && sym.length > 0
    : sharesNum > 0 && pos && sharesNum <= pos.shares

  const handleSubmit = e => {
    e.preventDefault()
    if (!valid) return
    onTrade(sym, modal.mode, parseFloat(sharesNum.toFixed(6)))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ color: isBuy ? 'var(--green)' : 'var(--red)' }}>
            {isBuy ? '📈 買い注文' : '📉 売り注文'}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}
          style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Ticker */}
          <div className="form-group">
            <label>ティッカー <span className="req">*</span></label>
            <input
              ref={ref}
              value={ticker}
              onChange={e => setTicker(e.target.value)}
              onBlur={e => setTicker(e.target.value.toUpperCase().trim())}
              list="trade-tickers"
              placeholder="例: VOO"
              style={{ textTransform: 'uppercase' }}
              readOnly={!!modal.ticker}
              required
            />
            <datalist id="trade-tickers">
              {ALL_ETFS.map(e => <option key={e.ticker} value={e.ticker}>{e.name}</option>)}
            </datalist>
            {etf && (
              <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                {etf.name} — 現在値: <strong style={{ color: 'var(--text)' }}>${price.toFixed(2)}</strong>
                {prices[sym] && <span className="live-chg pos" style={{ marginLeft: 6 }}>LIVE</span>}
              </span>
            )}
          </div>

          {/* Qty mode toggle + input */}
          <div className="form-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{isBuy ? '購入' : '売却'}数量</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {['shares', 'usd'].map(m => (
                  <button key={m} type="button"
                    className={`etf-filter-btn${qtyMode === m ? ' active' : ''}`}
                    style={{ padding: '2px 10px', fontSize: 11 }}
                    onClick={() => setQtyMode(m)}>
                    {m === 'shares' ? '株数' : '$金額'}
                  </button>
                ))}
              </div>
            </label>
            <input
              type="number" min="0.0001" step="any"
              value={qty} onChange={e => setQty(e.target.value)}
              placeholder={qtyMode === 'shares' ? '例: 2' : '例: 500'}
              required
            />
            {!isBuy && pos && (
              <button type="button" className="btn-text" style={{ marginTop: 3, fontSize: 11 }}
                onClick={() => { setQtyMode('shares'); setQty(String(pos.shares)) }}>
                全株売却 ({pos.shares.toFixed(4)}株)
              </button>
            )}
          </div>

          {/* Preview */}
          {qty && sym && sharesNum > 0 && (
            <div className={`trade-preview ${isBuy ? 'tp-buy' : 'tp-sell'}`}>
              <div className="tp-row"><span>銘柄</span>      <strong>{sym}</strong></div>
              <div className="tp-row"><span>株数</span>      <strong>{sharesNum.toFixed(4)}株</strong></div>
              <div className="tp-row"><span>単価</span>      <strong>${price.toFixed(2)}</strong></div>
              <div className="tp-row tp-total">
                <span>{isBuy ? '購入金額' : '売却金額'}</span>
                <strong>${total.toFixed(2)}</strong>
              </div>
              <div className="tp-row">
                <span>取引後現金</span>
                <strong style={{ color: cashAfter < 0 ? 'var(--red)' : 'var(--green)' }}>
                  ${cashAfter.toFixed(2)}
                </strong>
              </div>
              {isBuy && total > cash && (
                <div className="tp-warning">⚠ 現金残高が不足しています</div>
              )}
              {!isBuy && pos && sharesNum > pos.shares && (
                <div className="tp-warning">⚠ 保有株数を超えています</div>
              )}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>キャンセル</button>
            <button type="submit" disabled={!valid}
              className={isBuy ? 'btn-trade-buy' : 'btn-trade-sell'}>
              {isBuy ? '買い執行' : '売り執行'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
