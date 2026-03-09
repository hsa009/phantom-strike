import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

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
