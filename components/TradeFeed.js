'use client'

import { ArrowUp, ArrowDown, Coins } from 'lucide-react'

export default function TradeFeed({ trades }) {
  const formatPrice = (price) => {
    if (!price) return '-'
    return `$${parseFloat(price).toFixed(2)}`
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusColor = (status) => {
    if (status === 'OPEN') return 'bg-blue-500/20 text-blue-400'
    if (status === 'CLOSED_WIN') return 'bg-green-500/20 text-green-400'
    if (status === 'CLOSED_LOSS') return 'bg-red-500/20 text-red-400'
    return 'bg-gray-500/20 text-gray-400'
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Trade Log</h3>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {trades.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No trades yet</p>
        ) : (
          trades.map((trade) => (
            <div 
              key={trade.id} 
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-800"
            >
              <div className="flex items-center gap-3">
                {trade.direction === 'LONG' ? (
                  <ArrowUp className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  trade.direction === 'LONG' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {trade.direction}
                </span>
                {trade.is_demo && (
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                    👻 DEMO
                  </span>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">Entry</p>
                <p className="text-sm text-gray-300">{formatPrice(trade.entry_price)}</p>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">Exit</p>
                <p className="text-sm text-gray-300">{formatPrice(trade.exit_price)}</p>
              </div>

              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(trade.status)}`}>
                  {trade.status}
                </span>
                {trade.pnl !== null && trade.pnl !== undefined && (
                  <p className={`text-sm mt-1 ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.pnl >= 0 ? '+' : ''}{parseFloat(trade.pnl).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
