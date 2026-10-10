'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateEventServer } from '@/app/actions/events'

function toLocalInputFormat(isoStr: string | null | undefined) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export default function EditEventModal({ event }: { event: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [title, setTitle] = useState(event.title || '')
  const [type, setType] = useState(event.event_type || 'training')
  const [location, setLocation] = useState(event.location || '')
  const [startTime, setStartTime] = useState(toLocalInputFormat(event.start_time))
  const [answerBy, setAnswerBy] = useState(toLocalInputFormat(event.answer_by))
  const [reqOut, setReqOut] = useState(Boolean(event.reason_required_out))
  const [reqMaybe, setReqMaybe] = useState(Boolean(event.reason_required_maybe))

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const result = await updateEventServer(event.id, {
      title,
      event_type: type,
      location: location.trim() || null,
      start_time: new Date(startTime).toISOString(),
      answer_by: answerBy ? new Date(answerBy).toISOString() : null,
      reason_required_out: reqOut,
      reason_required_maybe: reqMaybe,
    })

    if (!result.success) {
      setErrorMsg(result.error || 'Failed to update event.')
      setLoading(false)
    } else {
      setIsOpen(false)
      setLoading(false)
      router.refresh()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-blue-600 text-sm font-semibold border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition cursor-pointer"
      >
        ✏️ Edit
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Event</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
              Event Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2.5 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Event Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                <option value="training">Training</option>
                <option value="match_home">Match (Home)</option>
                <option value="match_away">Match (Away)</option>
                <option value="social">Social</option>
                <option value="eten">Eten</option>
                <option value="eten_big_sunday">Eten (Big Sunday)</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Clubhuis"
                className="w-full p-2.5 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full p-2.5 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Answer By Deadline (Optional)
              </label>
              {answerBy && (
                <button
                  type="button"
                  onClick={() => setAnswerBy('')}
                  className="text-[10px] text-red-500 hover:underline font-semibold"
                >
                  Clear deadline
                </button>
              )}
            </div>
            <input
              type="datetime-local"
              value={answerBy}
              onChange={(e) => setAnswerBy(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
            <p className="text-xs font-bold text-gray-600 uppercase">Reason Requirements</p>
            <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
              <input
                type="checkbox"
                checked={reqOut}
                onChange={(e) => setReqOut(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              Require reason for 'Out'
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
              <input
                type="checkbox"
                checked={reqMaybe}
                onChange={(e) => setReqMaybe(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              Require reason for 'Maybe'
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
