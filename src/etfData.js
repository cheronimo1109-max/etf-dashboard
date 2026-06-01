// ─── US ETFs ──────────────────────────────────────────────
export const DEFAULT_MARKET = {
  vix: 18.5, yield10y: 4.35, sp500Change: 0.42,
  lastUpdate: '2026-05-27 16:00 ET',
}

export const SECTORS = [
  { id:'comm',     name:'コミュニケーション', etf:'XLC',  ytd: 35.2, pe:20.4, valuation:'fair',  cycle:'mid',   color:'#6366f1' },
  { id:'tech',     name:'テクノロジー',       etf:'XLK',  ytd: 28.5, pe:32.1, valuation:'high',  cycle:'mid',   color:'#3b82f6' },
  { id:'finance',  name:'金融',               etf:'XLF',  ytd: 18.2, pe:15.6, valuation:'fair',  cycle:'early', color:'#10b981' },
  { id:'indust',   name:'資本財',             etf:'XLI',  ytd: 14.6, pe:22.5, valuation:'fair',  cycle:'early', color:'#14b8a6' },
  { id:'cons_d',   name:'一般消費財',         etf:'XLY',  ytd: 12.4, pe:28.9, valuation:'high',  cycle:'mid',   color:'#f59e0b' },
  { id:'material', name:'素材',               etf:'XLB',  ytd:  5.7, pe:19.8, valuation:'fair',  cycle:'early', color:'#84cc16' },
  { id:'energy',   name:'エネルギー',         etf:'XLE',  ytd:  8.3, pe:12.8, valuation:'low',   cycle:'late',  color:'#f97316' },
  { id:'health',   name:'ヘルスケア',         etf:'XLV',  ytd: -2.1, pe:22.4, valuation:'fair',  cycle:'late',  color:'#ec4899' },
  { id:'cons_s',   name:'生活必需品',         etf:'XLP',  ytd: -1.8, pe:20.1, valuation:'fair',  cycle:'rec',   color:'#a78bfa' },
  { id:'util',     name:'ユーティリティ',     etf:'XLU',  ytd: -5.2, pe:18.3, valuation:'low',   cycle:'rec',   color:'#94a3b8' },
  { id:'real',     name:'不動産',             etf:'XLRE', ytd: -8.4, pe:38.5, valuation:'high',  cycle:'rec',   color:'#fb7185' },
]

export const ETFS = [
  { ticker:'VOO',  name:'Vanguard S&P 500',              cat:'broad',     yield:1.32, exp:0.03, ytd: 26.2, price: 498.52, aum:'4.2T', memo:'米国大型500銘柄' },
  { ticker:'VTI',  name:'Vanguard Total Market',         cat:'broad',     yield:1.38, exp:0.03, ytd: 25.8, price: 258.33, aum:'4.0T', memo:'米国全市場' },
  { ticker:'QQQ',  name:'Invesco Nasdaq 100',            cat:'growth',    yield:0.57, exp:0.20, ytd: 55.1, price: 484.96, aum:'2.4T', memo:'ナスダック100' },
  { ticker:'SCHD', name:'Schwab US Dividend Equity',     cat:'dividend',  yield:3.56, exp:0.06, ytd:  4.1, price:  27.42, aum:'520B', memo:'高配当・連続増配' },
  { ticker:'VYM',  name:'Vanguard High Dividend Yield',  cat:'dividend',  yield:2.92, exp:0.06, ytd:  9.8, price: 128.05, aum:'580B', memo:'高配当（広範）' },
  { ticker:'HDV',  name:'iShares Core High Dividend',    cat:'dividend',  yield:3.91, exp:0.08, ytd:  7.2, price: 109.38, aum:'110B', memo:'高配当（厳選75銘柄）' },
  { ticker:'VGT',  name:'Vanguard Info Technology',      cat:'sector',    yield:0.64, exp:0.10, ytd: 49.3, price: 598.40, aum:'680B', memo:'テクノロジーセクター' },
  { ticker:'XLE',  name:'Energy Select Sector SPDR',     cat:'sector',    yield:3.52, exp:0.09, ytd:  8.3, price:  92.18, aum:'410B', memo:'エネルギーセクター' },
  { ticker:'ARKK', name:'ARK Innovation ETF',            cat:'growth',    yield:0.00, exp:0.75, ytd: 25.8, price:  54.22, aum: '65B', memo:'破壊的イノベーション' },
  { ticker:'AGG',  name:'iShares Core US Aggregate Bd',  cat:'bond',      yield:3.58, exp:0.03, ytd:  3.5, price:  97.84, aum:'1.0T', memo:'米国総合債券' },
  { ticker:'TLT',  name:'iShares 20+ Year Treasury',     cat:'bond',      yield:4.21, exp:0.15, ytd: -8.2, price:  89.32, aum:'480B', memo:'長期米国国債' },
  { ticker:'GLD',  name:'SPDR Gold Shares',              cat:'commodity', yield:0.00, exp:0.40, ytd: 13.2, price: 218.40, aum:'580B', memo:'ゴールド' },
  { ticker:'VXUS', name:'Vanguard Total International',  cat:'intl',      yield:3.05, exp:0.07, ytd: 15.7, price:  60.88, aum:'650B', memo:'米国除く全世界' },
  { ticker:'VNQ',  name:'Vanguard Real Estate ETF',      cat:'sector',    yield:3.96, exp:0.12, ytd: -4.8, price:  81.25, aum:'290B', memo:'米国不動産(REIT)' },
]

