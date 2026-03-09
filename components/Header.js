'use client'

import { useState, useEffect } from 'react'
import { backendUrl, fetchBotConfig } from '@/lib/supabase'
import { Activity, Wifi, WifiOff, Loader2 } from 'lucide-react'

export default function Header({ isLiveMode, setIsLiveMode }) {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function checkConnection() {
      try {
        const res = await fetch(`${backendUrl}/health`)
        setConnected(res.ok)
      } catch (e) {
        setConnected(false)
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 10000)
    
    fetchBotConfig().then(config => {
      setIsLiveMode(!config.is_demo_mode)
    }).catch(() => {})

    return () => clearInterval(interval)
  }, [setIsLiveMode])

  const handleToggle = async () => {
    setLoading(true)
    try {
      const newMode = !isLiveMode
      const res = await fetch(`${backendUrl}/toggle-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode ? 'live' : 'demo' })
      })
      if (res.ok) {
        setIsLiveMode(newMode)
      }
    } catch (e) {
      console.error('Toggle error:', e)
    }
    setLoading(false)
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950">
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-white" />
        <h1 className="text-xl font-bold tracking-tight text-gray-50">PHANTOM-STRIKE</h1>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-full transition-all cursor-pointer ${
            isLiveMode 
              ? 'bg-green-500/20 border border-green-500' 
              : 'bg-yellow-500/20 border border-yellow-500'
          } ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <span className={`text-sm font-medium ${isLiveMode ? 'text-green-400' : 'text-yellow-400'}`}>
              {isLiveMode ? '● LIVE' : '○ DEMO'}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {connected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-xs font-medium ${connected ? 'text-green-500' : 'text-red-500'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  )
}
