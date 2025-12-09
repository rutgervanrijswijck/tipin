import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AttendanceToggle from '@/components/AttendanceToggle'
import CreateEventForm from '@/components/CreateEventForm'
import PollCard from '@/components/PollCard'

// 1. Types for handling Search Params
export default async function Home({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const activeTab = tab === 'polls' ? 'polls' : 'schedule'

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const isAanvoerder = profile?.role === 'coach'

  // FETCH DATA BASED ON TAB
  let events: any[] = []
  let polls: any[] = []

  if (activeTab === 'schedule') {
    // Note: We fetch 'attendance' to count them locally
    const { data } = await supabase
      .from('events')
      .select('*, attendance(user_id, status)') 
      .order('start_time', { ascending: true })
    events = data || []
  } else {
    const { data } = await supabase
      .from('polls')
      .select('*, poll_votes(user_id, option_index)')
      .order('created_at', { ascending: false })
    polls = data || []
  }

  // Helper to count votes for the Schedule List
  const getCounts = (attendance: any[]) => ({
    in: attendance.filter(a => a.status === 'in').length,
    out: attendance.filter(a => a.status === 'out').length,
    maybe: attendance.filter(a => a.status === 'maybe').length,
  })

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white pt-6 px-6 pb-2 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold text-gray-900">Hello, {profile?.full_name?.split(' ')[0]} 👋</h1>
          <form action="/auth/signout" method="post"><button className="text-xs text-gray-400">Log out</button></form>
        </div>

        {/* TABS */}
        <div className="flex space-x-6 border-b border-gray-100">
          <Link 
            href="/?tab=schedule" 
            className={`pb-3 text-sm font-bold transition ${activeTab === 'schedule' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
            Schedule
          </Link>
          <Link 
            href="/?tab=polls" 
            className={`pb-3 text-sm font-bold transition ${activeTab === 'polls' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
            Polls
          </Link>
        </div>
      </div>

      <div className="max-w-md mx-auto p-6">
        
        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div className="space-y-5">
            {isAanvoerder && <CreateEventForm userId={user.id} />}
            
            {events.map((event) => {
              const counts = getCounts(event.attendance || [])
              const myStatus = event.attendance.find((a: any) => a.user_id === user.id)?.status

              return (
                // Wrap in Link to go to Detail Page
                <Link key={event.id} href={`/events/${event.id}`} className="block">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative hover:border-blue-300 transition-colors">
                    
                    {/* Event Type Stripe */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 
                      ${event.event_type === 'game' ? 'bg-orange-500' : event.event_type === 'training' ? 'bg-blue-500' : 'bg-green-500'}`} 
                    />

                    <div className="pl-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400">
                           {event.event_type}
                        </span>
                        <span className="text-xs font-medium text-gray-400">
                          {new Date(event.start_time).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-gray-900 leading-tight mb-2">{event.title}</h2>
                      
                      {/* Count Badges */}
                      <div className="flex gap-2 mb-4 text-xs font-semibold">
                         <span className="bg-green-50 text-green-700 px-2 py-1 rounded">👍 {counts.in}</span>
                         <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded">🤔 {counts.maybe}</span>
                         <span className="bg-red-50 text-red-700 px-2 py-1 rounded">👎 {counts.out}</span>
                      </div>

                      {/* We stop propagation here so clicking buttons doesn't open the page */}
                      <AttendanceToggle eventId={event.id} userId={user.id} initialStatus={myStatus} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* POLLS TAB */}
        {activeTab === 'polls' && (
           <div className="space-y-4">
              {polls.map(poll => {
                 const myVote = poll.poll_votes.find((v: any) => v.user_id === user.id)
                 return (
                   <PollCard 
                      key={poll.id} 
                      poll={poll} 
                      userId={user.id} 
                      myVoteIndex={myVote ? myVote.option_index : null} 
                   />
                 )
              })}
              {polls.length === 0 && <div className="text-center text-gray-400 py-10">No polls yet.</div>}
           </div>
        )}
      </div>
    </main>
  )
}