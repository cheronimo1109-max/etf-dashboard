// Vercel Serverless Function — Claude でポートフォリオ分析＆ETF推薦
export const config = { maxDuration: 30 }

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

// Claude の出力からJSON配列を確実に抽出する
function extractJSON(text) {
  // コードブロック除去 (```json ... ``` or ``` ... ```)
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '')
  // 最初の [ から最後の ] までを取得
  const start = stripped.indexOf('[')
  const end   = stripped.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) return null
  return stripped.slice(start, end + 1)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({
      error: 'ANTHROPIC_API_KEY が設定されていません。Vercel → Settings → Environment Variables に追加してください。',
    })
  }

  const { holdings = [], market = {} } = req.body ?? {}

  const holdingStr = holdings.length
    ? holdings.map(h => `${h.ticker}(${h.shares}株, 取得単価$${h.avgCost})`).join(', ')
    : 'なし（ゼロから組む場合として推薦）'

  const ownedTickers = holdings.map(h => h.ticker).join(', ') || 'なし'

  const prompt = `あなたは日本人個人投資家向けの米国ETFアドバイザーです。

現在の保有ETF: ${holdingStr}
既保有ティッカー（これらは推薦しない）: ${ownedTickers}

市場状況:
- VIX恐怖指数: ${market.vix ?? '不明'}
- 米10年債利回り: ${market.yield10y ?? '不明'}%
- S&P500当日変化: ${market.sp500Change != null ? market.sp500Change + '%' : '不明'}

上記を踏まえて、次に追加購入すべきETFを4〜6件、重要度の高い順に推薦してください。
既に保有しているティッカーは絶対に含めないこと。

必ず以下のJSON配列だけを返してください。コードブロック・説明・前置きは一切不要です:
[{"ticker":"VOO","name":"Vanguard S&P 500 ETF","nameJa":"バンガード S&P500 ETF","reason":"推薦理由を2〜3文で","priority":"高","category":"成長","expenseRatio":0.03,"targetWeight":20},{"ticker":"...","name":"...","nameJa":"...","reason":"...","priority":"中","category":"防御","expenseRatio":0.05,"targetWeight":10}]

priorityは「高」「中」「低」のいずれか、categoryは「成長」「防御」「配当」「国際」「コモディティ」「債券」のいずれかにしてください。`

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
      let detail = ''
      try { detail = JSON.parse(err)?.error?.message ?? err } catch { detail = err }
      return res.status(502).json({ error: `Claude API エラー (${response.status}): ${detail}` })
    }

    const json = await response.json()
    const text = json.content?.[0]?.text ?? ''

    const raw = extractJSON(text)
    if (!raw) {
      return res.status(502).json({ error: `Claude の返答をJSONとして解析できませんでした。返答: ${text.slice(0, 200)}` })
    }

    let recommendations
    try {
      recommendations = JSON.parse(raw)
    } catch (parseErr) {
      return res.status(502).json({ error: `JSONパースエラー: ${parseErr.message}`, raw: raw.slice(0, 300) })
    }

    return res.json({ recommendations })

  } catch (e) {
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      return res.status(504).json({ error: 'タイムアウト: Claude APIの応答が遅すぎます。再度お試しください。' })
    }
    return res.status(500).json({ error: e.message })
  }
}
