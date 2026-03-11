'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchPriceHistory, fetchTradeLogs, fetchBotConfig, fetchPortfolioStats, toggleDemoMode, closeTrade } from '@/lib/supabase'
import Header from '@/components/Header'
import PriceChart from '@/components/PriceChart'
import TradeFeed from '@/components/TradeFeed'

const POLL_INTERVAL = 3000
const MAX_PRICE_POINTS = 100

export default function Dashboard() {
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

  const handleToggle = async (newMode) => {
    await toggleDemoMode(!newMode)
    setIsLiveMode(newMode)
  }

  const handleCloseTrade = async (trade, currentPrice) => {
    console.log('[Dashboard] Closing trade:', trade.id, 'at price:', currentPrice)
    const result = await closeTrade(trade.id, currentPrice, trade.direction, trade.entry_price)
    if (!result.error) {
      loadData()
    }
  }

  const currentPrice = prices.length > 0 ? prices[prices.length - 1].close : null;

  const calculateTotalPnL = () => {
    const closedPnL = trades
      .filter(t => t.status === 'CLOSED_WIN' || t.status === 'CLOSED_LOSS' || t.status === 'closed_win' || t.status === 'closed_loss')
      .reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0)
    
    const openTrade = trades.find(t => t.status === 'OPEN' || t.status === 'open')
    let floatingPnL = 0
    if (openTrade && currentPrice) {
      const margin = 20
      const leverage = 4
      const positionSizeUsd = margin * leverage
      const solQuantity = positionSizeUsd / openTrade.entry_price
      if (openTrade.direction === 'LONG') {
        floatingPnL = solQuantity * (currentPrice - openTrade.entry_price)
      } else if (openTrade.direction === 'SHORT') {
        floatingPnL = solQuantity * (openTrade.entry_price - currentPrice)
      }
    }
    
    console.log('[Dashboard] calculateTotalPnL:', { closedPnL, floatingPnL, openTrade: !!openTrade, currentPrice })
    return closedPnL + floatingPnL
  }

  const totalPnl = calculateTotalPnL()

  return (
    <div className="min-h-screen bg-gray-950 text-gray-50">
      <Header isLiveMode={isLiveMode} onToggle={handleToggle} />
      
      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Total Trades</p>
            <p className="text-2xl font-bold">{portfolio.totalTrades}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Total P&L</p>
            <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${totalPnl.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Win Rate</p>
            <p className="text-2xl font-bold">{portfolio.winRate.toFixed(1)}%</p>
          </div>
        </div>

        <PriceChart prices={prices} currentPrice={currentPrice} />
        
        <div className="mt-6">
          <TradeFeed trades={trades} currentPrice={currentPrice} onCloseTrade={handleCloseTrade} />
        </div>
      </main>
    </div>
  )
}
