'use client'

import { useState, useEffect } from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Scatter, ComposedChart 
} from 'recharts'
import { supabase, fetchPriceHistory, fetchTradeLogs } from '@/lib/supabase'

const MAX_PRICE_POINTS = 100

export default function PriceChart({ prices, setPrices, trades }) {
  const [tradesWithPrice, setTradesWithPrice] = useState([])

  useEffect(() => {
    fetchTradeLogs(50).then(setTradesWithPrice)
  }, [])

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const chartData = prices.map(p => ({
    ...p,
    time: formatTime(p.created_at),
    price: parseFloat(p.close)
  }))

  const tradeMarkers = tradesWithPrice
    .filter(t => t.status === 'OPEN' && t.entry_price)
    .map(t => ({
      x: t.entry_price,
      y: parseFloat(t.entry_price),
      direction: t.direction,
      type: 'trade'
    }))

  const latestPrice = prices.length > 0 ? parseFloat(prices[prices.length - 1].close) : 0

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <span className="text-4xl font-light text-gray-50">${latestPrice.toFixed(2)}</span>
          <span className="ml-2 text-lg text-gray-500">SOL-PERP</span>
        </div>
        <div className="text-sm text-gray-500">
          {prices.length} points
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="#6b7280" 
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={['auto', 'auto']} 
              stroke="#6b7280" 
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              width={60}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#111827', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#f3f4f6' }}
              formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fill="url(#priceGradient)" 
            />
            {tradeMarkers.length > 0 && (
              <Scatter 
                data={tradeMarkers} 
                dataKey="y"
                shape={(props) => {
                  const { cx, cy, payload } = props
                  const color = payload.direction === 'LONG' ? '#22c55e' : '#ef4444'
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={6} 
                      fill={color} 
                      stroke="#fff" 
                      strokeWidth={2}
                    />
                  )
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>LONG Entry</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span>SHORT Entry</span>
        </div>
      </div>
    </div>
  )
}
