'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchPriceHistory, fetchTradeLogs, fetchBotConfig, fetchPortfolioStats, toggleDemoMode, closeTrade } from '@/lib/supabase'
import PriceChart from '@/components/PriceChart'

const POLL_INTERVAL = 1000
const MAX_PRICE_POINTS = 100

export default function DashboardV3() {
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
    <div className="min-h-screen bg-[#0d0d1a] text-white font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" 
        style={{ backgroundImage: 'linear-gradient(#ff00ff22 1px, transparent 1px), linear-gradient(90deg, #00ffff22 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
      </div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
              PHANTOM_STRIKE
            </h1>
          </div>
          <button onClick={handleToggle} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-bold text-sm hover:opacity-80 transition-opacity rounded">
            {isLiveMode ? '◉ LIVE' : '○ DEMO'}
          </button>
        </header>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1a1a2e]/80 border border-cyan-500/30 backdrop-blur-sm p-5 rounded-lg">
            <p className="text-xs text-cyan-400 uppercase tracking-widest mb-1">Trades</p>
            <p className="text-4xl font-black text-white">{portfolio.totalTrades}</p>
          </div>
          <div className="bg-[#1a1a2e]/80 border border-fuchsia-500/30 backdrop-blur-sm p-5 rounded-lg">
            <p className="text-xs text-fuchsia-400 uppercase tracking-widest mb-1">P&L</p>
            <p className={`text-4xl font-black ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${totalPnl.toFixed(2)}
            </p>
            <p className={`text-xs mt-1 ${pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
            </p>
          </div>
          <div className="bg-[#1a1a2e]/80 border border-cyan-500/30 backdrop-blur-sm p-5 rounded-lg">
            <p className="text-xs text-cyan-400 uppercase tracking-widest mb-1">Win Rate</p>
            <p className="text-4xl font-black text-white">{portfolio.winRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-[#1a1a2e]/80 border border-cyan-500/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-cyan-400 text-sm font-bold">SOL-PERP</span>
              <span className="text-2xl font-black text-white">${currentPrice?.toFixed(2) || '---'}</span>
            </div>
            <PriceChart prices={prices} currentPrice={currentPrice} />
          </div>
          <div className="bg-[#1a1a2e]/80 border border-fuchsia-500/20 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-fuchsia-400 text-sm font-bold mb-4">ACTIVE POSITION</h3>
            {openTrade ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <span className={`text-3xl font-black ${openTrade.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                    {openTrade.direction}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-black/30 p-3 rounded">
                    <p className="text-xs text-gray-400">ENTRY</p>
                    <p className="text-lg font-bold">${parseFloat(openTrade.entry_price).toFixed(2)}</p>
                  </div>
                  <div className="bg-black/30 p-3 rounded">
                    <p className="text-xs text-gray-400">NOW</p>
                    <p className="text-lg font-bold">${currentPrice?.toFixed(2) || '---'}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-400">TP: +1.25%</span>
                  <span className="text-red-400">SL: -5%</span>
                </div>
                {openTrade.is_demo && (
                  <button onClick={() => handleCloseTrade(openTrade, currentPrice)}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 font-bold hover:opacity-80 transition-opacity rounded">
                    CLOSE
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">NO POSITION</div>
            )}
          </div>
        </div>

        <div className="bg-[#1a1a2e]/80 border border-cyan-500/20 backdrop-blur-sm rounded-lg p-4">
          <h3 className="text-cyan-400 text-sm font-bold mb-4">HISTORY</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {trades.filter(t => t.id !== openTrade?.id).slice(0, 10).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between py-2 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${trade.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.direction}
                  </span>
                  <span className="text-gray-400">@{parseFloat(trade.entry_price).toFixed(2)}</span>
                  {trade.exit_price && (
                    <span className="text-gray-400">→ {parseFloat(trade.exit_price).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 uppercase">{trade.status}</span>
                  {trade.pnl && (
                    <span className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
