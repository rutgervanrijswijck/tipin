import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import PollCard from '@/components/PollCard'
import DeleteButton from '@/components/DeleteButton'

export default async function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Fetch Poll + Votes + User Profiles
  const { data: poll } = await supabase
    .from('polls')
    .select('*, poll_votes(option_index, profiles(id, full_name))')
    .eq('id', id)
    .single()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAanvoerder = profile?.role === 'coach'

  if (!poll) return <div className="p-6">Poll not found</div>

  const myVote = poll.poll_votes.find((v: any) => v.profiles.id === user.id)

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/?tab=polls" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">←</Link>
          <h1 className="font-bold text-lg">Poll Details</h1>
        </div>
        {isAanvoerder && <DeleteButton id={poll.id} table="polls" redirectPath="/?tab=polls" />}
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        
        {/* The Active Poll Card */}
        <PollCard 
           poll={poll} 
           userId={user.id} 
           myVoteIndex={myVote ? myVote.option_index : null} 
        />

        {/* Detailed Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
             <h3 className="font-bold text-gray-700">Who voted what?</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {poll.options.map((option: string, idx: number) => {
              // Filter votes for this specific option
              const voters = poll.poll_votes.filter((v: any) => v.option_index === idx)
              
              return (
                <div key={idx} className="p-4">
                   <div className="flex justify-between mb-2">
                     <span className="font-semibold text-gray-900">{option}</span>
                     <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-bold">{voters.length}</span>
                   </div>
                   
                   {voters.length === 0 ? (
                     <p className="text-xs text-gray-400 italic">No votes yet</p>
                   ) : (
                     <div className="flex flex-wrap gap-2">
                       {voters.map((v: any) => (
                         <span key={v.profiles.id} className="text-xs border px-2 py-1 rounded-full bg-gray-50 text-gray-700">
                           {v.profiles.full_name}
                         </span>
                       ))}
                     </div>
                   )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </main>
  )
}