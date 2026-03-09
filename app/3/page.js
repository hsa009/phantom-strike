'use client'

import { useData } from '@/components/DataProvider'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Brain, Cpu, Zap, Target, Activity, Wallet, AlertTriangle, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const { priceHistory, aiPredictions, tradeLogs, portfolio, openTrades, rejections, lastUpdate } = useData()

  const chartData = priceHistory.map(p => ({
    time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: parseFloat(p.close)
  }))

  const latestPrice = chartData.length ? chartData[chartData.length - 1].price : 0
  const latestPrediction = aiPredictions[0]

  return (
    <div className="min-h-screen bg-black text-white p-8" style={{ background: 'radial-gradient(circle at 50% 0%, #1a0a2e 0%, #000 60%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-5xl font-bold tracking-wider" style={{ color: '#00ff88', textShadow: '0 0 20px #00ff88, 0 0 40px #00ff88' }}>PHANTOM-STRIKE</h1>
          <p className="text-purple-400 text-sm mt-2" style={{ textShadow: '0 0 10px #bf00ff' }}>Neon Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ boxShadow: '0 0 10px #00ff88' }}></div>
          <span className="text-gray-400">LIVE</span>
        </div>
      </div>

      {/* Version Tabs */}
      <div className="flex gap-2 mb-8">
        <a href="/1" className="px-4 py-2 bg-gray-900 border border-gray-700 text-gray-400 text-sm hover:bg-gray-800">Minimalist</a>
        <a href="/2" className="px-4 py-2 bg-gray-900 border border-gray-700 text-gray-400 text-sm hover:bg-gray-800">Analyst</a>
        <a href="/3" className="px-4 py-2 bg-purple-900 border border-purple-500 text-purple-400 text-sm" style={{ boxShadow: '0 0 15px #bf00ff' }}>Neon</a>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Chart */}
        <div className="col-span-8">
          <div className="glass p-6 rounded-xl" style={{ border: '1px solid rgba(191, 0, 255, 0.3)', boxShadow: '0 0 30px rgba(191, 0, 255, 0.2)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="text-purple-400" size={20} style={{ filter: 'drop-shadow(0 0 5px #bf00ff)' }} />
                <span className="text-gray-400">SOL-PERP</span>
              </div>
              <div className="text-5xl font-bold" style={{ color: '#00ff88', textShadow: '0 0 15px #00ff88' }}>
                ${latestPrice.toFixed(2)}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <XAxis dataKey="time" stroke="#333" tick={{ fill: '#666' }} />
                <YAxis domain={['auto', 'auto']} stroke="#333" tick={{ fill: '#666' }} tickFormatter={v => `$${v.toFixed(0)}`} />
                <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid #bf00ff', boxShadow: '0 0 15px #bf00ff' }} />
                <Line type="monotone" dataKey="price" stroke="#00ff88" strokeWidth={3} dot={false} style={{ filter: 'drop-shadow(0 0 8px #00ff88)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Active Position */}
          {openTrades.length > 0 && (
            <div className="mt-6 glass p-6 rounded-xl flex items-center justify-between" style={{ border: '1px solid #00ff88', boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' }}>
              <div className="flex items-center gap-4">
                <Target className="text-green-500" size={28} style={{ filter: 'drop-shadow(0 0 10px #00ff88)' }} />
                <div>
                  <span className="text-gray-400 text-sm">ACTIVE POSITION</span>
                  <div className="text-2xl font-bold" style={{ color: '#00ff88', textShadow: '0 0 10px #00ff88' }}>
                    {openTrades[0].direction} {openTrades[0].size?.toFixed(4)} SOL
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-gray-400 text-sm">Entry</span>
                <div className="text-xl">${openTrades[0].entry_price?.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="col-span-4 space-y-6">
          {/* AI Brain */}
          <div className="glass p-6 rounded-xl" style={{ border: '1px solid rgba(0, 255, 136, 0.3)', boxShadow: '0 0 20px rgba(0, 255, 136, 0.2)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Brain size={24} style={{ color: '#00ff88', filter: 'drop-shadow(0 0 5px #00ff88)' }} />
              <span className="text-xl font-bold" style={{ color: '#00ff88', textShadow: '0 0 10px #00ff88' }}>AI BRAIN</span>
            </div>

            {/* AI Nodes */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/50" style={{ border: '1px solid rgba(191, 0, 255, 0.3)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #bf00ff 0%, #6600ff 100%)', boxShadow: '0 0 15px #bf00ff' }}>
                  <Cpu size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">AI 1: Analyst</div>
                  <div className="text-purple-400">Trinity Large</div>
                </div>
              </div>

              <div className="flex justify-center">
                <Zap className="text-yellow-400" size={20} style={{ filter: 'drop-shadow(0 0 5px #ffff00)' }} />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/50" style={{ border: '1px solid rgba(0, 255, 255, 0.3)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00ffff 0%, #00ff88 100%)', boxShadow: '0 0 15px #00ffff' }}>
                  <Brain size={18} className="text-black" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">AI 2: Validator</div>
                  <div className="text-cyan-400">Gemini Flash</div>
                </div>
              </div>
            </div>

            {/* Latest Signal */}
            {latestPrediction && (
              <div className="mt-4 p-4 rounded-lg" style={{ background: latestPrediction.prediction_type === 'LONG' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 0, 100, 0.1)', border: `1px solid ${latestPrediction.prediction_type === 'LONG' ? '#00ff88' : '#ff0064'}` }}>
                <div className="text-xs text-gray-400 mb-1">LATEST SIGNAL</div>
                <div className="text-3xl font-bold" style={{ color: latestPrediction.prediction_type === 'LONG' ? '#00ff88' : '#ff0064', textShadow: `0 0 20px ${latestPrediction.prediction_type === 'LONG' ? '#00ff88' : '#ff0064'}` }}>
                  {latestPrediction.prediction_type}
                </div>
                <p className="text-gray-400 text-xs mt-2">{latestPrediction.reasoning_summary}</p>
                <div className="text-xs text-gray-500 mt-1">Confidence: {(latestPrediction.confidence_score * 100).toFixed(0)}%</div>
              </div>
            )}
          </div>

          {/* Portfolio */}
          <div className="glass p-6 rounded-xl" style={{ border: '1px solid rgba(191, 0, 255, 0.3)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={20} style={{ color: '#bf00ff', filter: 'drop-shadow(0 0 5px #bf00ff)' }} />
              <span className="font-bold" style={{ color: '#bf00ff', textShadow: '0 0 10px #bf00ff' }}>Portfolio</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-500 text-xs">TRADES</div>
                <div className="text-2xl text-white">{portfolio.totalTrades}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">WIN RATE</div>
                <div className="text-2xl text-green-500">{portfolio.winRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">P&L</div>
                <div className={`text-2xl ${portfolio.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>${portfolio.totalPnl.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs">OPEN</div>
                <div className="text-2xl text-yellow-500">{openTrades.length}</div>
              </div>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="glass p-6 rounded-xl" style={{ border: '1px solid rgba(0, 255, 136, 0.3)' }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} style={{ color: '#00ff88' }} />
              <span className="font-bold text-white">Recent Trades</span>
            </div>
            <div className="space-y-2">
              {tradeLogs.slice(0, 5).map(t => (
                <div key={t.id} className="flex justify-between items-center text-sm">
                  <span className={t.direction === 'LONG' ? 'text-green-500' : 'text-red-500'}>{t.direction}</span>
                  <span className="text-gray-400">${t.entry_price?.toFixed(2)}</span>
                  <span className={`text-xs ${t.status === 'open' ? 'text-yellow-500' : 'text-gray-500'}`}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rejections */}
          {rejections.length > 0 && (
            <div className="glass p-6 rounded-xl" style={{ border: '1px solid rgba(255, 0, 64, 0.3)' }}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={20} style={{ color: '#ff0040' }} />
                <span className="font-bold text-red-400">Rejections</span>
              </div>
              <div className="space-y-2">
                {rejections.slice(0, 3).map(r => (
                  <div key={r.id} className="text-xs text-gray-400 border-l-2 border-red-800 pl-2">
                    {r.validator_critique}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
