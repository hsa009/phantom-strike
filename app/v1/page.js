'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchPriceHistory, fetchTradeLogs, fetchBotConfig, fetchPortfolioStats, toggleDemoMode, closeTrade } from '@/lib/supabase'
import PriceChart from '@/components/PriceChart'

const POLL_INTERVAL = 1000
const MAX_PRICE_POINTS = 100

function TerminalCard({ title, children, className = '' }) {
  return (
    <div className={`border-2 border-green-500/50 bg-black/80 backdrop-blur-sm ${className}`}>
      <div className="border-b-2 border-green-500/30 px-3 py-1 flex items-center gap-2">
        <span className="text-green-400 text-xs">▸</span>
        <span className="text-green-500 text-xs font-mono uppercase tracking-wider">{title}</span>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

export default function DashboardV1() {
  const [prices, setPrices] = useState([])
  const [trades, setTrades] = useState([])
  const [portfolio, setPortfolio] = useState({ totalTrades: 0, totalPnl: 0, winRate: 0 })
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [scanlineY, setScanlineY] = useState(0)

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
    const interval = setInterval(() => {
      setScanlineY(Math.random() * 100)
    }, 100)
    return () => clearInterval(interval)
  }, [])

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
    const closedPnL = trades
      .filter(t => t.status?.includes('CLOSED'))
      .reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0)
    let floatingPnL = 0
    if (openTrade && currentPrice) {
      const positionSizeUsd = 20 * 4
      const solQuantity = positionSizeUsd / openTrade.entry_price
      if (openTrade.direction === 'LONG') {
        floatingPnL = solQuantity * (currentPrice - openTrade.entry_price)
      } else {
        floatingPnL = solQuantity * (openTrade.entry_price - currentPrice)
      }
    }
    return closedPnL + floatingPnL
  }

  const totalPnl = calculateTotalPnL()
  const pnlPercent = openTrade && currentPrice ? ((currentPrice - openTrade.entry_price) / openTrade.entry_price) * 100 * (openTrade.direction === 'LONG' ? 1 : -1) : 0

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-5" 
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff00 2px, #00ff00 4px)' }}>
      </div>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-green-500/5 to-transparent animate-pulse"
        style={{ transform: `translateY(${scanlineY}%)` }}>
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8 border-b-2 border-green-500/30 pb-4">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold tracking-widest">PHANTOM_STRIKE</span>
            <span className="text-xs text-green-600 animate-pulse">■ LIVE</span>
          </div>
          <button onClick={handleToggle}
            className="border border-green-500 px-4 py-1 text-sm hover:bg-green-500/20 transition-colors">
            [{isLiveMode ? 'LIVE' : 'DEMO'}]
          </button>
        </header>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <TerminalCard title="TOTAL_TRADES">
            <div className="text-4xl font-bold">{portfolio.totalTrades}</div>
            <div className="text-xs text-green-600 mt-1">▸ SCANS COMPLETE</div>
          </TerminalCard>
          <TerminalCard title="NET_PnL">
            <div className={`text-4xl font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${totalPnl.toFixed(2)}
            </div>
            <div className="text-xs text-green-600 mt-1">
              ▸ {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}% FLOAT
            </div>
          </TerminalCard>
          <TerminalCard title="WIN_RATE">
            <div className="text-4xl font-bold">{portfolio.winRate.toFixed(1)}%</div>
            <div className="text-xs text-green-600 mt-1">▸ ACCURACY</div>
          </TerminalCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <TerminalCard title="SOL_PERP_CHART">
              <PriceChart prices={prices} currentPrice={currentPrice} />
            </TerminalCard>
          </div>
          <TerminalCard title="ACTIVE_POSITION">
            {openTrade ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xl font-bold ${openTrade.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                    {openTrade.direction}
                  </span>
                  <span className="text-xs text-green-600">▸ {openTrade.is_demo ? 'SIMULATION' : 'LIVE'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-green-600">ENTRY</div>
                    <div>${parseFloat(openTrade.entry_price).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-green-600">CURRENT</div>
                    <div>${currentPrice?.toFixed(2) || '---'}</div>
                  </div>
                </div>
                <div className="border-t border-green-500/30 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">TARGET:</span>
                    <span className="text-green-400">+1.25%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">STOP:</span>
                    <span className="text-red-400">-5.00%</span>
                  </div>
                </div>
                {openTrade.is_demo && (
                  <button onClick={() => handleCloseTrade(openTrade, currentPrice)}
                    className="w-full border border-red-500 text-red-500 py-2 text-sm hover:bg-red-500/20 transition-colors mt-2">
                    [FORCE_CLOSE]
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-green-600">
                <span className="animate-pulse">▸ NO ACTIVE POSITION</span>
              </div>
            )}
          </TerminalCard>
        </div>

        <TerminalCard title="TRADE_LOG">
          <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-sm">
            {trades.filter(t => t.id !== openTrade?.id).slice(0, 10).map((trade) => (
              <div key={trade.id} className="flex items-center justify-between border border-green-500/20 p-2">
                <div className="flex items-center gap-3">
                  <span className={trade.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}>
                    {trade.direction}
                  </span>
                  <span className="text-green-600">@</span>
                  <span>${parseFloat(trade.entry_price).toFixed(2)}</span>
                  {trade.exit_price && (
                    <>
                      <span className="text-green-600">→</span>
                      <span>${parseFloat(trade.exit_price).toFixed(2)}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`${trade.status?.includes('CLOSED') ? (trade.pnl >= 0 ? 'text-green-400' : 'text-red-400') : 'text-yellow-400'}`}>
                    {trade.status?.toUpperCase()}
                  </span>
                  {trade.pnl && (
                    <span className={trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {trade.pnl >= 0 ? '+' : ''}${parseFloat(trade.pnl).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TerminalCard>
      </div>
    </div>
  )
}
