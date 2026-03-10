'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, fetchPriceHistory, fetchTradeLogs, fetchBotConfig, fetchPortfolioStats } from '@/lib/supabase'
import Header from '@/components/Header'
import PriceChart from '@/components/PriceChart'
import TradeFeed from '@/components/TradeFeed'

const POLL_INTERVAL = 5000
const MAX_PRICE_POINTS = 100

export default function Dashboard() {
  const [prices, setPrices] = useState([])
  const [trades, setTrades] = useState([])
  const [portfolio, setPortfolio] = useState({ totalTrades: 0, totalPnl: 0, winRate: 0 })
  const [isLiveMode, setIsLiveMode] = useState(false)

  const loadData = useCallback(async () => {
    const [priceData, tradeData, portfolioData, configData] = await Promise.all([
      fetchPriceHistory(MAX_PRICE_POINTS),
      fetchTradeLogs(20),
      fetchPortfolioStats(),
      fetchBotConfig()
    ])
    
    setPrices(priceData || [])
    setTrades(tradeData || [])
    setPortfolio(portfolioData || { totalTrades: 0, totalPnl: 0, winRate: 0 })
    setIsLiveMode(!configData.is_demo_mode)
  }, [])

  useEffect(() => {
    loadData()

    if (!supabase) return

    const priceChannel = supabase
      .channel('price-history')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'price_history' }, (payload) => {
        setPrices(prev => {
          const newPrices = [...prev, payload.new]
          if (newPrices.length > MAX_PRICE_POINTS) {
            return newPrices.slice(-MAX_PRICE_POINTS)
          }
          return newPrices
        })
      })
      .subscribe()

    const tradeChannel = supabase
      .channel('trade-logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trade_logs' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTrades(prev => [payload.new, ...prev].slice(0, 20))
        } else if (payload.eventType === 'UPDATE') {
          setTrades(prev => prev.map(t => t.id === payload.new.id ? payload.new : t))
        }
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(priceChannel)
      supabase.removeChannel(tradeChannel)
    }
  }, [loadData])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-50">
      <Header isLiveMode={isLiveMode} setIsLiveMode={setIsLiveMode} />
      
      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Total Trades</p>
            <p className="text-2xl font-bold">{portfolio.totalTrades}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Total P&L</p>
            <p className={`text-2xl font-bold ${portfolio.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${portfolio.totalPnl.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Win Rate</p>
            <p className="text-2xl font-bold">{portfolio.winRate.toFixed(1)}%</p>
          </div>
        </div>

        <PriceChart prices={prices} setPrices={setPrices} trades={trades} />
        
        <div className="mt-6">
          <TradeFeed trades={trades} />
        </div>
      </main>
    </div>
  )
}
