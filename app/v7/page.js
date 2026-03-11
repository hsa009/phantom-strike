'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchPriceHistory, fetchTradeLogs, fetchBotConfig, fetchPortfolioStats, toggleDemoMode, closeTrade } from '@/lib/supabase'
import PriceChart from '@/components/PriceChart'

const POLL_INTERVAL = 1000
const MAX_PRICE_POINTS = 100

export default function DashboardV7() {
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
    <div className="min-h-screen bg-[#0f0f23] text-white font-sans">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-8">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <h1 className="text-2xl font-light tracking-[0.2em]">PHANTOM STRIKE</h1>
          </div>
          <button onClick={handleToggle} 
            className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm hover:bg-white/20 transition-all">
            {isLiveMode ? '◉ Live' : '○ Demo'}
          </button>
        </header>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/50 uppercase tracking-widest mb-2">Trades</p>
            <p className="text-5xl font-light">{portfolio.totalTrades}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/50 uppercase tracking-widest mb-2">Net P&L</p>
            <p className={`text-5xl font-light ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${totalPnl.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/50 uppercase tracking-widest mb-2">Win Rate</p>
            <p className="text-5xl font-light">{portfolio.winRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/60">SOL / USD</span>
              <span className="text-4xl font-light">{currentPrice?.toFixed(2) || '---'}</span>
            </div>
            <PriceChart prices={prices} currentPrice={currentPrice} />
          </div>
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
            <h3 className="text-white/60 text-sm uppercase tracking-widest mb-6">Position</h3>
            {openTrade ? (
              <div className="space-y-6">
                <div className="text-center">
                  <span className={`text-4xl font-light ${openTrade.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                    {openTrade.direction}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-xs text-white/40 uppercase">Entry</p>
                    <p className="text-xl">${parseFloat(openTrade.entry_price).toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-xs text-white/40 uppercase">Current</p>
                    <p className="text-xl">${currentPrice?.toFixed(2) || '---'}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">+1.25%</span>
                  <span className="text-red-400">-5%</span>
                </div>
                {openTrade.is_demo && (
                  <button onClick={() => handleCloseTrade(openTrade, currentPrice)}
                    className="w-full py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all">
                    Close Position
                  </button>
                )}
              </div>
            ) : (
              <p className="text-center text-white/30 py-12">No position</p>
            )}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
          <h3 className="text-white/60 text-sm uppercase tracking-widest mb-6">History</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {trades.filter(t => t.id !== openTrade?.id).slice(0, 10).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <span className={`${trade.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.direction}
                  </span>
                  <span className="text-white/40">@ {parseFloat(trade.entry_price).toFixed(2)}</span>
                  {trade.exit_price && (
                    <span className="text-white/40">→ {parseFloat(trade.exit_price).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-white/30 uppercase">{trade.status}</span>
                  {trade.pnl && (
                    <span className={trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
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
