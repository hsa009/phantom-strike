'use client'

import { ArrowUp, ArrowDown } from 'lucide-react'

// Calculate floating PnL for open trades
function calculateFloatingPnL(entryPrice, currentPrice, action, margin = 20, leverage = 4) {
    if (!entryPrice || !currentPrice) return null;

    const positionSizeUsd = margin * leverage;
    const solQuantity = positionSizeUsd / entryPrice;

    let pnl = 0;
    if (action === 'LONG') {
        pnl = solQuantity * (currentPrice - entryPrice);
    } else if (action === 'SHORT') {
        pnl = solQuantity * (entryPrice - currentPrice);
    }

    return pnl;
}

export default function TradeFeed({ trades, currentPrice, onCloseTrade }) {
  const formatPrice = (price) => {
    if (!price) return '-'
    return `$${parseFloat(price).toFixed(2)}`
  }

  const formatPnL = (pnl) => {
    if (pnl === null || pnl === undefined) return null;
    const isPositive = pnl >= 0;
    return isPositive ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
  }

  const getStatusColor = (status) => {
    if (status === 'OPEN') return 'bg-blue-500/20 text-blue-400'
    if (status === 'CLOSED_WIN') return 'bg-green-500/20 text-green-400'
    if (status === 'CLOSED_LOSS') return 'bg-red-500/20 text-red-400'
    return 'bg-gray-500/20 text-gray-400'
  }

  // Get the open trade
  const openTrade = trades.find(t => t.status === 'OPEN' || t.status === 'open');

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Trade Log</h3>
      
      {/* Open Trade Card with Live PnL */}
      {openTrade && currentPrice && (
        <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {openTrade.direction === 'LONG' ? (
                <ArrowUp className="w-5 h-5 text-green-500" />
              ) : (
                <ArrowDown className="w-5 h-5 text-red-500" />
              )}
              <span className={`font-bold ${openTrade.direction === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                {openTrade.direction}
              </span>
              {openTrade.is_demo && (
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                  👻 DEMO
                </span>
              )}
            </div>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
              OPEN
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-500">Entry</p>
              <p className="text-lg text-white">{formatPrice(openTrade.entry_price)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Current</p>
              <p className="text-lg text-white">{formatPrice(currentPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">uPnL</p>
              {(() => {
                const pnl = calculateFloatingPnL(openTrade.entry_price, currentPrice, openTrade.direction);
                const pnlPercent = ((currentPrice - openTrade.entry_price) / openTrade.entry_price) * 100 * (openTrade.direction === 'LONG' ? 1 : -1);
                const isPositive = pnl >= 0;
                return (
                  <div>
                    <p className={`text-lg font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPnL(pnl)}
                    </p>
                    <p className={`text-xs ${pnlPercent >= 1.25 ? 'text-green-400' : pnlPercent <= -5 ? 'text-red-400' : 'text-gray-400'}`}>
                      {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
          
          {openTrade && currentPrice && (
            <button
              onClick={() => onCloseTrade && onCloseTrade(openTrade, currentPrice)}
              className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Close Position
            </button>
          )}
        </div>
      )}
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {(() => {
          const openTradeId = openTrade?.id
          const filteredTrades = trades.filter(t => t.id !== openTradeId && t.status !== 'OPEN' && t.status !== 'open')
          const uniqueTrades = filteredTrades.filter((t, index, self) => 
            index === self.findIndex(tr => tr.id === t.id)
          )
          
          if (uniqueTrades.length === 0) {
            return <p className="text-gray-500 text-sm text-center py-4">No closed trades yet</p>
          }
          
          return uniqueTrades.map((trade) => (
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
        })()}
      </div>
    </div>
  )
}
