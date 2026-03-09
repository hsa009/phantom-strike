import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function fetchPriceHistory(minutes = 60) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
  const { data } = await supabase
    .from('price_history')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(minutes)
  return data || []
}

export async function fetchAIPredictions(limit = 20) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
  const { data } = await supabase
    .from('ai_predictions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function fetchTradeLogs(limit = 20) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
  const { data } = await supabase
    .from('trade_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function fetchRejections(limit = 10) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
  const { data } = await supabase
    .from('rejections')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function fetchOpenTrades() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return []
  const { data } = await supabase
    .from('trade_logs')
    .select('*')
    .eq('status', 'open')
  return data || []
}

export async function fetchPortfolioStats() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { totalTrades: 0, closedTrades: 0, openTrades: 0, totalPnl: 0, winRate: 0 }
  }
  const trades = await fetchTradeLogs(100)
  const closed = trades.filter(t => t.status === 'closed')
  
  let totalPnl = 0
  closed.forEach(t => {
    if (t.exit_price && t.entry_price) {
      const pnl = t.direction === 'LONG' 
        ? (t.exit_price - t.entry_price) * t.size
        : (t.entry_price - t.exit_price) * t.size
      totalPnl += pnl * (t.leverage || 1)
    }
  })

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    openTrades: trades.filter(t => t.status === 'open').length,
    totalPnl,
    winRate: closed.length > 0 
      ? (closed.filter(t => {
          if (!t.exit_price) return false
          return t.direction === 'LONG' ? t.exit_price > t.entry_price : t.exit_price < t.entry_price
        }).length / closed.length * 100)
      : 0
  }
}
