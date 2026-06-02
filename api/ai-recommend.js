// Vercel Serverless Function — Claude でポートフォリオ分析＆ETF推薦
export const config = { maxDuration: 30 }

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY が設定されていません。Vercelの環境変数に追加してください。' })
  }

  const { holdings = [], market = {} } = req.body ?? {}

  const holdingStr = holdings.length
    ? holdings.map(h => `${h.ticker}(${h.shares}株, $${h.avgCost}/株)`).join(', ')
    : '未登録（ゼロから組む場合）'

  const prompt = `あなたは日本人投資家向けの米国ETF専門アドバイザーです。
以下の情報を分析して、次に購入すべきETFを推薦してください。

【現在の保有】
${holdingStr}

【市場状況】
- VIX恐怖指数: ${market.vix ?? '不明'}
- 米10年債利回り: ${market.yield10y ?? '不明'}%
- S&P500変化率(当日): ${market.sp500Change != null ? market.sp500Change + '%' : '不明'}

【指示】
- 今の保有に追加すると良い銘柄を4〜6件推薦
- 既に保有している銘柄は推薦しない
- 現在の市場状況（VIX・金利）を考慮する
- 日本人が買いやすい米国上場ETFを優先
- 日本語で分かりやすく説明

以下のJSON配列のみ返答（コードブロック・説明文は不要）:
[
  {
    "ticker": "ティッカー",
    "name": "銘柄名（英語）",
    "nameJa": "銘柄名（日本語）",
    "reason": "推薦理由（2〜3文、日本語）",
    "priority": "高" | "中" | "低",
    "category": "成長" | "防御" | "配当" | "国際" | "コモディティ" | "債券",
    "expenseRatio": 経費率（数値、例: 0.03）,
    "targetWeight": 推奨配分割合（%、数値、例: 10）
  }
]`

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(25000),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(502).json({ error: `Claude API エラー: ${response.status}`, detail: err })
    }

    const json = await response.json()
    const text = json.content?.[0]?.text ?? ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return res.json({ recommendations: [], raw: text })

    const recommendations = JSON.parse(match[0])
    return res.json({ recommendations })

  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
