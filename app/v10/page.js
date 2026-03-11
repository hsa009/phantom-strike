'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchPriceHistory, fetchTradeLogs, fetchBotConfig, fetchPortfolioStats, toggleDemoMode, closeTrade } from '@/lib/supabase'
import PriceChart from '@/components/PriceChart'

const POLL_INTERVAL = 1000
const MAX_PRICE_POINTS = 100

export default function DashboardV10() {
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
    <div className="min-h-screen bg-[#0a1628] text-[#4a90d9] font-mono" style={{ 
      backgroundImage: 'linear-gradient(rgba(74,144,217,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(74,144,217,0.03) 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      <div className="max-w-6xl mx-auto p-6">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-[#1e3a5f]">
          <div className="flex items-center gap-4">
            <svg className="w-8 h-8 text-[#4a90d9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h1 className="text-xl font-bold tracking-widest">PHANTOM STRIKE</h1>
            <span className="text-xs text-[#1e3a5f]">// v2.0</span>
          </div>
          <button onClick={handleToggle} 
            className="px-4 py-1 border border-[#4a90d9] text-[#4a90d9] hover:bg-[#4a90d9]/10 transition-colors text-sm">
            [{isLiveMode ? 'LIVE' : 'DEMO'}]
          </button>
        </header>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border border-[#1e3a5f] p-4 bg-[#0d1f35]/50">
            <p className="text-xs text-[#1e3a5f] mb-2">// TOTAL_TRADES</p>
            <p className="text-3xl font-bold">{portfolio.totalTrades}</p>
          </div>
          <div className="border border-[#1e3a5f] p-4 bg-[#0d1f35]/50">
            <p className="text-xs text-[#1e3a5f] mb-2">// NET_PnL</p>
            <p className={`text-3xl font-bold ${totalPnl >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
              ${totalPnl.toFixed(2)}
            </p>
          </div>
          <div className="border border-[#1e3a5f] p-4 bg-[#0d1f35]/50">
            <p className="text-xs text-[#1e3a5f] mb-2">// WIN_RATE</p>
            <p className="text-3xl font-bold">{portfolio.winRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 border border-[#1e3a5f] p-4 bg-[#0d1f35]/50">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1e3a5f]">
              <span className="text-sm">SOL_PERP // PRICE_ACTION</span>
              <span className="text-2xl font-bold">${currentPrice?.toFixed(2) || '---'}</span>
            </div>
            <PriceChart prices={prices} currentPrice={currentPrice} />
          </div>
          <div className="border border-[#1e3a5f] p-4 bg-[#0d1f35]/50">
            <p className="text-xs text-[#1e3a5f] mb-4 pb-2 border-b border-[#1e3a5f]">// ACTIVE_POSITION</p>
            {openTrade ? (
              <div className="space-y-3">
                <div className="text-center py-2 border border-[#4a90d9]">
                  <span className={`text-xl font-bold ${openTrade.direction === 'LONG' ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                    {openTrade.direction}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="border border-[#1e3a5f] p-2">
                    <p className="text-[#1e3a5f] text-xs">ENTRY</p>
                    <p>${parseFloat(openTrade.entry_price).toFixed(2)}</p>
                  </div>
                  <div className="border border-[#1e3a5f] p-2">
                    <p className="text-[#1e3a5f] text-xs">CURRENT</p>
                    <p>${currentPrice?.toFixed(2) || '---'}</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-[#1e3a5f]">
                  <span className="text-[#4ade80]">TP: +1.25%</span>
                  <span className="text-[#f87171]">SL: -5%</span>
                </div>
                {openTrade.is_demo && (
                  <button onClick={() => handleCloseTrade(openTrade, currentPrice)}
                    className="w-full py-2 border border-[#f87171] text-[#f87171] hover:bg-[#f87171]/10 transition-colors text-sm mt-2">
                    [CLOSE_POSITION]
                  </button>
                )}
              </div>
            ) : (
              <p className="text-center text-[#1e3a5f] py-8">// NO_POSITION</p>
            )}
          </div>
        </div>

        <div className="border border-[#1e3a5f] p-4 bg-[#0d1f35]/50">
          <p className="text-xs text-[#1e3a5f] mb-4 pb-2 border-b border-[#1e3a5f]">// TRADE_HISTORY</p>
          <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-sm">
            {trades.filter(t => t.id !== openTrade?.id).slice(0, 10).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between py-2 border-b border-[#1e3a5f]/30 hover:bg-[#4a90d9]/5">
                <div className="flex items-center gap-3">
                  <span className={`${trade.direction === 'LONG' ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                    {trade.direction}
                  </span>
                  <span className="text-[#1e3a5f]">@</span>
                  <span>${parseFloat(trade.entry_price).toFixed(2)}</span>
                  {trade.exit_price && (
                    <>
                      <span className="text-[#1e3a5f]">→</span>
                      <span>${parseFloat(trade.exit_price).toFixed(2)}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#1e3a5f] text-xs uppercase">{trade.status}</span>
                  {trade.pnl && (
                    <span className={trade.pnl >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}>
                      {trade.pnl >= 0 ? '+' : ''}${parseFloat(trade.pnl).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#1e3a5f] text-xs text-[#1e3a5f] flex justify-between">
          <span>PHANTOM_STRIKE_TERMINAL // {new Date().toISOString()}</span>
          <span>CONNECTION: ACTIVE</span>
        </div>
      </div>
    </div>
  )
}