// ─── International ETFs ────────────────────────────────────
export const INTL_ETFS = [
  { ticker:'EWJ',  name:'iShares MSCI Japan',              region:'japan',     yield:1.82, exp:0.50, ytd:  5.2, price: 67.38, aum:'160B', memo:'日本株（ヘッジなし）' },
  { ticker:'DXJ',  name:'WisdomTree Japan Hedged Equity',  region:'japan',     yield:1.65, exp:0.48, ytd: 18.3, price: 98.12, aum: '45B', memo:'日本株（USD為替ヘッジ）' },
  { ticker:'DBJP', name:'Xtrackers MSCI Japan Hedged',     region:'japan',     yield:1.40, exp:0.45, ytd: 16.8, price: 41.55, aum: '12B', memo:'日本株（低コストヘッジ）' },
  { ticker:'VGK',  name:'Vanguard European Stock Index',   region:'europe',    yield:3.42, exp:0.11, ytd: 12.8, price: 68.45, aum:'190B', memo:'欧州先進国株' },
  { ticker:'EWG',  name:'iShares MSCI Germany',            region:'europe',    yield:2.15, exp:0.51, ytd:  8.5, price: 28.90, aum: '28B', memo:'ドイツ株' },
  { ticker:'EWU',  name:'iShares MSCI United Kingdom',     region:'europe',    yield:4.21, exp:0.51, ytd:  7.2, price: 36.75, aum: '38B', memo:'英国株' },
  { ticker:'EZU',  name:'iShares MSCI Eurozone',           region:'europe',    yield:3.10, exp:0.35, ytd: 11.2, price: 47.82, aum: '72B', memo:'ユーロ圏株' },
  { ticker:'VWO',  name:'Vanguard Emerging Markets',       region:'em',        yield:3.15, exp:0.08, ytd:  9.4, price: 45.22, aum:'670B', memo:'新興国株（広範）' },
  { ticker:'EEM',  name:'iShares MSCI Emerging Markets',   region:'em',        yield:2.58, exp:0.70, ytd:  8.9, price: 42.18, aum:'250B', memo:'新興国株' },
  { ticker:'IEMG', name:'iShares Core MSCI Emerging Mkt',  region:'em',        yield:2.72, exp:0.09, ytd:  9.1, price: 53.84, aum:'860B', memo:'新興国株（低コスト）' },
  { ticker:'EZA',  name:'iShares MSCI South Africa',       region:'em',        yield:3.85, exp:0.59, ytd:  5.6, price: 42.80, aum:  '6B', memo:'南アフリカ株' },
  { ticker:'KWEB', name:'KraneShares CSI China Internet',  region:'china',     yield:0.00, exp:0.76, ytd: 25.8, price: 31.50, aum: '52B', memo:'中国インターネット株' },
  { ticker:'FXI',  name:'iShares China Large-Cap',         region:'china',     yield:1.85, exp:0.74, ytd: 18.4, price: 32.80, aum: '58B', memo:'中国大型株' },
  { ticker:'INDA', name:'iShares MSCI India',              region:'india',     yield:0.24, exp:0.65, ytd: 15.2, price: 52.40, aum: '85B', memo:'インド株' },
  { ticker:'INDY', name:'iShares India 50',                region:'india',     yield:0.18, exp:0.93, ytd: 14.8, price: 45.20, aum:  '8B', memo:'インド大型株50' },
  { ticker:'EWZ',  name:'iShares MSCI Brazil',             region:'latam',     yield:8.42, exp:0.59, ytd: -3.2, price: 28.40, aum: '42B', memo:'ブラジル株' },
  { ticker:'GXG',  name:'Global X MSCI Colombia',          region:'latam',     yield:4.12, exp:0.61, ytd:  6.5, price: 12.80, aum:  '2B', memo:'コロンビア株' },
  { ticker:'EWW',  name:'iShares MSCI Mexico',             region:'latam',     yield:3.42, exp:0.51, ytd:  5.8, price: 52.30, aum: '18B', memo:'メキシコ株' },
  { ticker:'EWY',  name:'iShares MSCI South Korea',        region:'korea',     yield:1.12, exp:0.51, ytd:  8.2, price: 58.40, aum: '48B', memo:'韓国株（サムスン・SK等）' },
  { ticker:'EWT',  name:'iShares MSCI Taiwan',             region:'taiwan',    yield:2.05, exp:0.57, ytd: 12.8, price: 52.20, aum: '72B', memo:'台湾株（TSMC等）' },
  { ticker:'EWA',  name:'iShares MSCI Australia',          region:'australia', yield:4.82, exp:0.51, ytd:  7.4, price: 24.80, aum: '22B', memo:'豪州株（資源・金融）' },
  { ticker:'EWC',  name:'iShares MSCI Canada',             region:'canada',    yield:2.65, exp:0.51, ytd:  9.1, price: 38.50, aum: '38B', memo:'カナダ株' },
  { ticker:'KSA',  name:'iShares MSCI Saudi Arabia',       region:'mideast',   yield:2.85, exp:0.74, ytd:  3.2, price: 38.10, aum: '10B', memo:'サウジアラビア株' },
  { ticker:'UAE',  name:'iShares MSCI UAE',                region:'mideast',   yield:2.10, exp:0.59, ytd:  4.8, price: 18.50, aum:  '2B', memo:'UAEドバイ株' },
  { ticker:'EWM',  name:'iShares MSCI Malaysia',           region:'asean',     yield:3.58, exp:0.51, ytd:  4.5, price: 22.40, aum:  '8B', memo:'マレーシア株' },
  { ticker:'EWS',  name:'iShares MSCI Singapore',          region:'asean',     yield:4.12, exp:0.51, ytd:  6.2, price: 20.80, aum:  '9B', memo:'シンガポール株' },
  { ticker:'THD',  name:'iShares MSCI Thailand',           region:'asean',     yield:2.25, exp:0.59, ytd: -2.8, price: 52.60, aum:  '5B', memo:'タイ株' },
  { ticker:'VNM',  name:'VanEck Vietnam ETF',              region:'asean',     yield:1.05, exp:0.66, ytd:  8.4, price: 13.20, aum:  '3B', memo:'ベトナム株' },
  { ticker:'EPHE', name:'iShares MSCI Philippines',        region:'asean',     yield:1.52, exp:0.59, ytd:  2.1, price: 26.50, aum:  '2B', memo:'フィリピン株' },
  { ticker:'VT',   name:'Vanguard Total World Stock',      region:'global',    yield:2.05, exp:0.07, ytd: 20.4, price:113.20, aum:'570B', memo:'全世界株（米国含む）' },
  { ticker:'ACWI', name:'iShares MSCI ACWI',               region:'global',    yield:1.85, exp:0.33, ytd: 19.8, price:107.35, aum:'220B', memo:'全世界株（MSCI）' },
]

