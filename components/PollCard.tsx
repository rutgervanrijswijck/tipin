'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { togglePollVoteServer } from '@/app/polls/actions'

export default function PollCard({ poll, userId, myVotes = [], counts = [], uniqueVoters = 0, detailLink }: any) {
  const [loading, setLoading] = useState(false)
  const [selectedVotes, setSelectedVotes] = useState<number[]>(myVotes)
  const [voteCounts, setVoteCounts] = useState<number[]>(counts)
  const [totalVoters, setTotalVoters] = useState<number>(uniqueVoters)

  const router = useRouter()

  // Use primitive keys to prevent unnecessary useEffect overwrites on parent re-renders
  const myVotesKey = (myVotes || []).slice().sort().join(',')
  const countsKey = (counts || []).join(',')

  useEffect(() => {
    setSelectedVotes(myVotes || [])
    setVoteCounts(counts || [])
    setTotalVoters(uniqueVoters || 0)
  }, [myVotesKey, countsKey, uniqueVoters])

  const hasVoted = selectedVotes && selectedVotes.length > 0
  const maxChoices = poll.max_choices || 1

  const handleVote = async (index: number) => {
    if (loading) return
    setLoading(true)

    const isSelected = selectedVotes.includes(index)

    // Save previous state for rollback on error
    const prevVotes = [...selectedVotes]
    const prevCounts = [...voteCounts]
    const prevTotal = totalVoters

    if (isSelected) {
      // 1. UNVOTE: Remove vote optimistically
      const nextVotes = selectedVotes.filter(v => v !== index)
      setSelectedVotes(nextVotes)

      const nextCounts = [...voteCounts]
      nextCounts[index] = Math.max(0, (nextCounts[index] || 1) - 1)
      setVoteCounts(nextCounts)

      if (nextVotes.length === 0) {
        setTotalVoters(Math.max(0, totalVoters - 1))
      }

      // Execute unvote via server action
      const result = await togglePollVoteServer(poll.id, index)

      if (!result.success) {
        console.error("Failed to unvote:", result.error)
        alert("Failed to unvote: " + result.error)
        setSelectedVotes(prevVotes)
        setVoteCounts(prevCounts)
        setTotalVoters(prevTotal)
      } else {
        router.refresh()
      }
    } else {
      // 2. VOTE: Add or switch vote optimistically
      if (maxChoices === 1) {
        // Single choice: decrement previous vote count if any
        const nextCounts = [...voteCounts]
        if (selectedVotes.length > 0) {
          selectedVotes.forEach(v => {
            nextCounts[v] = Math.max(0, (nextCounts[v] || 1) - 1)
          })
        }
        nextCounts[index] = (nextCounts[index] || 0) + 1
        setVoteCounts(nextCounts)
        setSelectedVotes([index])
        if (selectedVotes.length === 0) {
          setTotalVoters(totalVoters + 1)
        }

        const result = await togglePollVoteServer(poll.id, index)

        if (!result.success) {
          console.error("Failed to vote:", result.error)
          alert("Failed to vote: " + result.error)
          setSelectedVotes(prevVotes)
          setVoteCounts(prevCounts)
          setTotalVoters(prevTotal)
        } else {
          router.refresh()
        }
      } else {
        // Multiple choices: check limit
        if (selectedVotes.length >= maxChoices) {
          alert(`You can only select up to ${maxChoices} options.`)
          setLoading(false)
          return
        }

        const nextVotes = [...selectedVotes, index]
        setSelectedVotes(nextVotes)

        const nextCounts = [...voteCounts]
        nextCounts[index] = (nextCounts[index] || 0) + 1
        setVoteCounts(nextCounts)

        if (selectedVotes.length === 0) {
          setTotalVoters(totalVoters + 1)
        }

        const result = await togglePollVoteServer(poll.id, index)

        if (!result.success) {
          console.error("Failed to vote:", result.error)
          alert("Failed to vote: " + result.error)
          setSelectedVotes(prevVotes)
          setVoteCounts(prevCounts)
          setTotalVoters(prevTotal)
        } else {
          router.refresh()
        }
      }
    }

    setLoading(false)
  }

  return (
    <div className={`bg-white p-5 rounded-2xl shadow-sm border mb-4 transition-all ${!hasVoted ? 'border-blue-200 ring-1 ring-blue-50' : 'border-gray-100'}`}>
      
      {/* Header */}
      <div className="mb-4">
        {detailLink ? (
          <Link href={detailLink} prefetch={false} className="group">
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
             Select up to {maxChoices} options (click selected to unvote)
           </p>
        )}
        {maxChoices === 1 && hasVoted && (
           <p className="text-[10px] font-semibold text-gray-400 mt-1">
             Click your selected option to unvote
           </p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {poll.options.map((opt: string, idx: number) => {
          const count = voteCounts[idx] || 0
          const percent = totalVoters === 0 ? 0 : Math.round((count / totalVoters) * 100)
          const isSelected = selectedVotes.includes(idx)

          return (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleVote(idx)}
              className={`relative w-full text-left p-3 rounded-lg border transition-all overflow-hidden cursor-pointer
                ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/70 shadow-xs' : 'border-gray-200 hover:bg-gray-50'}
              `}
            >
              <div 
                className="absolute top-0 left-0 bottom-0 bg-blue-100 transition-all duration-500" 
                style={{ width: `${Math.min(percent, 100)}%`, opacity: isSelected ? 0.6 : 0.35 }} 
              />
              
              <div className="relative flex justify-between items-center z-10">
                <span className={`text-sm font-medium flex items-center gap-2 ${isSelected ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>
                  {isSelected && <span className="text-blue-600 text-xs">✓</span>}
                  {opt}
                </span>
                <span className="text-xs text-gray-500 font-semibold">{count} ({percent}%)</span>
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3 text-right">{totalVoters} {totalVoters === 1 ? 'person' : 'people'} voted</p>
    </div>
  )
}