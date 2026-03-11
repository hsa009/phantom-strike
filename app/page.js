'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchPriceHistory, fetchTradeLogs, fetchBotConfig, fetchPortfolioStats, toggleDemoMode, closeTrade } from '@/lib/supabase'
import PriceChart from '@/components/PriceChart'
import AIBrainStatus from '@/components/AIBrainStatus'

const POLL_INTERVAL = 1000
const MAX_PRICE_POINTS = 100

export default function DashboardV5() {
  const [prices, setPrices] = useState([])
  const [trades, setTrades] = useState([])
  const [portfolio, setPortfolio] = useState({ totalTrades: 0, totalPnl: 0, winRate: 0 })
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [isDark, setIsDark] = useState(true)

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

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

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

  const bgColor = isDark ? 'bg-[#0a0a0a]' : 'bg-[#f0f0f0]'
  const textColor = isDark ? 'text-white' : 'text-black'
  const cardBg = isDark ? 'bg-[#1a1a1a]' : 'bg-white'
  const borderColor = isDark ? 'border-white' : 'border-black'
  const borderClass = `border-4 ${borderColor}`

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} font-sans transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto p-4">
        <header className={`flex items-center justify-between mb-6 pb-4 border-b-4 ${borderColor}`}>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Phantom Strike</h1>
          <div className="flex items-center gap-3">
            <AIBrainStatus isDark={isDark} />
            <button onClick={() => setIsDark(!isDark)} 
              className={`px-4 py-2 border-2 ${borderColor} font-bold uppercase text-sm hover:bg-yellow-400 hover:text-black transition-colors`}>
              {isDark ? '☀ LIGHT' : '☾ DARK'}
            </button>
            <button onClick={handleToggle} 
              className={`px-6 py-3 ${borderColor} bg-yellow-400 text-black font-bold uppercase text-sm hover:bg-yellow-300 transition-colors`}>
              {isLiveMode ? 'LIVE' : 'DEMO'}
            </button>
          </div>
        </header>

        <div className={`grid grid-cols-3 gap-0 mb-6 ${borderClass} ${cardBg}`}>
          <div className={`p-6 border-r-4 ${borderColor}`}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2">TRADES</p>
            <p className="text-6xl font-black">{portfolio.totalTrades}</p>
          </div>
          <div className={`p-6 border-r-4 ${borderColor}`}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2">NET P&L</p>
            <p className={`text-6xl font-black ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${totalPnl.toFixed(2)}
            </p>
          </div>
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-2">WIN RATE</p>
            <p className="text-6xl font-black">{portfolio.winRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 mb-6">
          <div className={`lg:col-span-2 ${borderClass} ${cardBg} p-4`}>
            <div className={`flex items-center justify-between mb-2 pb-2 border-b-2 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
              <span className="font-bold uppercase">SOL-PERP</span>
              <span className="text-4xl font-black">${currentPrice?.toFixed(2) || '---'}</span>
            </div>
            <PriceChart prices={prices} currentPrice={currentPrice} />
          </div>
          <div className={`${borderClass} ${cardBg} p-4 lg:ml-[-4px]`}>
            <div className={`border-b-4 ${borderColor} pb-2 mb-4`}>
              <span className="font-bold uppercase">POSITION</span>
            </div>
            {openTrade ? (
              <div className="space-y-4">
                <div className={`text-center py-4 ${isDark ? 'bg-white' : 'bg-black'} ${isDark ? 'text-black' : 'text-white'}`}>
                  <span className="text-4xl font-black block">{openTrade.direction}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-200'} p-3`}>
                    <p className="text-xs font-bold uppercase">ENTRY</p>
                    <p className="text-xl font-black">${parseFloat(openTrade.entry_price).toFixed(2)}</p>
                  </div>
                  <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-200'} p-3`}>
                    <p className="text-xs font-bold uppercase">NOW</p>
                    <p className="text-xl font-black">${currentPrice?.toFixed(2) || '---'}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm font-bold uppercase border-t-2 border-current pt-2">
                  <span className="text-green-500">TP: +1.25%</span>
                  <span className="text-red-500">SL: -5%</span>
                </div>
                {openTrade.is_demo && (
                  <button onClick={() => handleCloseTrade(openTrade, currentPrice)}
                    className="w-full py-4 bg-red-600 text-white font-black uppercase text-lg hover:bg-yellow-400 hover:text-black transition-colors border-2 border-black mt-2">
                    CLOSE
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 font-bold uppercase text-gray-400">NO POSITION</div>
            )}
          </div>
        </div>

        <div className={`${borderClass} ${cardBg} p-4`}>
          <div className={`border-b-4 ${borderColor} pb-2 mb-4`}>
            <span className="font-bold uppercase">HISTORY</span>
          </div>
          <div className="space-y-0 max-h-64 overflow-y-auto">
            {trades.filter(t => t.id !== openTrade?.id).slice(0, 10).map((trade) => (
              <div key={trade.id} className={`flex items-center justify-between py-3 border-b-2 ${isDark ? 'border-gray-800' : 'border-gray-200'} hover:bg-yellow-100 dark:hover:bg-yellow-900 transition-colors`}>
                <div className="flex items-center gap-4">
                  <span className={`font-black uppercase ${trade.direction === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
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
                    <span className={`font-black ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
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
