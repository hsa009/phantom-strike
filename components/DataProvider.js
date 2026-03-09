'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { fetchPriceHistory, fetchAIPredictions, fetchTradeLogs, fetchRejections, fetchOpenTrades, fetchPortfolioStats } from '@/lib/supabase'

const DataContext = createContext()

export function DataProvider({ children }) {
  const [priceHistory, setPriceHistory] = useState([])
  const [aiPredictions, setAIPredictions] = useState([])
  const [tradeLogs, setTradeLogs] = useState([])
  const [rejections, setRejections] = useState([])
  const [openTrades, setOpenTrades] = useState([])
  const [portfolio, setPortfolio] = useState({ totalTrades: 0, closedTrades: 0, openTrades: 0, totalPnl: 0, winRate: 0 })
  const [lastUpdate, setLastUpdate] = useState(null)

  const loadData = async () => {
    try {
      const [prices, preds, trades, rej, open, stats] = await Promise.all([
        fetchPriceHistory(60),
        fetchAIPredictions(20),
        fetchTradeLogs(20),
        fetchRejections(10),
        fetchOpenTrades(),
        fetchPortfolioStats()
      ])
      setPriceHistory(prices)
      setAIPredictions(preds)
      setTradeLogs(trades)
      setRejections(rej)
      setOpenTrades(open)
      setPortfolio(stats)
      setLastUpdate(new Date())
    } catch (e) {
      console.error('Load error:', e)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <DataContext.Provider value={{ priceHistory, aiPredictions, tradeLogs, rejections, openTrades, portfolio, lastUpdate, refreshData: loadData }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
