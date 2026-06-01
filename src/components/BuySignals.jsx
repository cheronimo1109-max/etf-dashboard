import { SECTORS } from '../etfData'

function computeSignals(market) {
  const signals = []

  if (market.vix >= 30) {
    signals.push({
      level: 'strong',
      icon: '🔔',
      title: '恐怖時こそ買い — VIX 警戒水準',
      body: `VIX ${market.vix.toFixed(1)} は歴史的に絶好の長期買い場です。VOO・VTI への積み立てを検討。`,
      etfs: ['VOO', 'VTI', 'QQQ'],
    })
  } else if (market.vix >= 20) {
    signals.push({
      level: 'mild',
      icon: '⚠️',
      title: '軽度の恐怖 — 慎重な買い増しを検討',
      body: `VIX ${market.vix.toFixed(1)} は中程度の不安感。ドルコスト平均法での積み立てが有効。`,
      etfs: ['VOO', 'SCHD'],
    })
  } else {
    signals.push({
      level: 'neutral',
      icon: '✅',
      title: 'VIX 低水準 — 市場は安定',
      body: `VIX ${market.vix.toFixed(1)} は低水準。相場は落ち着いており通常の積み立てを継続。`,
      etfs: [],
    })
  }

  if (market.yield10y >= 4.5) {
    signals.push({
      level: 'strong',
      icon: '📈',
      title: '金利急騰 — 債券ETF・高配当に好機',
      body: `10年国債 ${market.yield10y.toFixed(2)}% は歴史的高水準。TLT/AGGの仕込みと高配当ETFへの資金シフトを検討。`,
      etfs: ['TLT', 'AGG', 'SCHD', 'HDV'],
    })
  } else if (market.yield10y >= 4.0) {
    signals.push({
      level: 'mild',
      icon: '🏦',
      title: '高金利環境 — 高配当ETFが有利',
      body: `金利 ${market.yield10y.toFixed(2)}% 環境ではグロース株の割引率が上昇。配当ETFで実質リターンを確保。`,
      etfs: ['SCHD', 'VYM', 'HDV'],
    })
  } else {
    signals.push({
      level: 'neutral',
      icon: '💚',
      title: '低金利環境 — グロースETFに追い風',
      body: `金利 ${market.yield10y.toFixed(2)}% は低水準。DiscountRate低下でグロース株の理論価値が上昇。`,
      etfs: ['QQQ', 'VGT'],
    })
  }

  const undervalued = SECTORS.filter(s => s.valuation === 'low')
  if (undervalued.length > 0) {
    signals.push({
      level: 'mild',
      icon: '💰',
      title: '割安セクターあり',
      body: `${undervalued.map(s => s.name).join('・')} セクターがPERベースで割安圏。長期保有の切り口として検討。`,
      etfs: undervalued.map(s => s.etf),
    })
  }

  if (market.vix >= 25 && market.yield10y >= 4.0) {
    signals.push({
      level: 'strong',
      icon: '🚀',
      title: '複合シグナル — 歴史的買い場の可能性',
      body: '恐怖指数上昇＋高金利という組み合わせは、長期視点では最高の仕込み時である可能性が高い。',
      etfs: ['VOO', 'VTI', 'SCHD', 'TLT'],
    })
  }

  return signals
}

const LEVEL_CONFIG = {
  strong:  { border:'#3b82f6', bg:'#eff6ff',      darkBg:'#172554',      label:'強シグナル', labelColor:'#3b82f6' },
  mild:    { border:'#f59e0b', bg:'#fffbeb',      darkBg:'#422006',      label:'注目',       labelColor:'#f59e0b' },
  neutral: { border:'#94a3b8', bg:'#f8fafc',      darkBg:'#1e293b',      label:'中立',       labelColor:'#94a3b8' },
}

export default function BuySignals({ market, isDark }) {
  const signals = computeSignals(market)

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">買い時シグナル</h2>
        <span className="card-sub">VIX・金利・バリュエーションから自動判定</span>
      </div>
      <div className="signals-list">
        {signals.map((sig, i) => {
          const cfg = LEVEL_CONFIG[sig.level]
          return (
            <div key={i} className="signal-card"
              style={{
                borderLeftColor: cfg.border,
                background: isDark ? cfg.darkBg : cfg.bg,
              }}>
              <div className="sig-header">
                <span className="sig-icon">{sig.icon}</span>
                <span className="sig-title">{sig.title}</span>
                <span className="sig-level" style={{ color: cfg.labelColor, borderColor: cfg.labelColor }}>
                  {cfg.label}
                </span>
              </div>
              <p className="sig-body">{sig.body}</p>
              {sig.etfs.length > 0 && (
                <div className="sig-etfs">
                  {sig.etfs.map(t => (
                    <span key={t} className="sig-etf-tag" style={{ borderColor: cfg.border, color: cfg.border }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
