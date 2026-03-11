'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchPriceHistory, fetchTradeLogs, fetchBotConfig, fetchPortfolioStats, toggleDemoMode, closeTrade } from '@/lib/supabase'
import PriceChart from '@/components/PriceChart'

const POLL_INTERVAL = 1000
const MAX_PRICE_POINTS = 100

export default function DashboardV9() {
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
    <div className="min-h-screen bg-gradient-to-br from-[#1a1512] to-[#0d0a08] text-[#c4a77d] font-serif">
      <div className="max-w-5xl mx-auto p-8">
        <header className="flex items-center justify-between mb-10 pb-6 border-b border-[#3d3428]">
          <div>
            <h1 className="text-3xl font-serif italic text-[#c4a77d]">Phantom Strike</h1>
            <p className="text-xs text-[#6b5d4d] uppercase tracking-[0.3em] mt-1">Algorithmic Trading Engine</p>
          </div>
          <button onClick={handleToggle} 
            className="px-6 py-2 border border-[#c4a77d] text-[#c4a77d] hover:bg-[#c4a77d]/10 transition-colors text-sm uppercase tracking-wider">
            {isLiveMode ? 'Live' : 'Demo'}
          </button>
        </header>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-[#151210] border border-[#3d3428] p-5 rounded-sm">
            <p className="text-xs text-[#6b5d4d] uppercase tracking-widest mb-2">Total Trades</p>
            <p className="text-4xl text-[#c4a77d]">{portfolio.totalTrades}</p>
          </div>
          <div className="bg-[#151210] border border-[#3d3428] p-5 rounded-sm">
            <p className="text-xs text-[#6b5d4d] uppercase tracking-widest mb-2">Net P&L</p>
            <p className={`text-4xl ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${totalPnl.toFixed(2)}
            </p>
          </div>
          <div className="bg-[#151210] border border-[#3d3428] p-5 rounded-sm">
            <p className="text-xs text-[#6b5d4d] uppercase tracking-widest mb-2">Win Rate</p>
            <p className="text-4xl text-[#c4a77d]">{portfolio.winRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-[#151210] border border-[#3d3428] p-5 rounded-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#3d3428]">
              <span className="text-sm text-[#6b5d4d] uppercase tracking-wider">SOL / USD Perpetual</span>
              <span className="text-2xl text-[#c4a77d]">${currentPrice?.toFixed(2) || '---'}</span>
            </div>
            <PriceChart prices={prices} currentPrice={currentPrice} />
          </div>
          <div className="bg-[#151210] border border-[#3d3428] p-5 rounded-sm">
            <h2 className="text-sm text-[#6b5d4d] uppercase tracking-widest mb-4 pb-3 border-b border-[#3d3428]">Active Position</h2>
            {openTrade ? (
              <div className="space-y-4">
                <div className="text-center py-3 border border-[#c4a77d]/30">
                  <span className={`text-2xl italic ${openTrade.direction === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                    {openTrade.direction}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-[#6b5d4d]">Entry</p>
                    <p className="text-lg">${parseFloat(openTrade.entry_price).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b5d4d]">Current</p>
                    <p className="text-lg">${currentPrice?.toFixed(2) || '---'}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-[#3d3428] space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6b5d4d]">Take Profit</span>
                    <span className="text-green-500">+1.25%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6b5d4d]">Stop Loss</span>
                    <span className="text-red-500">-5.00%</span>
                  </div>
                </div>
                {openTrade.is_demo && (
                  <button onClick={() => handleCloseTrade(openTrade, currentPrice)}
                    className="w-full py-2 border border-[#c4a77d] text-[#c4a77d] hover:bg-[#c4a77d]/10 transition-colors text-sm uppercase tracking-wider mt-4">
                    Close Position
                  </button>
                )}
              </div>
            ) : (
              <p className="text-center text-[#6b5d4d] italic py-8">No active position</p>
            )}
          </div>
        </div>

        <div className="bg-[#151210] border border-[#3d3428] p-5 rounded-sm">
          <h2 className="text-sm text-[#6b5d4d] uppercase tracking-widest mb-4 pb-3 border-b border-[#3d3428]">Trade History</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {trades.filter(t => t.id !== openTrade?.id).slice(0, 10).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between py-2 border-b border-[#3d3428]/50">
                <div className="flex items-center gap-3">
                  <span className={`${trade.direction === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.direction}
                  </span>
                  <span className="text-[#6b5d4d]">@ ${parseFloat(trade.entry_price).toFixed(2)}</span>
                  {trade.exit_price && (
                    <span className="text-[#6b5d4d]">→ ${parseFloat(trade.exit_price).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#6b5d4d] uppercase">{trade.status}</span>
                  {trade.pnl && (
                    <span className={trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
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
