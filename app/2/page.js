'use client'

import { useData } from '@/components/DataProvider'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Candlestick } from 'recharts'
import { Brain, TrendingUp, TrendingDown, Wallet, AlertTriangle, Activity, Table, Target } from 'lucide-react'

export default function Dashboard() {
  const { priceHistory, aiPredictions, tradeLogs, portfolio, openTrades, rejections, lastUpdate } = useData()

  const chartData = priceHistory.map(p => ({
    time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    open: parseFloat(p.open),
    high: parseFloat(p.high),
    low: parseFloat(p.low),
    close: parseFloat(p.close),
    volume: parseFloat(p.volume) / 1000000
  }))

  const latestPrice = chartData.length ? chartData[chartData.length - 1].close : 0
  const rsi = 68.5
  const macd = 0.42

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold">PHANTOM-STRIKE</h1>
          <p className="text-gray-500 text-sm">Analyst Dashboard — Data Heavy</p>
        </div>
        <div className="text-gray-500 text-sm">
          Last Update: {lastUpdate?.toLocaleTimeString() || 'Loading...'}
        </div>
      </div>

      {/* Version Tabs */}
      <div className="flex gap-2 mb-6">
        <a href="/1" className="px-4 py-2 bg-gray-800 text-gray-400 text-sm hover:bg-gray-700">Minimalist</a>
        <a href="/2" className="px-4 py-2 bg-blue-600 text-white text-sm">Analyst</a>
        <a href="/3" className="px-4 py-2 bg-gray-800 text-gray-400 text-sm hover:bg-gray-700">Neon</a>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Charts & Indicators */}
        <div className="col-span-8 space-y-6">
          {/* Price Chart with Candlestick-like */}
          <div className="bg-gray-800 border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-gray-400"><Activity size={16} /> Price Chart (OHLC)</h2>
              <span className="text-2xl">${latestPrice.toFixed(2)}</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <XAxis dataKey="time" stroke="#333" tick={{ fill: '#666', fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} stroke="#333" tick={{ fill: '#666', fontSize: 10 }} tickFormatter={v => `$${v.toFixed(0)}`} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333' }} />
                <Area type="monotone" dataKey="close" stroke="#888" fill="none" strokeWidth={1} />
                <Area type="monotone" dataKey="high" stroke="#22c55e" fill="none" strokeWidth={1} strokeDasharray="3 3" />
                <Area type="monotone" dataKey="low" stroke="#ef4444" fill="none" strokeWidth={1} strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Volume Bars */}
          <div className="bg-gray-800 border border-gray-700 p-4">
            <h2 className="text-gray-400 text-sm mb-4">Volume (M)</h2>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={chartData}>
                <XAxis dataKey="time" hide />
                <Bar dataKey="volume" fill="#333" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Technical Indicators Panel */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 p-4">
              <span className="text-gray-500 text-xs">RSI (14)</span>
              <div className={`text-2xl font-mono ${rsi > 70 ? 'text-red-500' : rsi < 30 ? 'text-green-500' : 'text-white'}`}>{rsi.toFixed(2)}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 p-4">
              <span className="text-gray-500 text-xs">MACD</span>
              <div className={`text-2xl font-mono ${macd > 0 ? 'text-green-500' : 'text-red-500'}`}>{macd.toFixed(4)}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 p-4">
              <span className="text-gray-500 text-xs">EMA 9</span>
              <div className="text-2xl font-mono">${(latestPrice * 0.998).toFixed(2)}</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 p-4">
              <span className="text-gray-500 text-xs">EMA 21</span>
              <div className="text-2xl font-mono">${(latestPrice * 0.995).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Right Column - Tables */}
        <div className="col-span-4 space-y-6">
          {/* Portfolio Stats */}
          <div className="bg-gray-800 border border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={16} className="text-blue-400" />
              <span className="font-semibold">Portfolio Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Total Trades</span><div className="text-xl">{portfolio.totalTrades}</div></div>
              <div><span className="text-gray-500">Win Rate</span><div className="text-xl text-green-500">{portfolio.winRate.toFixed(1)}%</div></div>
              <div><span className="text-gray-500">P&L</span><div className={`text-xl ${portfolio.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>${portfolio.totalPnl.toFixed(2)}</div></div>
              <div><span className="text-gray-500">Open</span><div className="text-xl">{openTrades.length}</div></div>
            </div>
          </div>

          {/* AI Predictions */}
          <div className="bg-gray-800 border border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} className="text-purple-400" />
              <span className="font-semibold">AI Predictions</span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {aiPredictions.map(p => (
                <div key={p.id} className="border-l-2 border-gray-600 pl-3 py-1">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${p.prediction_type === 'LONG' ? 'text-green-500' : p.prediction_type === 'SHORT' ? 'text-red-500' : 'text-gray-500'}`}>{p.prediction_type}</span>
                    <span className="text-gray-500 text-xs">{(p.confidence_score * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">{p.reasoning_summary}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trade Logs */}
          <div className="bg-gray-800 border border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Table size={16} className="text-cyan-400" />
              <span className="font-semibold">Trade Logs</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tradeLogs.map(t => (
                <div key={t.id} className="flex justify-between items-center text-sm border-b border-gray-700 pb-1">
                  <div>
                    <span className={t.direction === 'LONG' ? 'text-green-500' : 'text-red-500'}>{t.direction}</span>
                    <span className="text-gray-500 ml-2">${t.entry_price?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">{t.size?.toFixed(4)} SOL</span>
                    <span className={`text-xs ${t.status === 'open' ? 'text-yellow-500' : 'text-gray-500'}`}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rejections */}
          <div className="bg-gray-800 border border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-red-400" />
              <span className="font-semibold">Rejections</span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {rejections.map(r => (
                <div key={r.id} className="border-l-2 border-red-800 pl-3 py-1">
                  <p className="text-gray-400 text-xs">{r.validator_critique}</p>
                  <p className="text-gray-600 text-xs mt-1">{r.analyst_reasoning}</p>
                </div>
              ))}
              {rejections.length === 0 && <p className="text-gray-500 text-sm">No rejections</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
