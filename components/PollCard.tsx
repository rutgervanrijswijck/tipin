'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function PollCard({ poll, userId, myVoteIndex }: any) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Calculate percentages
  const totalVotes = poll.poll_votes.length
  const counts = poll.options.map((_: any, index: number) => 
    poll.poll_votes.filter((v: any) => v.option_index === index).length
  )

  const handleVote = async (index: number) => {
    setLoading(true)
    const { error } = await supabase
      .from('poll_votes')
      .upsert({ poll_id: poll.id, user_id: userId, option_index: index }, { onConflict: 'poll_id, user_id' })
    
    if (!error) router.refresh()
    setLoading(false)
  }

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
      <h3 className="font-bold text-gray-900 mb-4">{poll.question}</h3>
      <div className="space-y-3">
        {poll.options.map((opt: string, idx: number) => {
          const count = counts[idx]
          const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100)
          const isSelected = myVoteIndex === idx

          return (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleVote(idx)}
              className={`relative w-full text-left p-3 rounded-lg border transition-all overflow-hidden
                ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
              `}
            >
              {/* Progress Bar Background */}
              <div 
                className="absolute top-0 left-0 bottom-0 bg-blue-100 transition-all duration-500" 
                style={{ width: `${percent}%`, opacity: 0.5 }} 
              />
              
              <div className="relative flex justify-between items-center z-10">
                <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                  {opt}
                </span>
                <span className="text-xs text-gray-500 font-semibold">{percent}%</span>
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3 text-right">{totalVotes} votes</p>
    </div>
  )
}