'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchPriceHistory, fetchTradeLogs, fetchBotConfig, fetchPortfolioStats, toggleDemoMode, closeTrade } from '@/lib/supabase'
import PriceChart from '@/components/PriceChart'

const POLL_INTERVAL = 1000
const MAX_PRICE_POINTS = 100

export default function DashboardV4() {
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
    <div className="min-h-screen bg-white text-[#1d1d1f] font-sans">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="flex items-center justify-between mb-16">
          <h1 className="text-xl font-semibold tracking-tight">Phantom Strike</h1>
          <button onClick={handleToggle} 
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isLiveMode ? 'bg-[#0071e3] text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'
            }`}>
            {isLiveMode ? 'Live' : 'Demo'}
          </button>
        </header>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-6 rounded-2xl bg-[#f5f5f7]">
            <p className="text-xs text-[#86868b] uppercase tracking-wide mb-1">Trades</p>
            <p className="text-4xl font-semibold">{portfolio.totalTrades}</p>
          </div>
          <div className="p-6 rounded-2xl bg-[#f5f5f7]">
            <p className="text-xs text-[#86868b] uppercase tracking-wide mb-1">P&L</p>
            <p className={`text-4xl font-semibold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              ${totalPnl.toFixed(2)}
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-[#f5f5f7]">
            <p className="text-xs text-[#86868b] uppercase tracking-wide mb-1">Win Rate</p>
            <p className="text-4xl font-semibold">{portfolio.winRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-[#f5f5f7] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[#86868b]">SOL / USD</span>
              <span className="text-3xl font-semibold">${currentPrice?.toFixed(2) || '—'}</span>
            </div>
            <PriceChart prices={prices} currentPrice={currentPrice} />
          </div>
          <div className="bg-[#f5f5f7] rounded-2xl p-6">
            <h3 className="text-sm font-medium text-[#86868b] mb-4">Position</h3>
            {openTrade ? (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <span className={`text-2xl font-semibold ${openTrade.direction === 'LONG' ? 'text-green-600' : 'text-red-500'}`}>
                    {openTrade.direction}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-[#86868b]">Entry</p>
                    <p className="font-medium">${parseFloat(openTrade.entry_price).toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#86868b]">Current</p>
                    <p className="font-medium">${currentPrice?.toFixed(2) || '—'}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-[#86868b] pt-3 border-t border-gray-200">
                  <span>TP: +1.25%</span>
                  <span>SL: -5%</span>
                </div>
                {openTrade.is_demo && (
                  <button onClick={() => handleCloseTrade(openTrade, currentPrice)}
                    className="w-full py-2.5 bg-[#0071e3] text-white rounded-full text-sm font-medium hover:bg-[#0077ed] transition-colors">
                    Close
                  </button>
                )}
              </div>
            ) : (
              <p className="text-center text-[#86868b] py-8">No position</p>
            )}
          </div>
        </div>

        <div className="bg-[#f5f5f7] rounded-2xl p-6">
          <h3 className="text-sm font-medium text-[#86868b] mb-4">History</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {trades.filter(t => t.id !== openTrade?.id).slice(0, 10).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between py-2 border-b border-gray-200/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${trade.direction === 'LONG' ? 'text-green-600' : 'text-red-500'}`}>
                    {trade.direction}
                  </span>
                  <span className="text-sm text-[#86868b]">@ {parseFloat(trade.entry_price).toFixed(2)}</span>
                  {trade.exit_price && (
                    <span className="text-sm text-[#86868b]">→ {parseFloat(trade.exit_price).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#86868b] uppercase">{trade.status}</span>
                  {trade.pnl && (
                    <span className={`text-sm font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
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
