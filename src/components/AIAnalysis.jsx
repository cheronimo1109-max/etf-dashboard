import { useMemo, useState } from 'react'
import { ETFS, INTL_ETFS, CAT_LABELS, REGION_LABELS } from '../etfData'

const ALL_ETFS = [...ETFS, ...INTL_ETFS]
const ETF_MAP  = Object.fromEntries(ALL_ETFS.map(e => [e.ticker, e]))

// ── Health score computation ─────────────────────────────────
function computeHealth(enriched, totalValue) {
  if (!enriched.length || totalValue === 0) return { score: 0, grade: 'N/A', details: [] }

  let score = 100
  const details = []

  // 1. 銘柄数 (20pts)
  if (enriched.length >= 8)      { details.push({ type:'good', msg:`${enriched.length}銘柄で十分な分散` }) }
  else if (enriched.length >= 4) { score -= 8 }
  else                           { score -= 18; details.push({ type:'warn', msg:`保有銘柄${enriched.length}件と少ない — 3件以上推奨` }) }

  // 2. 集中リスク (25pts)
  const sorted   = [...enriched].sort((a, b) => b.currentValue - a.currentValue)
  const top1w    = sorted[0]?.currentValue / totalValue ?? 0
  const top3w    = sorted.slice(0, 3).reduce((s, h) => s + h.currentValue / totalValue, 0)
  if (top1w > 0.5) {
    score -= 22; details.push({ type:'danger', msg:`${sorted[0].ticker}に${(top1w*100).toFixed(0)}%集中 — リスク過大` })
  } else if (top1w > 0.35) {
    score -= 12; details.push({ type:'warn', msg:`${sorted[0].ticker}が${(top1w*100).toFixed(0)}%とやや高め` })
  } else {
    details.push({ type:'good', msg:`最大銘柄${(top1w*100).toFixed(0)}%で集中リスク低い` })
  }
  if (top3w > 0.85) score -= 5

  // 3. カテゴリバランス (20pts)
  const cats = new Set(enriched.map(h => h.etf?.cat).filter(Boolean))
  const hasBond      = [...cats].some(c => c === 'bond')
  const hasCommodity = [...cats].some(c => c === 'commodity')
  const defPct = enriched.filter(h => ['bond','commodity'].includes(h.etf?.cat))
    .reduce((s, h) => s + h.currentValue / totalValue, 0)
  if (!hasBond && !hasCommodity) {
    score -= 15; details.push({ type:'warn', msg:'債券・コモディティETFなし — 暴落クッション不足' })
  } else if (defPct < 0.08) {
    score -= 7; details.push({ type:'info', msg:`防御資産${(defPct*100).toFixed(0)}%は少なめ (推奨10-20%)` })
  } else {
    details.push({ type:'good', msg:`防御資産${(defPct*100).toFixed(0)}%でバランス良好` })
  }

  // 4. 地理的分散 (20pts)
  const intlPct = enriched.filter(h => h.etf?.region || h.etf?.cat === 'intl')
    .reduce((s, h) => s + h.currentValue / totalValue, 0)
  if (intlPct === 0) {
    score -= 15; details.push({ type:'warn', msg:'海外ETFなし — 米国集中リスク' })
  } else if (intlPct < 0.10) {
    score -= 7; details.push({ type:'info', msg:`海外比率${(intlPct*100).toFixed(0)}%は低め (推奨15-30%)` })
  } else {
    details.push({ type:'good', msg:`海外ETF${(intlPct*100).toFixed(0)}%で地政学分散` })
  }

  // 5. コスト効率 (15pts)
  const avgExp = enriched.reduce((s, h) => s + (h.etf?.exp ?? 0.3) * (h.currentValue / totalValue), 0)
  if (avgExp > 0.5) {
    score -= 12; details.push({ type:'warn', msg:`加重平均コスト${avgExp.toFixed(2)}%はやや高め (推奨0.2%以下)` })
  } else if (avgExp > 0.25) {
    score -= 6
  } else {
    details.push({ type:'good', msg:`コスト${avgExp.toFixed(2)}%/年は低水準` })
  }

  const final = Math.max(0, Math.min(100, Math.round(score)))
  const grade = final >= 85 ? 'A' : final >= 70 ? 'B' : final >= 55 ? 'C' : final >= 40 ? 'D' : 'F'
  return { score: final, grade, details }
}

