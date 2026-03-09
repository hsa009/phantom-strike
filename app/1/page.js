'use client'

import { useData } from '@/components/DataProvider'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Brain, TrendingUp, Wallet, Clock, AlertTriangle, BarChart3 } from 'lucide-react'

export default function Dashboard() {
  const { priceHistory, aiPredictions, tradeLogs, portfolio, openTrades, rejections, lastUpdate } = useData()

  const chartData = priceHistory.map(p => ({
    time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: parseFloat(p.close)
  }))

  const latestPrice = chartData.length ? chartData[chartData.length - 1].price : 0

  return (
    <div className="min-h-screen bg-white text-black p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PHANTOM-STRIKE</h1>
          <p className="text-gray-500">Minimalist Dashboard</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <Clock size={16} />
          {lastUpdate?.toLocaleTimeString() || 'Loading...'}
        </div>
      </div>

      {/* Version Tabs */}
      <div className="flex gap-2 mb-6">
        <a href="/1" className="px-4 py-2 bg-black text-white text-sm">Minimalist</a>
        <a href="/2" className="px-4 py-2 bg-gray-100 text-gray-600 text-sm hover:bg-gray-200">Analyst</a>
        <a href="/3" className="px-4 py-2 bg-gray-100 text-gray-600 text-sm hover:bg-gray-200">Neon</a>
      </div>

      {/* Price Chart - Main Focus */}
      <div className="mb-6">
        <div className="flex items-baseline gap-4 mb-4">
          <span className="text-5xl font-light">${latestPrice.toFixed(2)}</span>
          <span className="text-xl text-gray-500">SOL-PERP</span>
        </div>
        <div className="h-80 border border-gray-200 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis dataKey="time" stroke="#ccc" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} stroke="#ccc" tick={{ fontSize: 11 }} tickFormatter={v => `$${v.toFixed(0)}`} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #000' }} />
              <Area type="monotone" dataKey="price" stroke="#000" strokeWidth={2} fill="#f5f5f5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Portfolio Stats */}
        <div className="border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={18} />
            <span className="font-semibold">Portfolio</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Total Trades</span><span>{portfolio.totalTrades}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Win Rate</span><span>{portfolio.winRate.toFixed(1)}%</span></div>
            <div className="flex justify-between"><span className="text-gray-500">P&L</span><span className={portfolio.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}>${portfolio.totalPnl.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Open Positions</span><span>{openTrades.length}</span></div>
          </div>
        </div>

        {/* AI Predictions */}
        <div className="border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={18} />
            <span className="font-semibold">AI Predictions</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {aiPredictions.slice(0, 5).map(p => (
              <div key={p.id} className="text-sm border-l-2 border-gray-300 pl-2">
                <span className={p.prediction_type === 'LONG' ? 'text-green-600 font-bold' : p.prediction_type === 'SHORT' ? 'text-red-600 font-bold' : 'text-gray-500'}>{p.prediction_type}</span>
                <p className="text-gray-500 text-xs truncate">{p.reasoning_summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Logs */}
        <div className="border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={18} />
            <span className="font-semibold">Trade Logs</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {tradeLogs.slice(0, 5).map(t => (
              <div key={t.id} className="text-sm flex justify-between items-center">
                <span className={t.direction === 'LONG' ? 'text-green-600' : 'text-red-600'}>{t.direction}</span>
                <span className="text-gray-500">@{t.entry_price?.toFixed(2)}</span>
                <span className={`text-xs ${t.status === 'open' ? 'text-blue-600' : 'text-gray-400'}`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rejections */}
        <div className="border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} />
            <span className="font-semibold">Rejections</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {rejections.slice(0, 5).map(r => (
              <div key={r.id} className="text-sm border-l-2 border-red-300 pl-2">
                <p className="text-gray-600 text-xs truncate">{r.validator_critique}</p>
              </div>
            ))}
            {rejections.length === 0 && <p className="text-gray-400 text-sm">No rejections</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
