'use client'

import { useState, useEffect } from 'react'
import { fetchLastClosedTrade, fetchLatestAIPrediction } from '@/lib/supabase'

const COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes

export default function AIBrainStatus() {
  const [status, setStatus] = useState('analyzing')
  const [timeLeft, setTimeLeft] = useState(0)
  const [reasoning, setReasoning] = useState('')
  const [lastDecision, setLastDecision] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('[AIBrainStatus] Component mounted')
    
    const checkStatus = async () => {
      try {
        console.log('[AIBrainStatus] Checking status...')
        
        // Fetch latest AI prediction for reasoning
        const aiData = await fetchLatestAIPrediction()
        console.log('[AIBrainStatus] AI Data:', aiData)
        if (aiData) {
          setReasoning(aiData.reasoning || aiData.reasoning_details || 'No reasoning available')
          setLastDecision(aiData.decision || 'HOLD')
          setConfidence(aiData.confidence || 0)
        }

        // Fetch last closed trade for cooldown
        const lastTrade = await fetchLastClosedTrade()
        console.log('[AIBrainStatus] Last Trade:', lastTrade)
        
        if (lastTrade && lastTrade.created_at) {
          const closedTime = new Date(lastTrade.created_at).getTime()
          const cooldownEnd = closedTime + COOLDOWN_MS
          const now = Date.now()
          const remaining = cooldownEnd - now
          
          console.log('[AIBrainStatus] Cooldown remaining:', remaining)
          
          if (remaining > 0) {
            setStatus('cooldown')
            setTimeLeft(remaining)
          } else {
            setStatus('ready')
            setTimeLeft(0)
          }
        } else {
          setStatus('ready')
          setTimeLeft(0)
        }
      } catch (e) {
        console.error('[AIBrainStatus] Error:', e)
        setError(e.message)
        setStatus('ready')
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (ms) => {
    if (ms <= 0) return '00:00'
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusDisplay = () => {
    switch (status) {
      case 'cooldown':
        return (
          <span className="text-yellow-400">
            ⏳ Cooling Down ({formatTime(timeLeft)})
          </span>
        )
      case 'ready':
        return <span className="text-green-400">🔍 Analyzing Market...</span>
      default:
        return <span className="text-gray-400">🔄 Checking...</span>
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'cooldown':
        return '⏳'
      case 'ready':
        return '🔍'
      default:
        return '🤖'
    }
  }

  return (
    <div className="border-4 border-white bg-[#1a1a1a] p-4">
      <div className="border-b-4 border-white pb-2 mb-4">
        <span className="font-bold uppercase">AI Brain Status</span>
      </div>
      
      {error && <div className="text-red-500 text-sm">Error: {error}</div>}
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest">Status</span>
          <span className="text-lg font-black uppercase">
            {getStatusIcon()} {getStatusDisplay()}
          </span>
        </div>

        {status === 'cooldown' && (
          <div className="bg-black border-2 border-yellow-400 p-2 text-center">
            <span className="text-4xl font-black text-yellow-400">
              {formatTime(timeLeft)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800 p-2">
            <p className="text-xs font-bold uppercase">Decision</p>
            <p className={`text-xl font-black ${lastDecision === 'LONG' ? 'text-green-500' : lastDecision === 'SHORT' ? 'text-red-500' : 'text-gray-400'}`}>
              {lastDecision}
            </p>
          </div>
          <div className="bg-gray-800 p-2">
            <p className="text-xs font-bold uppercase">Confidence</p>
            <p className="text-xl font-black">{confidence.toFixed(0)}%</p>
          </div>
        </div>

        <div className="bg-gray-800 p-3">
          <p className="text-xs font-bold uppercase mb-1">Latest Reasoning</p>
          <p className="text-sm text-gray-400 italic">
            {reasoning || 'Waiting for AI analysis...'}
          </p>
        </div>
      </div>
    </div>
  )
}
