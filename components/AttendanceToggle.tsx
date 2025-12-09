'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Status = 'in' | 'out' | 'maybe' | null

export default function AttendanceToggle({ 
  eventId, 
  userId, 
  initialStatus 
}: { eventId: string, userId: string, initialStatus: Status }) {
  
  const [status, setStatus] = useState<Status>(initialStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleVote = async (newStatus: Status) => {
    if (loading || status === newStatus) return
    setLoading(true)
    
    // Optimistic UI update
    setStatus(newStatus)

    const { error } = await supabase
      .from('attendance')
      .upsert({ 
        event_id: eventId, 
        user_id: userId, 
        status: newStatus 
      }, { onConflict: 'user_id, event_id' })

    if (error) {
      console.error(error)
      setStatus(initialStatus)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  const baseClass = "flex-1 py-2 text-sm font-semibold transition-all duration-200 border-r last:border-r-0 first:rounded-l-lg last:rounded-r-lg focus:outline-none"

  return (
    <div 
      // FIX: We catch the click here inside the Client Component
      onClick={(e) => {
        e.preventDefault() // Stop the Link from opening
        e.stopPropagation() // Stop the event bubbling
      }}
      className="flex w-full mt-3 border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-white"
    >
      <button 
        onClick={() => handleVote('in')}
        className={`${baseClass} ${status === 'in' ? 'bg-green-500 text-white' : 'hover:bg-gray-50 text-gray-600'}`}>
        👍 In
      </button>
      <button 
        onClick={() => handleVote('maybe')}
        className={`${baseClass} ${status === 'maybe' ? 'bg-orange-400 text-white' : 'hover:bg-gray-50 text-gray-600'}`}>
        🤔 Maybe
      </button>
      <button 
        onClick={() => handleVote('out')}
        className={`${baseClass} ${status === 'out' ? 'bg-red-500 text-white' : 'hover:bg-gray-50 text-gray-600'}`}>
        👎 Out
      </button>
    </div>
  )
}