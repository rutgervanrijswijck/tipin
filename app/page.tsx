import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AttendanceToggle from '@/components/AttendanceToggle'
import CreateEventForm from '@/components/CreateEventForm'
import CreatePollForm from '@/components/CreatePollForm'
import PollCard from '@/components/PollCard'
import BottomNav from '@/components/BottomNav'

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

  // Fetch Logic
  let events: any[] = []
  let polls: any[] = []

  if (activeTab === 'schedule') {
    const { data } = await supabase
      .from('events')
      .select('*, attendance(user_id, status, reason)') 
      .order('start_time', { ascending: true })
    events = data || []
  } else {
    const { data } = await supabase
      .from('polls')
      .select('*, poll_votes(user_id, option_index)')
      .order('created_at', { ascending: false })
    polls = data || []
  }

  const getCounts = (attendance: any[]) => ({
    in: attendance.filter(a => a.status === 'in').length,
    out: attendance.filter(a => a.status === 'out').length,
    maybe: attendance.filter(a => a.status === 'maybe').length,
  })

  return (
    <main className="min-h-screen bg-[#F2F4F7] pb-32">
      
      {/* Big Clean Header */}
      <div className="bg-white px-6 pt-12 pb-6 mb-6 shadow-sm rounded-b-[2rem]">
        <div className="max-w-md mx-auto flex justify-between items-end">
          <div>
            <p className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wide">Welcome back</p>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {profile?.full_name?.split(' ')[0]}
            </h1>
          </div>
          <form action="/auth/signout" method="post">
            <button className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5">
        
        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isAanvoerder && <CreateEventForm userId={user.id} />}
            
            {events.map((event) => {
              const counts = getCounts(event.attendance || [])
              const myStatus = event.attendance.find((a: any) => a.user_id === user.id)?.status
              
              return (
                <Link key={event.id} href={`/events/${event.id}`} className="block group">
                  <div className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white group-hover:border-blue-200 transition-all duration-300 relative overflow-hidden pl-7">
                    
                    {/* REVERTED: The Left Colored Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-2.5 
                      ${event.event_type === 'game' ? 'bg-orange-500' : event.event_type === 'training' ? 'bg-blue-500' : 'bg-green-500'}`} 
                    />

                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {new Date(event.start_time).toLocaleDateString('nl-NL', { weekday: 'long' })}
                      </p>
                      <h2 className="text-xl font-bold text-gray-900 leading-tight">
                        {event.title}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(event.start_time).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })} @ {new Date(event.start_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute:'2-digit' })}
                      </p>
                    </div>

                    {/* Counts Row */}
                    <div className="flex gap-3 mb-5 text-sm font-medium text-gray-600">
                      {counts.in > 0 && <span className="flex items-center gap-1"><span className="text-green-600">●</span> {counts.in} In</span>}
                      {counts.maybe > 0 && <span className="flex items-center gap-1"><span className="text-orange-500">●</span> {counts.maybe} Maybe</span>}
                      {counts.out > 0 && <span className="flex items-center gap-1"><span className="text-red-500">●</span> {counts.out} Out</span>}
                      {counts.in === 0 && counts.maybe === 0 && counts.out === 0 && <span className="text-gray-400 text-xs">No votes yet</span>}
                    </div>

                    {/* Updated Toggle with Config and Reason */}
                    <AttendanceToggle 
                      eventId={event.id} 
                      userId={user.id} 
                      initialStatus={myStatus}
                      // Pass the reason from the join (we need to update the fetch query below first!)
                      initialReason={event.attendance.find((a: any) => a.user_id === user.id)?.reason}
                      config={{
                        reqOut: event.reason_required_out,
                        reqMaybe: event.reason_required_maybe
                      }}
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* POLLS TAB */}
        {activeTab === 'polls' && (
           <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {isAanvoerder && <CreatePollForm />}

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
              {polls.length === 0 && (
                <div className="text-center py-20 opacity-50">
                   <div className="text-6xl mb-4">📊</div>
                   <p>No polls active</p>
                </div>
              )}
           </div>
        )}
      </div>

      <BottomNav />
    </main>
  )
}