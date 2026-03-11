'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchPriceHistory, fetchTradeLogs, fetchBotConfig, fetchPortfolioStats, toggleDemoMode, closeTrade } from '@/lib/supabase'
import PriceChart from '@/components/PriceChart'

const POLL_INTERVAL = 1000
const MAX_PRICE_POINTS = 100

export default function DashboardV2() {
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
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0] font-serif" style={{ backgroundImage: 'radial-gradient(ellipse at top, #1a1a1a 0%, #0a0a0a 50%)' }}>
      <div className="max-w-7xl mx-auto p-8">
        <header className="flex items-center justify-between mb-12 border-b border-[#2a2a2a] pb-6">
          <div>
            <h1 className="text-3xl font-light tracking-[0.3em] text-[#c9a962]">PHANTOM STRIKE</h1>
            <p className="text-xs text-[#666] mt-1 tracking-widest">ALGORITHMIC TRADING</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-[#666] uppercase tracking-wider">Status</p>
              <p className="text-[#c9a962]">{isLiveMode ? 'Live Trading' : 'Paper Trading'}</p>
            </div>
            <button onClick={handleToggle} className="px-6 py-2 border border-[#c9a962] text-[#c9a962] hover:bg-[#c9a962]/10 transition-all text-sm tracking-wider">
              {isLiveMode ? 'GO PAPER' : 'GO LIVE'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-[#111] border border-[#222] p-6" style={{ boxShadow: '0 4px 20px rgba(201, 169, 98, 0.05)' }}>
            <p className="text-xs text-[#666] uppercase tracking-widest mb-2">Total Trades</p>
            <p className="text-5xl font-light text-[#f5f5f0]">{portfolio.totalTrades}</p>
          </div>
          <div className="bg-[#111] border border-[#222] p-6" style={{ boxShadow: '0 4px 20px rgba(201, 169, 98, 0.05)' }}>
            <p className="text-xs text-[#666] uppercase tracking-widest mb-2">Net P&L</p>
            <p className={`text-5xl font-light ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${totalPnl.toFixed(2)}
            </p>
            <p className={`text-xs mt-2 ${pnlPercent >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
              {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}% open position
            </p>
          </div>
          <div className="bg-[#111] border border-[#222] p-6" style={{ boxShadow: '0 4px 20px rgba(201, 169, 98, 0.05)' }}>
            <p className="text-xs text-[#666] uppercase tracking-widest mb-2">Win Rate</p>
            <p className="text-5xl font-light text-[#f5f5f0]">{portfolio.winRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-[#111] border border-[#222] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-light tracking-wider text-[#c9a962]">SOL / USD PERPETUAL</h2>
              <p className="text-3xl font-light">${currentPrice?.toFixed(2) || '---'}</p>
            </div>
            <PriceChart prices={prices} currentPrice={currentPrice} />
          </div>
          <div className="bg-[#111] border border-[#222] p-6">
            <h2 className="text-lg font-light tracking-wider text-[#c9a962] mb-4">Position</h2>
            {openTrade ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-[#222]">
                  <span className="text-[#666]">Direction</span>
                  <span className={`text-xl ${openTrade.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                    {openTrade.direction}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#666]">Entry Price</p>
                    <p className="text-xl">${parseFloat(openTrade.entry_price).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#666]">Current</p>
                    <p className="text-xl">${currentPrice?.toFixed(2) || '---'}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-[#222] space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Take Profit</span>
                    <span className="text-green-400">+1.25%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Stop Loss</span>
                    <span className="text-red-400">-5.00%</span>
                  </div>
                </div>
                {openTrade.is_demo && (
                  <button onClick={() => handleCloseTrade(openTrade, currentPrice)}
                    className="w-full py-3 bg-[#c9a962] text-black font-medium hover:bg-[#d4b872] transition-colors mt-4">
                    Close Position
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-[#666] italic">
                No active position
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#111] border border-[#222] p-6">
          <h2 className="text-lg font-light tracking-wider text-[#c9a962] mb-4">Trade History</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {trades.filter(t => t.id !== openTrade?.id).slice(0, 10).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between py-3 border-b border-[#222]">
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-medium ${trade.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.direction}
                  </span>
                  <span className="text-[#666]">${parseFloat(trade.entry_price).toFixed(2)}</span>
                  {trade.exit_price && (
                    <span className="text-[#666]">→ ${parseFloat(trade.exit_price).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#666]">{trade.status}</span>
                  {trade.pnl && (
                    <span className={`${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
