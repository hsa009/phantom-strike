'use client'

import { useState, useEffect } from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

export default function PriceChart({ prices, trades }) {
  const chartData = prices.map((p, i) => ({
    time: i,
    price: parseFloat(p.close)
  }))

  const latestPrice = prices.length > 0 ? parseFloat(prices[prices.length - 1].close) : 0

  console.log('[PriceChart] Rendering with', chartData.length, 'data points')

  if (chartData.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="text-center text-gray-500 py-20">
          Waiting for price data...
        </div>
      </div>
    )
  }

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

      <div className="h-80" style={{ border: '1px solid red' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <XAxis dataKey="time" stroke="#6b7280" />
            <YAxis domain={['auto', 'auto']} stroke="#6b7280" />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#3b82f6" 
              fill="#3b82f6"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
