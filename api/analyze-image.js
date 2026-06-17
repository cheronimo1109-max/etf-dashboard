// Vercel Serverless Function — Claude Vision でポートフォリオ画像を解析
export const config = { maxDuration: 30 }

function extractJSON(text) {
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '')
  const start = stripped.indexOf('[')
  const end   = stripped.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) return null
  return stripped.slice(start, end + 1)
}

function verifyRequest(req) {
  const secret = process.env.API_SECRET
  if (secret && req.headers['x-api-secret'] === secret) return true
  const src = req.headers.origin ?? req.headers.referer ?? ''
  if (src.includes('.vercel.app') || src.includes('localhost') || src.includes('127.0.0.1')) return true
  return !secret
}

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

const PROMPT = `この画像は証券口座・投資アプリのポートフォリオ画面、または投資明細書です。
保有している金融商品（株式・ETF・投資信託）の情報をすべて抽出してください。

以下のJSON配列形式のみで返答してください（コードブロック・説明文は不要）:
[
  {
    "ticker": "ティッカーシンボル（例: SPY, VTI, 7203.T）。不明な場合は銘柄名をそのまま入れる",
    "name": "銘柄名",
    "shares": 保有数量（数値）,
    "avgCost": 平均取得単価（USD。JPYの場合はそのまま数値で。不明な場合はnull）,
    "currentPrice": 現在値（不明な場合はnull）,
    "currency": "USD" または "JPY"（不明な場合は "USD"）
  }
]

- 数値は文字列ではなく数値型で返す
- 抽出できない場合は空配列 [] を返す
- JSON以外の文字を含めない`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!verifyRequest(req)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY が設定されていません。Vercelの環境変数に追加してください。' })
  }

  const { image, mediaType = 'image/jpeg' } = req.body ?? {}
  if (!image) return res.status(400).json({ error: 'image フィールドが必要です' })

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
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
      signal: AbortSignal.timeout(25000),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(502).json({ error: `Claude API エラー: ${response.status}`, detail: err })
    }

    const json = await response.json()
    const text = json.content?.[0]?.text ?? ''

    const raw = extractJSON(text)
    if (!raw) return res.json({ holdings: [] })

    let holdings
    try {
      holdings = JSON.parse(raw)
    } catch {
      return res.json({ holdings: [] })
    }
    return res.json({ holdings })

  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
