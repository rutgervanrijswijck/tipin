'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePollForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', '']) // Start with 2 empty options
  const [maxChoices, setMaxChoices] = useState<number>(1)
  const [relevantDate, setRelevantDate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const addOption = () => setOptions([...options, ''])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Filter out empty options
    const validOptions = options.filter(o => o.trim() !== '')

    const { error } = await supabase.from('polls').insert({
      question,
      options: validOptions,
      max_choices: maxChoices,
      relevant_date: relevantDate ? new Date(relevantDate).toISOString() : null
    })

    if (!error) {
      setIsOpen(false)
      setQuestion('')
      setOptions(['', ''])
      setMaxChoices(1)
      setRelevantDate('')
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
        <span>+</span> New Poll
      </button>
    )
  }

  return (
    <div className="mb-6 p-5 bg-white border border-gray-200 rounded-xl shadow-lg animate-in slide-in-from-top-4 fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">Create Poll</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3 text-gray-600">
        <input 
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required 
          placeholder="Question (e.g. who is the biggest VO baas?)" 
          className="w-full p-2 border rounded-lg font-medium" 
        />
        
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 mb-1 block">Max Choices</label>
            <input 
              type="number" min="1"
              value={maxChoices}
              onChange={(e) => setMaxChoices(parseInt(e.target.value))}
              className="w-full p-2 border rounded-lg text-sm bg-gray-50" 
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 mb-1 block">Date (Optional)</label>
            <input 
              type="datetime-local"
              value={relevantDate}
              onChange={(e) => setRelevantDate(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm bg-gray-50" 
            />
          </div>
        </div>

        <div className="space-y-2">
          {options.map((opt, idx) => (
            <input 
              key={idx}
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              placeholder={`Option ${idx + 1}`}
              className="w-full p-2 border rounded-lg text-sm bg-gray-50" 
              required={idx < 2} // First 2 are mandatory
            />
          ))}
        </div>

        <button type="button" onClick={addOption} className="text-xs text-blue-600 font-semibold hover:underline">
          + Add another option
        </button>

        <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium mt-2 hover:bg-blue-700">
          {loading ? 'Creating...' : 'Post Poll'}
        </button>
      </form>
    </div>
  )
}