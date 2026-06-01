export const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

export const fmt = (n) => `¥${Math.round(n).toLocaleString()}`

export const annualDividend = (s) =>
  s.shares * s.purchasePrice * (s.dividendYield / 100)

export const paymentPerMonth = (s) =>
  s.dividendMonths?.length ? annualDividend(s) / s.dividendMonths.length : 0

export const calcMonthlyData = (stocks) => {
  const arr = MONTHS.map(m => ({ month: m, amount: 0 }))
  stocks.forEach(s => {
    const pay = paymentPerMonth(s)
    s.dividendMonths?.forEach(m => { arr[m - 1].amount += pay })
  })
  return arr
}

export const calcCumulativeData = (stocks) => {
  let cum = 0
  return calcMonthlyData(stocks).map(d => ({
    month: d.month,
    cumulative: Math.round(cum += d.amount),
  }))
}

export const totalAnnual = (stocks) =>
  stocks.reduce((s, st) => s + annualDividend(st), 0)

export const totalInvestment = (stocks) =>
  stocks.reduce((s, st) => s + st.shares * st.purchasePrice, 0)
