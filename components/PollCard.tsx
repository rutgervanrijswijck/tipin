'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PollCard({ poll, userId, myVotes = [], detailLink }: any) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const counts = poll.options.map((_: any, index: number) => 
    poll.poll_votes ? poll.poll_votes.filter((v: any) => v.option_index === index).length : 0
  )

  const hasVoted = myVotes && myVotes.length > 0
  const maxChoices = poll.max_choices || 1

  const handleVote = async (index: number) => {
    setLoading(true)
    const isSelected = myVotes.includes(index)

    if (isSelected) {
      await supabase
        .from('poll_votes')
        .delete()
        .eq('poll_id', poll.id)
        .eq('user_id', userId)
        .eq('option_index', index)
    } else {
      if (maxChoices === 1) {
        await supabase
          .from('poll_votes')
          .delete()
          .eq('poll_id', poll.id)
          .eq('user_id', userId)
        
        await supabase
          .from('poll_votes')
          .insert({ poll_id: poll.id, user_id: userId, option_index: index })
      } else {
        if (myVotes.length >= maxChoices) {
          alert(`You can only select up to ${maxChoices} options.`)
          setLoading(false)
          return
        }
        await supabase
          .from('poll_votes')
          .insert({ poll_id: poll.id, user_id: userId, option_index: index })
      }
    }
    router.refresh()
    setLoading(false)
  }

  return (
    <div className={`bg-white p-5 rounded-2xl shadow-sm border mb-4 transition-all ${!hasVoted ? 'border-blue-200 ring-1 ring-blue-50' : 'border-gray-100'}`}>
      
      {/* Header */}
      <div className="mb-4">
        {detailLink ? (
          <Link href={detailLink} className="group">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {poll.question} <span className="text-gray-300 text-xs font-normal ml-1">›</span>
              </h3>
              {!hasVoted && (
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                  Vote required
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Click title for details</p>
          </Link>
        ) : (
          <h3 className="font-bold text-gray-900">{poll.question}</h3>
        )}
        {poll.relevant_date && (
           <p className="text-xs font-bold text-purple-600 mt-2">
             📅 {new Date(poll.relevant_date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
           </p>
        )}
        {maxChoices > 1 && (
           <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">
             Select up to {maxChoices} options
           </p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {poll.options.map((opt: string, idx: number) => {
          const count = counts[idx]
          const uniqueVoters = new Set(poll.poll_votes?.map((v:any) => v.user_id)).size
          const percent = uniqueVoters === 0 ? 0 : Math.round((count / uniqueVoters) * 100)
          const isSelected = myVotes.includes(idx)

          return (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleVote(idx)}
              className={`relative w-full text-left p-3 rounded-lg border transition-all overflow-hidden
                ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
              `}
            >
              <div 
                className="absolute top-0 left-0 bottom-0 bg-blue-100 transition-all duration-500" 
                style={{ width: `${Math.min(percent, 100)}%`, opacity: 0.5 }} 
              />
              
              <div className="relative flex justify-between items-center z-10">
                <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                  {opt}
                </span>
                <span className="text-xs text-gray-500 font-semibold">{count} ({percent}%)</span>
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3 text-right">{new Set(poll.poll_votes?.map((v:any)=>v.user_id)).size} people voted</p>
    </div>
  )
}