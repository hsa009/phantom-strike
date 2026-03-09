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
  return await fetchBackend('/price-history') || []
}

export async function fetchTradeLogs(limit = 20) {
  return await fetchBackend('/trade-logs') || []
}

export async function fetchBotConfig() {
  return await fetchBackend('/config') || { is_demo_mode: true }
}

export async function fetchPortfolioStats() {
  return await fetchBackend('/portfolio-stats') || { totalTrades: 0, totalPnl: 0, winRate: 0 }
}
