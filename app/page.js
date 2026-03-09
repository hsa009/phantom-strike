'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, fetchPriceHistory, fetchTradeLogs } from '@/lib/supabase'
import Header from '@/components/Header'
import PriceChart from '@/components/PriceChart'
import TradeFeed from '@/components/TradeFeed'

const MAX_PRICE_POINTS = 100

export default function Dashboard() {
  const [prices, setPrices] = useState([])
  const [trades, setTrades] = useState([])
  const [isLiveMode, setIsLiveMode] = useState(false)

  useEffect(() => {
    if (!supabase) return

    const initData = async () => {
      const [priceData, tradeData] = await Promise.all([
        fetchPriceHistory(MAX_PRICE_POINTS),
        fetchTradeLogs(20)
      ])
      setPrices(priceData || [])
      setTrades(tradeData || [])
    }

    initData()

    const priceChannel = supabase
      .channel('price-history')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'price_history' 
      }, (payload) => {
        setPrices(prev => {
          const newPrices = [...prev, payload.new]
          if (newPrices.length > MAX_PRICE_POINTS) {
            return newPrices.slice(-MAX_PRICE_POINTS)
          }
          return newPrices
        })
      })
      .subscribe()

    const tradeChannel = supabase
      .channel('trade-logs')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'trade_logs' 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTrades(prev => [payload.new, ...prev].slice(0, 20))
        } else if (payload.eventType === 'UPDATE') {
          setTrades(prev => 
            prev.map(t => t.id === payload.new.id ? payload.new : t)
          )
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(priceChannel)
      supabase.removeChannel(tradeChannel)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-50">
      <Header isLiveMode={isLiveMode} setIsLiveMode={setIsLiveMode} />
      
      <main className="p-6 max-w-7xl mx-auto">
        <PriceChart prices={prices} setPrices={setPrices} trades={trades} />
        
        <div className="mt-6">
          <TradeFeed trades={trades} />
        </div>
      </main>
    </div>
  )
}
