'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateEventForm({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false) // New State
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    // 1. Get Base Data
    const title = formData.get('title')
    const type = formData.get('type')
    const location = formData.get('location')
    const startTimeStr = formData.get('date') as string
    const reqOut = formData.get('req_out') === 'on'
    const reqMaybe = formData.get('req_maybe') === 'on'
    
    // 2. Handle Recurring Logic
    const eventsToInsert = []
    
    if (isRecurring) {
      const startDate = new Date(startTimeStr)
      const endDateStr = formData.get('repeat_until') as string
      
      if (!endDateStr) {
        alert("Please pick an end date for the recurring event")
        setLoading(false)
        return
      }

      const endDate = new Date(endDateStr)
      // Set end date to end of day to include the final training
      endDate.setHours(23, 59, 59)

      let currentDate = new Date(startDate)

      // Loop: Add 7 days until we pass the end date
      while (currentDate <= endDate) {
        eventsToInsert.push({
          title,
          event_type: type,
          start_time: currentDate.toISOString(), // Convert to Supabase format
          location,
          reason_required_out: reqOut,
          reason_required_maybe: reqMaybe,
        })

        // Add 7 days
        currentDate.setDate(currentDate.getDate() + 7)
      }
    } else {
      // Single Event
      eventsToInsert.push({
        title,
        event_type: type,
        start_time: startTimeStr, // Supabase handles the raw input string well usually, but ISO is safer
        location,
        reason_required_out: reqOut,
        reason_required_maybe: reqMaybe,
      })
    }

    // 3. Batch Insert
    const { error } = await supabase.from('events').insert(eventsToInsert)

    if (!error) {
      setIsOpen(false)
      setIsRecurring(false) // Reset
      router.refresh()
    } else {
      alert(error.message)
    }
    setLoading(false)
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full mb-6 py-3 bg-gray-900 text-white rounded-xl font-semibold shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
        <span>+</span> Nieuw Event
      </button>
    )
  }

  return (
    <div className="mb-6 p-5 bg-white border border-gray-200 rounded-xl shadow-lg animate-in slide-in-from-top-4 fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">Nieuw Event</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3 text-gray-400">
        <input name="title" required placeholder="Event Name" className="w-full text-gray-800 p-2 border rounded-lg" />
        
        <div className="flex gap-2">
          <select name="type" className="p-2 text-gray-800 border rounded-lg bg-white flex-1">
            <option value="training">Training</option>
            <option value="game">Game</option>
            <option value="social">Social</option>
          </select>
          <input name="location" placeholder="Location" className="p-2 text border rounded-lg flex-1" />
        </div>

        <div>
           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date & Time</label>
           <input name="date" type="datetime-local" required className="w-full p-2 border rounded-lg text-gray-600" />
        </div>

        {/* RECURRING SECTION */}
        <div className="bg-gray-50 p-3 rounded-lg border space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer mb-2">
            <input 
              type="checkbox" 
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500" 
            />
            Repeat Weekly?
          </label>

          {isRecurring && (
            <div className="animate-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-blue-400 uppercase mb-1">Repeat until</label>
              <input 
                name="repeat_until" 
                type="date" 
                required={isRecurring}
                className="w-full p-2 border border-blue-200 rounded-lg text-gray-600 bg-white" 
              />
              <p className="text-[10px] text-blue-600 mt-1">
                Will create an event every 7 days until this date.
              </p>
            </div>
          )}
        </div>

        {/* Reason Requirements */}
        <div className="bg-gray-50 p-3 border rounded-lg space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase">Reason Requirements</p>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" name="req_out" className="rounded text-blue-600" />
            Require reason for 'Out'
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" name="req_maybe" className="rounded text-blue-600" />
            Require reason for 'Maybe'
          </label>
        </div>

        <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
          {loading ? 'Creating...' : `Create ${isRecurring ? 'Events' : 'Event'}`}
        </button>
      </form>
    </div>
  )
}