export const REGION_LABELS = {
  japan:     '🇯🇵 日本',
  europe:    '🇪🇺 欧州',
  em:        '🌏 新興国',
  china:     '🇨🇳 中国',
  india:     '🇮🇳 インド',
  latam:     '🌎 中南米',
  global:    '🌍 全世界',
  korea:     '🇰🇷 韓国',
  taiwan:    '🇹🇼 台湾',
  australia: '🇦🇺 豪州',
  canada:    '🇨🇦 カナダ',
  asean:     '🌏 東南アジア',
  mideast:   '🕌 中東',
}

export const REGION_COLORS = {
  japan:     '#ef4444',
  europe:    '#3b82f6',
  em:        '#10b981',
  china:     '#f59e0b',
  india:     '#8b5cf6',
  latam:     '#06b6d4',
  global:    '#6366f1',
  korea:     '#0ea5e9',
  taiwan:    '#14b8a6',
  australia: '#f97316',
  canada:    '#84cc16',
  asean:     '#ec4899',
  mideast:   '#a78bfa',
}

export const CAT_LABELS = {
  broad:'分散', growth:'グロース', dividend:'配当',
  sector:'セクター', bond:'債券', commodity:'コモディティ', intl:'海外',
}

export const CAT_COLORS = {
  broad:'#3b82f6', growth:'#8b5cf6', dividend:'#10b981',
  sector:'#f59e0b', bond:'#64748b', commodity:'#f97316', intl:'#ec4899',
}

// ─── Sector rotation ───────────────────────────────────────
export const CYCLE_PHASES = [
  { id:'early', label:'景気回復期', angle:225, sectors:['金融','素材','資本財'],               desc:'景気底打ち・金融緩和',  color:'#10b981' },
  { id:'mid',   label:'景気拡大期', angle:315, sectors:['テクノロジー','一般消費財','通信'],   desc:'企業収益・消費拡大',    color:'#3b82f6' },
  { id:'late',  label:'景気成熟期', angle: 45, sectors:['エネルギー','ヘルスケア'],            desc:'インフレ・金利上昇',    color:'#f59e0b' },
  { id:'rec',   label:'景気後退期', angle:135, sectors:['生活必需品','ユーティリティ','REIT'], desc:'景気縮小・防御色',      color:'#ef4444' },
]

export const CURRENT_CYCLE_PHASE = 'mid'

// ─── Sample portfolio holdings ─────────────────────────────
export const SAMPLE_HOLDINGS = [
  { id:'h1', ticker:'VOO',  shares: 15,  avgCost: 420.00 },
  { id:'h2', ticker:'QQQ',  shares:  8,  avgCost: 380.00 },
  { id:'h3', ticker:'SCHD', shares: 60,  avgCost:  75.00 },
  { id:'h4', ticker:'EWJ',  shares: 80,  avgCost:  62.00 },
  { id:'h5', ticker:'VWO',  shares: 40,  avgCost:  44.00 },
  { id:'h6', ticker:'TLT',  shares: 20,  avgCost:  98.00 },
]
