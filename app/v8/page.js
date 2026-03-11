'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchPriceHistory, fetchTradeLogs, fetchBotConfig, fetchPortfolioStats, toggleDemoMode, closeTrade } from '@/lib/supabase'
import PriceChart from '@/components/PriceChart'

const POLL_INTERVAL = 1000
const MAX_PRICE_POINTS = 100

export default function DashboardV8() {
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
    <div className="min-h-screen bg-[#ff3300] text-[#0033cc] font-sans">
      <div className="bg-white min-h-screen p-4 md:p-8">
        <header className="flex items-start justify-between mb-8 border-b-8 border-[#0033cc] pb-4">
          <div>
            <h1 className="text-6xl font-bold tracking-tighter leading-none">PHANTOM<br/>STRIKE</h1>
          </div>
          <div className="text-right">
            <button onClick={handleToggle} 
              className="bg-[#0033cc] text-white px-6 py-3 font-bold text-lg hover:bg-[#ff3300] transition-colors">
              {isLiveMode ? 'LIVE' : 'DEMO'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0033cc] text-white p-6">
            <p className="text-sm font-bold uppercase tracking-widest mb-2">TRADES</p>
            <p className="text-7xl font-bold leading-none">{portfolio.totalTrades}</p>
          </div>
          <div className="bg-[#0033cc] text-white p-6">
            <p className="text-sm font-bold uppercase tracking-widest mb-2">P&L</p>
            <p className={`text-7xl font-bold leading-none ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${totalPnl.toFixed(2)}
            </p>
          </div>
          <div className="bg-[#0033cc] text-white p-6">
            <p className="text-sm font-bold uppercase tracking-widest mb-2">WIN RATE</p>
            <p className="text-7xl font-bold leading-none">{portfolio.winRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 border-4 border-[#0033cc] p-4">
            <div className="flex items-center justify-between mb-4 border-b-4 border-[#0033cc] pb-2">
              <span className="text-xl font-bold uppercase">SOL / USD PERPETUAL</span>
              <span className="text-5xl font-bold">${currentPrice?.toFixed(2) || '---'}</span>
            </div>
            <PriceChart prices={prices} currentPrice={currentPrice} />
          </div>
          <div className="border-4 border-[#0033cc] p-4">
            <div className="border-b-4 border-[#0033cc] pb-2 mb-4">
              <span className="text-xl font-bold uppercase">POSITION</span>
            </div>
            {openTrade ? (
              <div className="space-y-4">
                <div className="text-center py-6 bg-[#0033cc] text-white">
                  <span className="text-5xl font-bold block">{openTrade.direction}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-2 border-[#0033cc] p-3 text-center">
                    <p className="text-xs font-bold uppercase">ENTRY</p>
                    <p className="text-xl font-bold">${parseFloat(openTrade.entry_price).toFixed(2)}</p>
                  </div>
                  <div className="border-2 border-[#0033cc] p-3 text-center">
                    <p className="text-xs font-bold uppercase">NOW</p>
                    <p className="text-xl font-bold">${currentPrice?.toFixed(2) || '---'}</p>
                  </div>
                </div>
                <div className="flex justify-between font-bold border-t-2 border-[#0033cc] pt-2">
                  <span className="text-green-600">TP +1.25%</span>
                  <span className="text-red-600">SL -5%</span>
                </div>
                {openTrade.is_demo && (
                  <button onClick={() => handleCloseTrade(openTrade, currentPrice)}
                    className="w-full py-4 bg-[#ff3300] text-white font-bold text-xl hover:bg-[#0033cc] transition-colors">
                    CLOSE
                  </button>
                )}
              </div>
            ) : (
              <p className="text-center py-12 font-bold text-[#0033cc]/50">NO POSITION</p>
            )}
          </div>
        </div>

        <div className="border-4 border-[#0033cc] p-4">
          <div className="border-b-4 border-[#0033cc] pb-2 mb-4">
            <span className="text-xl font-bold uppercase">HISTORY</span>
          </div>
          <div className="space-y-0 max-h-64 overflow-y-auto">
            {trades.filter(t => t.id !== openTrade?.id).slice(0, 10).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between py-3 border-b-2 border-gray-200 hover:bg-[#ff3300] hover:text-white transition-colors">
                <div className="flex items-center gap-4">
                  <span className={`font-bold ${trade.direction === 'LONG' ? 'text-green-600' : 'text-red-600'}`}>
                    {trade.direction}
                  </span>
                  <span className="font-bold">@ {parseFloat(trade.entry_price).toFixed(2)}</span>
                  {trade.exit_price && (
                    <span className="font-bold">→ {parseFloat(trade.exit_price).toFixed(2)}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold uppercase text-xs">{trade.status}</span>
                  {trade.pnl && (
                    <span className={`font-bold ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
