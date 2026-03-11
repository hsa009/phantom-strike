'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchPriceHistory, fetchTradeLogs, fetchBotConfig, fetchPortfolioStats, toggleDemoMode, closeTrade } from '@/lib/supabase'
import PriceChart from '@/components/PriceChart'

const POLL_INTERVAL = 1000
const MAX_PRICE_POINTS = 100

export default function DashboardV6() {
  const [prices, setPrices] = useState([])
  const [trades, setTrades] = useState([])
  const [portfolio, setPortfolio] = useState({ totalTrades: 0, totalPnl: 0, winRate: 0 })
  const [isLiveMode, setIsLiveMode] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [priceData, tradeData, portfolioData, configData] = await Promise.all([
        fetchPriceHistory(MAX_PRICE_POINTS),
        fetchTradeLogs(20),
        fetchPortfolioStats(),
        fetchBotConfig()
      ])
      setPrices(priceData || [])
      setTrades(tradeData || [])
      setPortfolio(portfolioData || { totalTrades: 0, totalPnl: 0, winRate: 0 })
      setIsLiveMode(!configData?.is_demo_mode)
    } catch (e) {
      console.error('Load data error:', e)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [loadData])

  const handleToggle = async () => {
    await toggleDemoMode(!isLiveMode)
    setIsLiveMode(!isLiveMode)
  }

  const handleCloseTrade = async (trade, currentPrice) => {
    await closeTrade(trade.id, currentPrice, trade.direction, trade.entry_price)
    loadData()
  }

  const currentPrice = prices.length > 0 ? prices[prices.length - 1].close : null
  const openTrade = trades.find(t => t.status === 'OPEN' || t.status === 'open')

  const calculateTotalPnL = () => {
    const closedPnL = trades.filter(t => t.status?.includes('CLOSED')).reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0)
    let floatingPnL = 0
    if (openTrade && currentPrice) {
      const positionSizeUsd = 20 * 4
      const solQuantity = positionSizeUsd / openTrade.entry_price
      floatingPnL = openTrade.direction === 'LONG' 
        ? solQuantity * (currentPrice - openTrade.entry_price)
        : solQuantity * (openTrade.entry_price - currentPrice)
    }
    return closedPnL + floatingPnL
  }

  const totalPnl = calculateTotalPnL()
  const pnlPercent = openTrade && currentPrice 
    ? ((currentPrice - openTrade.entry_price) / openTrade.entry_price) * 100 * (openTrade.direction === 'LONG' ? 1 : -1)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-purple-900 text-white font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" 
        style={{ backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,.05) 50%)', backgroundSize: '20px 20px' }}>
      </div>
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-pink-500/30 to-transparent"></div>

      <div className="relative z-10 max-w-6xl mx-auto p-6">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-300 drop-shadow-lg">
            PHANTOM STRIKE
          </h1>
          <button onClick={handleToggle} 
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 font-bold italic text-sm hover:opacity-80 transition-all shadow-lg">
            {isLiveMode ? '◉ LIVE' : '○ DEMO'}
          </button>
        </header>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5">
            <p className="text-xs text-pink-300 uppercase tracking-widest mb-1">Trades</p>
            <p className="text-4xl font-black italic">{portfolio.totalTrades}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5">
            <p className="text-xs text-cyan-300 uppercase tracking-widest mb-1">P&L</p>
            <p className={`text-4xl font-black italic ${totalPnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              ${totalPnl.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5">
            <p className="text-xs text-pink-300 uppercase tracking-widest mb-1">Win Rate</p>
            <p className="text-4xl font-black italic">{portfolio.winRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-cyan-300 italic font-bold">SOL-PERP</span>
              <span className="text-3xl font-black italic text-white drop-shadow-lg">${currentPrice?.toFixed(2) || '---'}</span>
            </div>
            <PriceChart prices={prices} currentPrice={currentPrice} />
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
            <h3 className="text-pink-300 italic font-bold mb-4">POSITION</h3>
            {openTrade ? (
              <div className="space-y-4">
                <div className="text-center py-3 bg-gradient-to-r from-purple-500/50 to-pink-500/50 rounded-lg">
                  <span className={`text-3xl font-black italic ${openTrade.direction === 'LONG' ? 'text-green-300' : 'text-red-300'}`}>
                    {openTrade.direction}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-400">ENTRY</p>
                    <p className="font-bold italic">${parseFloat(openTrade.entry_price).toFixed(2)}</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-400">NOW</p>
                    <p className="font-bold italic">${currentPrice?.toFixed(2) || '---'}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs italic">
                  <span className="text-green-300">TP: +1.25%</span>
                  <span className="text-red-300">SL: -5%</span>
                </div>
                {openTrade.is_demo && (
                  <button onClick={() => handleCloseTrade(openTrade, currentPrice)}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 font-bold italic hover:opacity-80 transition-all shadow-lg">
                    CLOSE
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-pink-300/50 italic">NO POSITION</div>
            )}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
          <h3 className="text-cyan-300 italic font-bold mb-4">HISTORY</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {trades.filter(t => t.id !== openTrade?.id).slice(0, 10).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between py-2 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className={`font-bold italic ${trade.direction === 'LONG' ? 'text-green-300' : 'text-red-300'}`}>
                    {trade.direction}
                  </span>
                  <span className="text-white/60">@ {parseFloat(trade.entry_price).toFixed(2)}</span>
                  {trade.exit_price && (
                    <span className="text-white/60">→ {parseFloat(trade.exit_price).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 uppercase">{trade.status}</span>
                  {trade.pnl && (
                    <span className={`font-bold italic ${trade.pnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {trade.pnl >= 0 ? '+' : ''}${parseFloat(trade.pnl).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
