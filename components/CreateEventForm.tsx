'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateEventForm({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    const { error } = await supabase.from('events').insert({
      title: formData.get('title'),
      event_type: formData.get('type'),
      start_time: formData.get('date'), // HTML datetime-local input
      location: formData.get('location'),
    })

    if (!error) {
      setIsOpen(false)
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
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="title" required placeholder="Event Name (e.g. Derby vs Ajax)" className="w-full p-2 border rounded-lg" />
        
        <div className="flex gap-2">
          <select name="type" className="p-2 border rounded-lg bg-white flex-1">
            <option value="training">Training</option>
            <option value="game">Game</option>
            <option value="social">Social</option>
          </select>
          <input name="location" placeholder="Location" className="p-2 border rounded-lg flex-1" />
        </div>

        <input name="date" type="datetime-local" required className="w-full p-2 border rounded-lg text-gray-600" />

        <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
          {loading ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  )
}