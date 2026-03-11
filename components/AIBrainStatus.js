'use client'

import { useState, useEffect } from 'react'
import { fetchLastClosedTrade, fetchLatestAIPrediction } from '@/lib/supabase'

const COOLDOWN_MS = 5 * 60 * 1000

export default function AIBrainStatus({ isDark = true }) {
  const [status, setStatus] = useState('analyzing')
  const [timeLeft, setTimeLeft] = useState(0)
  const [reasoning, setReasoning] = useState('')
  const [lastDecision, setLastDecision] = useState('')
  const [confidence, setConfidence] = useState(0)

  const borderColor = isDark ? 'border-white' : 'border-black'
  const bgColor = isDark ? 'bg-[#1a1a1a]' : 'bg-white'
  const textColor = isDark ? 'text-white' : 'text-black'
  const mutedColor = isDark ? 'text-gray-400' : 'text-gray-500'
  const cardBg = isDark ? 'bg-gray-800' : 'bg-gray-100'

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const aiData = await fetchLatestAIPrediction()
        if (aiData) {
          setReasoning(aiData.reasoning_summary || aiData.reasoning || aiData.reasoning_details || 'No reasoning available')
          setLastDecision(aiData.prediction_type || aiData.decision || 'HOLD')
          setConfidence(aiData.confidence || 0)
        }

        const lastTrade = await fetchLastClosedTrade()
        
        if (lastTrade && lastTrade.created_at) {
          const closedTime = new Date(lastTrade.created_at).getTime()
          const cooldownEnd = closedTime + COOLDOWN_MS
          const now = Date.now()
          const remaining = cooldownEnd - now
          
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

  const getStatusText = () => {
    if (status === 'cooldown') return '⏳ Cooling ' + formatTime(timeLeft)
    if (status === 'ready') return '🔍 Analyzing...'
    return '🤖 Checking...'
  }

  return (
    <div className={`border-4 ${borderColor} ${bgColor} p-3 w-72 h-full mr-6 shadow-2xl`}>
      <div className={`border-b-2 ${borderColor} pb-2 mb-3`}>
        <span className={`font-bold uppercase text-sm ${textColor}`}>AI Brain</span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase ${mutedColor}`}>Status</span>
          <span className={`text-sm font-black uppercase ${textColor}`}>
            {getStatusText()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className={`${cardBg} p-2`}>
            <p className={`text-xs font-bold uppercase ${mutedColor}`}>Decision</p>
            <p className={`text-lg font-black ${lastDecision === 'LONG' ? 'text-green-500' : lastDecision === 'SHORT' ? 'text-red-500' : mutedColor}`}>
              {lastDecision}
            </p>
          </div>
          <div className={`${cardBg} p-2`}>
            <p className={`text-xs font-bold uppercase ${mutedColor}`}>Confidence</p>
            <p className={`text-lg font-black ${textColor}`}>{confidence.toFixed(0)}%</p>
          </div>
        </div>

        <div className={`${cardBg} p-2`}>
          <p className={`text-xs font-bold uppercase ${mutedColor} mb-1`}>Reasoning</p>
          <p className={`text-xs ${mutedColor} italic line-clamp-4`}>
            {reasoning || 'Waiting for AI...'}
          </p>
        </div>
      </div>
    </div>
  )
}
