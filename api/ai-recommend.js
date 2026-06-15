// Vercel Serverless Function — Gemini Flash (無料枠) でETF推薦
export const config = { maxDuration: 30 }

const GEMINI_MODEL = 'gemini-2.0-flash'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY が設定されていません。Vercel → Settings → Environment Variables に追加してください。',
    })
  }

  const { holdings = [], market = {} } = req.body ?? {}

  const ownedTickers = holdings.map(h => h.ticker).join(', ') || 'なし'
  const holdingStr   = holdings.length
    ? holdings.map(h => `${h.ticker}(${h.shares}株, 取得単価$${h.avgCost})`).join(', ')
    : 'なし（初めて投資する場合として推薦）'

  const prompt = `あなたは日本人個人投資家向けの米国ETFアドバイザーです。

現在の保有ETF: ${holdingStr}
既保有ティッカー（推薦しないこと）: ${ownedTickers}

市場状況:
- VIX恐怖指数: ${market.vix ?? '不明'}
- 米10年債利回り: ${market.yield10y ?? '不明'}%
- S&P500当日変化: ${market.sp500Change != null ? market.sp500Change + '%' : '不明'}

上記を踏まえて次に追加購入すべきETFを4〜6件、重要度の高い順に推薦してください。
既保有ティッカーは絶対に含めないこと。

以下のJSONスキーマに従ったJSON配列を返してください:
[
  {
    "ticker": "string (例: VOO)",
    "name": "string (英語の正式銘柄名)",
    "nameJa": "string (日本語名)",
    "reason": "string (推薦理由を2〜3文、日本語)",
    "priority": "string (高 または 中 または 低)",
    "category": "string (成長 または 防御 または 配当 または 国際 または コモディティ または 債券)",
    "expenseRatio": "number (経費率。例: 0.03)",
    "targetWeight": "number (推奨配分割合%。例: 20)"
  }
]`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
      }),
      signal: AbortSignal.timeout(25000),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const msg = err?.error?.message ?? `HTTP ${response.status}`
      return res.status(502).json({ error: `Gemini API エラー: ${msg}` })
    }

    const json = await response.json()
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // responseMimeType: application/json を指定しているので直接パース可能
    let recommendations
    try {
      recommendations = JSON.parse(text)
      // オブジェクトが返ってきた場合は配列に変換
      if (!Array.isArray(recommendations)) {
        recommendations = Object.values(recommendations)[0] ?? []
      }
    } catch (e) {
      return res.status(502).json({ error: `JSONパースエラー: ${e.message}`, raw: text.slice(0, 300) })
    }

    return res.json({ recommendations })

  } catch (e) {
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      return res.status(504).json({ error: 'タイムアウト: Gemini APIの応答が遅すぎます。再度お試しください。' })
    }
    return res.status(500).json({ error: e.message })
  }
}
