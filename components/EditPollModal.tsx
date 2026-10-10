'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updatePollServer } from '@/app/actions/polls'

function toLocalDateInput(isoStr: string | null | undefined) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toLocalDatetimeInput(isoStr: string | null | undefined) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditPollModal({ poll }: { poll: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [question, setQuestion] = useState(poll.question || '')
  const [options, setOptions] = useState<string[]>(Array.isArray(poll.options) ? [...poll.options] : ['', ''])
  const [maxChoices, setMaxChoices] = useState<number>(poll.max_choices || 1)
  const [relevantDate, setRelevantDate] = useState(toLocalDateInput(poll.relevant_date))
  const [answerBy, setAnswerBy] = useState(toLocalDatetimeInput(poll.answer_by))

  const router = useRouter()

  const handleOptionChange = (idx: number, val: string) => {
    const next = [...options]
    next[idx] = val
    setOptions(next)
  }

  const addOption = () => {
    setOptions([...options, ''])
  }

  const removeOption = (idx: number) => {
    if (options.length <= 2) {
      alert('A poll must have at least 2 options.')
      return
    }
    setOptions(options.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const validOptions = options.map(o => o.trim()).filter(Boolean)
    if (validOptions.length < 2) {
      setErrorMsg('Please provide at least 2 valid options.')
      setLoading(false)
      return
    }

    const result = await updatePollServer(poll.id, {
      question: question.trim(),
      options: validOptions,
      max_choices: maxChoices,
      relevant_date: relevantDate ? new Date(relevantDate).toISOString() : null,
      answer_by: answerBy ? new Date(answerBy).toISOString() : null,
    })

    if (!result.success) {
      setErrorMsg(result.error || 'Failed to update poll.')
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
          <h2 className="text-xl font-bold text-gray-900">Edit Poll</h2>
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
              Poll Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              className="w-full p-2.5 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
              Options
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    required
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 p-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="text-gray-400 hover:text-red-500 p-1 text-sm font-bold"
                      title="Remove option"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              + Add Option
            </button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Max Choices
              </label>
              <input
                type="number"
                min="1"
                value={maxChoices}
                onChange={(e) => setMaxChoices(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Relevant Date
                </label>
                {relevantDate && (
                  <button
                    type="button"
                    onClick={() => setRelevantDate('')}
                    className="text-[10px] text-red-500 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="date"
                value={relevantDate}
                onChange={(e) => setRelevantDate(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
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
