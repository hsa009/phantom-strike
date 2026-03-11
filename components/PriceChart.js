'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function PriceChart({ prices }) {
  if (!prices || prices.length === 0) {
    return <div className="bg-gray-900 p-4 rounded-lg">No price data</div>
  }

  const data = prices.map(p => ({
    time: new Date(p.created_at).toLocaleTimeString(),
    price: parseFloat(p.close)
  }))

  const latest = data[data.length - 1]?.price || 0

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="mb-4">
        <span className="text-4xl text-white">${latest.toFixed(2)}</span>
        <span className="ml-2 text-gray-500">SOL-PERP</span>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <XAxis dataKey="time" stroke="#6b7280" />
            <YAxis domain={['auto', 'auto']} stroke="#6b7280" />
            <Tooltip />
            <Area dataKey="price" stroke="#3b82f6" fill="#3b82f6" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
