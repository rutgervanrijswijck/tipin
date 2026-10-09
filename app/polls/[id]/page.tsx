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

  // 1. Fetch Poll + Votes
  const { data: poll } = await supabase
    .from('polls')
    .select('*, poll_votes(user_id, option_index, profiles(id, full_name))')
    .eq('id', id)
    .single()

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAanvoerder = profile?.role === 'captain'

  // 2. Fetch ALL Profiles to calculate missing
  const { data: allPlayers } = await supabase.from('profiles').select('id, full_name, status')

  if (!poll || !allPlayers) return <div className="p-6">Poll not found</div>

  const myVotes = poll.poll_votes.filter((v: any) => v.user_id === user.id).map((v: any) => v.option_index)
  
  // Logic: Who hasn't voted?
  const votedUserIds = poll.poll_votes.map((v: any) => v.user_id)
  const noVotePlayers = allPlayers.filter(p => p.status !== 'retired' && !votedUserIds.includes(p.id))
  const missingPlayers = allPlayers.filter(p => p.status === 'active' && !votedUserIds.includes(p.id))

  // --- LAZY PENALTY CALCULATION ---
  if (poll.answer_by && new Date(poll.answer_by) < new Date() && missingPlayers.length > 0) {
    const { data: boeteType } = await supabase.from('boete_types').select('id, default_amount').eq('name', 'Missed deadline').single()
    if (boeteType) {
      // Note: Since this is a poll and we don't have a poll_id in boetes, we can save it with just the reason for now, 
      // or we can add a 'poll_id' to boetes if we need strong relational ties. But reason is fine.
      // We will check for existing penalties by reason string to prevent duplicates.
      const reasonStr = `Missed deadline for poll: ${poll.question}`
      const { data: existingFines } = await supabase.from('boetes').select('user_id').eq('boete_type_id', boeteType.id).eq('reason', reasonStr)
      const existingUserIds = existingFines?.map(f => f.user_id) || []
      
      const newFines = missingPlayers
        .filter(p => !existingUserIds.includes(p.id))
        .map(p => ({
          user_id: p.id,
          boete_type_id: boeteType.id,
          amount: boeteType.default_amount,
          reason: reasonStr
        }))
        
      if (newFines.length > 0) {
        await supabase.from('boetes').insert(newFines)
      }
    }
  }
  // ---------------------------------

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/?tab=polls" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">←</Link>
          <h1 className="font-bold text-lg">Poll Details</h1>
        </div>
        {isAanvoerder && <DeleteButton id={poll.id} table="polls" redirectPath="/?tab=polls" />}
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        
        {/* Pass detailLink={null} so the title is NOT clickable here */}
        <PollCard 
           poll={poll} 
           userId={user.id} 
           myVotes={myVotes} 
           detailLink={null} 
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
             <h3 className="font-bold text-gray-700">Breakdown</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {/* Voted Options */}
            {poll.options.map((option: string, idx: number) => {
              const voters = poll.poll_votes.filter((v: any) => v.option_index === idx)
              return (
                <div key={idx} className="p-4">
                   <div className="flex justify-between mb-2">
                     <span className="font-semibold text-gray-900">{option}</span>
                     <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-bold">{voters.length}</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {voters.map((v: any) => (
                       <span key={v.user_id} className="text-xs border px-2 py-1 rounded-full bg-gray-50 text-gray-700">
                         {v.profiles.full_name}
                       </span>
                     ))}
                   </div>
                </div>
              )
            })}

            {/* No Vote Section */}
            <div className="p-4 bg-red-50/30">
               <div className="flex justify-between mb-2">
                 <span className="font-semibold text-red-900">No Response</span>
                 <span className="text-xs bg-red-100 px-2 py-1 rounded text-red-800 font-bold">{noVotePlayers.length}</span>
               </div>
               <div className="flex flex-wrap gap-2">
                 {noVotePlayers.map((p) => (
                   <span key={p.id} className="text-xs border border-red-100 px-2 py-1 rounded-full bg-white text-gray-500 italic">
                     {p.full_name}
                   </span>
                 ))}
               </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}