// ── AI recommendations ───────────────────────────────────────
function generateRecs(enriched, totalValue, market) {
  if (!enriched.length || totalValue === 0) return []
  const recs = []

  const cats    = new Set(enriched.map(h => h.etf?.cat).filter(Boolean))
  const regions = new Set(enriched.map(h => h.etf?.region).filter(Boolean))
  const tickers = new Set(enriched.map(h => h.ticker))

  const bondPct = enriched.filter(h => h.etf?.cat === 'bond')
    .reduce((s, h) => s + h.currentValue / totalValue, 0)
  const intlPct = enriched.filter(h => h.etf?.region || h.etf?.cat === 'intl')
    .reduce((s, h) => s + h.currentValue / totalValue, 0)
  const portYield = enriched.reduce((s, h) => s + (h.annualDiv ?? 0), 0) / totalValue * 100

  if (bondPct < 0.05) {
    recs.push({
      icon:'🏦', priority:'high', color:'#3b82f6',
      title:'債券ETFでリスクヘッジ',
      body:`株式100%のポートフォリオは暴落時に大きく下落します。AGGやTLTを10〜20%組み込むことで下落幅を抑制。`,
      etfs:['AGG','TLT'].filter(t => !tickers.has(t)),
    })
  }

  if (intlPct < 0.15) {
    recs.push({
      icon:'🌍', priority: intlPct === 0 ? 'high' : 'medium', color:'#10b981',
      title:'海外ETFで地政学分散',
      body:`米国集中リスクを軽減しましょう。VXUSやVTで全世界分散、またはEWJやINDAで個別国へのアクセスが可能です。`,
      etfs:['VXUS','VT','EWJ','INDA'].filter(t => !tickers.has(t)).slice(0, 3),
    })
  }

  if (portYield < 1.0 && !cats.has('dividend')) {
    recs.push({
      icon:'💰', priority:'medium', color:'#f59e0b',
      title:'配当ETFでインカムゲイン強化',
      body:`現在の配当利回り${portYield.toFixed(2)}%は低水準です。SCHDやVYMを追加して安定的なキャッシュフローを確保。`,
      etfs:['SCHD','VYM','HDV'].filter(t => !tickers.has(t)),
    })
  }

  if (market.vix >= 25) {
    recs.push({
      icon:'🔔', priority:'high', color:'#6366f1',
      title:`VIX${market.vix.toFixed(0)} — 歴史的買い場シグナル`,
      body:`恐怖指数が高水準です。過去のデータではVIX25超での積み立ては長期的に高リターンをもたらしています。`,
      etfs:['VOO','VTI','QQQ'].filter(t => !tickers.has(t)).slice(0, 2),
    })
  }

  if (!cats.has('growth') && !tickers.has('QQQ') && !tickers.has('VGT')) {
    recs.push({
      icon:'🚀', priority:'low', color:'#8b5cf6',
      title:'グロースETFで長期成長力を追加',
      body:'テクノロジーセクターへの露出がありません。QQQやVGTで長期的な成長ポテンシャルを取り込むことを検討。',
      etfs:['QQQ','VGT'].filter(t => !tickers.has(t)),
    })
  }

  if (!regions.has('india') && !regions.has('asean') && totalValue > 5000) {
    recs.push({
      icon:'🌏', priority:'low', color:'#ec4899',
      title:'アジア新興国で高成長を取り込む',
      body:'インド・東南アジアは今後10〜20年で最も高い経済成長が見込まれる地域です。INDAやVWOで長期成長に参加。',
      etfs:['INDA','VWO','EWT'].filter(t => !tickers.has(t)).slice(0, 3),
    })
  }

  const order = { high: 0, medium: 1, low: 2 }
  return recs.sort((a, b) => order[a.priority] - order[b.priority])
}

