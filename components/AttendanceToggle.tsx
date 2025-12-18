'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Status = 'in' | 'out' | 'maybe' | null

interface Props {
  eventId: string
  userId: string
  initialStatus: Status
  initialReason?: string | null
  config: {
    reqOut: boolean
    reqMaybe: boolean
  }
}

export default function AttendanceToggle({ eventId, userId, initialStatus, initialReason, config }: Props) {
  const [status, setStatus] = useState<Status>(initialStatus)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<Status>(null)
  const [reasonText, setReasonText] = useState(initialReason || '')
  
  const router = useRouter()
  const supabase = createClient()

  // 1. Initial Click Handler
  const handleVoteClick = (newStatus: Status) => {
    // If clicking same status, just open modal to edit reason
    if (status === newStatus) {
      setPendingStatus(newStatus)
      setShowModal(true)
      return
    }

    // Check Requirements
    const isMandatory = (newStatus === 'out' && config.reqOut) || (newStatus === 'maybe' && config.reqMaybe)

    if (isMandatory) {
      setPendingStatus(newStatus)
      setShowModal(true) // Force modal
    } else {
      // Direct save if no reason required
      saveVote(newStatus, reasonText)
    }
  }

  // 2. Save Logic
  const saveVote = async (newStatus: Status, reason: string | null) => {
    if (loading) return
    setLoading(true)
    
    // Optimistic Update
    setStatus(newStatus)
    setShowModal(false)

    const { error } = await supabase
      .from('attendance')
      .upsert({ 
        event_id: eventId, 
        user_id: userId, 
        status: newStatus,
        reason: reason 
      }, { onConflict: 'user_id, event_id' })

    if (!error) {
      router.refresh()
    } else {
      setStatus(initialStatus) // Revert on error
    }
    setLoading(false)
  }

  const baseClass = "flex-1 py-2 text-sm font-semibold transition-all duration-200 border-r last:border-r-0 first:rounded-l-lg last:rounded-r-lg focus:outline-none flex items-center justify-center gap-1"

  return (
    <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      
      {/* The Buttons */}
      <div className="flex w-full mt-3 border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-white">
        <button 
          onClick={() => handleVoteClick('in')}
          className={`${baseClass} ${status === 'in' ? 'bg-green-500 text-white' : 'hover:bg-gray-50 text-gray-600'}`}>
          👍 In
        </button>
        <button 
          onClick={() => handleVoteClick('maybe')}
          className={`${baseClass} ${status === 'maybe' ? 'bg-orange-400 text-white' : 'hover:bg-gray-50 text-gray-600'}`}>
          🤔 Maybe
        </button>
        <button 
          onClick={() => handleVoteClick('out')}
          className={`${baseClass} ${status === 'out' ? 'bg-red-500 text-white' : 'hover:bg-gray-50 text-gray-600'}`}>
          👎 Out
        </button>
      </div>

      {/* Edit Reason Link (Always visible if you voted) */}
      {status && (
        <div className="text-center mt-1">
          <button 
            onClick={() => { setPendingStatus(status); setShowModal(true); }}
            className="text-[10px] text-gray-400 underline hover:text-blue-500">
            {initialReason ? 'Edit note' : 'Add note'}
          </button>
        </div>
      )}

      {/* The Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-lg mb-2">
              Add a reason for <span className="uppercase">{pendingStatus}</span>
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {((pendingStatus === 'out' && config.reqOut) || (pendingStatus === 'maybe' && config.reqMaybe)) 
                ? 'A reason is required by the coach.' 
                : 'Optional: Add a note for the team.'}
            </p>
            
            <textarea 
              autoFocus
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="w-full border rounded-lg p-3 min-h-[80px] mb-4 text-sm"
              placeholder="e.g. Injured, Holiday, Work..."
            />

            <div className="flex gap-2">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button 
                disabled={((pendingStatus === 'out' && config.reqOut) || (pendingStatus === 'maybe' && config.reqMaybe)) && !reasonText.trim()}
                onClick={() => saveVote(pendingStatus!, reasonText)}
                className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}