import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

console.log('[Dashboard] Supabase URL:', supabaseUrl)
console.log('[Dashboard] Supabase Key set:', !!supabaseKey)

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : null

export async function fetchPriceHistory(limit = 100) {
  console.log('[Dashboard] fetchPriceHistory, supabase exists:', !!supabase);
  if (!supabase) return []
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  console.log('[Dashboard] price result:', data?.length, 'error:', error);
  // Reverse to show oldest to newest on chart
  return (data || []).reverse();
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

export async function toggleDemoMode(isDemo) {
  if (!supabase) return
  const { data } = await supabase.from('bot_config').select('id').limit(1).single()
  if (data) {
    await supabase.from('bot_config').update({ is_demo_mode: isDemo }).eq('id', data.id)
  }
}

export async function closeTrade(tradeId, exitPrice, direction, entryPrice) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) return null
  
  const margin = 20
  const leverage = 4
  const positionSizeUsd = margin * leverage
  const solQuantity = positionSizeUsd / entryPrice
  
  let pnl = 0
  if (direction === 'LONG') {
    pnl = solQuantity * (exitPrice - entryPrice)
  } else if (direction === 'SHORT') {
    pnl = solQuantity * (entryPrice - exitPrice)
  }

  console.log('[Dashboard] closeTrade:', { tradeId, exitPrice, pnl, entryPrice: parseFloat(entryPrice) })

  try {
    const exitPriceNum = parseFloat(exitPrice)
    const pnlValue = parseFloat(pnl.toFixed(2))
    
    console.log('[Dashboard] Attempting to close trade with:', { exit_price: exitPriceNum, pnl: pnlValue, status: 'closed' })
    
    const response = await fetch(`${supabaseUrl}/rest/v1/trade_logs?id=eq.${tradeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        exit_price: exitPriceNum,
        pnl: pnlValue,
        status: 'closed'
      })
    })
    
    console.log('[Dashboard] Trade closed response:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('[Dashboard] Trade closed error:', errorText)
    }
    
    return { data: null, error: response.ok ? null : new Error(response.statusText) }
  } catch (err) {
    console.log('[Dashboard] Trade closed exception:', err)
    return { data: null, error: err }
  }
}
