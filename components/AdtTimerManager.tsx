'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdtTimerManager({ profiles, initialAdts }: any) {
  const [mode, setMode] = useState<'view' | 'add_manual' | 'add_record'>('view')
  
  // Stopwatch
  const [time, setTime] = useState(0) // time in 10ms increments (centiseconds)
  const [running, setRunning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Form state
  const [selectedUser, setSelectedUser] = useState('')
  const [manualTime, setManualTime] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1)
      }, 10)
    } else if (!running && timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [running])

  const handleStartStop = () => {
    setRunning(!running)
  }

  const handleReset = () => {
    setRunning(false)
    setTime(0)
  }

  const handleSave = async (timeInSeconds: number) => {
    if (!selectedUser) {
      alert("Please select a player.")
      return
    }
    setLoading(true)
    const { error } = await supabase.from('adts').insert({
      user_id: selectedUser,
      time_seconds: timeInSeconds
    })
    
    if (error) alert(error.message)
    else {
      alert("Adt recorded successfully! 🍻")
      setMode('view')
      setTime(0)
      setManualTime('')
    }
    setLoading(false)
    router.refresh()
  }

  // Calculate Leaderboard
  // 1. Fastest time per user
  // 2. Amount of adts per user
  const userStats = profiles.map((p: any) => {
    const userAdts = initialAdts.filter((a: any) => a.user_id === p.id)
    const count = userAdts.length
    const fastest = count > 0 ? Math.min(...userAdts.map((a: any) => Number(a.time_seconds))) : null
    const fastestRecord = userAdts.find((a: any) => Number(a.time_seconds) === fastest)
    return {
      ...p,
      count,
      fastest,
      fastestDate: fastestRecord ? fastestRecord.recorded_at : null
    }
  }).filter((p: any) => p.count > 0).sort((a: any, b: any) => (a.fastest || Infinity) - (b.fastest || Infinity))

  const formatTime = (centiseconds: number) => {
    const secs = Math.floor(centiseconds / 100)
    const ms = centiseconds % 100
    return `${secs}.${ms.toString().padStart(2, '0')}s`
  }

  return (
    <div className="max-w-md mx-auto p-4 mt-2">
      {mode === 'view' && (
        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode('add_record')} className="flex-1 bg-yellow-500 text-white font-bold py-3 rounded-xl shadow-sm hover:bg-yellow-600 transition flex items-center justify-center gap-2">
            ⏱️ Record Adt
          </button>
          <button onClick={() => setMode('add_manual')} className="flex-1 bg-white border-2 border-yellow-500 text-yellow-600 font-bold py-3 rounded-xl shadow-sm hover:bg-yellow-50 transition flex items-center justify-center gap-2">
            📝 Add Manual
          </button>
        </div>
      )}

      {mode === 'add_record' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6 text-center animate-in fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Stopwatch</h3>
            <button onClick={() => setMode('view')} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
          </div>
          
          <div className="text-6xl font-black text-gray-900 mb-8 font-mono">
            {formatTime(time)}
          </div>
          
          <div className="flex gap-4 justify-center mb-8">
            <button 
              onClick={handleStartStop} 
              className={`w-20 h-20 rounded-full font-bold text-white shadow-lg flex items-center justify-center text-lg ${running ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {running ? 'STOP' : 'START'}
            </button>
            <button 
              onClick={handleReset} 
              disabled={running || time === 0}
              className="w-20 h-20 rounded-full font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 shadow-sm flex items-center justify-center text-lg"
            >
              RESET
            </button>
          </div>

          {!running && time > 0 && (
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 animate-in slide-in-from-bottom-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 text-left">Save to Player</label>
              <select 
                value={selectedUser} 
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 mb-3 bg-white font-medium"
              >
                <option value="">-- Select Player --</option>
                {profiles.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
              <button 
                disabled={loading}
                onClick={() => handleSave(time / 100)} 
                className="w-full bg-yellow-500 text-white font-bold py-3 rounded-xl hover:bg-yellow-600 transition"
              >
                {loading ? 'Saving...' : 'Save Time'}
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'add_manual' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6 animate-in fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Manual Entry</h3>
            <button onClick={() => setMode('view')} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
          </div>
          
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Player</label>
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 mb-4 bg-white font-medium outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="">-- Select Player --</option>
            {profiles.map((p: any) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>

          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Time (Seconds)</label>
          <input 
            type="number" 
            step="0.01" 
            placeholder="e.g. 5.43"
            value={manualTime}
            onChange={(e) => setManualTime(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 mb-6 bg-white font-medium outline-none focus:ring-2 focus:ring-yellow-500"
          />

          <button 
            disabled={loading || !manualTime}
            onClick={() => handleSave(Number(manualTime))} 
            className="w-full bg-yellow-500 text-white font-bold py-3 rounded-xl hover:bg-yellow-600 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Time'}
          </button>
        </div>
      )}

      {mode === 'view' && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-bold text-xl text-gray-900">🏆 Wall of Fast</h2>
          </div>
          
          {userStats.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
               <p className="text-4xl mb-2">🏜️</p>
               <p className="text-gray-500 font-medium">No adts recorded yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userStats.map((s: any, idx: number) => (
                <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
                  <div className="flex items-center gap-4">
                    <span className={`font-black w-6 text-center ${idx === 0 ? 'text-yellow-500 text-xl' : idx === 1 ? 'text-gray-400 text-lg' : idx === 2 ? 'text-amber-700 text-lg' : 'text-gray-300'}`}>
                      {idx + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-yellow-50 flex items-center justify-center text-sm font-bold text-yellow-600 uppercase border border-yellow-100">
                        {s.full_name?.charAt(0)}
                      </div>
                      <div>
                        <Link href={`/team/player/${s.id}`} className="font-bold text-gray-900 hover:text-blue-600 transition block">
                          {s.full_name}
                        </Link>
                        <p className="text-[10px] text-gray-400 font-semibold">{s.count} total adt{s.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xl text-gray-900 font-mono tracking-tight">
                      {s.fastest.toFixed(2)}s
                    </p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold mt-0.5">
                      {new Date(s.fastestDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