// ── Market regime analysis ───────────────────────────────────
function analyzeRegime(market) {
  const vixH   = market.vix >= 25
  const vixM   = market.vix >= 18
  const yldH   = market.yield10y >= 4.0
  const sp500  = market.sp500Change ?? 0

  let regime, icon, color, body, action
  if (vixH && yldH) {
    regime = '複合ストレス局面'; icon = '🚨'; color = '#6366f1'
    body   = `恐怖指数(${market.vix.toFixed(1)})と金利(${market.yield10y.toFixed(2)}%)が同時に高水準。歴史的には長期投資の最高の仕込み場のひとつ。`
    action = 'コアETF(VOO/VTI)への積み立て増額を強く推奨'
  } else if (vixH) {
    regime = '高ボラティリティ局面'; icon = '⚠️'; color = '#ef4444'
    body   = `VIX${market.vix.toFixed(1)}は警戒水準。市場は不安定ですが、長期目線では絶好の買い機会です。`
    action = '分割購入（週次・月次積み立て）で価格リスクを分散'
  } else if (yldH) {
    regime = '高金利環境'; icon = '📈'; color = '#f59e0b'
    body   = `10年金利${market.yield10y.toFixed(2)}%は高水準。グロース株の割引率が上昇するため、配当・バリュー系に優位性。`
    action = '高配当ETF(SCHD/VYM)・債券ETF(TLT)を優先'
  } else if (!vixM && sp500 > 0) {
    regime = '強気トレンド局面'; icon = '🟢'; color = '#10b981'
    body   = `VIX${market.vix.toFixed(1)}は低水準で市場は安定。グロース株に有利な環境が続いています。`
    action = 'グロースETF(QQQ/VGT)の積み立て継続。利確より保有優先'
  } else {
    regime = '平常相場'; icon = '✅'; color = '#3b82f6'
    body   = `VIX${market.vix.toFixed(1)}・金利${market.yield10y.toFixed(2)}%ともに中立圏。通常の積み立て戦略を継続。`
    action = '設定した積み立てプランを粛々と継続することが最善'
  }
  return { regime, icon, color, body, action }
}

// ── Risk metrics ─────────────────────────────────────────────
function computeRiskMetrics(enriched, totalValue) {
  if (!enriched.length || totalValue === 0) return null

  const VOL_BY_CAT = {
    broad: 16, growth: 22, dividend: 12, sector: 20, bond: 5, commodity: 18, intl: 18
  }
  const VOL_BY_REGION = {
    japan:8, europe:14, em:20, china:25, india:22, latam:24,
    global:14, korea:22, taiwan:22, australia:16, canada:15, asean:22, mideast:20
  }

  const estVol = enriched.reduce((s, h) => {
    const v = h.etf?.cat    ? (VOL_BY_CAT[h.etf.cat]    ?? 18)
            : h.etf?.region ? (VOL_BY_REGION[h.etf.region] ?? 18) : 18
    return s + v * (h.currentValue / totalValue)
  }, 0)

  const avgExp = enriched.reduce((s, h) => s + (h.etf?.exp ?? 0.3) * (h.currentValue / totalValue), 0)

  const portYield = enriched.reduce((s, h) => s + (h.annualDiv ?? 0), 0) / totalValue * 100

  const totalPnlPct = enriched.reduce((s, h) => {
    const w = h.currentValue / totalValue
    return s + h.pnlPct * w
  }, 0)

  const sharpePx = totalPnlPct > 0 ? (totalPnlPct / estVol).toFixed(2) : '—'

  const cats = {}
  enriched.forEach(h => {
    const k = h.etf?.cat || h.etf?.region || 'other'
    cats[k] = (cats[k] ?? 0) + h.currentValue / totalValue
  })
  const herfindahl = Object.values(cats).reduce((s, w) => s + w * w, 0)
  const divScore = Math.round((1 - herfindahl) * 100)

  return { estVol: estVol.toFixed(1), avgExp: avgExp.toFixed(2), portYield: portYield.toFixed(2), sharpePx, divScore }
}

