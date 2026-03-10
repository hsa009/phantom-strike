import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

async function fetchBackend(endpoint) {
  try {
    const res = await fetch(`${backendUrl}${endpoint}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (e) {
    console.error(`Backend fetch error (${endpoint}):`, e)
    return null
  }
}

export async function fetchPriceHistory(limit = 100) {
  if (!supabase) return []
  const { data } = await supabase
    .from('price_history')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit)
  return data || []
}

export async function fetchTradeLogs(limit = 20) {
  if (!supabase) return []
  const { data } = await supabase
    .from('trade_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function fetchBotConfig() {
  if (!supabase) return { is_demo_mode: true }
  const { data } = await supabase
    .from('bot_config')
    .select('*')
    .limit(1)
    .single()
  return data || { is_demo_mode: true }
}

export async function fetchPortfolioStats() {
  if (!supabase) return { totalTrades: 0, totalPnl: 0, winRate: 0 }
  const { data: trades } = await supabase
    .from('trade_logs')
    .select('*')
    .limit(100)
  
  if (!trades) return { totalTrades: 0, totalPnl: 0, winRate: 0 }
  
  const closed = trades.filter(t => t.status === 'closed_win' || t.status === 'closed_loss')
  const totalPnl = closed.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0)
  const wins = closed.filter(t => t.status === 'closed_win').length
  const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    openTrades: trades.filter(t => t.status === 'open').length,
    totalPnl,
    winRate
  }
}