// ── Component ────────────────────────────────────────────────
export default function AIAnalysis({ holdings, prices, market, isDark }) {
  const enriched = useMemo(() => {
    return holdings.map(h => {
      const etf          = ETF_MAP[h.ticker]
      const currentPrice = prices[h.ticker]?.price ?? etf?.price ?? h.avgCost
      const costBasis    = h.avgCost * h.shares
      const currentValue = currentPrice * h.shares
      const pnl          = currentValue - costBasis
      const pnlPct       = costBasis > 0 ? (pnl / costBasis) * 100 : 0
      const annualDiv    = etf ? currentValue * ((etf.yield ?? 0) / 100) : 0
      return { ...h, etf, currentPrice, costBasis, currentValue, pnl, pnlPct, annualDiv }
    }).sort((a, b) => b.currentValue - a.currentValue)
  }, [holdings, prices])

  const totalValue = enriched.reduce((s, h) => s + h.currentValue, 0)
  const { score, grade, details }    = useMemo(() => computeHealth(enriched, totalValue), [enriched, totalValue])
  const recs                         = useMemo(() => generateRecs(enriched, totalValue, market), [enriched, totalValue, market])
  const regime                       = useMemo(() => analyzeRegime(market), [market])
  const risk                         = useMemo(() => computeRiskMetrics(enriched, totalValue), [enriched, totalValue])

  const scoreColor = score >= 85 ? '#10b981' : score >= 70 ? '#3b82f6' : score >= 55 ? '#f59e0b' : '#ef4444'
  const detailIcon = { good:'✅', info:'💡', warn:'⚠️', danger:'🔴' }
  const priorityLabel = { high:'優先', medium:'推奨', low:'参考' }
  const priorityColor = { high:'#ef4444', medium:'#f59e0b', low:'#94a3b8' }

  // Claude AI推薦
  const [aiRecs,     setAiRecs]     = useState(null)
  const [aiLoading,  setAiLoading]  = useState(false)
  const [aiError,    setAiError]    = useState(null)
  const [aiCached,   setAiCached]   = useState(false)

  const fetchAiRecs = async () => {
    setAiLoading(true)
    setAiError(null)
    setAiCached(false)
    try {
      const res = await fetch('/api/ai-recommend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          holdings: enriched.map(h => ({ ticker: h.ticker, shares: h.shares, avgCost: h.avgCost })),
          market: { vix: market.vix, yield10y: market.yield10y, sp500Change: market.sp500Change },
        }),
        signal: AbortSignal.timeout(30000),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setAiRecs(data.recommendations ?? [])
    } catch (e) {
      setAiError(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  const catColor = { '成長':'#8b5cf6', '防御':'#10b981', '配当':'#f59e0b', '国際':'#3b82f6', 'コモディティ':'#f97316', '債券':'#06b6d4' }
  const priColor = { '高':'#ef4444', '中':'#f59e0b', '低':'#94a3b8' }

  return (
    <div className="ai-wrap">

      {/* ── Claude AI推薦 ── */}
      <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">🤖 Claude AI おすすめ銘柄</h2>
            <span className="card-sub">あなたのポートフォリオ・市場状況を分析して次の買いを提案</span>
          </div>
          <button
            className="btn-save ai-rec-fetch-btn"
            onClick={fetchAiRecs}
            disabled={aiLoading}
            style={{ background: '#8b5cf6', minWidth: 110 }}
          >
            {aiLoading ? '分析中...' : aiRecs ? '再取得' : '✨ 推薦を取得'}
          </button>
        </div>

        {!aiRecs && !aiLoading && !aiError && (
          <div className="ai-rec-placeholder">
            <p>「推薦を取得」ボタンを押すと、Claude AIが現在の保有内容と市場状況を分析して最適なETFを提案します。</p>
            <ul className="ai-rec-feature-list">
              <li>📊 ポートフォリオのギャップを自動検出</li>
              <li>📈 VIX・金利を踏まえたタイミング分析</li>
              <li>🌍 地理的・セクター分散の改善提案</li>
            </ul>
          </div>
        )}

        {aiLoading && (
          <div className="img-loading">
            <div className="img-spinner" style={{ borderTopColor: '#8b5cf6' }} />
            <p>Claudeが分析中です... (最大30秒)</p>
          </div>
        )}

        {aiError && (
          <div className="img-error">
            <strong>エラー:</strong> {aiError}
            {aiError.includes('ANTHROPIC_API_KEY') && (
              <p style={{ marginTop: 8, fontSize: 12 }}>
                Vercelの環境変数に <code>ANTHROPIC_API_KEY</code> を設定してください。
              </p>
            )}
          </div>
        )}

        {aiRecs && !aiLoading && (
          <>
            <div className="claude-recs-grid">
              {aiRecs.map((r, i) => (
                <div key={i} className="claude-rec-card" style={{ '--rc': catColor[r.category] ?? '#3b82f6' }}>
                  <div className="claude-rec-head">
                    <span className="claude-rec-ticker">{r.ticker}</span>
                    <span className="claude-rec-name">{r.nameJa || r.name}</span>
                    <div style={{ display:'flex', gap:6, marginLeft:'auto', flexShrink:0 }}>
                      <span className="ai-priority-badge" style={{ color: priColor[r.priority] ?? '#94a3b8', borderColor: priColor[r.priority] ?? '#94a3b8' }}>
                        {r.priority}優先度
                      </span>
                      <span className="ai-priority-badge" style={{ color: catColor[r.category] ?? '#3b82f6', borderColor: catColor[r.category] ?? '#3b82f6' }}>
                        {r.category}
                      </span>
                    </div>
                  </div>
                  <p className="claude-rec-reason">{r.reason}</p>
                  <div className="claude-rec-meta">
                    {r.expenseRatio != null && (
                      <span>経費率 {(r.expenseRatio * 100).toFixed(2)}%/年</span>
                    )}
                    {r.targetWeight != null && (
                      <span>推奨比率 {r.targetWeight}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
              ※ AIの推薦は参考情報です。投資判断はご自身の責任で行ってください。
            </p>
          </>
        )}
      </div>

      {/* ── Market Regime ── */}
      <div className="card" style={{ borderLeft:`4px solid ${regime.color}` }}>
        <div className="card-header">
          <h2 className="card-title">AI マーケット環境分析</h2>
          <span className="card-sub">VIX・金利・トレンド総合判定</span>
        </div>
        <div className="ai-regime">
          <div className="ai-regime-top">
            <span className="ai-regime-icon">{regime.icon}</span>
            <span className="ai-regime-name" style={{ color: regime.color }}>{regime.regime}</span>
          </div>
          <p className="ai-regime-body">{regime.body}</p>
          <div className="ai-regime-action">
            <span className="ai-regime-action-label">推奨アクション</span>
            <span>{regime.action}</span>
          </div>
          <div className="ai-market-pills">
            <span className="ai-pill" style={{ color: market.vix >= 25 ? '#ef4444' : market.vix >= 18 ? '#f59e0b' : '#10b981', borderColor: 'currentColor' }}>
              VIX {market.vix.toFixed(1)}
            </span>
            <span className="ai-pill" style={{ color: market.yield10y >= 4.0 ? '#ef4444' : '#10b981', borderColor: 'currentColor' }}>
              10Y {market.yield10y.toFixed(2)}%
            </span>
            {market.sp500Change !== undefined && (
              <span className="ai-pill" style={{ color: market.sp500Change >= 0 ? '#10b981' : '#ef4444', borderColor: 'currentColor' }}>
                S&amp;P {market.sp500Change >= 0 ? '+' : ''}{market.sp500Change.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Portfolio Health + Risk Metrics ── */}
      <div className="ai-score-row">
        {/* Health Score */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">ポートフォリオ健全度</h2>
            <span className="card-sub">AI総合評価</span>
          </div>

          {totalValue === 0 ? (
            <p className="empty-msg">ポートフォリオを登録すると分析が表示されます</p>
          ) : (
            <div className="ai-health">
              <div className="ai-score-display">
                <div className="ai-score-circle" style={{ '--sc': scoreColor }}>
                  <span className="ai-score-num">{score}</span>
                  <span className="ai-score-slash">/100</span>
                </div>
                <div className="ai-grade-wrap">
                  <span className="ai-grade" style={{ color: scoreColor }}>{grade}</span>
                  <span className="ai-grade-label">評価</span>
                </div>
              </div>
              <div className="ai-score-bar-track">
                <div className="ai-score-bar-fill" style={{ width:`${score}%`, background: scoreColor }} />
              </div>
              <div className="ai-details">
                {details.map((d, i) => (
                  <div key={i} className={`ai-detail-item ai-detail-${d.type}`}>
                    <span>{detailIcon[d.type]}</span>
                    <span>{d.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Risk Metrics */}
        {risk && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">リスク指標</h2>
              <span className="card-sub">推定値（参考）</span>
            </div>
            <div className="ai-risk-grid">
              {[
                { label:'推定年間ボラティリティ', value:`±${risk.estVol}%`,          sub:'株式市場平均は約15-20%', color:'#8b5cf6' },
                { label:'分散スコア',             value:`${risk.divScore}/100`,       sub:'100が完全分散', color: risk.divScore >= 70 ? '#10b981' : risk.divScore >= 50 ? '#f59e0b' : '#ef4444' },
                { label:'加重平均コスト',          value:`${risk.avgExp}%/年`,         sub:'0.1%以下が優秀', color: risk.avgExp <= 0.1 ? '#10b981' : risk.avgExp <= 0.3 ? '#f59e0b' : '#ef4444' },
                { label:'配当利回り',              value:`${risk.portYield}%`,         sub:'年間配当/評価額', color:'#10b981' },
                { label:'Sharpe比（概算）',        value:`${risk.sharpePx}`,           sub:'1.0超が優良', color:'#3b82f6' },
              ].map((m, i) => (
                <div key={i} className="ai-metric-item">
                  <span className="ai-metric-label">{m.label}</span>
                  <span className="ai-metric-value" style={{ color: m.color }}>{m.value}</span>
                  <span className="ai-metric-sub">{m.sub}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── AI Recommendations ── */}
      {recs.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">AI 推奨アクション</h2>
            <span className="card-sub">ポートフォリオ分析に基づく提案</span>
          </div>
          <div className="ai-recs-grid">
            {recs.map((r, i) => (
              <div key={i} className="ai-rec-card" style={{ borderColor: r.color + '44', '--rc': r.color }}>
                <div className="ai-rec-header">
                  <span className="ai-rec-icon">{r.icon}</span>
                  <span className="ai-rec-title">{r.title}</span>
                  <span className="ai-priority-badge" style={{ color: priorityColor[r.priority], borderColor: priorityColor[r.priority] }}>
                    {priorityLabel[r.priority]}
                  </span>
                </div>
                <p className="ai-rec-body">{r.body}</p>
                {r.etfs.length > 0 && (
                  <div className="ai-rec-etfs">
                    {r.etfs.map(t => (
                      <span key={t} className="ai-rec-etf-tag" style={{ borderColor: r.color, color: r.color }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Category breakdown ── */}
      {enriched.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">カテゴリ別 保有分析</h2>
            <span className="card-sub">{enriched.length}銘柄</span>
          </div>
          <div className="ai-cat-list">
            {Object.entries(
              enriched.reduce((acc, h) => {
                const k   = h.etf?.cat || h.etf?.region || 'other'
                const lbl = CAT_LABELS[k] || REGION_LABELS[k] || k
                if (!acc[lbl]) acc[lbl] = { value: 0, items: [] }
                acc[lbl].value += h.currentValue
                acc[lbl].items.push(h.ticker)
                return acc
              }, {})
            )
              .sort((a, b) => b[1].value - a[1].value)
              .map(([cat, { value, items }]) => {
                const pct = totalValue > 0 ? value / totalValue * 100 : 0
                return (
                  <div key={cat} className="ai-cat-row">
                    <span className="ai-cat-name">{cat}</span>
                    <div className="ai-cat-bar-wrap">
                      <div className="ai-cat-bar" style={{ width:`${Math.max(pct, 1)}%` }} />
                    </div>
                    <span className="ai-cat-pct">{pct.toFixed(1)}%</span>
                    <span className="ai-cat-tickers">{items.join(' · ')}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
